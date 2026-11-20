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

// CORS & JSON body parsing
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
})
app.use(express.json())

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

// Active terminal sessions: socketId -> { ptyProcess, projectId, userId, cwd, syncTimeout }
const sessions = new Map()
// Active project owners: projectId -> userId (for headless/HTTP sync triggers)
const projectUsers = new Map()

const IGNORED_NAMES = new Set([
    'node_modules',
    '.git',
    '.DS_Store',
    'Thumbs.db',
    '.cache',
    '__pycache__',
    '.pytest_cache',
    '.mypy_cache',
    '.venv',
    'venv',
    'env',
    '.idea',
    '.vscode'
])

const IGNORED_EXTENSIONS = new Set([
    'exe',
    'o',
    'obj',
    'out',
    'a',
    'lib',
    'so',
    'dll',
    'dylib',
    'class',
    'pyc',
    'pyo',
    'pyd',
    'pdb',
    'idb',
    'ilk'
])

const getLanguageFromFilename = (filename) => {
    if (!filename || typeof filename !== 'string') return 'plainText'
    const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : ''
    const map = {
        // C & C++
        c: 'c',
        h: 'c',
        cpp: 'cpp',
        'c++': 'cpp',
        cc: 'cpp',
        cxx: 'cpp',
        cp: 'cpp',
        hpp: 'cpp',
        'h++': 'cpp',
        hh: 'cpp',
        hxx: 'cpp',

        // Python
        py: 'python',
        pyw: 'python',
        pyi: 'python',

        // Java, Rust, Go
        java: 'java',
        rs: 'rust',
        go: 'go',

        // Web & Scripting
        js: 'javascript',
        jsx: 'javascript',
        mjs: 'javascript',
        cjs: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        json: 'json',
        html: 'html',
        htm: 'html',
        css: 'css',
        scss: 'scss',
        md: 'markdown',
        sh: 'shell',
        bash: 'shell',
        zsh: 'shell',
        xml: 'xml',
        yaml: 'yaml',
        yml: 'yaml',
        sql: 'sql',
        txt: 'plainText'
    }
    return map[ext] || 'plainText'
}

// Helper functions
const sendData = (socket, data) => {
    if (!socket || !socket.connected) return
    socket.emit('terminalData', String(data || ''))
}

// Security audit logger for forensic tracking of terminal events
const logSecurityEvent = (level, eventType, details = {}) => {
    const timestamp = new Date().toISOString()
    const logEntry = `[SECURITY][${level.toUpperCase()}][${timestamp}][${eventType}] ${JSON.stringify(details)}`
    if (level === 'error' || level === 'warn') {
        console.warn(logEntry)
    } else {
        console.log(logEntry)
    }
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

// Validates project ID format to prevent shell and directory injection
const isValidProjectId = (projectId) => {
    if (!projectId || typeof projectId !== 'string') return false
    const trimmed = projectId.trim()
    return /^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)
}

