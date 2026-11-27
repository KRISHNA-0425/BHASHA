import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiPlus, FiMoon, FiSun, FiZap, FiCheck, FiMenu } from 'react-icons/fi'

const TopBar = ({
    searchQuery,
    setSearchQuery,
    onOpenNewProject,
    onOpenPricing,
    subscription,
    theme = 'dark',
    toggleTheme,
    onOpenMobileSidebar
}) => {
    const isDark = theme === 'dark'
    const inputRef = useRef(null)

    const isPro = subscription?.status?.toUpperCase() === 'ACTIVE' &&
        (subscription?.planId === 'PRO_MONTHLY' || subscription?.planId === 'PRO_YEARLY')

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
        <header className={`w-full py-3 sm:py-4 px-3 sm:px-6 lg:px-8 border-b backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 font-sans transition-colors duration-200 ${
            isDark
                ? 'border-white/[0.06] bg-[#0a0c12]/85'
                : 'border-[#d8d0bf] bg-[#ebe5d8]/85'
        }`}>
            {/* Left: Mobile Sidebar Hamburger + Search Bar */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
                {/* Mobile Drawer Trigger (visible on screens smaller than lg) */}
                <button
                    type="button"
                    onClick={onOpenMobileSidebar}
                    className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
                        isDark
                            ? 'bg-[#12151f] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06]'
                            : 'bg-[#ebe5d8] border-[#d8d0bf] text-[#201d1a] hover:text-black hover:bg-[#ede7dc] shadow-xs'
                    }`}
                    aria-label="Open navigation menu"
                    title="Open Menu"
                >
                    <FiMenu className="text-lg" />
                </button>

                {/* Search Input Bar */}
                <div className="relative flex-1 min-w-0">
                    <div className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all border ${
                        isDark
                            ? 'bg-[#12151f] border-white/[0.08] hover:border-white/[0.18] focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30'
                            : 'bg-[#fbf9f4] border-[#d8d0bf] hover:border-[#c8bfae] focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900/10 shadow-xs'
                    }`}>
                        <FiSearch className="text-sm sm:text-base shrink-0 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects..."
                            className={`w-full bg-transparent text-xs sm:text-sm outline-none font-sans min-w-0 ${
                                isDark
                                    ? 'text-slate-100 placeholder:text-slate-500'
                                    : 'text-slate-900 placeholder:text-slate-400'
                            }`}
                        />
                        <kbd className={`hidden md:inline-flex items-center gap-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0 border ${
                            isDark
                                ? 'text-slate-400 border-white/[0.08] bg-white/[0.04]'
                                : 'text-slate-500 border-slate-200 bg-slate-100'
                        }`}>
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right: Theme Toggle, Plan Status & New Project Action */}
            <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 shrink-0">
                {/* Theme Toggle Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={toggleTheme}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle theme mode"
                    className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-center shrink-0 ${
                        isDark
                            ? 'bg-[#12151f] border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white shadow-xs'
                            : 'bg-[#ebe5d8] border-[#d8d0bf] hover:border-[#c8bfae] text-[#201d1a] hover:text-black shadow-xs'
                    }`}
                >
                    {isDark ? (
                        <FiMoon className="text-sm sm:text-base" />
                    ) : (
                        <FiSun className="text-sm sm:text-base text-amber-500" />
                    )}
                </motion.button>

                {/* Pro / Upgrade Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onOpenPricing}
                    title={isPro ? "Pro Developer Pass Active" : "View Pro Plans & Pricing"}
                    className={`text-xs sm:text-sm font-semibold px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                        isPro
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-xs'
                            : isDark
                                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 shadow-xs'
                    }`}
                >
                    {isPro ? (
                        <>
                            <FiCheck className="text-xs sm:text-sm text-emerald-400 stroke-[3]" />
                            <span className="hidden xs:inline sm:inline">Pro</span>
                        </>
                    ) : (
                        <>
                            <FiZap className="text-xs sm:text-sm text-amber-400" />
                            <span className="hidden xs:inline sm:inline">Upgrade</span>
                        </>
                    )}
                </motion.button>

                {/* + New Project Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenNewProject}
                    title="Create New Project"
                    className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 sm:gap-2 shadow-sm transition-colors cursor-pointer shrink-0 ${
                        isDark
                            ? 'bg-white hover:bg-slate-100 text-black'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                >
                    <FiPlus className="text-sm sm:text-base stroke-[2.5]" />
                    <span className="hidden sm:inline">New Project</span>
                    <span className="sm:hidden">New</span>
                </motion.button>
            </div>
        </header>
    )
}

export default TopBar
