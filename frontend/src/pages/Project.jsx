import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PricingModal from '../components/payment/PricingModal.jsx'
import {
  VscFiles,
  VscSearch,
  VscSourceControl,
  VscSparkle,
  VscTerminal,
  VscSettingsGear,
  VscPlay,
  VscArrowLeft,
  VscSplitHorizontal,
  VscLayoutSidebarLeft,
  VscLayoutSidebarRight
} from 'react-icons/vsc'
import FileExplorer from '../components/editor/FileExplorer.jsx'
import CodeEditor from '../components/editor/CodeEditor.jsx'
import TerminalPanel from '../components/editor/TerminalPanel.jsx'
import AIAgentPanel from '../components/editor/AIAgentPanel.jsx'

// Default mock files for immediate interactive UI experience
const initialMockTree = [
  {
    id: 'src-folder',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'app-jsx',
        name: 'App.jsx',
        type: 'file',
        content: `import React, { useState } from 'react';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="container">\n      <header className="header">\n        <h1>Welcome to AI-IDE ⚡</h1>\n        <p>Start coding with Monaco Editor, Terminal, & AI Assistant.</p>\n      </header>\n      <main>\n        <button onClick={() => setCount(count + 1)}>\n          Count is: {count}\n        </button>\n      </main>\n    </div>\n  );\n}\n\nexport default App;\n`
      },
      {
        id: 'index-css',
        name: 'index.css',
        type: 'file',
        content: `/* Global Workspace Styles */\nbody {\n  margin: 0;\n  padding: 0;\n  background-color: #0b0e14;\n  color: #f8fafc;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n}\n\n.container {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}\n`
      },
      {
        id: 'main-jsx',
        name: 'main.jsx',
        type: 'file',
        content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`
      }
    ]
  },
  {
    id: 'package-json',
    name: 'package.json',
    type: 'file',
    content: `{\n  "name": "ai-project-workspace",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  }\n}\n`
  },
  {
    id: 'readme-md',
    name: 'README.md',
    type: 'file',
    content: `# AI Workspace Project\n\nThis project is configured with full Monaco editor capabilities, an interactive terminal, and pair programming AI Agent assistance.\n\n## Getting Started\n- Open any file from the explorer on the left.\n- Edit code with real-time syntax highlighting.\n- Use the AI Agent panel on the right to prompt or refactor.\n`
  }
]

