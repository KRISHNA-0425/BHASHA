import { useState, useEffect, useMemo, useRef } from 'react'
import {
  VscRefresh,
  VscGlobe,
  VscError,
  VscWarning,
  VscDeviceMobile,
  VscScreenFull,
  VscBrowser,
  VscLinkExternal,
  VscClose
} from 'react-icons/vsc'
import {
  buildFileMap,
  detectProjectKind,
  buildHtmlPreviewDoc,
  buildReactPreviewDoc
} from '../../utils/previewBuilder.js'

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: '100%' },
  tablet: { label: 'Tablet', width: '768px' },
  mobile: { label: 'Mobile', width: '375px' }
}

const PreviewPanel = ({
  fileTree = [],
  openTabs = [],
  activeFile = null,
  projectName = 'workspace',
  previewVersion = 0
}) => {
  const [viewport, setViewport] = useState('desktop')
  const [reloadNonce, setReloadNonce] = useState(0)
  const [runtimeStatus, setRuntimeStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [runtimeError, setRuntimeError] = useState(null)

  // Flatten project files including live editor tab changes
  const fileMap = useMemo(
    () => buildFileMap(fileTree, openTabs, activeFile),
    [fileTree, openTabs, activeFile]
  )

  const projectInfo = useMemo(() => detectProjectKind(fileMap), [fileMap])

  // Build srcDoc based on detected project kind
  const rawDoc = useMemo(() => {
    if (projectInfo.kind === 'html-js') {
      return buildHtmlPreviewDoc(fileMap, projectInfo.entryHtmlPath)
    }
    if (projectInfo.kind === 'react-vite') {
      return buildReactPreviewDoc(fileMap, projectInfo.packageJson)
    }
    return ''
  }, [fileMap, projectInfo])

  // Debounce document updates while typing; flush immediately when previewVersion or reloadNonce changes
  const [debouncedDoc, setDebouncedDoc] = useState(rawDoc)
  const lastForceSigRef = useRef(`${previewVersion}-${reloadNonce}`)

  useEffect(() => {
    const forceSig = `${previewVersion}-${reloadNonce}`
    const isForced = lastForceSigRef.current !== forceSig
    lastForceSigRef.current = forceSig

    const timer = setTimeout(() => {
      setDebouncedDoc(rawDoc)
      setRuntimeError(null)
      if (rawDoc) {
        setRuntimeStatus('loading')
      }
    }, isForced ? 0 : 350)

    return () => clearTimeout(timer)
  }, [rawDoc, previewVersion, reloadNonce])

  // Listen for error/ready messages posted from inside the sandbox iframe
  useEffect(() => {
    const handleMessage = (event) => {
      const payload = event?.data
      if (!payload || payload.source !== 'ai-ide-preview') return

      if (payload.type === 'ready') {
        setRuntimeStatus('ready')
        setRuntimeError(null)
      } else if (payload.type === 'error') {
        setRuntimeStatus('error')
        setRuntimeError(payload.message || 'Unknown preview runtime error')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleManualReload = () => {
    setRuntimeError(null)
    setRuntimeStatus('loading')
    setReloadNonce((n) => n + 1)
  }

  const handleOpenExternal = () => {
    if (!debouncedDoc) return
    const blob = new Blob([debouncedDoc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const runtimeLabel =
    projectInfo.kind === 'react-vite'
      ? 'React + Vite'
      : projectInfo.kind === 'html-js'
      ? 'HTML / CSS / JS'
      : null

  return (
    <div className="h-full w-full flex flex-col bg-[#07090e] select-none overflow-hidden">
      {/* Top Browser-Style Control Bar */}
      <div className="h-9 px-3 bg-[#0a0d14] border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
        {/* Left: Status + Address Pill */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 bg-[#121622] border border-white/[0.08] rounded-md px-2.5 py-1 min-w-0 flex-1 max-w-md">
            {projectInfo.kind === 'empty' || projectInfo.kind === 'unsupported' ? (
              <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
            ) : runtimeStatus === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            ) : runtimeStatus === 'ready' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
            <VscGlobe className="text-slate-500 text-xs shrink-0" />
            <span className="text-[11px] font-mono text-slate-300 truncate">
              preview://{projectName || 'workspace'}
            </span>
            {runtimeLabel && (
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300 shrink-0">
                {runtimeLabel}
              </span>
            )}
          </div>
        </div>

        {/* Right: Viewport Switcher & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center bg-[#121622] border border-white/[0.06] rounded p-0.5 mr-1">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop Viewport"
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VscScreenFull className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet Viewport (768px)"
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VscBrowser className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile Viewport (375px)"
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VscDeviceMobile className="text-xs" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualReload}
            disabled={!debouncedDoc}
            title="Reload Preview"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded transition-colors disabled:opacity-30 cursor-pointer"
          >
            <VscRefresh className="text-xs" />
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            disabled={!debouncedDoc}
            title="Open Preview in New Tab"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded transition-colors disabled:opacity-30 cursor-pointer"
          >
            <VscLinkExternal className="text-xs" />
          </button>
        </div>
      </div>

      {/* Main Preview Stage */}
      <div className="flex-1 w-full bg-[#0d1017] flex items-center justify-center overflow-auto relative">
        {projectInfo.kind === 'empty' && (
          <div className="text-center px-6 max-w-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-3">
              <VscGlobe className="text-xl" />
            </div>
            <h3 className="text-sm font-medium text-slate-200 mb-1">No Preview Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ask the AI Agent on the right to build something (like a digital clock or portfolio), or create an <span className="font-mono text-slate-300">index.html</span> file to start previewing.
            </p>
          </div>
        )}

        {projectInfo.kind === 'unsupported' && (
          <div className="text-center px-6 max-w-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <VscWarning className="text-xl" />
            </div>
            <h3 className="text-sm font-medium text-slate-200 mb-1">
              Can&apos;t preview this project
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Built-in live preview supports <span className="text-slate-300">React + Vite</span> and <span className="text-slate-300">HTML + CSS + JS</span> web applications.
            </p>
          </div>
        )}

        {(projectInfo.kind === 'html-js' || projectInfo.kind === 'react-vite') && (
          <div
            style={{ width: VIEWPORTS[viewport].width }}
            className={`h-full bg-white transition-all duration-200 relative ${
              viewport !== 'desktop'
                ? 'my-3 h-[calc(100%-24px)] rounded-xl overflow-hidden shadow-2xl border border-white/[0.15]'
                : 'w-full'
            }`}
          >
            <iframe
              key={`${reloadNonce}-${previewVersion}-${projectInfo.kind}`}
              title="Live Project Preview"
              srcDoc={debouncedDoc}
              sandbox="allow-scripts allow-modals allow-forms"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        )}
      </div>

      {/* Runtime Error Footer Banner */}
      {runtimeError && (
        <div className="px-3 py-2 bg-rose-950/80 border-t border-rose-500/30 flex items-center justify-between gap-2 text-xs text-rose-200 font-mono shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <VscError className="text-rose-400 shrink-0" />
            <span className="truncate">{runtimeError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRuntimeError(null)}
            className="text-rose-300 hover:text-white p-0.5 cursor-pointer shrink-0"
          >
            <VscClose className="text-xs" />
          </button>
        </div>
      )}
    </div>
  )
}

export default PreviewPanel
