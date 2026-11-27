import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlus, FiStar } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { createProject } from '../features/project.js'

const NewProjectModal = ({ isOpen, onClose, onProjectCreated, onOpenPricing, theme = 'dark' }) => {
    const isDark = theme === 'dark'
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [liked, setLiked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isLimitReached, setIsLimitReached] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!name.trim()) {
            setError("Project identifier / name is required.")
            return
        }

        setIsLoading(true)
        try {
            const newProject = await createProject({
                name: name.trim(),
                description: description.trim(),
                liked
            })

            setName('')
            setDescription('')
            setLiked(false)
            onProjectCreated(newProject)
            onClose()
        } catch (err) {
            console.error("Failed to create project:", err)
            const isLimit = err.response?.status === 403 || err.response?.data?.code === 'PROJECT_LIMIT_EXCEEDED'
            setIsLimitReached(isLimit)
            setError(err.response?.data?.message || err.message || "Failed to create project")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                />

                {/* Modal Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 10 }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
                    className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto backdrop-blur-2xl rounded-2xl p-5 sm:p-7 z-10 border shadow-2xl transition-colors ${
                        isDark
                            ? 'bg-[#10131b]/95 border-white/[0.1] text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
                            : 'bg-[#ebe5d8] border-[#d8d0bf] text-[#201d1a] shadow-2xl'
                    }`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between pb-4 border-b ${
                        isDark ? 'border-white/[0.08]' : 'border-[#d8d0bf]'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                                isDark
                                    ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400'
                                    : 'bg-[#ede7dc] border-[#d8d0bf] text-[#201d1a]'
                            }`}>
                                <FiPlus className="text-lg" />
                            </div>
                            <div>
                                <h2 className={`text-base sm:text-lg font-semibold tracking-tight ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                    Create New Project
                                </h2>
                                <p className={`text-xs sm:text-[13px] mt-0.5 ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    Initialize a new isolated neural execution workspace
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark 
                                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <FiX className="text-lg" />
                        </button>
                    </div>

                    {/* Error / Capacity Limit Banner */}
                    {error && (
                        <div className={`mt-4 p-3.5 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isLimitReached
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-red-950/40 border-red-500/30 text-red-200'
                        }`}>
                            <span className="flex-1 leading-relaxed">{error}</span>
                            {isLimitReached && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose()
                                        if (onOpenPricing) onOpenPricing()
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                                >
                                    Upgrade to Pro
                                </button>
                            )}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4.5">
                        <div>
                            <label className={`block text-sm sm:text-[15px] font-medium mb-1.5 text-left ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                                Project Name <span className="text-cyan-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. bhasha-runtime / agent-core"
                                autoFocus
                                className={`w-full rounded-xl px-4 py-3 text-sm sm:text-[15px] outline-none transition-all font-mono border ${
                                    isDark
                                        ? 'bg-[#090b10] border-slate-800 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/25 text-slate-100 placeholder:text-slate-500'
                                        : 'bg-[#fbf9f4] border-[#d8d0bf] focus:border-slate-900 focus:ring-1 focus:ring-slate-900/15 text-[#201d1a] placeholder:text-[#8a8174]'
                                }`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm sm:text-[15px] font-medium mb-1.5 text-left ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Autonomous LLM-agent execution sandbox with verified state attestation..."
                                rows={3}
                                className={`w-full rounded-xl px-4 py-3 text-sm sm:text-[15px] outline-none transition-all resize-none leading-relaxed font-sans border ${
                                    isDark
                                        ? 'bg-[#090b10] border-slate-800 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/25 text-slate-100 placeholder:text-slate-500'
                                        : 'bg-[#fbf9f4] border-[#d8d0bf] focus:border-slate-900 focus:ring-1 focus:ring-slate-900/15 text-[#201d1a] placeholder:text-[#8a8174]'
                                }`}
                            />
                        </div>

                        {/* Starred checkbox toggle */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setLiked(!liked)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                    liked
                                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-500'
                                        : isDark
                                        ? 'bg-[#151922] border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#1a202c]'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                {liked ? <FaStar className="text-amber-400 text-sm" /> : <FiStar className="text-sm" />}
                                <span>Star this project</span>
                            </button>
                        </div>

                        {/* Footer Buttons */}
                        <div className={`flex items-center justify-end gap-3 pt-4 border-t mt-6 ${
                            isDark ? 'border-white/[0.06]' : 'border-slate-100'
                        }`}>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`px-4.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                                    isDark 
                                        ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                Cancel
                            </button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className={`text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md disabled:opacity-50 cursor-pointer ${
                                    isDark
                                        ? 'bg-white hover:bg-slate-100 text-black'
                                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                            >
                                {isLoading ? "Initializing..." : "Create Project"}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default NewProjectModal
