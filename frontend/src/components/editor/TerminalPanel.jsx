import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { io } from 'socket.io-client'
import '@xterm/xterm/css/xterm.css'
import {
  VscClearAll,
  VscClose,
  VscChevronUp,
  VscChevronDown,
  VscRefresh,
  VscSplitHorizontal
} from 'react-icons/vsc'

const TERMINAL_SERVICE_URL = import.meta.env.VITE_TERMINAL_URL || 'http://localhost:8005'

const TerminalPanel = forwardRef(({
  isOpen,
  onClose,
  isMaximized,
  onToggleMaximize,
  projectId,
  userId,
  onRefreshTree
}, ref) => {
  const terminalRef = useRef(null)
  const xtermInstance = useRef(null)
  const fitAddonRef = useRef(null)
  const socketRef = useRef(null)
  const pendingCommandRef = useRef(null)
  const [activeTab, setActiveTab] = useState('TERMINAL')
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connecting' | 'connected' | 'disconnected' | 'error'

  useImperativeHandle(ref, () => ({
    executeCommand: (cmd) => {
      if (!cmd) return
      const formattedCmd = cmd.endsWith('\r') || cmd.endsWith('\n') ? cmd : `${cmd}\r`
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('terminal-write', formattedCmd)
      } else {
        pendingCommandRef.current = formattedCmd
      }
    },
    saveFileToDisk: (relPath, content) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('file-saved', { relPath, content })
      }
    },
    focus: () => {
      xtermInstance.current?.focus()
    }
  }), [])

  // Vertical resizability states
  const [panelHeight, setPanelHeight] = useState(256)
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const panelHeightRef = useRef(256)

  useEffect(() => {
    panelHeightRef.current = panelHeight
  }, [panelHeight])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    isDraggingRef.current = true

    const startY = e.clientY
    const startHeight = panelHeightRef.current

    if (isMaximized && onToggleMaximize) {
      onToggleMaximize()
    }

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return
      const deltaY = startY - moveEvent.clientY
      const minHeight = 90
      const maxHeight = Math.floor(window.innerHeight * 0.85)
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY))
      setPanelHeight(newHeight)
      panelHeightRef.current = newHeight
      fitAddonRef.current?.fit()
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      isDraggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      setTimeout(() => {
        try {
          fitAddonRef.current?.fit()
          if (socketRef.current?.connected && xtermInstance.current) {
            socketRef.current.emit(
              'terminal-resize',
              xtermInstance.current.cols,
              xtermInstance.current.rows
            )
          }
        } catch (e) {}
      }, 50)
    }

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [isMaximized, onToggleMaximize])

  const connectTerminal = useCallback(() => {
    if (!projectId || !userId || !terminalRef.current) return

    // Clean up previous socket if any
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Initialize xterm if not already created
    let term = xtermInstance.current
    let fitAddon = fitAddonRef.current

    if (!term) {
      term = new Terminal({
        cursorBlink: true,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
        lineHeight: 1.3,
        convertEol: true,
        theme: {
          background: '#07090e',
          foreground: '#cbd5e1',
          cursor: '#f8fafc',
          selectionBackground: '#ffffff20',
          black: '#07090e',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#94a3b8',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f8fafc',
          brightBlack: '#64748b',
          brightRed: '#ef4444',
          brightGreen: '#22c55e',
          brightYellow: '#eab308',
          brightBlue: '#cbd5e1',
          brightMagenta: '#a855f7',
          brightCyan: '#06b6d4',
          brightWhite: '#ffffff'
        }
      })

      fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(terminalRef.current)
      fitAddon.fit()

      xtermInstance.current = term
      fitAddonRef.current = fitAddon
    } else {
      term.clear()
    }

    setConnectionStatus('connecting')
    term.writeln('\x1b[90mConnecting to integrated terminal backend...\x1b[0m')

    const socket = io(TERMINAL_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('connecting')
      term.writeln('\x1b[32m● Connected to terminal socket. Spawning shell environment...\x1b[0m\r\n')

      const cols = term.cols || 80
      const rows = term.rows || 30

      // Request terminal session initialization with current project
      socket.emit('terminalData', {
        projectId,
        userId,
        cols,
        rows
      })
    })

    socket.on('terminal-ready', ({ cols, rows }) => {
      setConnectionStatus('connected')
      if (pendingCommandRef.current) {
        const cmdToRun = pendingCommandRef.current
        pendingCommandRef.current = null
        setTimeout(() => {
          if (socketRef.current?.connected) {
            socketRef.current.emit('terminal-write', cmdToRun)
          }
        }, 300)
      }
    })

    // Listen for file sync updates emitted when files are created/updated in the terminal
    socket.on('disk-synced', () => {
      if (onRefreshTree) {
        onRefreshTree(false)
      }
    })

    // Forward raw PTY output from backend into Xterm
    socket.on('terminalData', (data) => {
      term.write(data)
    })

    socket.on('connect_error', (err) => {
      setConnectionStatus('error')
      term.writeln(`\r\n\x1b[31m[Connection Error: ${err.message || 'Cannot reach terminal service'}]\x1b[0m`)
      term.writeln('\x1b[90mEnsure backend terminal service is running on port 8005.\x1b[0m\r\n')
    })

    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected')
      term.writeln(`\r\n\x1b[90m[Terminal session disconnected: ${reason}]\x1b[0m\r\n`)
    })

    // Send every user input keystroke directly to backend ptyProcess
    const onDataDisposable = term.onData((data) => {
      if (socket.connected) {
        socket.emit('terminal-write', data)
      }
    })

    return () => {
      onDataDisposable.dispose()
    }
  }, [projectId, userId])

  useEffect(() => {
    if (!isOpen) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setConnectionStatus('disconnected')
      return
    }

    const cleanupDisposable = connectTerminal()

    const handleResize = () => {
      try {
        fitAddonRef.current?.fit()
        if (socketRef.current?.connected && xtermInstance.current) {
          socketRef.current.emit(
            'terminal-resize',
            xtermInstance.current.cols,
            xtermInstance.current.rows
          )
        }
      } catch (err) {
        // ignore layout resize errors
      }
    }

    window.addEventListener('resize', handleResize)
    const timeout = setTimeout(handleResize, 150)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
      if (cleanupDisposable) cleanupDisposable()
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [isOpen, connectTerminal])

  // ResizeObserver to automatically fit xterm whenever the container resizes
  useEffect(() => {
    if (!terminalRef.current) return
    const ro = new ResizeObserver(() => {
      try {
        fitAddonRef.current?.fit()
        if (socketRef.current?.connected && xtermInstance.current) {
          socketRef.current.emit(
            'terminal-resize',
            xtermInstance.current.cols,
            xtermInstance.current.rows
          )
        }
      } catch (err) {}
    })
    ro.observe(terminalRef.current)
    return () => ro.disconnect()
  }, [])

  // Recalculate dimensions on maximize toggle
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        fitAddonRef.current?.fit()
        if (socketRef.current?.connected && xtermInstance.current) {
          socketRef.current.emit(
            'terminal-resize',
            xtermInstance.current.cols,
            xtermInstance.current.rows
          )
        }
      } catch (err) {}
    }, 220)
    return () => clearTimeout(timeout)
  }, [isMaximized])

  const handleClear = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear()
    }
  }

  const handleReconnect = () => {
    connectTerminal()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        height: isMaximized ? '75vh' : `${panelHeight}px`
      }}
      className={`w-full bg-[#07090e] border-t border-white/[0.08] flex flex-col z-10 font-sans relative ${
        isDragging ? 'select-none transition-none' : 'transition-[height] duration-150'
      }`}
    >
      {/* Top Drag Resize Handle (VS Code style) */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={onToggleMaximize}
        className="h-2 w-full bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 cursor-row-resize absolute top-0 left-0 z-30 transition-colors group flex items-center justify-center"
        title="Drag up or down to resize terminal (Double click to toggle maximize)"
      >
        <div className="w-8 h-0.5 rounded-full bg-white/20 group-hover:bg-blue-400 group-hover:w-16 transition-all duration-150" />
      </div>

      {/* Terminal Top Bar */}
      <div className="h-8 bg-[#090c13] border-b border-white/[0.06] flex items-center justify-between px-3 text-xs select-none">
        {/* Left Tabs & Status Indicator */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {['TERMINAL', 'OUTPUT', 'PROBLEMS (0)', 'DEBUG CONSOLE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                activeTab === tab
                  ? 'text-white font-semibold bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}

          {/* Connection status badge */}
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded text-[10px] bg-white/[0.04] border border-white/[0.06]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 font-sans capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleReconnect}
            title="Reconnect Terminal"
            className="p-1 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            <VscRefresh className="text-xs" />
          </button>
          <button
            onClick={handleClear}
            title="Clear Terminal"
            className="p-1 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            <VscClearAll className="text-xs" />
          </button>
          <button
            title="Split Terminal"
            className="p-1 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer opacity-50 cursor-not-allowed"
          >
            <VscSplitHorizontal className="text-xs" />
          </button>
          <button
            onClick={onToggleMaximize}
            title={isMaximized ? 'Restore Terminal' : 'Maximize Terminal'}
            className="p-1 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            {isMaximized ? (
              <VscChevronDown className="text-xs" />
            ) : (
              <VscChevronUp className="text-xs" />
            )}
          </button>
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            <VscClose className="text-xs" />
          </button>
        </div>
      </div>

      {/* Terminal Content Canvas */}
      <div className="flex-1 w-full p-2 overflow-hidden bg-[#07090e]">
        {activeTab === 'TERMINAL' ? (
          <div ref={terminalRef} className="h-full w-full" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono text-xs">
            No active output for {activeTab}.
          </div>
        )}
      </div>
    </div>
  )
})

TerminalPanel.displayName = 'TerminalPanel'

export default TerminalPanel
