import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearUserData } from '../redux/userSlice.js'
import { logoutUser } from '../features/login.js'

/**
 * Navbar component
 * @param {Object} props
 * @param {Object} [props.user] - Optional user object property (falls back to Redux user state)
 * @param {Function} [props.onLogout] - Optional custom logout handler
 * @param {boolean} [props.showLogout=true] - Whether to show the logout button
 */
const Navbar = ({ user: userProp, onLogout, showLogout = true }) => {
    const { userData: reduxUser } = useSelector((state) => state.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const user = userProp || reduxUser
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [imageError, setImageError] = useState(false)

    const userName = user?.name || user?.email?.split('@')[0] || 'Explorer'
    const userAvatar = user?.avatar || ''
    const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

    // Reset image error state whenever avatar URL changes
    useEffect(() => {
        setImageError(false)
    }, [userAvatar])

    const handleLogout = async () => {
        if (onLogout) {
            return onLogout()
        }

        setIsLoggingOut(true)
        try {
            await logoutUser()
        } catch (error) {
            console.error("Logout request failed:", error)
        } finally {
            dispatch(clearUserData())
            setIsLoggingOut(false)
            navigate('/login')
        }
    }

    return (
        <header className="relative z-10 w-full border-b border-white/[0.06] bg-[#0c0f17]/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Brand / Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3">
                <img 
                    src="/bhasha-logo-white.png" 
                    alt="BHASHA" 
                    className="h-4 sm:h-5 object-contain" 
                />
                <div className="h-3 w-px bg-slate-800 hidden xs:block"></div>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase hidden xs:inline-block">
                    AI—WORKSPACE
                </span>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-2.5 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 bg-[#131722] border border-white/[0.08] rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-sm min-w-0">
                    {userAvatar && !imageError ? (
                        <img 
                            src={userAvatar} 
                            alt={userName} 
                            referrerPolicy="no-referrer"
                            onError={() => setImageError(true)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-white/10 ring-1 ring-cyan-500/20 shrink-0" 
                        />
                    ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold tracking-wider shadow-inner shrink-0">
                            {initial}
                        </div>
                    )}
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{userName}</span>
                </div>

                {showLogout && (
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="bg-red-950/30 hover:bg-red-950/60 active:bg-red-950/80 text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        {isLoggingOut ? 'Logging out...' : 'Sign Out'}
                    </button>
                )}
            </div>
        </header>
    )
}

export default Navbar

