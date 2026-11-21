import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiPlus, FiMoon, FiSun } from 'react-icons/fi'
import { VscSparkle } from 'react-icons/vsc'

const TopBar = ({ searchQuery, setSearchQuery, onOpenNewProject, onOpenPricing, theme = 'dark', toggleTheme }) => {
    const isDark = theme === 'dark'
    const inputRef = useRef(null)

    // Keyboard shortcut for Cmd/Ctrl + K to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <header className={`w-full py-4.5 px-8 border-b backdrop-blur-xl flex items-center justify-between sticky top-0 z-10 font-sans transition-colors duration-200 ${
            isDark
                ? 'border-white/[0.06] bg-[#0a0c12]/80'
                : 'border-slate-200 bg-white/80'
        }`}>
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-xl">
                <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all border ${
                    isDark
                        ? 'bg-[#12151f] border-white/[0.08] hover:border-white/[0.18] focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900/10 shadow-xs'
                }`}>
                    <FiSearch className={`text-base shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects, neural embeddings, memory hashes..."
                        className={`w-full bg-transparent text-sm sm:text-[15px] outline-none font-sans ${
                            isDark
                                ? 'text-slate-100 placeholder:text-slate-500'
                                : 'text-slate-900 placeholder:text-slate-400'
                        }`}
                    />
                    <kbd className={`hidden sm:inline-flex items-center gap-0.5 text-xs font-mono px-2 py-0.5 rounded-md shrink-0 border ${
                        isDark
                            ? 'text-slate-400 border-white/[0.08] bg-white/[0.04]'
                            : 'text-slate-500 border-slate-200 bg-slate-100'
                    }`}>
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Right Status Dot, Theme Toggle & New Project Action */}
            <div className="flex items-center gap-3.5 ml-6">
                {/* Active node indicator */}
                <div className="flex items-center gap-2 mr-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" />
                </div>

                {/* Theme Toggle Button (shifted here beside New Project) */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={toggleTheme}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${
                        isDark
                            ? 'bg-[#12151f] border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-xs'
                    }`}
                >
                    {isDark ? (
                        <FiMoon className="text-base" />
                    ) : (
                        <FiSun className="text-base text-amber-500" />
                    )}
                </motion.button>

                {/* Upgrade to Pro Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onOpenPricing}
                    title="View Pro Plans & Pricing"
                    className="text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20"
                >
                    <VscSparkle className="text-base text-amber-300" />
                    <span>Upgrade</span>
                </motion.button>

                {/* + New Project Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenNewProject}
                    className={`text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer ${
                        isDark
                            ? 'bg-white hover:bg-slate-100 text-black'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                >
                    <FiPlus className="text-base stroke-[2.5]" />
                    <span>New Project</span>
                </motion.button>
            </div>
        </header>
    )
}

export default TopBar
