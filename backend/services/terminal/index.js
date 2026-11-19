import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import os from 'os'
import axios from 'axios'
import fs from 'fs/promises'
import pty from 'node-pty'
import connectDb from './config/db.js'

dotenv.config()

const port = process.env.PORT || 8005
const app = express()

// Health check route
app.get('/', (_, res) => {
    res.json({ success: true, service: 'terminal' })
})

// Creating HTTP server
const server = http.createServer(app)

const fileService = process.env.FILE_SERVICE_URL || process.env.FILE_SERVICE || 'http://localhost:8003'
const WORKSPACE_ROOT = path.join(os.tmpdir(), 'BHASHA-AI')
const SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash'

// Socket.io server with CORS configured
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
})

// Active terminal sessions: socketId -> { ptyProcess, projectId, userId, cwd }
const sessions = new Map()

// Helper functions
const sendData = (socket, data) => {
    if (!socket || !socket.connected) return
    socket.emit('terminalData', String(data || ''))
}

// Validates file/folder names against directory traversal
const isValidFileName = (name) => {
    if (!name || typeof name !== 'string') return false
    const trimmed = name.trim()
    if (trimmed === '.' || trimmed === '..' || trimmed.includes('/') || trimmed.includes('\\')) {
        return false
    }
    return true
}

// Generates the workspace path for a specific project
const getProjectPath = (projectId) => {
    return path.join(WORKSPACE_ROOT, String(projectId))
}

// Guard rails for terminal dimensions
const normalizingCols = (cols) => {
    const val = Number(cols)
    if (!Number.isFinite(val)) return 80
    return Math.max(20, Math.min(Math.floor(val), 500))
}

const normalizingRows = (rows) => {
    const val = Number(rows)
    if (!Number.isFinite(val)) return 30
    return Math.max(5, Math.min(Math.floor(val), 200))
}

// Fetches project file tree from management service
const getTree = async (projectId, userId) => {
    try {
        const url = `${fileService}/api/management/tree/${projectId}`
        const response = await axios.get(url, {
            headers: {
                'x-user-id': String(userId)
            }
        })
        const data = response.data
        if (Array.isArray(data)) return data
        if (Array.isArray(data?.tree)) return data.tree
        return []
    } catch (error) {
        console.error('getTree error:', error.response?.data || error.message)
        return []
    }
}

// Writes tree nodes to local disk for the terminal environment
const writeNode = async (nodes, directory) => {
    if (!Array.isArray(nodes)) return

    for (const node of nodes) {
        if (!isValidFileName(node?.name)) continue
        const target = path.join(directory, node.name)

        if (node.type === 'folder') {
            await fs.mkdir(target, { recursive: true })
            await writeNode(node.children || [], target)
            continue
        }

        if (node.type === 'file') {
            await fs.mkdir(path.dirname(target), { recursive: true })
            await fs.writeFile(target, node.content || '', 'utf-8')
        }
    }
}

const syncProject = async (projectId, userId) => {
    const tree = await getTree(projectId, userId)
    const root = getProjectPath(projectId)
    await fs.mkdir(root, { recursive: true })

    if (tree.length === 1 && tree[0]?.type === 'folder') {
        await writeNode(tree[0].children || [], root)
    } else {
        await writeNode(tree, root)
    }

    return { tree, root }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('terminal connected:', socket.id)

    socket.on('terminalData', async ({ projectId, userId, cols = 80, rows = 30 } = {}) => {
        try {
            projectId = String(projectId || '').trim()
            userId = String(userId || '').trim()

            if (!projectId || !userId) {
                throw new Error('Project Id and User Id are required')
            }

            // Cleanup existing session on reconnect
            const existingSession = sessions.get(socket.id)
            if (existingSession) {
                try {
                    existingSession.ptyProcess.kill()
                } catch (error) {}
                sessions.delete(socket.id)
            }

            cols = normalizingCols(cols)
            rows = normalizingRows(rows)

            const { root } = await syncProject(projectId, userId)

            const ptyInstance = pty.spawn(SHELL, [], {
                name: 'xterm-256color',
                cols,
                rows,
                cwd: root,
                env: {
                    ...process.env,
                    FORCE_COLOR: '1'
                }
            })

            ptyInstance.onData((data) => {
                sendData(socket, data)
            })

            ptyInstance.onExit(({ exitCode }) => {
                sendData(socket, `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`)
                const currentSession = sessions.get(socket.id)
                if (currentSession?.ptyProcess === ptyInstance) {
                    sessions.delete(socket.id)
                }
            })

            sessions.set(socket.id, {
                projectId,
                userId,
                cwd: root,
                ptyProcess: ptyInstance
            })

            socket.emit('terminal-ready', { cols, rows })
        } catch (error) {
            console.error('terminal init error:', error)
            sendData(socket, `\r\n\x1b[31m${error.message}\x1b[0m\r\n`)
        }
    })

    socket.on('terminal-write', (data) => {
        const session = sessions.get(socket.id)
        if (!session) return
        session.ptyProcess.write(String(data || ''))
    })

    socket.on('terminal-resize', (cols, rows) => {
        const session = sessions.get(socket.id)
        if (!session) return

        cols = normalizingCols(cols)
        rows = normalizingRows(rows)

        try {
            session.ptyProcess.resize(cols, rows)
        } catch (error) {}
    })

    socket.on('disconnect', () => {
        console.log('terminal disconnect:', socket.id)
        const session = sessions.get(socket.id)
        if (!session) return
        try {
            session.ptyProcess.kill()
        } catch (error) {}
        sessions.delete(socket.id)
    })
})

const startServer = () => {
    connectDb()
        .then(() => {
            server.listen(port, () => {
                console.log(`terminal service started at port: ${port}`)
            })
        })
        .catch((e) => console.error(e))
}

startServer()