// Validates that a target relative path stays strictly inside base directory
const isSafeSubPath = (baseDir, targetRelPath) => {
    if (!targetRelPath || typeof targetRelPath !== 'string' || targetRelPath.includes('\0')) {
        logSecurityEvent('warn', 'PATH_TRAVERSAL_BLOCKED', { baseDir, targetRelPath, reason: 'invalid_or_null_bytes' })
        return false
    }
    const resolvedBase = path.resolve(baseDir)
    const resolvedTarget = path.resolve(resolvedBase, targetRelPath)
    const isSafe = resolvedTarget.startsWith(resolvedBase + path.sep)
    if (!isSafe) {
        logSecurityEvent('warn', 'PATH_TRAVERSAL_BLOCKED', { baseDir, targetRelPath, reason: 'escapes_workspace' })
    }
    return isSafe
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

// Fetches all project files (both active and soft-deleted) for accurate two-way reconciliation
const getAllFiles = async (projectId, userId) => {
    try {
        const url = `${fileService}/api/management/all-files/${projectId}`
        const response = await axios.get(url, {
            headers: {
                'x-user-id': String(userId)
            }
        })
        return Array.isArray(response.data) ? response.data : []
    } catch (error) {
        console.error('getAllFiles error:', error.response?.data || error.message)
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

// Scans local project disk directory and syncs files/folders back to MongoDB
const syncDiskToDb = async (projectId, userId) => {
    if (!projectId || !userId) {
        return { success: false, message: 'Missing projectId or userId' }
    }

    const root = getProjectPath(projectId)
    try {
        await fs.access(root)
    } catch {
        return { success: false, message: 'Workspace directory does not exist on disk' }
    }

    // Retrieve all files (both active and soft-deleted) for full two-way reconciliation
    const allFiles = await getAllFiles(projectId, userId)
    let rootFolder = allFiles.find((n) => n.type === 'folder' && !n.parentId)

    // Fallback to getTree if getAllFiles endpoint is not available
    if (!rootFolder) {
        const tree = await getTree(projectId, userId)
        if (Array.isArray(tree) && tree.length > 0) {
            if (tree.length === 1 && tree[0]?.type === 'folder') {
                rootFolder = tree[0]
            } else {
                rootFolder = tree.find((n) => n.type === 'folder' && !n.parentId) || tree[0]
            }
        }
    }

    if (!rootFolder || !rootFolder._id) {
        return { success: false, message: 'No root folder found in database' }
    }

    const rootFolderIdStr = String(rootFolder._id)
    const idToNode = new Map()
    for (const file of allFiles) {
        idToNode.set(String(file._id), file)
    }

    // Resolves relative path inside project root (e.g. "src/App.jsx" or "package.json")
    const resolveRelPath = (node) => {
        const parts = [node.name]
        let current = node
        let depth = 0
        while (current.parentId && depth < 20) {
            depth++
            const parentIdStr = String(current.parentId)
            if (parentIdStr === rootFolderIdStr) {
                break
            }
            const parent = idToNode.get(parentIdStr)
            if (!parent) break
            parts.unshift(parent.name)
            current = parent
        }
        return parts.join('/')
    }

    const activeMap = new Map()
    const deletedMap = new Map()

    // 1. Populate activeMap with all active (non-deleted) nodes
    for (const node of allFiles) {
        if (String(node._id) === rootFolderIdStr) continue
        if (node.isDeleted) continue
        const relPath = resolveRelPath(node)
        if (relPath) {
            activeMap.set(relPath, node)
        }
    }

    // 2. Populate deletedMap strictly for paths that do not have an active document
    for (const node of allFiles) {
        if (String(node._id) === rootFolderIdStr) continue
        if (!node.isDeleted) continue
        const relPath = resolveRelPath(node)
        if (relPath && !activeMap.has(relPath)) {
            deletedMap.set(relPath, node)
        }
    }

    // 3. Purge any soft-deleted files/folders off the disk immediately so they stay deleted
    for (const [delRelPath] of deletedMap.entries()) {
        const diskPath = path.join(root, delRelPath)
        try {
            await fs.rm(diskPath, { recursive: true, force: true })
        } catch {}
    }

    // 4. Ensure all active DB files are present on disk (safeguards against accidental disk wipes)
    for (const [activeRelPath, activeNode] of activeMap.entries()) {
        const diskPath = path.join(root, activeRelPath)
        try {
            if (activeNode.type === 'folder') {
                await fs.mkdir(diskPath, { recursive: true })
            } else if (activeNode.type === 'file') {
                const exists = await fs.access(diskPath).then(() => true).catch(() => false)
                if (!exists) {
                    await fs.mkdir(path.dirname(diskPath), { recursive: true })
                    await fs.writeFile(diskPath, activeNode.content || '', 'utf-8')
                }
            }
        } catch {}
    }

    const added = []
    const updated = []
    const scannedDiskRelPaths = new Set()

    // 5. Recursive disk walk to detect new files created on disk & sync modified content
    const scanAndSync = async (dirPath, currentRelPath = '', parentId = rootFolder._id) => {
        let entries
        try {
            entries = await fs.readdir(dirPath, { withFileTypes: true })
        } catch {
            return
        }

        for (const entry of entries) {
            if (IGNORED_NAMES.has(entry.name)) continue
            if (!isValidFileName(entry.name)) continue

            const relPath = currentRelPath ? `${currentRelPath}/${entry.name}` : entry.name
            const fullPath = path.join(dirPath, entry.name)

            // If file was soft-deleted in DB, enforce deletion on disk and do not recreate
            if (deletedMap.has(relPath)) {
                try {
                    await fs.rm(fullPath, { recursive: true, force: true })
                } catch {}
                continue
            }

            scannedDiskRelPaths.add(relPath)

            if (entry.isDirectory()) {
                let folderNode = activeMap.get(relPath)
                if (!folderNode || folderNode.type !== 'folder') {
                    try {
                        const res = await axios.post(
                            `${fileService}/api/management/createFolder`,
                            { name: entry.name, parentId, projectId },
                            { headers: { 'x-user-id': String(userId) } }
                        )
                        folderNode = res.data
                        activeMap.set(relPath, folderNode)
                        added.push(relPath)
                    } catch (err) {
                        console.error(`Failed to create folder ${relPath}:`, err.response?.data || err.message)
                    }
                }

                if (folderNode?._id) {
                    await scanAndSync(fullPath, relPath, folderNode._id)
                }
            } else if (entry.isFile()) {
                const ext = entry.name.includes('.') ? entry.name.split('.').pop().toLowerCase() : ''
                if (IGNORED_EXTENSIONS.has(ext)) continue

                try {
                    const stat = await fs.stat(fullPath)
                    // Skip files > 5MB to avoid mongo payload bloat
                    if (stat.size > 5 * 1024 * 1024) continue

                    const fileNode = activeMap.get(relPath)
                    const content = await fs.readFile(fullPath, 'utf-8')

                    if (!fileNode) {
                        const language = getLanguageFromFilename(entry.name)
                        const res = await axios.post(
                            `${fileService}/api/management/createFile`,
                            {
                                name: entry.name,
                                parentId,
                                projectId,
                                content,
                                language
                            },
                            { headers: { 'x-user-id': String(userId) } }
                        )
                        activeMap.set(relPath, res.data)
                        added.push(relPath)
                    } else if (fileNode.type === 'file') {
                        if (fileNode.content !== content) {
                            await axios.put(
                                `${fileService}/api/management/updateFile/${fileNode._id}`,
                                { content },
                                { headers: { 'x-user-id': String(userId) } }
                            )
                            fileNode.content = content
                            updated.push(relPath)
                        }
                    }
                } catch (err) {
                    console.error(`Failed to sync file ${relPath}:`, err.response?.data || err.message)
                }
            }
        }
    }

    await scanAndSync(root, '', rootFolder._id)

    return { success: true, added, updated }
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

    // Also run disk-to-DB sync to capture any files on disk created offline
    try {
        await syncDiskToDb(projectId, userId)
    } catch (e) {
        console.warn('Initial disk-to-DB sync notice:', e.message)
    }

    return { tree, root }
}

// HTTP sync endpoint
const handleSyncRequest = async (req, res) => {
    try {
        const { projectId } = req.body || {}
        const userId = req.headers['x-user-id'] || req.body?.userId || projectUsers.get(String(projectId))

        if (!projectId || !userId) {
            return res.status(400).json({ message: 'projectId and userId are required' })
        }

        const result = await syncDiskToDb(String(projectId), String(userId))
        return res.status(200).json(result)
    } catch (error) {
        console.error('sync endpoint error:', error)
        return res.status(500).json({ message: error.message })
    }
}

app.post('/api/terminal/sync', handleSyncRequest)
app.post('/sync-disk', handleSyncRequest)

// HTTP clear workspace disk endpoint
const handleClearDiskRequest = async (req, res) => {
    try {
        const { projectId } = req.body || {}
        if (!projectId) {
            return res.status(400).json({ error: 'Missing projectId' })
        }
        const root = getProjectPath(String(projectId))
        try {
            const entries = await fs.readdir(root, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = path.join(root, entry.name)
                await fs.rm(fullPath, { recursive: true, force: true })
            }
        } catch (err) {
            console.error('Error clearing workspace disk:', err.message)
        }

        for (const [socketId, sess] of sessions.entries()) {
            if (String(sess.projectId) === String(projectId)) {
                io.to(socketId).emit('disk-synced', { success: true, added: [], updated: [] })
            }
        }

        return res.status(200).json({ success: true, message: 'Workspace disk cleared successfully' })
    } catch (error) {
        console.error('clear-workspace error:', error)
        return res.status(500).json({ error: error.message })
    }
}

app.post('/api/terminal/clear', handleClearDiskRequest)
app.post('/clear-workspace', handleClearDiskRequest)

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
                ptyProcess: ptyInstance,
                syncTimeout: null
            })
            projectUsers.set(projectId, userId)

            socket.emit('terminal-ready', { cols, rows })
            // Notify frontend in case initial sync brought in disk files
            socket.emit('disk-synced')
        } catch (error) {
            console.error('terminal init error:', error)
            sendData(socket, `\r\n\x1b[31m${error.message}\x1b[0m\r\n`)
        }
    })

    socket.on('terminal-write', (data) => {
        const session = sessions.get(socket.id)
        if (!session) return
        session.ptyProcess.write(String(data || ''))

        // If the user hit enter/return, schedule auto-sync after command settles
        if (typeof data === 'string' && (data.includes('\r') || data.includes('\n'))) {
            if (session.syncTimeout) {
                clearTimeout(session.syncTimeout)
            }
            session.syncTimeout = setTimeout(async () => {
                try {
                    const result = await syncDiskToDb(session.projectId, session.userId)
                    if (result?.added?.length > 0 || result?.updated?.length > 0) {
                        socket.emit('disk-synced', result)
                    }
                } catch (e) {
                    console.error('Auto-sync error after command:', e.message)
                }
            }, 1200)
        }
    })

    socket.on('sync-to-db', async () => {
        const session = sessions.get(socket.id)
        if (!session) return
        try {
            const result = await syncDiskToDb(session.projectId, session.userId)
            socket.emit('disk-synced', result)
        } catch (e) {
            console.error('Manual sync-to-db error:', e.message)
        }
    })

    // Sync file saved in Monaco Editor directly onto terminal workspace disk
    socket.on('file-saved', async ({ relPath, content }) => {
        const session = sessions.get(socket.id)
        if (!session || !relPath) return
        try {
            const fullPath = path.join(session.cwd, relPath)
            await fs.mkdir(path.dirname(fullPath), { recursive: true })
            await fs.writeFile(fullPath, String(content || ''), 'utf-8')
        } catch (e) {
            console.error('Error saving file to terminal disk:', e.message)
        }
    })

    // Sync file deleted in FileExplorer directly off terminal workspace disk
    socket.on('file-deleted', async ({ relPath }) => {
        const session = sessions.get(socket.id)
        if (!session || !relPath) return
        try {
            const fullPath = path.join(session.cwd, relPath)
            await fs.rm(fullPath, { recursive: true, force: true })
        } catch (e) {
            console.error('Error deleting file from terminal disk:', e.message)
        }
    })

    // Clear all files and folders off terminal workspace disk
    socket.on('clear-workspace', async () => {
        const session = sessions.get(socket.id)
        if (!session || !session.cwd) return
        try {
            const entries = await fs.readdir(session.cwd, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = path.join(session.cwd, entry.name)
                await fs.rm(fullPath, { recursive: true, force: true })
            }
            socket.emit('disk-synced', { success: true, added: [], updated: [] })
        } catch (e) {
            console.error('Error clearing terminal workspace disk:', e.message)
        }
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
        if (session.syncTimeout) {
            clearTimeout(session.syncTimeout)
        }
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
