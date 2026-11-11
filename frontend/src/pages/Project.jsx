import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import {
  VscFiles,
  VscSearch,
  VscSourceControl,
  VscSparkle,
  VscTerminal,
  VscSettingsGear,
  VscPlay,
  VscArrowLeft,
  VscLayoutSidebarLeft,
  VscSync,
  VscCode,
  VscGlobe,
  VscSplitHorizontal
} from 'react-icons/vsc'
import FileExplorer from '../components/editor/FileExplorer.jsx'
import CodeEditor from '../components/editor/CodeEditor.jsx'
import TerminalPanel from '../components/editor/TerminalPanel.jsx'
import AIAgentPanel from '../components/editor/AIAgentPanel.jsx'
import PreviewPanel from '../components/editor/PreviewPanel.jsx'
import { buildFileMap, detectProjectKind } from '../utils/previewBuilder.js'
import { getProjectById } from '../features/project.js'
import {
  getTree,
  getFile,
  createRootFolder,
  createFolder,
  createFile,
  updateFile,
  deleteFile,
  deleteFolder
} from '../features/management.js'

/**
 * Detect language based on file extension
 */
const detectLanguage = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  switch (ext) {
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
    case 'py':
      return 'python'
    case 'sql':
      return 'sql'
    case 'sh':
    case 'bash':
      return 'shell'
    default:
      return 'plainText'
  }
}

/**
 * Recursively find a node in the tree by ID
 */
const findNodeInTree = (nodes, targetId) => {
  for (const node of nodes) {
    const id = node._id || node.id
    if (id === targetId) return node
    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, targetId)
      if (found) return found
    }
  }
  return null
}

/**
 * Recursively find the first file in the tree
 */
const findFirstFile = (nodes) => {
  for (const node of nodes) {
    if (node.type === 'file') return node
    if (node.children && node.children.length > 0) {
      const found = findFirstFile(node.children)
      if (found) return found
    }
  }
  return null
}

