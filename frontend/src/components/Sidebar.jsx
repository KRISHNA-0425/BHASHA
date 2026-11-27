import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFolder, FiSettings, FiLogOut, FiZap, FiMail, FiUser, FiCheck, FiX } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearUserData } from '../redux/userSlice.js'
import { logoutUser } from '../features/login.js'
import { getUserSubscription } from '../features/payment'

const Sidebar = ({
    user,
    subscription: initialSubscription,
    activeTab,
    setActiveTab,
    totalProjectsCount = 0,
    starredProjectsCount = 0,
    theme = 'dark',
    isMobileOpen = false,
    onCloseMobile
}) => {
    const isDark = theme === 'dark'
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [imageError, setImageError] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [subscription, setSubscription] = useState(initialSubscription || null)

    // Sync subscription if passed as prop, or fetch fallback
    useEffect(() => {
        if (initialSubscription) {
            setSubscription(initialSubscription)
            return
        }
        let isMounted = true
        const fetchSub = async () => {
            try {
                const res = await getUserSubscription()
                if (isMounted && res?.subscription) {
                    setSubscription(res.subscription)
                }
            } catch {
                // Silently fallback to Starter
            }
        }
        fetchSub()
        return () => { isMounted = false }
    }, [initialSubscription])

    const isPro = subscription?.status?.toUpperCase() === 'ACTIVE' &&
        (subscription?.planId === 'PRO_MONTHLY' || subscription?.planId === 'PRO_YEARLY')
    const planName = isPro 
        ? (subscription?.planId === 'PRO_YEARLY' ? 'Pro Yearly' : 'Pro')
        : 'Starter'
    const extraTokens = subscription?.extraTokens || 0

    const userName = user?.name || user?.email?.split('@')[0] || 'User'
    const userEmail = user?.email || 'Authenticated User'
    const userAvatar = user?.avatar || ''
    
    // Compute initials
    const getInitials = () => {
        if (!userName) return 'U'
        const parts = userName.trim().split(' ')
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
        }
        return userName.charAt(0).toUpperCase()
    }

    const initials = getInitials()

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await logoutUser()
        } catch (error) {
            console.error("Logout failed:", error)
        } finally {
            dispatch(clearUserData())
            setIsLoggingOut(false)
            if (onCloseMobile) onCloseMobile()
            navigate('/login')
        }
    }

    const handleNavClick = (tab) => {
        setActiveTab(tab)
        if (onCloseMobile) onCloseMobile()
    }

    const sidebarContent = (
        <div className="flex flex-col justify-between h-full">
            {/* Top Brand & Navigation */}
            <div className="flex flex-col">
                {/* Logo & Mobile Close Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg flex items-center justify-center shadow-inner ${
                            isDark 
                                ? 'bg-[#12151f] border border-white/[0.1]' 
                                : 'bg-[#fbf9f4] border border-[#d8d0bf]'
                        }`}>
                            <img 
                                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"} 
                                alt="BHASHA" 
                                className="h-4 sm:h-5 object-contain" 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer ${
                            isDark 
                                ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        aria-label="Close navigation sidebar"
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-2 sm:mt-3 px-3.5 space-y-1.5">
                    {/* Projects Link */}
                    <button
                        onClick={() => handleNavClick('projects')}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                            activeTab === 'projects'
                                ? isDark
                                    ? 'bg-[#151926] text-white border-l-2 shadow-sm'
                                    : 'bg-slate-100 text-slate-900 border-l-2 border-slate-900 shadow-sm'
                                : isDark
                                    ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <FiFolder className={`text-lg ${
                                activeTab === 'projects' 
                                    ? isDark ? 'text-white' : 'text-slate-900' 
                                    : isDark ? 'text-slate-400' : 'text-slate-500'
                            }`} />
                            <span className="tracking-tight">Projects</span>
                        </div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                            activeTab === 'projects' 
                                ? isDark 
                                    ? 'bg-white text-black font-semibold' 
                                    : 'bg-slate-200 text-slate-800 font-semibold'
                                : isDark 
                                    ? 'text-slate-500' 
                                    : 'text-slate-500'
                        }`}>
                            {totalProjectsCount}
                        </span>
                    </button>

                    {/* Starred Link */}
                    <button
                        onClick={() => handleNavClick('starred')}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                            activeTab === 'starred'
                                ? isDark
                                    ? 'bg-[#151926] text-white border-l-2 border-amber-400 shadow-sm'
                                    : 'bg-slate-100 text-slate-900 border-l-2 border-amber-500 shadow-sm'
                                : isDark
                                    ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <FaStar className="text-amber-400 text-base" />
                            <span className="tracking-tight">Starred</span>
                        </div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                            activeTab === 'starred' 
                                ? isDark 
                                    ? 'bg-amber-500/15 text-amber-300 font-semibold' 
                                    : 'bg-amber-100 text-amber-800 font-semibold'
                                : isDark 
                                    ? 'text-slate-500' 
                                    : 'text-slate-500'
                        }`}>
                            {starredProjectsCount}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Bottom Upgrade / Active Plan Card & User Profile */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Plan Card */}
                <div className={`rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden border transition-colors ${
                    isPro
                        ? isDark
                            ? 'bg-[#0e131f] border-emerald-500/25 shadow-xs'
                            : 'bg-emerald-50/50 border-emerald-200/80 shadow-xs'
                        : isDark
                            ? 'bg-[#10131c] border-white/[0.08]'
                            : 'bg-indigo-50/60 border-indigo-100/80 shadow-xs'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {isPro ? 'Active Plan' : 'Workspace Plan'}
                        </span>
                        <span className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${
                            isPro
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : isDark
                                    ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                            {isPro && <FiCheck className="text-[10px] stroke-[3]" />}
                            {planName}
                        </span>
                    </div>
                    <p className={`text-xs sm:text-[13px] leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isPro
                            ? 'Unlimited workspaces, compiler & autonomous AI pair programmer active.'
                            : 'Upgrade to Pro for unlimited workspaces & autonomous AI pair programmer.'}
                    </p>

                    {extraTokens > 0 && (
                        <div className="mb-3 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono flex items-center gap-1.5">
                            <FiZap className="text-xs shrink-0" />
                            <span>{extraTokens.toLocaleString()} Bonus Tokens</span>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (onCloseMobile) onCloseMobile()
                            navigate('/payment')
                        }}
                        className={`w-full text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer border ${
                            isPro
                                ? isDark
                                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                                : isDark
                                    ? 'bg-white hover:bg-slate-100 text-black border-transparent'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white border-transparent'
                        }`}
                    >
                        {isPro ? (
                            <>
                                <FiCheck className="text-sm text-emerald-400 stroke-[3]" />
                                <span>Manage Plan</span>
                            </>
                        ) : (
                            <>
                                <FiZap className="text-sm text-amber-400" />
                                <span>Upgrade to Pro</span>
                            </>
                        )}
                    </motion.button>
                </div>

                {/* User Profile Bar with Settings Item */}
                <div className="relative">
                    <div 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-colors cursor-pointer border ${isDark
                                ? 'hover:bg-white/[0.04] border-transparent hover:border-white/[0.05]'
                                : 'hover:bg-slate-100/80 border-transparent hover:border-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar: Google DP or Initials */}
                            {userAvatar && !imageError ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    referrerPolicy="no-referrer"
                                    onError={() => setImageError(true)}
                                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0 border ${isDark ? 'border-white/10' : 'border-black'
                                    }`}
                                />
                            ) : (
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold font-mono text-sm sm:text-base flex items-center justify-center shrink-0 shadow-sm ${isDark ? 'bg-slate-200 text-black' : 'bg-slate-900 text-white'
                                }`}>
                                    {initials}
                                </div>
                            )}
                            <div className="min-w-0 flex flex-col text-left">
                                <span className={`text-sm sm:text-base font-semibold truncate block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {userName}
                                </span>
                                <span className={`text-[11px] sm:text-xs font-mono truncate block ${
                                    isPro
                                        ? 'text-emerald-400 font-semibold'
                                        : isDark ? 'text-slate-500' : 'text-slate-500'
                                }`}>
                                    {isPro ? 'Pro Developer' : 'Starter Tier'}
                                </span>
                            </div>
                        </div>

                        {/* Settings Button */}
                        <motion.button
                            whileHover={{ rotate: 45 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsSettingsOpen(!isSettingsOpen)
                            }}
                            title="Settings & Account"
                            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ml-1 ${isDark
                                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <FiSettings className="text-lg sm:text-xl" />
                        </motion.button>
                    </div>

                    {/* Settings Dropdown: Username, Email, Password, Sign Out */}
                    <AnimatePresence>
                        {isSettingsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl p-3 shadow-2xl z-30 border ${isDark
                                        ? 'bg-[#121622] border-white/[0.1]'
                                        : 'bg-white border-slate-200 shadow-xl'
                                }`}
                            >
                                <div className={`px-3.5 py-2.5 border-b mb-2 space-y-1 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <FiUser className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                        <p className={`text-sm font-semibold truncate tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {userName}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors mb-1 ${isDark
                                        ? 'text-slate-300'
                                        : 'text-slate-700'
                                }`}>
                                    <FiMail className={`text-sm shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                    <p className="truncate">
                                        {userEmail}
                                    </p>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${isDark
                                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                    }`}
                                >
                                    <FiLogOut className="text-base" />
                                    <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sticky Sidebar */}
            <aside className={`hidden lg:flex w-68 flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-20 font-sans transition-colors duration-200 ${
                isDark 
                    ? 'bg-[#0a0c12] border-r border-white/[0.06]' 
                    : 'bg-[#ebe5d8] border-r border-[#d8d0bf]'
            }`}>
                {sidebarContent}
            </aside>

            {/* Mobile / Tablet Off-Canvas Drawer Backdrop */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCloseMobile}
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Mobile / Tablet Off-Canvas Drawer */}
            <div className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] h-full z-50 lg:hidden font-sans transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            } ${
                isDark 
                    ? 'bg-[#0a0c12] border-r border-white/[0.1] text-slate-100' 
                    : 'bg-[#ebe5d8] border-r border-[#d8d0bf] text-[#201d1a]'
            }`}>
                {sidebarContent}
            </div>
        </>
    )
}

export default Sidebar
