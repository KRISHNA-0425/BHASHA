import React, { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { VscClose, VscChevronRight, VscCheck, VscCode, VscSync, VscError, VscPlay } from 'react-icons/vsc'
import { getFileIcon } from './FileExplorer.jsx'

const CodeEditor = ({
  openTabs = [],
  activeFile,
  onSelectTab,
  onCloseTab,
  onCodeChange,
  onRunFile,
  saveStatus = 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
  projectName = 'workspace'
}) => {
  const editorRef = useRef(null)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Track cursor movement for status bar
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column
      })
    })

    // Custom dark background for Monaco
    monaco.editor.defineTheme('ai-dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'e2e8f0', fontStyle: 'bold' },
        { token: 'string', foreground: 'cbd5e1' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'function', foreground: 'f8fafc' }
      ],
      colors: {
        'editor.background': '#07090e',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#11172680',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#f8fafc',
        'editorGutter.background': '#07090e',
        'editorCursor.foreground': '#f8fafc',
        'editor.selectionBackground': '#ffffff18',
        'editor.inactiveSelectionBackground': '#ffffff0d'
      }
    })

    monaco.editor.setTheme('ai-dark-theme')
  }

  const isRunnable = (fileName) => {
    if (!fileName) return false
    const ext = fileName.split('.').pop().toLowerCase()
    return ['py', 'pyw', 'c', 'cpp', 'cc', 'cxx', 'js', 'mjs', 'cjs', 'ts', 'java', 'go', 'rs', 'sh', 'bash'].includes(ext)
  }

  // Determine Monaco language mode from file extension or file.language
  const getLanguage = (fileName, language) => {
    if (language && language !== 'plainText') {
      const lowerLang = language.toLowerCase()
      if (['javascript', 'typescript', 'css', 'html', 'json', 'python', 'markdown', 'c', 'cpp', 'java', 'rust', 'go', 'shell', 'sql'].includes(lowerLang)) {
        return lowerLang
      }
    }

    const ext = fileName?.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'c':
      case 'h':
        return 'c'
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'hpp':
      case 'hxx':
        return 'cpp'
      case 'py':
      case 'pyw':
        return 'python'
      case 'java':
        return 'java'
      case 'rs':
        return 'rust'
      case 'go':
        return 'go'
      case 'jsx':
      case 'js':
      case 'mjs':
      case 'cjs':
        return 'javascript'
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'css':
      case 'scss':
        return 'css'
      case 'html':
      case 'htm':
        return 'html'
      case 'json':
        return 'json'
      case 'md':
      case 'markdown':
        return 'markdown'
      case 'sql':
        return 'sql'
      case 'sh':
      case 'bash':
        return 'shell'
      default:
        return 'plaintext'
    }
  }

  if (!activeFile) {
    return (
      <div className="h-full w-full bg-[#07090e] flex flex-col items-center justify-center text-slate-500 font-sans select-none">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-200 mb-4 shadow-xl">
          <VscCode className="text-3xl" />
        </div>
        <h3 className="text-slate-300 font-medium text-base mb-1">No File Open</h3>
        <p className="text-xs text-slate-500">Select a file from the explorer on the left or create a new one</p>
      </div>
    )
  }

  const activeId = activeFile._id || activeFile.id

  return (
    <div className="h-full w-full flex flex-col bg-[#07090e] overflow-hidden select-none">
      {/* 1. Open File Tabs */}
      <div className="flex items-center bg-[#0a0d14] border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        {openTabs.map((tab) => {
          const tabId = tab._id || tab.id
          const isActive = tabId === activeId
          return (
            <div
              key={tabId}
              onClick={() => onSelectTab(tab)}
              className={`group flex items-center gap-2 px-3.5 py-2 border-r border-white/[0.06] text-xs font-mono cursor-pointer transition-colors shrink-0 relative ${
                isActive
                  ? 'bg-[#07090e] text-white border-t-2 border-t-slate-200 font-medium'
                  : 'bg-[#0b0e14] text-slate-400 hover:bg-white/[0.02] hover:text-slate-300'
              }`}
            >
              <span className="shrink-0">{getFileIcon(tab.name)}</span>
              <span className="truncate max-w-[140px]">{tab.name}</span>
              
              {/* Tab close button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-white/[0.1] rounded p-0.5 text-slate-400 hover:text-slate-100 transition-opacity ml-1 cursor-pointer"
              >
                <VscClose className="text-xs" />
              </button>
            </div>
          )
        })}
      </div>

      {/* 2. Breadcrumb Path Bar + Live Save Status */}
      <div className="px-4 py-1.5 bg-[#080b11] border-b border-white/[0.04] flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 truncate text-[11px]">
          <span className="text-slate-500">{projectName}</span>
          <VscChevronRight className="text-[10px] text-slate-600" />
          <span className="text-slate-300 font-medium">{activeFile.name}</span>
        </div>

        {/* Live Save State Indicator & Run Action */}
        <div className="flex items-center gap-3 text-[11px]">
          {onRunFile && isRunnable(activeFile.name) && (
            <button
              type="button"
              onClick={() => onRunFile(activeFile)}
              title={`Run ${activeFile.name} in Integrated Terminal`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-medium transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <VscPlay className="text-xs" />
              <span>Run</span>
            </button>
          )}

          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <VscSync className="text-xs animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'unsaved' && (
            <div className="flex items-center gap-1.5 text-amber-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Unsaved changes (Ctrl+S)</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 text-emerald-400/90">
              <VscCheck className="text-xs" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-rose-400">
              <VscError className="text-xs" />
              <span>Save error</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Monaco Code Editor Canvas */}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          width="100%"
          language={getLanguage(activeFile.name, activeFile.language)}
          value={activeFile.content || ''}
          theme="vs-dark"
          onChange={onCodeChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true, scale: 0.75 },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>

      {/* 4. Editor Status Bar */}
      <div className="h-6 bg-[#080b11] border-t border-white/[0.06] px-3 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
        <div className="flex items-center gap-4">
          <span className="text-slate-200">
            {getLanguage(activeFile.name, activeFile.language).toUpperCase()}
          </span>
          <span>UTF-8</span>
          <span>Spaces: 2</span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-amber-400 animate-ping' : saveStatus === 'unsaved' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
