import { useState, useRef, useEffect } from 'react'
import {
  VscSparkle,
  VscClose,
  VscSend,
  VscCheck,
  VscError,
  VscSync,
  VscFileCode,
  VscFolder,
  VscDebugStop,
  VscClearAll,
  VscPlay
} from 'react-icons/vsc'
import { chat } from '../../features/ai.js'
import { getFileIcon } from './FileExplorer.jsx'

const formatToolLabel = (toolName, args = {}) => {
  switch (toolName) {
    case 'get_tree':
      return 'Inspecting project structure'
    case 'get_file':
      return 'Reading file contents'
    case 'create_folder':
      return `Creating folder ${args.name ? `"${args.name}"` : ''}`.trim()
    case 'create_file':
      return `Creating file ${args.name ? `"${args.name}"` : ''}`.trim()
    case 'update_file':
      return `Updating ${args.name ? `"${args.name}"` : 'file'}`
    case 'delete_file':
      return 'Deleting file'
    case 'delete_folder':
      return 'Deleting folder'
    default:
      return `Running ${toolName || 'tool'}`
  }
}

const AIAgentPanel = ({
  isOpen,
  onClose,
  projectId,
  activeFile,
  onFileMutated,
  onOpenFile,
  onOpenPreview
}) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! I'm your autonomous AI coding agent. Tell me what you want to build (for example, a digital clock, todo app, or portfolio) and I will create the files and wire everything directly in your workspace.",
      steps: [],
      time: 'Ready'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [mutatedAnyFile, setMutatedAnyFile] = useState(false)

  const abortControllerRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const updateAssistantMessage = (assistantId, updater) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? updater(m) : m))
    )
  }

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setIsGenerating(false)
  }

  const handleClearChat = () => {
    if (isGenerating) handleStop()
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Conversation cleared. Ready for your next prompt!',
        steps: [],
        time: 'Just now'
      }
    ])
    setMutatedAnyFile(false)
  }

  const handleSend = async (e, overridePrompt = null) => {
    e?.preventDefault()
    const rawPrompt = overridePrompt !== null ? overridePrompt : inputText
    if (!rawPrompt.trim() || isGenerating || !projectId) return

    const promptText = rawPrompt.trim()
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Build history for backend from completed messages before appending new turn
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome-1' && !m.isError && m.text && m.text.trim())
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: promptText,
      time: nowLabel
    }

    const assistantId = `a-${Date.now() + 1}`
    const assistantMsg = {
      id: assistantId,
      sender: 'assistant',
      text: '',
      steps: [],
      isStreaming: true,
      hasMutations: false,
      time: nowLabel
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    if (overridePrompt === null) {
      setInputText('')
    }
    setIsGenerating(true)
    setMutatedAnyFile(false)

    const controller = new AbortController()
    abortControllerRef.current = controller

    let didMutateInTurn = false

    try {
      const result = await chat({
        projectId,
        message: promptText,
        history: historyPayload,
        signal: controller.signal,
        onEvent: ({ type, data }) => {
          if (type === 'start') {
            return
          }

          if (type === 'tool_start') {
            const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const label = formatToolLabel(data?.toolName, data?.args)
            updateAssistantMessage(assistantId, (msg) => ({
              ...msg,
              steps: [
                ...(msg.steps || []),
                {
                  id: stepId,
                  toolName: data?.toolName,
                  label,
                  status: 'running',
                  args: data?.args || {}
                }
              ]
            }))
            return
          }

          if (
            type === 'create_file' ||
            type === 'update_file' ||
            type === 'create_folder' ||
            type === 'delete_file' ||
            type === 'delete_folder'
          ) {
            didMutateInTurn = true
            setMutatedAnyFile(true)

            updateAssistantMessage(assistantId, (msg) => {
              const steps = [...(msg.steps || [])]
              const idx = steps.findIndex((s) => s.status === 'running')
              if (idx !== -1) {
                steps[idx] = {
                  ...steps[idx],
                  status: 'done',
                  file: data?.file || null,
                  folder: data?.folder || null
                }
              }
              return { ...msg, steps, hasMutations: true }
            })

            onFileMutated?.({ operation: type, data })
            return
          }

          if (type === 'get_tree' || type === 'get_file' || type === 'tool_result') {
            updateAssistantMessage(assistantId, (msg) => {
              const steps = [...(msg.steps || [])]
              const idx = steps.findIndex((s) => s.status === 'running')
              if (idx !== -1) {
                steps[idx] = { ...steps[idx], status: 'done' }
              }
              return { ...msg, steps }
            })
            return
          }

          if (type === 'tool_error') {
            updateAssistantMessage(assistantId, (msg) => {
              const steps = [...(msg.steps || [])]
              const idx = steps.findIndex((s) => s.status === 'running')
              if (idx !== -1) {
                steps[idx] = {
                  ...steps[idx],
                  status: 'error',
                  error: data?.error || 'Tool execution failed'
                }
              }
              return { ...msg, steps }
            })
            return
          }

          if (type === 'message') {
            const content = data?.content || ''
            if (content) {
              updateAssistantMessage(assistantId, (msg) => ({
                ...msg,
                text: msg.text ? `${msg.text}\n\n${content}` : content
              }))
            }
            return
          }

          if (type === 'done') {
            updateAssistantMessage(assistantId, (msg) => ({
              ...msg,
              isStreaming: false,
              text: msg.text || data?.message || 'Done.'
            }))
            onFileMutated?.({ operation: 'done', data, didMutate: didMutateInTurn })
            return
          }

          if (type === 'error') {
            updateAssistantMessage(assistantId, (msg) => ({
              ...msg,
              isStreaming: false,
              isError: true,
              text: data?.message || 'An error occurred while running the AI agent.'
            }))
          }
        }
      })

      if (result?.aborted) {
        updateAssistantMessage(assistantId, (msg) => ({
          ...msg,
          isStreaming: false,
          text: msg.text || 'Generation stopped by user.'
        }))
      } else {
        updateAssistantMessage(assistantId, (msg) => ({
          ...msg,
          isStreaming: false,
          text: msg.text || 'Completed.'
        }))
      }
    } catch (error) {
      console.error('AIAgentPanel chat error:', error)
      updateAssistantMessage(assistantId, (msg) => ({
        ...msg,
        isStreaming: false,
        isError: true,
        text: error?.message || 'Failed to reach AI service.'
      }))
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const quickPrompts = [
    'Create a modern digital clock',
    'Build a clean todo app in React',
    activeFile ? `Explain and improve ${activeFile.name}` : 'Create a sleek landing page'
  ]

  if (!isOpen) return null

  return (
    <div className="h-full w-80 sm:w-96 bg-[#0b0e14] border-l border-white/[0.08] flex flex-col font-sans select-none shrink-0 z-10">
      {/* Agent Top Header */}
      <div className="px-3.5 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[#080b11]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/[0.1] border border-white/[0.15] flex items-center justify-center text-slate-100 shadow-xs">
            <VscSparkle className="text-xs" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-100">AI Agent</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isGenerating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {mutatedAnyFile && onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              title="Open Live Preview"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono transition-colors cursor-pointer"
            >
              <VscPlay className="text-[10px]" />
              <span>Preview</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            <VscClearAll className="text-sm" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close AI Agent"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            <VscClose className="text-sm" />
          </button>
        </div>
      </div>

      {/* Context Bar */}
      <div className="px-3 py-1.5 bg-[#090c13] border-b border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Autonomous Workspace Agent</span>
        {activeFile && (
          <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
            @{activeFile.name}
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 select-text">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[94%] rounded-xl px-3.5 py-2.5 text-xs font-sans leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-200 text-slate-900 font-medium rounded-br-xs shadow-sm'
                  : msg.isError
                  ? 'bg-rose-950/50 text-rose-200 border border-rose-500/30 rounded-bl-xs'
                  : 'bg-[#121622] text-slate-200 border border-white/[0.06] rounded-bl-xs'
              }`}
            >
              {/* Tool Execution Steps */}
              {Array.isArray(msg.steps) && msg.steps.length > 0 && (
                <div className="mb-2.5 space-y-1.5 pb-2 border-b border-white/[0.06]">
                  {msg.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between gap-2 text-[11px] font-mono bg-[#080b11] px-2 py-1 rounded border border-white/[0.05]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {step.status === 'running' && (
                          <VscSync className="text-amber-400 animate-spin shrink-0 text-xs" />
                        )}
                        {step.status === 'done' && (
                          <VscCheck className="text-emerald-400 shrink-0 text-xs" />
                        )}
                        {step.status === 'error' && (
                          <VscError className="text-rose-400 shrink-0 text-xs" />
                        )}
                        <span className="truncate text-slate-300">{step.label}</span>
                      </div>

                      {step.file && onOpenFile && (
                        <button
                          type="button"
                          onClick={() => onOpenFile(step.file)}
                          title={`Open ${step.file.name}`}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 text-[10px] shrink-0 cursor-pointer transition-colors"
                        >
                          {getFileIcon(step.file.name)}
                          <span className="max-w-[80px] truncate">{step.file.name}</span>
                        </button>
                      )}
                      {step.folder && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400/80 shrink-0">
                          <VscFolder className="text-[10px]" />
                          <span className="max-w-[70px] truncate">{step.folder.name}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Assistant / User Text */}
              {msg.text ? (
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              ) : (
                msg.isStreaming && (
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <VscSync className="animate-spin text-xs" />
                    <span>Thinking &amp; editing workspace...</span>
                  </div>
                )
              )}

              {/* Quick Preview CTA after file creation/update */}
              {msg.sender === 'assistant' && !msg.isStreaming && msg.hasMutations && onOpenPreview && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <VscFileCode className="text-emerald-400" />
                    Workspace updated
                  </span>
                  <button
                    type="button"
                    onClick={onOpenPreview}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono cursor-pointer transition-colors"
                  >
                    <VscPlay className="text-[10px]" />
                    <span>Open Preview</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 pt-2 pb-1 border-t border-white/[0.04] bg-[#080b11]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={isGenerating}
              onClick={() => handleSend(null, prompt)}
              className="text-[10px] whitespace-nowrap bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] rounded-full px-2.5 py-0.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Box */}
      <div className="p-3 bg-[#080b11] border-t border-white/[0.06]">
        <form onSubmit={(e) => handleSend(e)} className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isGenerating}
            placeholder="Describe what to build (e.g. Create a digital clock)..."
            className="w-full bg-[#121622] border border-white/[0.08] focus:border-white/40 focus:ring-1 focus:ring-white/20 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none resize-none font-sans disabled:opacity-60"
          />

          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[10px] text-slate-500 font-mono">
              {isGenerating ? 'Agent working...' : '↵ Enter to send'}
            </span>
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                className="px-3 py-1 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <VscDebugStop className="text-xs" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim() || !projectId}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <span>Send</span>
                <VscSend className="text-xs" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default AIAgentPanel
