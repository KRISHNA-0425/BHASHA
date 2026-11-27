import React from 'react'
import { motion } from 'framer-motion'
import { FiFolder, FiPlus, FiStar } from 'react-icons/fi'

const EmptyState = ({ type = "all", searchQuery = "", onOpenNewProject, theme = 'dark' }) => {
    const isDark = theme === 'dark'
    const isSearch = Boolean(searchQuery)
    const isStarred = type === "starred"

    return (
        <div className={`w-full border border-dashed rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center my-4 sm:my-6 font-sans transition-colors ${
            isDark
                ? 'bg-[#10131c]/60 border-white/[0.08]'
                : 'bg-white/60 border-slate-200 shadow-xs'
        }`}>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 text-2xl shadow-inner ${
                isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
                {isStarred ? <FiStar className="text-amber-500" /> : <FiFolder className={isDark ? "text-cyan-400" : "text-slate-800"} />}
            </div>

            <h3 className={`text-base sm:text-lg font-semibold tracking-tight mb-1.5 ${
                isDark ? 'text-white' : 'text-slate-900'
            }`}>
                {isSearch
                    ? `No projects matching "${searchQuery}"`
                    : isStarred
                    ? "No starred projects yet"
                    : "No projects in your workspace"}
            </h3>

            <p className={`text-xs sm:text-sm max-w-md mb-6 leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
                {isSearch
                    ? "Check your spelling or clear search filters to find what you're looking for."
                    : isStarred
                    ? "Click the star icon on any project card to bookmark it here for instant access."
                    : "Create your first project to start building, compiling, and attesting neural workloads."}
            </p>

            {!isSearch && !isStarred && (
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onOpenNewProject}
                    className={`text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-colors cursor-pointer ${
                        isDark
                            ? 'bg-white hover:bg-slate-100 text-black'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                >
                    <FiPlus className="text-base stroke-[2.5]" />
                    <span>Create Your First Project</span>
                </motion.button>
            )}
        </div>
    )
}

export default EmptyState
