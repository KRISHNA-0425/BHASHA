import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// --- Crisp Lightweight Inline Icons for Zero-Lag, Never-Flicker Rendering ---
const TerminalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
)

const CodeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
)

const RefreshIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
)

const PlayIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
)

const ShieldIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

const ArrowRightIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const SunIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
)

const MoonIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
)

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const GitHubIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

// --- 4-Grid Dedicated Icons ---
const SparklesIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.122 2.122m8.486 8.486l2.122 2.122M5.636 18.364l2.122-2.122m8.486-8.486l2.122-2.122"/>
  </svg>
)

const RocketIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4.5c1.45-1.47 4.5-2 4.5-2"/>
    <path d="M12 15v5s3.03-.55 4.5-2c1.47-1.45 2-4.5 2-4.5"/>
  </svg>
)

const MonitorIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"/>
    <line x1="8" x2="16" y1="21" y2="21"/>
    <line x1="12" x2="12" y1="17" y2="21"/>
  </svg>
)

const LockShieldIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
    <path d="M12 15v2"/>
  </svg>
)

const Landing = () => {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)

  // Local theme management
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', next)
      } catch (err) {
        console.error("Failed to save theme in localStorage:", err)
      }
      return next
    })
  }

  // Update HTML tag class for dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Mobile navigation menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 1. Scenario Selector State (User-Oriented)
  const scenarios = useMemo(() => ({
    'node-react': {
      title: 'Full-Stack React & Node.js Application',
      probe: 'AI Engine: Scaffolding API & React client components',
      tokens: '1,420 tokens generated',
      mode: 'agent'
    },
    'multi-file': {
      title: 'Autonomous Multi-File Component Refactor',
      probe: 'AST Synthesizer: Modifying 3 files simultaneously',
      tokens: '2,180 tokens generated',
      mode: 'agent'
    },
    'live-preview': {
      title: 'Real-Time Dual-Engine App Preview',
      probe: 'Preview Engine: HMR synced in 18ms',
      tokens: '740 tokens generated',
      mode: 'preview'
    },
    'terminal-exec': {
      title: 'Sandboxed Interactive Cloud Terminal',
      probe: 'Terminal Daemon: Running test suite in isolated container',
      tokens: '980 tokens generated',
      mode: 'pty'
    }
  }), [])

  const [activeScenario, setActiveScenario] = useState('node-react')
  const [tokenCounter, setTokenCounter] = useState(1420)
  const [activeTabMobile, setActiveTabMobile] = useState('dag') // 'dag' | 'code' | 'probes'

  // 2. DAG Progression State
  const [activeDagStep, setActiveDagStep] = useState(3)
  const dagNodes = [
    { id: 1, name: '1. context_loader', badge: 'ACTIVE 2ms' },
    { id: 2, name: '2. agent_planner', badge: 'PLANNING' },
    { id: 3, name: '3. mutate_ast_patch', badge: 'STREAMING' },
    { id: 4, name: '4. syntax_verify', badge: 'VERIFYING' },
    { id: 5, name: '5. filesystem_sync', badge: 'SYNCED' }
  ]

  // Live Simulated Typing in Code Editor
  const simulatedCodeSnippets = useMemo(() => [
    `return await ASTSynthesizer.applyMultiFileDiff({
    targetFiles: ['src/components/Dashboard.tsx', 'src/server/routes.ts'],
    autoFormat: true,
    debounceSyncMs: 50
  });`,
    `return await CodeRefactor.verifySyntaxAndTypes({
    channel: 'workspace-sync',
    strictTypeCheck: true,
    instantReload: true
  });`,
    `return await AgentPipeline.streamAutonomousAST({
    model: 'gemini-1.5-flash',
    maxTokens: 4096,
    multiFileDiff: true
  });`
  ], [])

  const [snippetIndex, setSnippetIndex] = useState(0)
  const [typedChars, setTypedChars] = useState(0)

  useEffect(() => {
    let timer
    const currentCode = simulatedCodeSnippets[snippetIndex]
    if (typedChars < currentCode.length) {
      timer = setTimeout(() => {
        setTypedChars(prev => prev + 1)
      }, 20)
    } else {
      timer = setTimeout(() => {
        setSnippetIndex(prev => (prev + 1) % simulatedCodeSnippets.length)
        setTypedChars(0)
        setActiveDagStep(prev => (prev % 5) + 1)
      }, 3000)
    }
    return () => clearTimeout(timer)
  }, [typedChars, snippetIndex, simulatedCodeSnippets])

  // Live Telemetry Simulation
  const [telemetry, setTelemetry] = useState({
    heroLatency: '42ms',
    monacoLatency: '1.1ms'
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry({
        heroLatency: (38 + Math.floor(Math.random() * 8)) + 'ms',
        monacoLatency: (0.9 + Math.random() * 0.4).toFixed(1) + 'ms'
      })
      setTokenCounter(prev => prev + Math.floor(Math.random() * 8) + 1)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // 3. User-Oriented Platform Architecture Data (NO INTERNAL PORTS OR IPs)
  const meshData = useMemo(() => ({
    gateway: {
      name: 'Edge Ingress & Global Routing',
      badge: 'GLOBAL EDGE',
      role: 'Edge Ingress',
      desc: 'Instant global routing, automatic SSL/TLS termination, and edge caching for sub-millisecond page delivery.',
      tech: 'HTTP/2 & Secure WebSockets',
      path: 'Developer Client ➔ Global Edge Ingress ➔ Cloud Workspace',
      schema: `{\n  "service": "Edge Ingress",\n  "protocol": "HTTPS / WSS",\n  "edge_caching": true,\n  "compression": "Brotli",\n  "status": "Online"\n}`,
      diagnostics: [
        { label: 'Edge Latency', value: '<1ms' },
        { label: 'Encryption', value: 'Enterprise TLS 1.3' },
        { label: 'Data Masking', value: 'Active Token Scrubber' },
        { label: 'Availability', value: '99.99% Multi-Region' }
      ]
    },
    auth: {
      name: 'Identity & Access Management',
      badge: 'OAUTH & SSO',
      role: 'Authentication',
      desc: 'One-click GitHub & OAuth authorization with scoped repository access and cryptographic session validation.',
      tech: 'OAuth 2.0 / JWT',
      path: 'Edge Gateway ➔ Identity Service ➔ Scoped Workspace Token',
      schema: `{\n  "auth_provider": "GitHub OAuth 2.0",\n  "scopes": ["repo", "user:email"],\n  "token_security": "Ed25519 Signed",\n  "session_status": "Active"\n}`,
      diagnostics: [
        { label: 'Auth Speed', value: '0.8ms' },
        { label: 'Token Type', value: 'Cryptographically Signed' },
        { label: 'Permission Scope', value: 'Sandboxed Cloud Volume' }
      ]
    },
    project: {
      name: 'Cloud Workspace Virtualization',
      badge: 'PERSISTENT DISK',
      role: 'Workspace Storage',
      desc: 'Persistent cloud disks with automated snapshotting, instant project cloning, and real-time state preservation.',
      tech: 'Virtual Cloud Disk',
      path: 'Edge Gateway ➔ Workspace Virtualizer ➔ Persistent Volume',
      schema: `{\n  "workspace_state": "Active",\n  "filesystem": "Virtual Volume",\n  "auto_backup": "Enabled",\n  "snapshot_frequency": "Continuous"\n}`,
      diagnostics: [
        { label: 'Disk Mount', value: 'Sub-millisecond Read/Write' },
        { label: 'Snapshots', value: 'Automated Continuous' },
        { label: 'Persistence', value: 'Encrypted Cloud Storage' }
      ]
    },
    vfs: {
      name: 'Real-Time Virtual Filesystem',
      badge: 'INSTANT SYNC',
      role: 'Filesystem Sync',
      desc: 'Two-way duplex synchronization between editor, terminal, and container filesystem with zero lost edits.',
      tech: 'Duplex Event Bus',
      path: 'Monaco Editor ➔ Virtual Filesystem ➔ Sandboxed Container',
      schema: `{\n  "sync_engine": "Bi-Directional Event Stream",\n  "conflict_resolution": "Automated",\n  "sync_lag": "0ms",\n  "file_integrity": "Verified"\n}`,
      diagnostics: [
        { label: 'Sync Latency', value: '<5ms' },
        { label: 'Conflict Engine', value: 'Deterministic Resolution' },
        { label: 'State Parity', value: '100% Verified' }
      ]
    },
    agent: {
      name: 'Autonomous AI Agent Engine',
      badge: 'LANGGRAPH CYCLOID',
      role: 'AI Code Engine',
      desc: 'LangGraph multi-step state machines streaming verified multi-file code diffs directly into your editor buffer.',
      tech: 'LangGraph / SSE',
      path: 'User Prompt ➔ LangGraph DAG ➔ Monaco Multi-File Diff',
      schema: `{\n  "model_engine": "Multi-Model AI Router",\n  "stream_protocol": "Server-Sent Events",\n  "ast_validation": "Strict Syntax Check",\n  "autonomous_diff": true\n}`,
      diagnostics: [
        { label: 'Generation Speed', value: '54+ tokens/sec' },
        { label: 'AST Verification', value: '0 Syntax Regressions' },
        { label: 'Context Scope', value: 'Project-Wide Dependency Graph' }
      ]
    },
    pty: {
      name: 'Interactive Cloud Terminal',
      badge: 'FULL PTY REPL',
      role: 'Terminal Shell',
      desc: 'Full-duplex terminal connection supporting interactive CLIs, node/python REPLs, and npm build commands.',
      tech: 'WebSockets / PTY',
      path: 'Browser Terminal ➔ Secure WebSocket ➔ Container PTY Shell',
      schema: `{\n  "terminal_type": "xterm-256color",\n  "protocol": "Secure WSS",\n  "shell": "bash / zsh",\n  "full_duplex": true\n}`,
      diagnostics: [
        { label: 'Terminal Ping', value: '<2ms' },
        { label: 'ANSI Color', value: '256 TrueColor' },
        { label: 'Buffer Sync', value: 'Instant Mirroring' }
      ]
    },
    security: {
      name: 'Security Sandboxes & Quotas',
      badge: 'ENTERPRISE GUARD',
      role: 'Security & Quotas',
      desc: 'Isolated container boundaries, credential redaction, and transparent plan usage governance.',
      tech: 'Isolated Sandboxes',
      path: 'Container Runtime ➔ Security Filter ➔ Isolated Execution',
      schema: `{\n  "sandbox_isolation": "Container cgroups",\n  "token_redaction": "Regex Masking Active",\n  "plan_governance": "Starter & Pro",\n  "secret_leak_protection": true\n}`,
      diagnostics: [
        { label: 'Credential Masking', value: '100% Redacted in Prompts' },
        { label: 'Plan Control', value: 'Automated Quota Governance' },
        { label: 'Sandbox Isolation', value: 'Enterprise Grade' }
      ]
    },
    storage: {
      name: 'Encrypted Cloud Storage',
      badge: 'AES-256 GCM',
      role: 'Storage & Backup',
      desc: 'High-throughput caching and persistent volume backups with end-to-end data encryption at rest.',
      tech: 'High-Performance Cache',
      path: 'Workspace Data ➔ Encrypted Volume ➔ Redundant Cloud Backup',
      schema: `{\n  "encryption_at_rest": "AES-256-GCM",\n  "redundancy": "Multi-Zone Cloud Replication",\n  "cache_layer": "In-Memory Pub/Sub",\n  "backup_recovery": "Continuous"\n}`,
      diagnostics: [
        { label: 'Encryption', value: 'AES-256 At Rest & In Transit' },
        { label: 'Reliability', value: '99.99% Uptime SLA' },
        { label: 'Recovery Time', value: 'Instant Volume Restore' }
      ]
    }
  }), [])

  const [activeMeshKey, setActiveMeshKey] = useState('gateway')
  const activeMesh = meshData[activeMeshKey] || meshData.gateway

  // 4. Comparison Matrix State (User-Oriented Scenarios)
  const [matrixScenario, setMatrixScenario] = useState('refactor') // 'refactor' | 'coldstart' | 'feedback'

  const matrixData = useMemo(() => ({
    refactor: {
      btnLabel: 'SCENARIO: MULTI-FILE REFACTORING',
      verdict: 'LangGraph multi-agent diffs eliminate tedious copy-pasting from chat windows.',
      traditional: {
        title: '❌ Fragmented Chat Snippets in Sidebar:',
        body: 'Developer is forced to manually copy-paste code snippets into 5 separate files, resolve indentation errors, and fix broken imports by hand.'
      },
      bhasha: {
        title: '✔ Autonomous Multi-File AST Diffing:',
        body: 'Bhasha analyzes the entire project structure, plans modifications across all relevant files, and applies verified code diffs directly into your editor buffer.'
      }
    },
    coldstart: {
      btnLabel: 'SCENARIO: WORKSPACE SETUP TIME',
      verdict: 'Instant WebAssembly cloud engine boots full-stack environments in under 2 seconds.',
      traditional: {
        title: '❌ Slow VM Spooling & Local Config Hell:',
        body: 'Waiting 3 to 10 minutes to pull Docker containers, install mismatched Node.js versions, and resolve platform-specific build tool failures.'
      },
      bhasha: {
        title: '✔ Sub-2s Instant Browser Launch:',
        body: 'Zero local dependencies required. Launch pre-configured Node, React, and Python workspaces with Monaco editor and terminal ready to code.'
      }
    },
    feedback: {
      btnLabel: 'SCENARIO: LIVE PREVIEW & FEEDBACK',
      verdict: 'Dual-engine live preview provides instantaneous feedback with zero browser reloads.',
      traditional: {
        title: '❌ Context-Switching Between App Windows:',
        body: 'Constantly switching between terminal tabs, browser windows, and editor panes, manually hitting refresh to inspect CSS and state changes.'
      },
      bhasha: {
        title: '✔ Integrated Unified Workspace Dock:',
        body: 'Code editor, interactive cloud terminal, and dual-engine live preview run seamlessly side-by-side with sub-50ms Hot Module Replacement.'
      }
    }
  }), [])

  // 5. Interactive In-Browser REPL State
  const [replHistory, setReplHistory] = useState([
    { type: 'comment', text: '// Terminal initialized. Type a command or click quick action buttons below.' },
    { type: 'cmd', text: '$ bhasha --status' },
    { type: 'out', text: '✔ [Status] All cloud workspaces and AI engines operational. 99.99% uptime.' }
  ])
  const [replInput, setReplInput] = useState('')
  const terminalEndRef = useRef(null)

  const runReplCommand = (cmd) => {
    let output = ''
    if (cmd.includes('--status')) {
      output = '✔ [Status] All cloud workspaces and AI engines operational. System healthy & mesh synchronized.'
    } else if (cmd.includes('npm test')) {
      output = 'PASS src/components/App.test.tsx (14 tests passed, 0 syntax regressions)'
    } else if (cmd.includes('git status')) {
      output = 'On branch main. Working tree clean. All workspace changes synced to cloud volume.'
    } else if (cmd.includes('bhasha create-app')) {
      output = '✔ Initialized full-stack React + Node.js workspace template in 1.4s. Ready to build.'
    } else if (cmd.includes('cat agent.config.json')) {
      output = '{\n  "agent_graph": "LangGraph_Cycloid_v4",\n  "active_model": "gemini-1.5-flash",\n  "multi_file_patching": true,\n  "ast_verification": true\n}'
    } else if (cmd.includes('cat .env.safe')) {
      output = '# Sanitized environment variables (Redacted by Regex Whitelist):\nGITHUB_CLIENT_ID=gh_99af28\nAPI_HOST=https://api.bhasha.ai\nOPENAI_KEY=[REDACTED_SECRET_MASK]'
    } else if (cmd === 'help') {
      output = 'Available commands: bhasha --status, npm test, git status, bhasha create-app, cat agent.config.json, clear'
    } else {
      output = `Command executed successfully: ${cmd}`
    }

    setReplHistory(prev => [...prev, { type: 'cmd', text: `$ ${cmd}` }, { type: 'out', text: output }])
    setTimeout(() => {
      if (terminalEndRef.current) {
        terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
      }
    }, 50)
  }

  const handleReplSubmit = (e) => {
    e.preventDefault()
    if (!replInput.trim()) return
    if (replInput.trim() === 'clear') {
      setReplHistory([])
      setReplInput('')
      return
    }
    runReplCommand(replInput.trim())
    setReplInput('')
  }

  // --- Fixed, Highly Robust WebGL Shader Canvas ---
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationFrameId
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    function syncSize() {
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    syncSize()

    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize)
      resizeObserver.observe(canvas)
    } else {
      window.addEventListener('resize', syncSize)
    }

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_is_dark;

      float grid(vec2 st, float res) {
        vec2 grid = fract(st * res);
        vec2 line = step(0.975, grid) + step(grid, vec2(0.025));
        return clamp(line.x + line.y, 0.0, 1.0);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec3 darkBase = vec3(0.035, 0.045, 0.07);
        vec3 lightBase = vec3(0.96, 0.97, 0.985);
        vec3 color = u_is_dark > 0.5 ? darkBase : lightBase;

        float g1 = grid(st, 24.0) * 0.14;
        float g2 = grid(st, 6.0) * 0.24;

        float scan = smoothstep(0.008, 0.0, abs(fract(st.y * 0.18 - u_time * 0.05) - 0.5));
        
        vec2 cell = floor(st * 6.0);
        float hash = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
        float pulse = step(0.85, sin(u_time * 2.5 + hash * 6.2831)) * 0.15;

        vec3 tealTrace = vec3(0.0, 0.96, 0.77);
        vec3 blueTrace = u_is_dark > 0.5 ? vec3(0.12, 0.35, 0.85) : vec3(0.15, 0.55, 0.9);

        color += tealTrace * (g1 * 0.4 + g2 * 0.5);
        color += tealTrace * (scan * 0.18);
        color += blueTrace * (pulse * g2 * 1.5);

        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float vignette = smoothstep(1.3, 0.25, length(uv - 0.5));
        if (u_is_dark > 0.5) {
          color *= (0.45 + 0.55 * vignette);
        } else {
          color = mix(color, vec3(0.94, 0.95, 0.97), 1.0 - vignette);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `

    function createShader(gl, type, source) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const posBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]), gl.STATIC_DRAW)

    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uIsDark = gl.getUniformLocation(program, 'u_is_dark')

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    let start = performance.now()
    function render(t) {
      syncSize()
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (uTime) gl.uniform1f(uTime, (t || performance.now() - start) * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      if (uIsDark) gl.uniform1f(uIsDark, isDark ? 1.0 : 0.0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }
    animationFrameId = requestAnimationFrame(render)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', syncSize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isDark])

  // Call to Action Email State
  const [ctaEmail, setCtaEmail] = useState('')
  const handleCtaSubmit = (e) => {
    e.preventDefault()
    navigate(userData ? '/home' : '/login')
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#080a0f] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans antialiased selection:bg-[#00f5c4] selection:text-[#080a0f] overflow-x-hidden transition-colors duration-200`}>
      
      {/* =========================================================================
          HEADER / NAVBAR
          ========================================================================= */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#080a0f]/80 border-[#232734]' : 'bg-white/80 border-slate-200'} border-b backdrop-blur-md transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left Brand with Official Logo from public folder */}
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <img
                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                alt="BHASHA"
                className="h-6 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-mono text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4] text-[#00f5c4] hidden sm:inline-block">
                AI-IDE
              </span>
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-[12px] font-mono uppercase tracking-wider text-slate-400">
              <a className="hover:text-[#00f5c4] transition-colors" href="#features">Features</a>
              <a className="hover:text-[#00f5c4] transition-colors" href="#simulator">Simulator</a>
              <a className="hover:text-[#00f5c4] transition-colors" href="#platform">Platform</a>
              <a className="hover:text-[#00f5c4] transition-colors" href="#comparison">Comparison</a>
              <a className="hover:text-[#00f5c4] transition-colors" href="#terminal">Terminal</a>
              <a className="hover:text-[#00f5c4] transition-colors" href="/payment">Pricing</a>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* GitHub Link */}
            <a 
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 ${isDark ? 'bg-[#101319] border-[#232734] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'} border hover:border-[#00f5c4] text-[12px] font-mono hover:text-[#00f5c4] transition-colors`}
              href="https://github.com/KRISHNA-0425/BHASHA"
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon className="w-3.5 h-3.5 fill-current" />
              <span>GitHub</span>
            </a>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={`p-1.5 ${isDark ? 'bg-[#101319] border-[#232734] text-slate-300 hover:text-[#00f5c4]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-emerald-600'} border flex items-center justify-center transition-colors`}
            >
              {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>

            {/* Launch CTA Button */}
            <button
              onClick={() => navigate(userData ? '/home' : '/login')}
              className="px-2.5 sm:px-4 py-1.5 bg-[#00f5c4] hover:bg-[#00f5c4]/90 text-[#080a0f] font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
            >
              <span className="hidden xs:inline">{userData ? 'WORKSPACE' : 'LAUNCH IDE'}</span>
              <span className="xs:hidden">{userData ? 'APP' : 'IDE'}</span>
              <ArrowRightIcon className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden px-4 pt-3 pb-5 ${isDark ? 'bg-[#0b0e14] border-[#232734]' : 'bg-slate-100 border-slate-300'} border-b flex flex-col gap-3 font-mono text-xs uppercase tracking-wider`}>
            <a onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#00f5c4]" href="#features">Features</a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#00f5c4]" href="#simulator">Simulator</a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#00f5c4]" href="#platform">Platform</a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#00f5c4]" href="#comparison">Comparison</a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#00f5c4]" href="#terminal">Terminal</a>
            <a onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#00f5c4]" href="/payment">Pricing</a>
            <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
              <span className="text-slate-400">Theme:</span>
              <button onClick={toggleTheme} className="text-[#00f5c4] flex items-center gap-1.5">
                {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO SECTION (Shader canvas, datum brand frame, user-oriented headline)
          ========================================================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 flex flex-col items-center text-center overflow-hidden">
        
        {/* Background Interactive Shader Canvas */}
        <div className="absolute inset-0 pointer-events-none opacity-60 z-0">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Small Technical Top Banner */}
        <div className={`relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:py-1 ${isDark ? 'bg-[#101319] border-[#232734]' : 'bg-white border-slate-300 shadow-sm'} border mb-6 text-[10px] sm:text-[11px] font-mono max-w-full text-center`}>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#00f5c4] anim-pulse-dot"></span>
            <span className="text-slate-400">AI CLOUD IDE:</span>
            <span className="text-[#00f5c4] font-semibold">ACTIVE</span>
          </div>
          <span className="text-slate-600 hidden xs:inline">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">LATENCY:</span>
            <span className="text-slate-300 font-semibold">{telemetry.heroLatency}</span>
          </div>
          <span className="text-slate-600 hidden xs:inline">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">BOOT TIME:</span>
            <span className="text-slate-300">&lt; 2s INSTANT</span>
          </div>
        </div>

        {/* Centerpiece: Precision Engineered BHASHA Brand Geometry Frame */}
        <div className="relative z-10 w-full max-w-3xl mb-8">
          <div className={`relative p-3.5 sm:p-7 ${isDark ? 'bg-[#080a0f]/90 border-[#232734]' : 'bg-white/90 border-slate-300 shadow-lg'} border corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br backdrop-blur-md`}>
            
            {/* Datum Header inside Frame */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 mb-3 sm:mb-4 border-b border-[#232734] pb-2">
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#00f5c4]">⎡</span>
                <span>AUTONOMOUS <span className="hidden xs:inline">CLOUD </span>WORKSPACE</span>
              </span>
              <span className="hidden md:inline text-slate-500">NEXT-GEN DEVELOPER RUNTIME</span>
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span>AI COPILOT READY</span>
                <span className="text-[#00f5c4]">⎤</span>
              </span>
            </div>

            {/* Iconic BHASHA Brand Logo from public folder */}
            <div className="flex flex-col items-center justify-center py-3 sm:py-4 px-2 relative gap-3">
              <img
                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                alt="BHASHA"
                className="h-10 sm:h-18 md:h-20 w-auto max-w-[85%] object-contain select-none transition-all drop-shadow-[0_0_24px_rgba(0,245,196,0.3)]"
              />
              <div className="ruler-tick-h w-full opacity-60"></div>
            </div>

            {/* Datum Footer inside Frame */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 mt-3 sm:mt-4 border-t border-[#232734] pt-2">
              <span className="text-[#00f5c4] truncate">⎣ LANGGRAPH AGENT<span className="hidden xs:inline"> ENGINE</span></span>
              <span className="text-slate-400 hidden md:inline">MULTI-FILE CODE SYNTHESIS</span>
              <span className="text-[#00f5c4] truncate"><span className="hidden xs:inline">INTEGRATED </span>CLOUD SHELL ⎦</span>
            </div>
          </div>
        </div>

        {/* User-Oriented Architectural Headline */}
        <h1 className="relative z-10 font-display font-bold text-2xl sm:text-5xl lg:text-6xl tracking-tight text-white max-w-4xl leading-[1.2] sm:leading-[1.15] mb-5 px-2">
          The AI-First Cloud IDE That <br className="hidden sm:inline"/>
          <span className="text-[#00f5c4]">Builds Software With You</span>
        </h1>

        

        {/* Interactive Scenario Selector Pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mb-8 max-w-3xl">
          {[
            { key: 'node-react', label: '• Full-Stack Node & React' },
            { key: 'multi-file', label: '• Multi-File AI Refactor' },
            { key: 'live-preview', label: '• Real-Time Live Preview' },
            { key: 'terminal-exec', label: '• Sandboxed Cloud Terminal' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setActiveScenario(p.key)}
              className={`px-3.5 py-1.5 text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                activeScenario === p.key
                  ? 'bg-[#161922] border border-[#00f5c4] text-[#00f5c4] shadow-[0_0_12px_rgba(0,245,196,0.2)]'
                  : `${isDark ? 'bg-[#101319] border-[#232734] text-slate-400 hover:border-slate-500' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'} border`
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Live Telemetry Ticker Strip */}
        <div className={`relative z-10 flex flex-wrap items-center justify-center gap-4 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[#00f5c4] font-bold">✓</span>
            <span>{scenarios[activeScenario]?.probe || 'AI Engine: Active & Ready'}</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Throughput:</span>
            <span className="text-[#00f5c4] font-bold">{tokenCounter} tokens generated</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Latency:</span>
            <span className="text-[#00f5c4] font-bold">42ms AST Patch</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: THE CORE 4-GRID (The 4 Pillars of BHASHA)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="features">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[#00f5c4] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              [ 4-GRID CORE CAPABILITIES ]
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
              Engineered for Developers Who Ship
            </h2>
            <p className="font-sans text-sm text-slate-400 mt-2 max-w-2xl">
              Everything required to write, test, debug, and deploy software in a single cohesive flow. No context switching, no fragmented tabs, and zero configuration.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#101319] border border-[#232734] font-mono text-xs text-slate-300 shrink-0">
            <span className="w-2 h-2 bg-[#00f5c4] anim-pulse-dot"></span>
            <span>4 Pillars • Zero Setup</span>
          </div>
        </div>

        {/* 4-Grid Cards Container (2x2 on desktop, 1 col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Grid 1: Autonomous AI Pair Programmer */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#101319] border border-[#232734] hover:border-[#00f5c4] transition-all group flex flex-col justify-between relative corner-ch corner-ch-tl corner-ch-br">
            <div>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="w-10 h-10 bg-[#161922] border border-[#00f5c4]/40 text-[#00f5c4] flex items-center justify-center shrink-0">
                  <SparklesIcon className="w-5 h-5 text-[#00f5c4]" />
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-[#00f5c4] px-2 py-0.5 bg-[#080a0f] border border-[#00f5c4]/30">
                  PILLAR 01 // MULTI-FILE AI
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-[#00f5c4] transition-colors">
                Autonomous Multi-File Code Synthesis
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Stop copy-pasting code snippets from a chat sidebar. Bhasha's LangGraph AI understands your entire project context, plans file changes across components, and streams verified AST diffs directly into your editor buffer.
              </p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-[#232734] font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-[#00f5c4] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Real-time multi-file diffing & dependency updates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00f5c4] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Automated AST syntax and regression checks</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
                <span>Engine: LangGraph State Machine</span>
                <span className="text-[#00f5c4]">0 REGRESSIONS</span>
              </div>
            </div>
          </div>

          {/* Grid 2: Instant Cloud Workspaces */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#101319] border border-[#232734] hover:border-[#00d2ff] transition-all group flex flex-col justify-between relative corner-ch corner-ch-tr corner-ch-bl">
            <div>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="w-10 h-10 bg-[#161922] border border-[#00d2ff]/40 text-[#00d2ff] flex items-center justify-center shrink-0">
                  <RocketIcon className="w-5 h-5 text-[#00d2ff]" />
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-[#00d2ff] px-2 py-0.5 bg-[#080a0f] border border-[#00d2ff]/30">
                  PILLAR 02 // ZERO LOCAL SETUP
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-[#00d2ff] transition-colors">
                Zero-Config Full-Stack Environments
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Launch full-stack Node.js, React, and Python workspaces in under 2 seconds right in your browser. Powered by Monaco editor with full IntelliSense, smart autocompletion, instant snapshotting, and persistent cloud volumes.
              </p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-[#232734] font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-[#00d2ff] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Sub-2s workspace cold start via WebAssembly</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00d2ff] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Full Monaco IntelliSense & multi-cursor editing</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
                <span>Persistence: Continuous Snapshotting</span>
                <span className="text-[#00d2ff]">READY IN &lt;2s</span>
              </div>
            </div>
          </div>

          {/* Grid 3: Dual-Engine Live App Preview */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#101319] border border-[#232734] hover:border-[#a855f7] transition-all group flex flex-col justify-between relative corner-ch corner-ch-tl corner-ch-br">
            <div>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="w-10 h-10 bg-[#161922] border border-[#a855f7]/40 text-[#a855f7] flex items-center justify-center shrink-0">
                  <MonitorIcon className="w-5 h-5 text-[#a855f7]" />
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-[#a855f7] px-2 py-0.5 bg-[#080a0f] border border-[#a855f7]/30">
                  PILLAR 03 // REAL-TIME HMR
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-[#a855f7] transition-colors">
                Dual-Engine Live In-Browser Preview
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Watch your web application update instantly as you or your AI agent modify code. Dual-engine preview renders client and server runtimes side-by-side with sub-50ms Hot Module Replacement and zero browser reloading.
              </p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-[#232734] font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-[#a855f7] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Client & server runtimes rendered side-by-side</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#a855f7] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Sub-50ms React 19 and Vite hot module reload</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
                <span>Sync Latency: 18ms WebWorker Stream</span>
                <span className="text-[#a855f7]">LIVE SYNC</span>
              </div>
            </div>
          </div>

          {/* Grid 4: Integrated Cloud Terminal & Security */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#101319] border border-[#232734] hover:border-[#10b981] transition-all group flex flex-col justify-between relative corner-ch corner-ch-tr corner-ch-bl">
            <div>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="w-10 h-10 bg-[#161922] border border-[#10b981]/40 text-[#10b981] flex items-center justify-center shrink-0">
                  <LockShieldIcon className="w-5 h-5 text-[#10b981]" />
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-[#10b981] px-2 py-0.5 bg-[#080a0f] border border-[#10b981]/30">
                  PILLAR 04 // CLOUD PTY SHELL
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-[#10b981] transition-colors">
                Full Interactive Sandboxed Terminal
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Run package managers, custom test suites, and backend processes in an isolated cloud container. Automated credential redaction guarantees secret tokens and API keys never leak into model prompts.
              </p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-[#232734] font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-[#10b981] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Full duplex xterm.js PTY shell with ANSI color</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#10b981] shrink-0">✔</span>
                <span className="text-[11px] sm:text-xs">Isolated container execution & secret redaction</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
                <span>Security: Enterprise Sandboxed Container</span>
                <span className="text-[#10b981]">ZERO LEAKS</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BHASHA SIMULATOR (Live Multi-Pane Engineering Dock)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" id="simulator">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[#00f5c4] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              [ LIVE INTERACTIVE DOCK ]
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Experience the Autonomous Development Flow
            </h2>
            <p className="font-sans text-sm text-slate-400 mt-1 max-w-xl">
              Watch the LangGraph state machine orchestrate code modifications, verify syntax, and update the editor in real time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSnippetIndex(prev => (prev + 1) % simulatedCodeSnippets.length)
                setTypedChars(0)
                setActiveDagStep(prev => (prev % 5) + 1)
              }}
              className="px-3 py-1.5 bg-[#101319] hover:bg-[#161922] border border-[#00f5c4] text-[#00f5c4] text-xs font-mono font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Re-Trigger Cycle</span>
            </button>
          </div>
        </div>

        {/* Mobile View Tabs */}
        <div className="flex lg:hidden mb-3 border-b border-[#232734] font-mono text-xs">
          {[
            { key: 'dag', label: 'DAG Pipeline' },
            { key: 'code', label: 'Code Diff' },
            { key: 'probes', label: 'Runtime Telemetry' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTabMobile(tab.key)}
              className={`flex-1 py-2 text-center transition-colors ${
                activeTabMobile === tab.key
                  ? 'border-b-2 border-[#00f5c4] text-[#00f5c4] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Multi-Pane Simulator Window Frame */}
        <div className="border border-[#232734] bg-[#0c0f16] corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br">
          
          {/* Top Window Title Bar */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#101319] border-b border-[#232734] flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 bg-[#ef4444] rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-[#eab308] rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full"></span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <img
                  src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                  alt="BHASHA"
                  className="h-4 w-auto object-contain inline-block align-middle shrink-0"
                />
                <span className="text-slate-400 hidden sm:inline shrink-0">Workspace Dock //</span>
                <span className="text-[#00f5c4] font-semibold truncate text-[11px] sm:text-xs">{scenarios[activeScenario]?.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-400 shrink-0">
              <span className="hidden sm:inline">Tokens: {tokenCounter}</span>
              <span className="px-2 py-0.5 bg-[#161922] border border-[#232734] text-[#00f5c4]">
                ENGINE ACTIVE
              </span>
            </div>
          </div>

          {/* 3-Column Dock Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#232734]">
            
            {/* Panel 1: LangGraph DAG Pipeline (Left 3 cols) */}
            <div className={`lg:col-span-3 ${isDark ? 'bg-[#080a0f]' : 'bg-slate-50'} p-3.5 space-y-3 ${activeTabMobile === 'dag' ? 'block' : 'hidden lg:block'}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pb-2 border-b border-[#232734]">
                [ AI Execution Pipeline ]
              </div>
              <p className="text-[10px] font-mono text-slate-500 leading-relaxed">
                Autonomous cycle streaming verified AST patches through the execution graph.
              </p>

              <div className="space-y-1.5">
                {dagNodes.map((node) => {
                  const isCurrent = node.id === activeDagStep
                  const isPast = node.id < activeDagStep
                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveDagStep(node.id)}
                      className={`p-2.5 border transition-all cursor-pointer font-mono text-xs flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#161922] border-[#00f5c4] text-[#00f5c4] shadow-[0_0_10px_rgba(0,245,196,0.15)]'
                          : isPast
                          ? 'bg-[#101319] border-[#232734] text-slate-300'
                          : 'bg-transparent border-transparent text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 ${isCurrent ? 'bg-[#00f5c4] anim-pulse-dot' : isPast ? 'bg-[#10b981]' : 'bg-slate-600'}`}></span>
                        <span>{node.name}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 bg-[#080a0f] border border-[#232734] text-slate-400">
                        {isPast ? 'COMPLETED' : node.badge}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveDagStep(prev => (prev % 5) + 1)}
                  className="w-full py-1.5 bg-[#101319] hover:bg-[#161922] border border-[#232734] hover:border-[#00f5c4] text-[#00f5c4] font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlayIcon className="w-3 h-3 fill-current" />
                  <span>Step Next AST Token Patch</span>
                </button>
              </div>
            </div>

            {/* Panel 2: Live Code Diff Buffer (Center 6 cols) */}
            <div className={`lg:col-span-6 bg-[#050608] flex flex-col justify-between ${activeTabMobile === 'code' ? 'block' : 'hidden lg:flex'}`}>
              <div>
                {/* Code Editor Header */}
                <div className="px-3 sm:px-4 py-2 bg-[#0c0f16] border-b border-[#232734] flex items-center justify-between font-mono text-xs text-slate-400 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <CodeIcon className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                    <span className="text-white truncate">src/components/Dashboard.tsx</span>
                    <span className="text-[9px] sm:text-[10px] text-[#00f5c4] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4]/30 shrink-0">LIVE AST DIFF</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">TypeScript 5.4</span>
                </div>

                {/* Code Buffer Content */}
                <div className="p-3 sm:p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto text-slate-300 space-y-1">
                  <p className="text-slate-500">// Autonomous LangGraph AST patch orchestration</p>
                  <p>
                    <span className="text-purple-400">import</span> &#123; <span className="text-[#00f5c4]">AgentPipeline</span> &#125; <span className="text-purple-400">from</span> <span className="text-amber-300">'@bhasha/agent-runtime'</span>;
                  </p>
                  <p className="pt-2 text-slate-500">// Real-time multi-file state synthesis</p>
                  <p>
                    <span className="text-blue-400">export async function</span> <span className="text-yellow-300">executeAutonomousASTCycle</span>&#40;<span className="text-orange-300">config</span>: <span className="text-[#00f5c4]">ASTConfig</span>&#41; &#123;
                  </p>
                  <p className="pl-4">
                    <span className="text-blue-400">const</span> engine = <span className="text-blue-400">await</span> AgentPipeline.<span className="text-yellow-300">resolveAutonomousRuntime</span>&#40;&#41;;
                  </p>
                  <p className="pl-4">
                    <span className="text-slate-400">engine.maxTokens = 4096;</span>
                  </p>
                  <p className="pl-4">
                    <span className="text-slate-400">engine.strictTombstones = true;</span>
                  </p>
                  
                  {/* Streaming Diff Area */}
                  <div className="my-2 p-2.5 bg-[#0a1215] border-l-2 border-[#00f5c4] text-[#00f5c4] font-mono text-[11px] whitespace-pre-wrap">
                    <p className="text-xs text-slate-400 mb-1">// [!] Live AST Patch Streamed [Node: mutate_ast_patch]</p>
                    {simulatedCodeSnippets[snippetIndex].substring(0, typedChars)}
                    <span className="anim-blink">|</span>
                  </div>

                  <p className="pt-1">&#125;</p>

                  {activeDagStep >= 4 && (
                    <p className="text-[#00f5c4] pt-1 text-[11px]">// [AST] Node 'syntax_verify' passed 0 syntax regressions</p>
                  )}
                  {activeDagStep === 5 && (
                    <p className="text-[#00f5c4] text-[11px]">// [AST] Two-way filesystem synchronization complete. Buffer updated.</p>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <div className={`px-3 sm:px-4 py-2 ${isDark ? 'bg-[#0d1017] border-[#232734]' : 'bg-slate-100 border-slate-200'} border-t flex items-center justify-between font-mono text-[10px] sm:text-[11px] text-slate-400 gap-2 flex-wrap`}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#00f5c4] anim-pulse-dot"></span>
                  <span>AST State: Clean & Synced</span>
                </div>
                <span>Latency: {telemetry.monacoLatency}</span>
              </div>
            </div>

            {/* Panel 3: System Runtime & Probes (Right 3 cols) */}
            <div className={`lg:col-span-3 ${isDark ? 'bg-[#080a0f]' : 'bg-slate-50'} p-3.5 flex flex-col justify-between ${activeTabMobile === 'probes' ? 'block' : 'hidden lg:flex'}`}>
              <div className="space-y-4">
                
                {/* Section Header */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-[#232734]">
                  <span>SYSTEM RUNTIME & PROBES</span>
                  <span className="text-[#00f5c4] font-bold text-[10px] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4]">
                    ONLINE
                  </span>
                </div>

                <p className="text-[10px] font-mono text-slate-500 leading-relaxed">
                  High-performance container isolation, sub-millisecond AST parser, and automated continuous backup.
                </p>

                {/* AI Copilot Probe Card */}
                <div className="p-3 bg-[#101319] border border-[#232734] font-mono text-xs space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">AI COPILOT RUNTIME:</div>
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>Gemini 1.5 Flash</span>
                    <span className="text-[#00f5c4] text-[10px]">Active</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-[#232734]">
                    Engine: LangGraph State Machine<br/>
                    Transport: Bi-Directional SSE Stream
                  </div>
                </div>

                {/* Cloud Workspace State */}
                <div className="p-3 bg-[#101319] border border-[#232734] font-mono text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#00f5c4] uppercase font-bold tracking-wider">
                    <ShieldIcon className="w-3.5 h-3.5 text-[#00f5c4]" />
                    <span>SANDBOX INTEGRITY</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Zero ghost file leaks during terminal file deletions. Inode state tracked deterministically.
                  </p>
                </div>

              </div>

              {/* Bottom VFS Sync Diagnostics */}
              <div className="pt-3 border-t border-[#232734] font-mono text-[10px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Cloud Sync Status:</span>
                  <span className="text-[#00f5c4]">SYNCHRONIZED</span>
                </div>
                <div className="flex justify-between">
                  <span>File Integrity Check:</span>
                  <span className="text-white">PASSING (0 ERRORS)</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CLOUD PLATFORM ARCHITECTURE (NO PORTS OR INTERNAL LEAKS)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="platform">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[#00f5c4] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              [ ENTERPRISE CLOUD ARCHITECTURE ]
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Cloud Platform Architecture
            </h2>
            <p className="font-sans text-sm text-slate-400 mt-1 max-w-xl">
              Engineered for high-throughput developer workflows. Inspect core platform capabilities, security boundaries, and real-time execution guarantees.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#101319] border border-[#232734] font-mono text-xs text-[#00f5c4] shrink-0">
            <span className="w-2 h-2 bg-[#00f5c4] anim-pulse-dot"></span>
            <span>Global Cloud Cluster • 99.99% Availability</span>
          </div>
        </div>

        {/* Live Event Bus Ribbon */}
        <div className="mb-6 p-2.5 bg-[#101319] border border-[#232734] font-mono text-xs flex flex-wrap items-center justify-between gap-3 packet-rail">
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-[#00f5c4] font-bold">•</span>
            <span className="text-slate-300">REAL-TIME TELEMETRY BUS:</span>
            <span className="text-[#00f5c4]">ZERO-LATENCY EVENT MESH</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 relative z-10 text-[11px]">
            <span>LATENCY: &lt;1.2 ms</span>
            <span>THROUGHPUT: 12.4K ops/s</span>
          </div>
        </div>

        {/* 8 Interactive Capability Cards Grid (Responsive 1/2/4 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Object.entries(meshData).map(([key, node]) => {
            const isSelected = key === activeMeshKey
            return (
              <div
                key={key}
                onClick={() => setActiveMeshKey(key)}
                className={`p-3.5 border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#161922] border-[#00f5c4] shadow-[0_0_12px_rgba(0,245,196,0.15)]'
                    : 'bg-[#101319] border-[#232734] hover:border-[#00f5c4]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold ${isSelected ? 'text-[#00f5c4]' : 'text-white'}`}>
                    {node.role}
                  </span>
                  <span className="font-mono text-[9px] text-[#00f5c4] px-1 py-0.5 bg-[#080a0f] border border-[#232734]">
                    {node.badge}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-slate-400 mb-2 leading-relaxed">
                  {node.desc}
                </p>
                <div className="pt-2 border-t border-[#232734] flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span>{node.tech}</span>
                  <span className={isSelected ? 'text-[#00f5c4] font-bold' : ''}>
                    {isSelected ? 'INSPECTING' : 'CLICK TO VIEW'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Active Node Inspector Box */}
        <div className="p-4 sm:p-5 bg-[#080a0f] border border-[#232734] corner-ch corner-ch-tl corner-ch-br">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#232734]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00f5c4] anim-pulse-dot"></span>
              <span className="font-mono text-xs text-slate-400">Inspecting Capability:</span>
              <span className="font-mono text-xs font-bold text-white">{activeMesh.name}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              Execution Flow: <span className="text-[#00f5c4]">{activeMesh.path}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: JSON Contract Schema */}
            <div className="lg:col-span-7">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                CAPABILITY SPECIFICATION:
              </div>
              <pre className="p-3.5 bg-[#050608] border border-[#232734] text-[#00f5c4] font-mono text-xs leading-relaxed overflow-x-auto">
                <code>{activeMesh.schema}</code>
              </pre>
            </div>

            {/* Right: Live Telemetry & Diagnostics */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  TELEMETRY & OPERATIONAL GUARANTEES:
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {activeMesh.diagnostics.map((d, i) => (
                    <div key={i} className="p-2.5 bg-[#101319] border border-[#232734] flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">{d.label}:</span>
                      <span className="text-white font-semibold text-[11px]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-[#232734] flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Health Status: 99.99% Cloud SLA</span>
                <span className="text-[#00f5c4]">PASSING</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: TRADITIONAL CLOUD IDE VS BHASHA AUTONOMOUS FLOW
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="comparison">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-[#00f5c4] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            [ PARADIGM SHIFT: HOW DEVELOPERS BUILD ]
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
              Traditional Cloud IDE vs
            </h2>
            <img
              src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
              alt="BHASHA"
              className="h-8 sm:h-9 w-auto object-contain inline-block"
            />
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
              Autonomous Flow
            </h2>
          </div>
          <p className="font-sans text-sm text-slate-400">
            Compare friction across real development tasks: multi-file modifications, environment cold starts, and debugging feedback loops.
          </p>
        </div>

        {/* 3 Interactive Scenario Toggle Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { key: 'refactor', label: matrixData.refactor.btnLabel },
            { key: 'coldstart', label: matrixData.coldstart.btnLabel },
            { key: 'feedback', label: matrixData.feedback.btnLabel }
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setMatrixScenario(s.key)}
              className={`px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider border transition-all ${
                matrixScenario === s.key
                  ? 'bg-[#00f5c4] text-[#080a0f] border-[#00f5c4] shadow-[0_0_14px_rgba(0,245,196,0.3)]'
                  : 'bg-[#101319] text-slate-400 border-[#232734] hover:border-slate-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 2-Column Comparison Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Card 1: Traditional Cloud IDE */}
          <div className="p-6 bg-[#0c0f16] border border-[#ef4444]/30 flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232734]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#ef4444] rounded-full"></span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    TRADITIONAL CLOUD IDE / EXTENSIONS
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#ef4444] px-1.5 py-0.5 bg-[#161214] border border-[#ef4444]/40">
                  HIGH FRICTION
                </span>
              </div>

              <div className="p-4 bg-[#140f12] border border-[#ef4444]/30 mb-5">
                <div className="text-xs font-mono font-bold text-[#ef4444] mb-1">
                  {matrixData[matrixScenario]?.traditional.title}
                </div>
                <p className="font-sans text-xs text-slate-300 leading-relaxed">
                  {matrixData[matrixScenario]?.traditional.body}
                </p>
              </div>

              <ul className="space-y-2 text-xs font-mono text-slate-400 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#ef4444]">✗</span>
                  <span>Manual copy-pasting of code blocks into separate files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ef4444]">✗</span>
                  <span>Slow VM cold starts taking 30 to 90 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ef4444]">✗</span>
                  <span>Frequent syntax mismatches and missing import errors</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-[#ef4444]/20 text-[11px] font-mono text-slate-500">
              Result: Broken flow state, lost time, and tedious manual error recovery.
            </div>
          </div>

          {/* Card 2: BHASHA Autonomous Flow */}
          <div className="p-6 bg-[#0c1316] border border-[#00f5c4] flex flex-col justify-between relative shadow-[0_0_20px_rgba(0,245,196,0.1)]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#00f5c4]/30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#00f5c4] anim-pulse-dot"></span>
                  <img
                    src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                    alt="BHASHA"
                    className="h-4 w-auto object-contain inline-block align-middle"
                  />
                  <span className="font-mono text-xs font-bold text-[#00f5c4] uppercase tracking-wider">
                    AUTONOMOUS FLOW
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#00f5c4] px-1.5 py-0.5 bg-[#081514] border border-[#00f5c4]">
                  ZERO FRICTION
                </span>
              </div>

              <div className="p-4 bg-[#0a1818] border border-[#00f5c4]/40 mb-5">
                <div className="text-xs font-mono font-bold text-[#00f5c4] mb-1">
                  {matrixData[matrixScenario]?.bhasha.title}
                </div>
                <p className="font-sans text-xs text-slate-200 leading-relaxed">
                  {matrixData[matrixScenario]?.bhasha.body}
                </p>
              </div>

              <ul className="space-y-2 text-xs font-mono text-slate-300 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#00f5c4]">✔</span>
                  <span>Autonomous multi-file diffing with automated syntax checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00f5c4]">✔</span>
                  <span>Sub-2s browser boot with zero local installation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00f5c4]">✔</span>
                  <span>Unified dock with live preview and interactive terminal</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-[#00f5c4]/30 text-[11px] font-mono text-[#00f5c4]">
              Result: Complete cognitive flow state without context loss or manual copy-pasting.
            </div>
          </div>
        </div>

        {/* Verdict Bar */}
        <div className="p-3 bg-[#101319] border border-[#232734] text-center font-mono text-xs text-slate-300">
          <span className="text-[#00f5c4] font-bold">VERDICT: </span>
          <span>{matrixData[matrixScenario]?.verdict}</span>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: INTEGRATED CLOUD TERMINAL (Web-PTY REPL)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="terminal">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[#00f5c4] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              [ EMBEDDED XTERM.JS RUNTIME ]
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Integrated Cloud Terminal & Sandboxed CLI
            </h2>
            <p className="font-sans text-sm text-slate-400 mt-1 max-w-xl">
              Execute real terminal commands inside an isolated container. Test live commands below to evaluate speed and secret masking.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              'bhasha --status',
              'npm test',
              'git status',
              'bhasha create-app'
            ].map(cmd => (
              <button
                key={cmd}
                onClick={() => runReplCommand(cmd)}
                className="px-2.5 py-1 bg-[#101319] hover:bg-[#161922] border border-[#232734] hover:border-[#00f5c4] text-[#00f5c4] font-mono text-xs transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Window Frame */}
        <div className="bg-[#050608] border border-[#232734] corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br">
          
          {/* Terminal Window Title Bar */}
          <div className="px-4 py-2 bg-[#0c0f16] border-b border-[#232734] flex items-center justify-between font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00f5c4] anim-pulse-dot"></span>
              <span>session: cloud-terminal-secure (active)</span>
            </div>
            <span>container: isolated-sandbox</span>
          </div>

          {/* Terminal Output Display */}
          <div
            ref={terminalEndRef}
            className="p-4 sm:p-6 font-mono text-xs leading-relaxed max-h-80 overflow-y-auto space-y-2 text-slate-300"
          >
            {replHistory.map((item, idx) => (
              <div key={idx}>
                {item.type === 'comment' && (
                  <p className="text-slate-500">{item.text}</p>
                )}
                {item.type === 'cmd' && (
                  <p className="text-[#00f5c4] font-bold mt-2">{item.text}</p>
                )}
                {item.type === 'out' && (
                  <pre className="text-slate-300 whitespace-pre-wrap pl-2 font-mono">{item.text}</pre>
                )}
              </div>
            ))}
          </div>

          {/* Terminal Command Input Form */}
          <form onSubmit={handleReplSubmit} className="p-3 bg-[#080a0f] border-t border-[#232734] flex items-center gap-3">
            <span className="text-[#00f5c4] font-mono font-bold">$</span>
            <input
              type="text"
              value={replInput}
              onChange={(e) => setReplInput(e.target.value)}
              placeholder="type a command (e.g. 'help', 'bhasha --status', 'npm test', 'git status') and press Enter..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-[#161922] hover:bg-[#00f5c4] text-[#00f5c4] hover:text-[#080a0f] border border-[#00f5c4] font-mono text-xs font-bold transition-colors"
            >
              EXECUTE
            </button>
          </form>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: CALL TO ACTION (Instant Browser Launch)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-6 sm:p-10 bg-[#0c0f16] border border-[#232734] corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br circuit-grid">
          <div className="max-w-2xl">
            <div className="text-[#00f5c4] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              [ INSTANT CLOUD LAUNCH ]
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight mb-3">
              Start building your next idea in under 2 seconds.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Zero configuration required. Complete Monaco editor, autonomous AI copilot, and isolated cloud terminal initialized instantly in your browser.
            </p>

            {/* Email / GitHub Launch Input */}
            <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5 max-w-lg">
              <input
                type="email"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                placeholder="developer@bhasha.ai"
                className="flex-1 px-3.5 py-2.5 bg-[#050608] border border-[#232734] text-white placeholder:text-slate-600 font-mono text-xs focus:border-[#00f5c4] outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00f5c4] hover:bg-[#00f5c4]/90 text-[#080a0f] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>{userData ? 'GO TO WORKSPACE' : 'LAUNCH WORKSPACE'}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: PROFESSIONAL FOOTER (Zero Microservice Port Leaks)
          ========================================================================= */}
      <footer className="w-full bg-[#050608] border-t border-[#232734]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            
            {/* Brand Column */}
            <div className="sm:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                  alt="BHASHA"
                  className="h-7 w-auto object-contain"
                />
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4] text-[#00f5c4]">
                  AI-IDE
                </span>
              </div>
              <p className="font-sans text-xs text-slate-400 max-w-sm leading-relaxed">
                The AI-first cloud development environment. Engineered for autonomous cognitive flow, multi-file code synthesis, and instant live app previews.
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-[#101319] border border-[#232734]">
                  <span className="w-2 h-2 bg-[#00f5c4] anim-pulse-dot"></span>
                  <span className="font-mono text-[10px] text-slate-300">All Systems Operational (99.99%)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">v2.0-STABLE</span>
              </div>
            </div>

            {/* Links Column 1: Product */}
            <div>
              <div className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-3">
                PRODUCT
              </div>
              <ul className="space-y-2 text-xs font-mono text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">AI Pair Programmer</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Cloud Workspaces</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Live App Preview</a></li>
                <li><a href="#terminal" className="hover:text-white transition-colors">Cloud Terminal</a></li>
                <li><a href="/payment" className="hover:text-white transition-colors">Pricing & Plans</a></li>
              </ul>
            </div>

            {/* Links Column 2: Platform */}
            <div>
              <div className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-3">
                PLATFORM
              </div>
              <ul className="space-y-2 text-xs font-mono text-slate-400">
                <li><a href="#platform" className="hover:text-white transition-colors">Global Edge Ingress</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">Virtual Filesystem</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">LangGraph AI Engine</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">Sandboxed Containers</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">Security Hardening</a></li>
              </ul>
            </div>

            {/* Links Column 3: Resources */}
            <div>
              <div className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-3">
                RESOURCES
              </div>
              <ul className="space-y-2 text-xs font-mono text-slate-400">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="https://github.com/KRISHNA-0425/BHASHA" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Feature Highlights</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Terms */}
          <div className="pt-6 border-t border-[#232734] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span>© 2026</span>
              <img
                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                alt="BHASHA"
                className="h-3.5 w-auto object-contain inline-block align-middle mx-1"
              />
              <span>Labs, Inc. The AI-first Cloud IDE engineered for autonomous developer flow.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-slate-300 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="https://github.com/KRISHNA-0425/BHASHA" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">Security</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}

export default Landing
