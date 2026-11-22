import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFolder, FiSettings, FiLogOut, FiZap, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearUserData } from '../redux/userSlice.js'
import { logoutUser } from '../features/login.js'

const Sidebar = ({
    user,
    activeTab,
    setActiveTab,
    totalProjectsCount = 0,
    starredProjectsCount = 0,
    theme = 'dark'
}) => {
    const isDark = theme === 'dark'
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [imageError, setImageError] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

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
            navigate('/login')
        }
    }

    return (
        <aside className={`w-68 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-20 font-sans transition-colors duration-200 ${
            isDark 
                ? 'bg-[#0a0c12] border-r border-white/[0.06]' 
                : 'bg-white border-r border-slate-200'
        }`}>
            {/* Top Brand & Navigation */}
            <div className="flex flex-col">
                {/* Logo & Version Header */}
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg flex items-center justify-center shadow-inner ${
                            isDark 
                                ? 'bg-[#12151f] border border-white/[0.1]' 
                                : 'bg-slate-50 border border-slate-200'
                        }`}>
                            <img 
                                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"} 
                                alt="BHASHA" 
                                className="h-4 sm:h-5 object-contain" 
                                onError={(e) => {
                                    // Fallback to text if file missing
                                    e.target.style.display = 'none';
                                }}
                            />
                            
                        </div>
                    </div>
                    
                </div>

                {/* Navigation Items */}
                <nav className="mt-3 px-3.5 space-y-1.5">
                    {/* Projects Link */}
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                            activeTab === 'projects'
                                ? isDark
                                    ? 'bg-[#151926] text-white border-l-2  shadow-sm'
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
                        onClick={() => setActiveTab('starred')}
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

            {/* Bottom Upgrade Card & User Profile */}
            <div className="p-4 space-y-4">
                {/* Upgrade Plan Card */}
                <div className={`rounded-2xl p-4 shadow-sm relative overflow-hidden border transition-colors ${
                    isDark
                        ? 'bg-[#10131c] border-white/[0.08]'
                        : 'bg-indigo-50/60 border-indigo-100/80 shadow-xs'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Upgrade Plan
                        </span>
                        <span className={`text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md font-semibold border ${
                            isDark
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                            Starter
                        </span>
                    </div>
                    <p className={`text-xs sm:text-[13px] leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Upgrade to Pro for unlimited neural credits & dedicated TEE enclaves.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer ${
                            isDark
                                ? 'bg-white hover:bg-slate-100 text-black'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                    >
                        <FiZap className={`text-sm ${isDark ? 'fill-black' : 'fill-white'}`} />
                        <span>Upgrade Now</span>
                    </motion.button>
                </div>

                {/* User Profile Bar with Settings Item */}
                <div className="relative">
                    <div 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer border ${isDark
                                ? 'hover:bg-white/[0.04] border-transparent hover:border-white/[0.05]'
                                : 'hover:bg-slate-100/80 border-transparent hover:border-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            {/* Avatar: Google DP or Initials */}
                            {userAvatar && !imageError ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    referrerPolicy="no-referrer"
                                    onError={() => setImageError(true)}
                                    className={`w-11 h-11 rounded-full object-cover shrink-0 border ${isDark ? 'border-white/10' : 'border-black'
                                    }`}
                                />
                            ) : (
                                <div className={`w-11 h-11 rounded-full font-bold font-mono text-sm sm:text-base flex items-center justify-center shrink-0 shadow-sm ${isDark ? 'bg-slate-200 text-black' : 'bg-slate-900 text-white'
                                }`}>
                                    {initials}
                                </div>
                            )}
                            <div className="min-w-0 flex flex-col text-left">
                                <span className={`text-base font-semibold truncate block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {userName}
                                </span>
                                <span className={`text-xs sm:text-sm font-mono truncate block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Basic
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
                            <FiSettings className="text-xl" />
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
                                {/* User Info Header */}
                                <div className={`px-3.5 py-3 border-b mb-2 space-y-1.5 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'
                                }`}>
                                    <div className="flex items-center gap-2.5">
                                        <FiUser className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                        <p className={`text-base font-semibold truncate tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {userName}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">

                                    </div>
                                </div>

                                {/* Password Setting Row */}
                                <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer mb-1 ${isDark
                                        ? 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}>

                                    <FiMail className={`text-sm ${isDark ? 'text-white' : 'text-black'}`} />
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'} truncate`}>
                                        {userEmail}
                                    </p>
                                </div>

                                {/* Sign Out Action */}
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isDark
                                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                    }`}
                                >
                                    <FiLogOut className="text-lg" />
                                    <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
