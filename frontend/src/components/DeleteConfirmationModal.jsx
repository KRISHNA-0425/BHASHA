import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi'

const DeleteConfirmationModal = ({
    isOpen,
    project,
    onClose,
    onConfirm,
    isLoading = false,
    theme = 'dark'
}) => {
    const isDark = theme === 'dark'

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isLoading) {
                onClose()
            }
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, isLoading, onClose])

    if (!isOpen || !project) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={!isLoading ? onClose : undefined}
                    className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 10 }}
                    transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                    className={`relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 z-10 border shadow-2xl transition-colors ${
                        isDark
                            ? 'bg-[#10131b] border-white/[0.1] text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
                            : 'bg-[#ebe5d8] border-[#d8d0bf] text-[#201d1a] shadow-2xl'
                    }`}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className={`absolute top-5 right-5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                                ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                                : 'text-[#5e584f] hover:text-[#201d1a] hover:bg-[#ede7dc]'
                        }`}
                        aria-label="Close modal"
                    >
                        <FiX className="text-lg" />
                    </button>

                    {/* Header with Danger Icon */}
                    <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDark
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                : 'bg-rose-50 border-rose-200 text-rose-600'
                        }`}>
                            <FiTrash2 className="text-xl" />
                        </div>

                        <div className="space-y-1 pr-6">
                            <h3 className="text-lg font-semibold tracking-tight">
                                Delete Project
                            </h3>
                            <p className={`text-xs sm:text-sm leading-relaxed ${
                                isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                                Are you sure you want to delete <span className="font-semibold text-rose-400">"{project.name}"</span>?
                            </p>
                        </div>
                    </div>

                    {/* Warning Notice */}
                    <div className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                        isDark
                            ? 'bg-amber-500/[0.07] border-amber-500/20 text-amber-300'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                        <FiAlertTriangle className="text-base shrink-0" />
                        <span>This action cannot be undone. All project files and memory hashes will be deleted permanently.</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-colors cursor-pointer ${
                                isDark
                                    ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.05]'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-900/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <FiTrash2 className="text-sm" />
                                    <span>Delete Project</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default DeleteConfirmationModal

