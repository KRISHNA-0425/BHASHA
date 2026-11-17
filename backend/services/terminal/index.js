import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import os from 'os'
import axios from 'axios'
import connectDb from './config/db.js'

dotenv.config()

const port = process.env.PORT || 8005
const app = express()

// Health check route
app.get('/', (_, res) => {
    res.send('hello from terminal')
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

// Active terminal sessions: socketId -> { ptyProcess, projectId, userId }
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
    if (!Number.isFinite(val)) return 64
    return Math.max(20, Math.min(Math.floor(val), 500))
}

const normalizingRows = (rows) => {
    const val = Number(rows)
    if (!Number.isFinite(val)) return 32
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


const startServer = () => {
    connectDb()
        .then(() => {
            server.listen(port, () => {
                console.log(`terminal service started at port: ${port}`);
            });
        })
        .catch((e) => console.error(e));
}

startServer();