const Project = () => {
  const { id: projectId } = useParams()

  // Project details & tree states
  const [project, setProject] = useState(null)
  const [fileTree, setFileTree] = useState([])
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [isLoadingTree, setIsLoadingTree] = useState(true)

  // Layout Toggle States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isTerminalOpen, setIsTerminalOpen] = useState(true)
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(true)
  const [activeActivityTab, setActiveActivityTab] = useState('explorer')
  const [workspaceView, setWorkspaceView] = useState('code') // 'code' | 'split' | 'preview'
  const [previewVersion, setPreviewVersion] = useState(0)

  // Editor and File States
  const [openTabs, setOpenTabs] = useState([])
  const [activeFile, setActiveFile] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved' | 'error'

  // Refs for debounced auto-save & manual save without closure staleness
  const activeFileRef = useRef(activeFile)
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    activeFileRef.current = activeFile
  }, [activeFile])

  // Determine root folder (folder with parentId === null)
  const rootFolder = useMemo(() => {
    return fileTree.find((n) => n.type === 'folder' && !n.parentId) || fileTree[0] || null
  }, [fileTree])

  const rootFolderId = rootFolder ? rootFolder._id || rootFolder.id : null

  // 1. Select file: fetch full content if missing
  const selectFileWithContent = useCallback(async (fileNode) => {
    const fileId = fileNode._id || fileNode.id
    let fullFile = fileNode

    if (fullFile.content === undefined || fullFile.content === null) {
      try {
        const data = await getFile(fileId)
        fullFile = { ...fileNode, ...data }
      } catch (err) {
        console.error("Failed to fetch full file content:", err)
        fullFile = { ...fileNode, content: '' }
      }
    }

    setActiveFile(fullFile)

    // Add or update in open tabs
    setOpenTabs((prev) => {
      const exists = prev.some((tab) => (tab._id || tab.id) === fileId)
      if (exists) {
        return prev.map((tab) => ((tab._id || tab.id) === fileId ? fullFile : tab))
      }
      return [...prev, fullFile]
    })
  }, [])

  // 2. Initial Load: Fetch Project & Workspace File Tree
  useEffect(() => {
    if (!projectId) return

    let isMounted = true

    const loadWorkspace = async () => {
      setIsLoadingProject(true)
      setIsLoadingTree(true)

      try {
        // Fetch project metadata
        const projData = await getProjectById(projectId)
        if (isMounted) {
          setProject(projData)
        }

        // Fetch file tree
        let tree = await getTree(projectId)

        // If workspace has no tree or root folder, initialize root folder automatically
        if (!tree || tree.length === 0) {
          try {
            await createRootFolder({
              projectId,
              projectName: projData?.name || 'workspace'
            })
            tree = await getTree(projectId)
          } catch (createErr) {
            console.error("Auto-creation of root folder failed:", createErr)
          }
        }

        if (isMounted) {
          const validTree = Array.isArray(tree) ? tree : []
          setFileTree(validTree)

          // Select first file if available and no file is active
          const firstFile = findFirstFile(validTree)
          if (firstFile) {
            selectFileWithContent(firstFile)
          }
        }
      } catch (err) {
        console.error("Failed to load project workspace:", err)
        toast.error("Failed to load workspace data")
      } finally {
        if (isMounted) {
          setIsLoadingProject(false)
          setIsLoadingTree(false)
        }
      }
    }

    loadWorkspace()

    return () => {
      isMounted = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [projectId, selectFileWithContent])

  // 3. Close Tab
  const handleCloseTab = (tabToClose) => {
    const targetId = tabToClose._id || tabToClose.id
    const remaining = openTabs.filter((t) => (t._id || t.id) !== targetId)
    setOpenTabs(remaining)

    if (activeFile && (activeFile._id || activeFile.id) === targetId) {
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null)
    }
  }

  // 4. Save logic: updates file on backend
  const performSave = async (fileId, contentToSave) => {
    if (!fileId) return
    setSaveStatus('saving')
    try {
      await updateFile(fileId, { content: contentToSave })
      setSaveStatus('saved')
    } catch (err) {
      console.error("Auto-save failed:", err)
      setSaveStatus('error')
      toast.error("Failed to save changes")
    }
  }

  // 5. Code change in Monaco Editor: instant local state + debounced auto-save
  const handleCodeChange = (newCode) => {
    if (!activeFile) return

    const currentId = activeFile._id || activeFile.id
    const updated = { ...activeFile, content: newCode }

    setActiveFile(updated)
    setOpenTabs((prev) =>
      prev.map((t) => ((t._id || t.id) === currentId ? updated : t))
    )

    setSaveStatus('unsaved')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave(currentId, newCode)
    }, 1000)
  }

  // 6. Global keyboard shortcut: Ctrl+S / Cmd+S for immediate save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (activeFileRef.current) {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }
          performSave(
            activeFileRef.current._id || activeFileRef.current.id,
            activeFileRef.current.content || ''
          )
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 7. Create File Handler
  const handleCreateFile = async ({ parentId, name }) => {
    if (!name || !name.trim()) return

    const targetParentId = parentId || rootFolderId
    if (!targetParentId) {
      toast.error("Cannot create file: no folder available")
      return
    }

    try {
      const language = detectLanguage(name)
      const newFile = await createFile({
        projectId,
        parentId: targetParentId,
        name: name.trim(),
        content: '',
        language
      })

      toast.success(`Created file "${name}"`)

      // Refresh tree
      const updatedTree = await getTree(projectId)
      setFileTree(Array.isArray(updatedTree) ? updatedTree : [])

      // Automatically open the new file in editor
      await selectFileWithContent(newFile)
    } catch (err) {
      console.error("Error creating file:", err)
      toast.error(err.response?.data?.message || "Failed to create file")
    }
  }

  // 8. Create Folder Handler
  const handleCreateFolder = async ({ parentId, name }) => {
    if (!name || !name.trim()) return

    const targetParentId = parentId || rootFolderId
    if (!targetParentId) {
      toast.error("Cannot create folder: no parent folder available")
      return
    }

    try {
      await createFolder({
        projectId,
        parentId: targetParentId,
        name: name.trim()
      })

      toast.success(`Created folder "${name}"`)

      // Refresh tree
      const updatedTree = await getTree(projectId)
      setFileTree(Array.isArray(updatedTree) ? updatedTree : [])
    } catch (err) {
      console.error("Error creating folder:", err)
      toast.error(err.response?.data?.message || "Failed to create folder")
    }
  }

  // 9. Delete File Handler
  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFile(fileId)
      toast.success("File deleted successfully")

      // Close tab if open
      setOpenTabs((prev) => {
        const remaining = prev.filter((t) => (t._id || t.id) !== fileId)
        if (activeFile && (activeFile._id || activeFile.id) === fileId) {
          setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null)
        }
        return remaining
      })

      // Refresh tree
      const updatedTree = await getTree(projectId)
      setFileTree(Array.isArray(updatedTree) ? updatedTree : [])
    } catch (err) {
      console.error("Error deleting file:", err)
      toast.error(err.response?.data?.message || "Failed to delete file")
    }
  }

  // 10. Delete Folder Handler
  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteFolder(folderId)
      toast.success("Folder deleted successfully")

      // Refresh tree
      const updatedTree = await getTree(projectId)
      const validTree = Array.isArray(updatedTree) ? updatedTree : []
      setFileTree(validTree)

      // Close open tabs whose files were deleted
      setOpenTabs((prev) => {
        const remaining = prev.filter((tab) => findNodeInTree(validTree, tab._id || tab.id))
        if (activeFile && !findNodeInTree(validTree, activeFile._id || activeFile.id)) {
          setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null)
        }
        return remaining
      })
    } catch (err) {
      console.error("Error deleting folder:", err)
      toast.error(err.response?.data?.message || "Failed to delete folder")
    }
  }

  // 11. Refresh File Tree
  const handleRefreshTree = async () => {
    setIsLoadingTree(true)
    try {
      const updatedTree = await getTree(projectId)
      setFileTree(Array.isArray(updatedTree) ? updatedTree : [])
      toast.info("Workspace file tree refreshed")
    } catch (err) {
      console.error("Failed to refresh file tree:", err)
      toast.error("Failed to refresh workspace")
    } finally {
      setIsLoadingTree(false)
    }
  }

  // 12. Handle autonomous file mutations emitted by the AI Agent
  const handleAIFileMutated = async ({ operation, data, didMutate }) => {
    try {
      const updatedTree = await getTree(projectId)
      const validTree = Array.isArray(updatedTree) ? updatedTree : []
      setFileTree(validTree)

      if ((operation === 'create_file' || operation === 'update_file') && data?.file) {
        const rawFile = data.file
        const mutatedId = rawFile._id || rawFile.id
        const treeNode = findNodeInTree(validTree, mutatedId)
        const mutatedFile = {
          ...(treeNode || {}),
          ...rawFile,
          content: rawFile.content ?? treeNode?.content ?? ''
        }

        setOpenTabs((prev) => {
          const exists = prev.some((t) => (t._id || t.id) === mutatedId)
          if (exists) {
            return prev.map((t) => ((t._id || t.id) === mutatedId ? mutatedFile : t))
          }
          return [...prev, mutatedFile]
        })

        // Focus created/updated file in editor so user watches code arrive in real time
        setActiveFile((prevActive) => {
          const prevId = prevActive?._id || prevActive?.id
          if (!prevActive || prevId === mutatedId || operation === 'create_file') {
            return mutatedFile
          }
          return prevActive
        })
      }

      if (operation === 'delete_file' && data?.fileId) {
        setOpenTabs((prev) => {
          const remaining = prev.filter((t) => (t._id || t.id) !== data.fileId)
          setActiveFile((curr) =>
            curr && (curr._id || curr.id) === data.fileId
              ? remaining.length > 0
                ? remaining[remaining.length - 1]
                : null
              : curr
          )
          return remaining
        })
      }

      if (operation === 'delete_folder') {
        setOpenTabs((prev) => {
          const remaining = prev.filter((tab) => findNodeInTree(validTree, tab._id || tab.id))
          setActiveFile((curr) =>
            curr && !findNodeInTree(validTree, curr._id || curr.id)
              ? remaining.length > 0
                ? remaining[remaining.length - 1]
                : null
              : curr
          )
          return remaining
        })
      }

      if (operation !== 'done' || didMutate) {
        setPreviewVersion((v) => v + 1)
      }

      // When AI completes building a previewable project, automatically reveal Split View (Code + Preview)
      if (operation === 'done' && didMutate) {
        const fileMap = buildFileMap(validTree)
        const info = detectProjectKind(fileMap)
        if (info.kind === 'react-vite' || info.kind === 'html-js') {
          setWorkspaceView((curr) => (curr === 'code' ? 'split' : curr))
        }
      }
    } catch (err) {
      console.error("Failed to sync workspace after AI mutation:", err)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#07090e] text-slate-200 select-none font-sans">
      <ToastContainer
        position="top-right"
        autoClose={2200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

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
              {project?.name || (projectId ? `Project #${projectId.slice(-6)}` : 'AI Workspace')}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-200 border border-white/[0.1]">
              main
            </span>
            {isLoadingProject && (
              <VscSync className="text-xs text-slate-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Center: View Mode Switcher (Code | Split | Preview) & Run Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#121622] border border-white/[0.08] rounded-md p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setWorkspaceView('code')}
              title="Code Editor Only"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                workspaceView === 'code'
                  ? 'bg-white/[0.12] text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VscCode className="text-xs" />
              <span className="hidden sm:inline">Code</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceView('split')}
              title="Split Code + Live Preview"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                workspaceView === 'split'
                  ? 'bg-white/[0.12] text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VscSplitHorizontal className="text-xs" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceView('preview')}
              title="Full Live Preview"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                workspaceView === 'preview'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VscGlobe className="text-xs" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setWorkspaceView((curr) => (curr === 'code' ? 'split' : curr))
              setPreviewVersion((v) => v + 1)
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.12] text-xs font-mono transition-all cursor-pointer shadow-xs"
          >
            <VscPlay className="text-xs text-emerald-400" />
            <span>Run Preview</span>
          </button>
        </div>

        {/* Right: Panel Toggles */}
        <div className="flex items-center gap-1.5">
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
              onSelectFile={selectFileWithContent}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              onRefreshTree={handleRefreshTree}
              projectName={project?.name || 'workspace'}
              rootFolderId={rootFolderId}
              isLoading={isLoadingTree}
            />
          </div>
        )}

        {/* Center Canvas: Monaco Code Editor + Live Preview + Bottom Terminal */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Top Stage: Code, Split, or Live Preview */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            {(workspaceView === 'code' || workspaceView === 'split') && (
              <div
                className={`h-full overflow-hidden min-w-0 ${
                  workspaceView === 'split'
                    ? 'flex-1 border-r border-white/[0.08]'
                    : 'flex-1'
                }`}
              >
                <CodeEditor
                  openTabs={openTabs}
                  activeFile={activeFile}
                  onSelectTab={(tab) => selectFileWithContent(tab)}
                  onCloseTab={handleCloseTab}
                  onCodeChange={handleCodeChange}
                  saveStatus={saveStatus}
                  projectName={project?.name || 'workspace'}
                />
              </div>
            )}

            {(workspaceView === 'preview' || workspaceView === 'split') && (
              <div className="flex-1 h-full overflow-hidden min-w-0">
                <PreviewPanel
                  fileTree={fileTree}
                  openTabs={openTabs}
                  activeFile={activeFile}
                  projectName={project?.name || 'workspace'}
                  previewVersion={previewVersion}
                />
              </div>
            )}
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
          projectId={projectId}
          activeFile={activeFile}
          onFileMutated={handleAIFileMutated}
          onOpenFile={selectFileWithContent}
          onOpenPreview={() => {
            setWorkspaceView('split')
            setPreviewVersion((v) => v + 1)
          }}
        />
      </div>
    </div>
  )
}

export default Project