const Project = () => {
  const { id: projectId } = useParams()
  const { userData } = useSelector((state) => state.user)
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  // Layout Toggle States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isTerminalOpen, setIsTerminalOpen] = useState(true)
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(true)
  const [activeActivityTab, setActiveActivityTab] = useState('explorer')

  // Editor and File States
  const [fileTree, setFileTree] = useState(initialMockTree)
  const [openTabs, setOpenTabs] = useState([
    initialMockTree[0].children[0], // App.jsx
    initialMockTree[0].children[1]  // index.css
  ])
  const [activeFile, setActiveFile] = useState(initialMockTree[0].children[0])

  // Select a file from explorer or tabs
  const handleSelectFile = (file) => {
    setActiveFile(file)
    // Add to open tabs if not present
    if (!openTabs.find((t) => t.id === file.id)) {
      setOpenTabs((prev) => [...prev, file])
    }
  }

  // Close tab
  const handleCloseTab = (tabToClose) => {
    const remaining = openTabs.filter((t) => t.id !== tabToClose.id)
    setOpenTabs(remaining)

    if (activeFile?.id === tabToClose.id) {
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null)
    }
  }

  // Handle active code edit
  const handleCodeChange = (newCode) => {
    if (!activeFile) return
    setActiveFile((prev) => ({ ...prev, content: newCode }))
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#07090e] text-slate-200 select-none font-sans">
      {/* 1. TOP NAVBAR / IDE HEADER */}
      <header className="h-11 bg-[#090c13] border-b border-white/[0.08] px-3 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            title="Back to Dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.06] transition-colors"
          >
            <VscArrowLeft className="text-sm" />
            <span className="hidden sm:inline font-mono">Projects</span>
          </Link>

          <div className="h-4 w-px bg-white/[0.1] hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-100 font-mono tracking-wide">
              {projectId ? `Project #${projectId.slice(-6)}` : 'AI Workspace'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-200 border border-white/[0.1]">
              main
            </span>
          </div>
        </div>

        {/* Center: Quick Dev Action */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setIsTerminalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.12] text-xs font-mono transition-all cursor-pointer shadow-xs"
          >
            <VscPlay className="text-xs text-slate-100" />
            <span>Run Dev</span>
          </button>
        </div>

        {/* Right: Panel Toggles & Upgrade */}
        <div className="flex items-center gap-1.5">
          {/* Upgrade to Pro Button */}
          <button
            type="button"
            onClick={() => setIsPricingOpen(true)}
            title="View Pro Plans & Pricing"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95 mr-1"
          >
            <VscSparkle className="text-xs text-amber-400" />
            <span>Upgrade</span>
          </button>

          {/* Toggle File Explorer */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title="Toggle File Explorer"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isSidebarOpen
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <VscLayoutSidebarLeft className="text-sm" />
          </button>

          {/* Toggle Terminal */}
          <button
            onClick={() => setIsTerminalOpen((prev) => !prev)}
            title="Toggle Terminal"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isTerminalOpen
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <VscTerminal className="text-sm" />
          </button>

          {/* Toggle AI Agent Screen */}
          <button
            onClick={() => setIsAIOpen((prev) => !prev)}
            title="Toggle AI Agent"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              isAIOpen
                ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <VscSparkle className="text-xs text-slate-200" />
            <span className="text-xs font-mono hidden sm:inline">AI Agent</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (VS Code left iconic vertical rail) */}
        <div className="w-12 bg-[#080b11] border-r border-white/[0.06] flex flex-col items-center py-2 shrink-0 select-none">
          <div className="flex flex-col gap-2 items-center flex-1">
            <button
              onClick={() => {
                setActiveActivityTab('explorer')
                setIsSidebarOpen(true)
              }}
              title="Explorer"
              className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                activeActivityTab === 'explorer' && isSidebarOpen
                  ? 'text-white bg-white/[0.1]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <VscFiles className="text-lg" />
            </button>

            <button
              onClick={() => {
                setActiveActivityTab('search')
                setIsSidebarOpen(true)
              }}
              title="Search"
              className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                activeActivityTab === 'search' && isSidebarOpen
                  ? 'text-white bg-white/[0.1]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <VscSearch className="text-lg" />
            </button>

            <button
              onClick={() => {
                setActiveActivityTab('git')
                setIsSidebarOpen(true)
              }}
              title="Source Control"
              className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                activeActivityTab === 'git' && isSidebarOpen
                  ? 'text-white bg-white/[0.1]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <VscSourceControl className="text-lg" />
            </button>

            <button
              onClick={() => setIsAIOpen((prev) => !prev)}
              title="AI Assistant"
              className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                isAIOpen
                  ? 'text-white bg-white/[0.1]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <VscSparkle className="text-lg text-slate-200" />
            </button>
          </div>

          {/* Bottom Settings Icon */}
          <button
            title="Settings"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
          >
            <VscSettingsGear className="text-lg" />
          </button>
        </div>

        {/* Left Sidebar (File Explorer Tree) */}
        {isSidebarOpen && (
          <div className="w-60 md:w-64 shrink-0 h-full overflow-hidden">
            <FileExplorer
              fileTree={fileTree}
              activeFile={activeFile}
              onSelectFile={handleSelectFile}
              projectName="workspace"
            />
          </div>
        )}

        {/* Center Canvas: Monaco Code Editor + Bottom Terminal */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Main Monaco Code Editor */}
          <div className="flex-1 overflow-hidden relative">
            <CodeEditor
              openTabs={openTabs}
              activeFile={activeFile}
              onSelectTab={(tab) => setActiveFile(tab)}
              onCloseTab={handleCloseTab}
              onCodeChange={handleCodeChange}
            />
          </div>

          {/* Bottom Terminal Panel */}
          <TerminalPanel
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            isMaximized={isTerminalMaximized}
            onToggleMaximize={() => setIsTerminalMaximized((prev) => !prev)}
          />
        </div>

        {/* Right Sidebar: AI Agent Screen */}
        <AIAgentPanel
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          activeFile={activeFile}
        />

        {/* Pricing & Subscription Modal */}
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
          user={userData}
        />
      </div>
    </div>
  )
}

export default Project
