import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'
import { FiStar, FiTrash2 } from 'react-icons/fi'
import { formatTimeAgo, getStatusDotColor } from '../utils/timeAgo.js'

const ProjectCard = ({ project, onToggleLike, onDelete, onClick, theme = 'dark' }) => {
    const isDark = theme === 'dark'
    const [isLiking, setIsLiking] = useState(false)
    const dotColor = getStatusDotColor(project.name || project._id)

    const handleStarClick = async (e) => {
        e.stopPropagation()
        if (isLiking) return
        setIsLiking(true)
        try {
            await onToggleLike(project._id)
        } finally {
            setIsLiking(false)
        }
    }

    const handleDeleteClick = (e) => {
        e.stopPropagation()
        if (onDelete) {
            onDelete(project)
        }
    }

    // Parse or extract tags from project, or fallback gracefully
    const getTags = () => {
        if (Array.isArray(project.tags) && project.tags.length > 0) {
            return project.tags
        }
        if (typeof project.tags === 'string' && project.tags.trim()) {
            return project.tags.split(',').map((t) => t.trim())
        }
        // If no explicit tags were assigned during creation, provide default tags based on name/description keywords
        const text = `${project.name} ${project.description || ''}`.toLowerCase()
        const tags = []
        if (text.includes('wasm') || text.includes('webassembly')) tags.push('WASM')
        if (text.includes('rust')) tags.push('Rust')
        if (text.includes('ts') || text.includes('type') || text.includes('script')) tags.push('TypeScript')
        if (text.includes('py') || text.includes('python')) tags.push('Python')
        if (text.includes('cpp') || text.includes('c++')) tags.push('C++')
        if (text.includes('solidity') || text.includes('contract')) tags.push('Solidity')
        if (text.includes('zk') || text.includes('zero') || text.includes('snark')) tags.push('Circom')
        if (text.includes('tee') || text.includes('enclave')) tags.push('TEE')
        if (text.includes('grpc')) tags.push('gRPC')
        if (tags.length === 0) tags.push('Core', 'Runtime')
        return tags.slice(0, 2)
    }

    const tags = getTags()

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ 
                y: -3, 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#cbd5e1' 
            }}
            transition={{ duration: 0.2 }}
            onClick={() => onClick && onClick(project)}
            className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[175px] sm:h-48 transition-all cursor-pointer group font-sans border ${
                isDark
                    ? 'bg-[#10131c] border-white/[0.08] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.8)]'
                    : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
            }`}
        >
            {/* Top row: Status dot + Title + Star */}
            <div>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                        <h3 className={`text-sm sm:text-[15px] font-semibold transition-colors truncate tracking-tight ${
                            isDark
                                ? 'text-slate-100 '
                                : 'text-slate-900 group-hover:text-slate-700'
                        }`}>
                            {project.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={handleStarClick}
                            className="text-slate-400 hover:text-amber-500 p-1.5 transition-colors cursor-pointer shrink-0"
                            title={project.liked ? "Unstar project" : "Star project"}
                        >
                            {project.liked ? (
                                <FaStar className="text-amber-400 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            ) : (
                                <FiStar className="text-slate-400 hover:text-amber-500 text-sm" />
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={handleDeleteClick}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 opacity-70 group-hover:opacity-100 ${
                                isDark
                                    ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Delete project"
                        >
                            <FiTrash2 className="text-sm" />
                        </motion.button>
                    </div>
                </div>

                {/* Project Description */}
                <p className={`text-xs sm:text-[13px] line-clamp-2 mt-2.5 leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                    {project.description || "Autonomous LLM-agent execution sandbox with verified state attestation."}
                </p>
            </div>

            {/* Bottom Row: Tags + Relative Timestamp */}
            <div className={`flex items-center justify-between pt-3.5 border-t ${
                isDark ? 'border-white/[0.05]' : 'border-slate-100'
            }`}>
                <div className="flex items-center gap-2 flex-wrap">
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-md tracking-wide border ${
                                isDark
                                    ? 'bg-[#161a25] border-white/[0.07] text-slate-300'
                                    : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <span className="text-xs font-mono text-slate-500 shrink-0">
                    Updated {formatTimeAgo(project.updatedAt || project.createdAt)}
                </span>
            </div>
        </motion.div>
    )
}

export default ProjectCard
