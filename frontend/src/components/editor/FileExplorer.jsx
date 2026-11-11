import React, { useState, useMemo, useEffect } from 'react'
import {
  VscFolder,
  VscFolderOpened,
  VscFile,
  VscNewFile,
  VscNewFolder,
  VscRefresh,
  VscCollapseAll,
  VscChevronRight,
  VscChevronDown,
  VscSearch,
  VscTrash,
  VscLoading
} from 'react-icons/vsc'
import { getFileIcon } from '../../utils/fileIcons.jsx'
export { getFileIcon }

/**
 * Recursive Tree Node Component
 */
const TreeNode = ({
  node,
  depth = 0,
  activeFile,
  selectedFolderId,
  setSelectedFolderId,
  onSelectFile,
  expandedFolders,
  toggleFolder,
  creatingState,
  setCreatingState,
  onSubmitCreate,
  onRequestDelete,
  filterQuery
}) => {
  const isFolder = node.type === 'folder'
  const nodeId = node._id || node.id
  const isExpanded = Boolean(expandedFolders[nodeId])
  const isActive = activeFile && (activeFile._id || activeFile.id) === nodeId
  const isSelectedFolder = selectedFolderId === nodeId

  // Creation input state for this node's direct children
  const isCreatingUnderThis = creatingState && creatingState.parentId === nodeId
  const [inlineName, setInlineName] = useState('')

  // Check if this node or any child matches the search filter
  const matchesFilter = useMemo(() => {
    if (!filterQuery) return true
    const checkMatch = (n) => {
      if (n.name.toLowerCase().includes(filterQuery.toLowerCase())) return true
      if (n.children && n.children.length > 0) {
        return n.children.some(checkMatch)
      }
      return false
    }
    return checkMatch(node)
  }, [node, filterQuery])

  if (!matchesFilter) return null

  const handleNodeClick = (e) => {
    e.stopPropagation()
    if (isFolder) {
      setSelectedFolderId(nodeId)
      toggleFolder(nodeId)
    } else {
      onSelectFile(node)
    }
  }

  const handleStartCreate = (e, type) => {
    e.stopPropagation()
    // Make sure folder is expanded so inline input is visible
    if (!isExpanded) {
      toggleFolder(nodeId, true)
    }
    setSelectedFolderId(nodeId)
    setCreatingState({ type, parentId: nodeId })
    setInlineName('')
  }

  const handleInlineSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inlineName.trim()) {
      setCreatingState(null)
      return
    }
    onSubmitCreate({
      type: creatingState.type,
      parentId: nodeId,
      name: inlineName.trim()
    })
    setCreatingState(null)
    setInlineName('')
  }

  const handleInlineKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      setCreatingState(null)
      setInlineName('')
    }
  }

  return (
    <div>
      {/* Node Row */}
      <div
        onClick={handleNodeClick}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`group flex items-center justify-between py-1 pr-2 cursor-pointer select-none text-[13px] font-sans transition-colors rounded-sm mx-1 ${
          isActive
            ? 'bg-white/[0.12] text-white font-medium'
            : isSelectedFolder && isFolder
            ? 'bg-white/[0.05] text-slate-200'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        }`}
      >
        {/* Left: Icon & Name */}
        <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          {isFolder ? (
            <>
              <span className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
                {isExpanded ? (
                  <VscChevronDown className="text-xs" />
                ) : (
                  <VscChevronRight className="text-xs" />
                )}
              </span>
              <span className="text-amber-400/90 text-sm shrink-0">
                {isExpanded ? <VscFolderOpened /> : <VscFolder />}
              </span>
            </>
          ) : (
            <>
              <span className="w-3 shrink-0"></span>
              {getFileIcon(node.name)}
            </>
          )}
          <span className="truncate text-xs">{node.name}</span>
        </div>

        {/* Right: Quick Action Buttons on Hover */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
          {isFolder && (
            <>
              <button
                onClick={(e) => handleStartCreate(e, 'file')}
                title="New File Inside"
                className="p-1 hover:bg-white/[0.15] text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                <VscNewFile className="text-xs" />
              </button>
              <button
                onClick={(e) => handleStartCreate(e, 'folder')}
                title="New Folder Inside"
                className="p-1 hover:bg-white/[0.15] text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                <VscNewFolder className="text-xs" />
              </button>
            </>
          )}

          {/* Delete action (prevent deleting root folder if node.parentId === null) */}
          {node.parentId !== null && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRequestDelete(node)
              }}
              title={isFolder ? 'Delete Folder' : 'Delete File'}
              className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded cursor-pointer transition-colors"
            >
              <VscTrash className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Create Input (if creating directly under this expanded folder) */}
      {isFolder && isExpanded && isCreatingUnderThis && (
        <form
          onSubmit={handleInlineSubmit}
          style={{ paddingLeft: `${(depth + 1) * 14 + 14}px` }}
          className="py-1 pr-2"
        >
          <div className="flex items-center gap-1.5 bg-[#141824] border border-blue-500/50 rounded px-1.5 py-0.5">
            {creatingState.type === 'folder' ? (
              <VscFolder className="text-amber-400 text-xs shrink-0" />
            ) : (
              <VscFile className="text-slate-300 text-xs shrink-0" />
            )}
            <input
              autoFocus
              type="text"
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              onKeyDown={handleInlineKeyDown}
              onBlur={() => {
                if (!inlineName.trim()) setCreatingState(null)
              }}
              placeholder={`new-${creatingState.type}...`}
              className="w-full bg-transparent border-none text-xs text-white outline-none font-mono"
            />
          </div>
        </form>
      )}

      {/* Children list */}
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child._id || child.id}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              creatingState={creatingState}
              setCreatingState={setCreatingState}
              onSubmitCreate={onSubmitCreate}
              onRequestDelete={onRequestDelete}
              filterQuery={filterQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main FileExplorer Component
 */
const FileExplorer = ({
  fileTree = [],
  activeFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  onRefreshTree,
  projectName = 'workspace',
  rootFolderId = null,
  isLoading = false
}) => {
  // Set default expanded for root folders
  const [expandedFolders, setExpandedFolders] = useState(() => {
    const initial = {}
    fileTree.forEach((node) => {
      if (node.type === 'folder') {
        initial[node._id || node.id] = true
      }
    })
    return initial
  })

  const [selectedFolderId, setSelectedFolderId] = useState(rootFolderId)
  const [filterQuery, setFilterQuery] = useState('')
  const [creatingState, setCreatingState] = useState(null) // { type: 'file' | 'folder', parentId: string }
  const [rootInlineName, setRootInlineName] = useState('')
  const [itemToDelete, setItemToDelete] = useState(null) // Node targeted for deletion confirmation modal

  // Auto-expand root and newly created folders without overriding user collapse choices
  useEffect(() => {
    setExpandedFolders((prev) => {
      let changed = false
      const next = { ...prev }
      const visit = (nodes) => {
        for (const node of nodes) {
          if (node.type === 'folder') {
            const id = node._id || node.id
            if (id && !(id in next)) {
              next[id] = true
              changed = true
            }
            if (Array.isArray(node.children) && node.children.length > 0) {
              visit(node.children)
            }
          }
        }
      }
      visit(fileTree)
      return changed ? next : prev
    })
  }, [fileTree])

  const toggleFolder = (folderId, forceExpand = null) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: forceExpand !== null ? forceExpand : !prev[folderId]
    }))
  }

  const handleCollapseAll = () => {
    setExpandedFolders({})
  }

  // Header quick add buttons
  const handleHeaderCreate = (type) => {
    // Target selected folder or fallback to rootFolderId or first folder's id
    let targetParentId = selectedFolderId || rootFolderId
    if (!targetParentId && fileTree.length > 0) {
      const firstFolder = fileTree.find((n) => n.type === 'folder')
      if (firstFolder) targetParentId = firstFolder._id || firstFolder.id
    }

    if (targetParentId) {
      toggleFolder(targetParentId, true)
      setCreatingState({ type, parentId: targetParentId })
    } else {
      // Top level root inline
      setCreatingState({ type, parentId: 'root' })
    }
  }

  const handleSubmitCreate = ({ type, parentId, name }) => {
    const targetParentId = parentId === 'root' ? rootFolderId : parentId
    if (type === 'folder') {
      onCreateFolder?.({ parentId: targetParentId, name })
    } else {
      onCreateFile?.({ parentId: targetParentId, name })
    }
  }

  const handleRootInlineSubmit = (e) => {
    e.preventDefault()
    if (!rootInlineName.trim()) {
      setCreatingState(null)
      return
    }
    handleSubmitCreate({
      type: creatingState.type,
      parentId: rootFolderId || 'root',
      name: rootInlineName.trim()
    })
    setCreatingState(null)
    setRootInlineName('')
  }

  // Confirm delete modal action
  const confirmDelete = () => {
    if (!itemToDelete) return
    const id = itemToDelete._id || itemToDelete.id
    if (itemToDelete.type === 'folder') {
      onDeleteFolder?.(id)
    } else {
      onDeleteFile?.(id)
    }
    setItemToDelete(null)
  }

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] border-r border-white/[0.06] select-none text-slate-300 font-sans relative">
      {/* 1. Header Toolbar */}
      <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleHeaderCreate('file')}
            title="New File"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
          >
            <VscNewFile className="text-xs" />
          </button>
          <button
            onClick={() => handleHeaderCreate('folder')}
            title="New Folder"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
          >
            <VscNewFolder className="text-xs" />
          </button>
          <button
            onClick={handleCollapseAll}
            title="Collapse All Folders"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
          >
            <VscCollapseAll className="text-xs" />
          </button>
          <button
            onClick={onRefreshTree}
            title="Refresh Files"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
          >
            <VscRefresh className={`text-xs ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Project Root Header */}
      <div className="px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider bg-white/[0.02] border-b border-white/[0.03]">
        <div className="flex items-center gap-1.5 truncate">
          <VscChevronDown className="text-slate-500 text-[10px]" />
          <span className="truncate font-mono text-[11px] text-slate-200 lowercase">
            {projectName}
          </span>
        </div>
        {isLoading && (
          <span className="text-[10px] text-slate-500 font-mono animate-pulse">
            syncing...
          </span>
        )}
      </div>

      {/* 3. Top-Level Inline Creation (when parent is root) */}
      {creatingState && creatingState.parentId === 'root' && (
        <form onSubmit={handleRootInlineSubmit} className="px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            {creatingState.type === 'folder' ? (
              <VscFolder className="text-amber-400 text-xs shrink-0" />
            ) : (
              <VscFile className="text-slate-300 text-xs shrink-0" />
            )}
            <input
              autoFocus
              type="text"
              value={rootInlineName}
              onChange={(e) => setRootInlineName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setCreatingState(null)
              }}
              onBlur={() => {
                if (!rootInlineName.trim()) setCreatingState(null)
              }}
              placeholder={`new-${creatingState.type}...`}
              className="w-full bg-[#141824] border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none font-mono"
            />
          </div>
        </form>
      )}

      {/* 4. File Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 && !isLoading ? (
          <div className="px-4 py-8 text-center text-xs text-slate-500 font-mono">
            <p>No files yet</p>
            <button
              onClick={() => handleHeaderCreate('file')}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              + Create first file
            </button>
          </div>
        ) : (
          fileTree.map((node) => (
            <TreeNode
              key={node._id || node.id}
              node={node}
              depth={0}
              activeFile={activeFile}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              creatingState={creatingState}
              setCreatingState={setCreatingState}
              onSubmitCreate={handleSubmitCreate}
              onRequestDelete={(targetNode) => setItemToDelete(targetNode)}
              filterQuery={filterQuery}
            />
          ))
        )}
      </div>

      {/* 5. Quick Search at Bottom */}
      <div className="p-2 border-t border-white/[0.06] bg-[#090b10]">
        <div className="flex items-center gap-2 bg-[#121622] px-2 py-1 rounded border border-white/[0.06] text-xs text-slate-400">
          <VscSearch className="text-xs shrink-0 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-transparent outline-none text-slate-200 placeholder:text-slate-500 text-xs font-mono"
          />
        </div>
      </div>

      {/* 6. Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121724] border border-white/[0.12] rounded-lg p-4 shadow-2xl max-w-xs w-full text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <VscTrash className="text-rose-400 text-base" />
              <span>Delete {itemToDelete.type}?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Are you sure you want to delete <span className="text-white font-mono font-medium">"{itemToDelete.name}"</span>?
              {itemToDelete.type === 'folder' && ' All contents inside will be permanently deleted.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-2.5 py-1 text-xs rounded hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 text-xs font-medium rounded bg-rose-500/80 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileExplorer
