import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleAuthProvider } from '../config/firebase.js'
import { googleLogin, registerUser } from '../features/login.js'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice.js'

// --- Crisp Lightweight Inline Icons ---
const GoogleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
)

const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const SunIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
)

const MoonIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
)

const UserIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const AtSignIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path>
  </svg>
)

const KeyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"></circle>
    <path d="m21 2-9.6 9.6"></path>
    <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
  </svg>
)

const Register = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Local theme management
  const [theme, setTheme] = useState(() => {
    try {
      const qTheme = new URLSearchParams(window.location.search).get('theme')
      if (qTheme === 'light' || qTheme === 'dark') return qTheme
      return localStorage.getItem('theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', next)
      } catch (err) {
        console.error("Failed to save theme in localStorage:", err)
      }
      return next
    })
  }

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true)
    setError(null)
    try {
      const data = await signInWithPopup(auth, googleAuthProvider)
      const token = await data.user.getIdToken()
      const res = await googleLogin(token)
      setSuccess("Identity provisioned via Google Federated Enclave!")
      setTimeout(() => {
        navigate('/home')
      }, 600)
      dispatch(setUserData(res))
    } catch (err) {
      console.error("Google registration failed:", err)
      setError(err.response?.data?.message || err.message || "Failed to register with Google")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError("Developer username / alias is required.")
      return
    }

    if (!email.trim()) {
      setError("Email address is required.")
      return
    }

    if (!password) {
      setError("Password is required.")
      return
    }

    if (password.length < 8) {
      setError("Secret master password must be at least 8 characters long.")
      return
    }

    if (!agreeTerms) {
      setError("Please accept the Terms & Conditions and quota protection.")
      return
    }

    setIsLoading(true)
    try {
      const data = await registerUser(name.trim(), email.trim(), password)
      setSuccess("Identity initialized! Provisioning workspace container...")
      setTimeout(() => {
        navigate('/home')
      }, 600)
      dispatch(setUserData(data))
    } catch (err) {
      console.error("Registration error:", err)
      if (err.response?.status === 409) {
        setError("An account with this email address already exists. Please sign in instead.")
      } else {
        setError(err.response?.data?.message || err.message || "Registration failed. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#080a0f] text-slate-100 circuit-grid' : 'bg-[#f5f2eb] text-[#201d1a] circuit-grid-light'} font-sans antialiased selection:bg-[#00f5c4] selection:text-[#080a0f] flex flex-col justify-between overflow-x-hidden transition-colors duration-200 relative`}>
      
      {/* Top Navbar */}
      <header className={`w-full ${isDark ? 'bg-[#080a0f]/90 border-[#232734]' : 'bg-[#ebe5d8]/90 border-[#d8d0bf]'} border-b backdrop-blur-md px-4 sm:px-6 py-2.5 z-20`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Brand & Status Markers */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <Link to="/" className="flex items-center gap-2 group">
              {/* <span className="w-2.5 h-2.5 bg-[#00f5c4] inline-block"></span> */}
              <img
                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                alt="BHASHA"
                className="h-5 sm:h-6 w-auto "
              />
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4] text-[#00f5c4]">
                AI-IDE
              </span>
            </Link>

          </div>

          {/* Right Header Navigation Pills */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 bg-[#101319] border border-[#00f5c4] text-[#00f5c4] font-semibold text-[11px] hidden sm:inline-block">
              AUTH_GATE
            </span>
            
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={`p-1.5 ${isDark ? 'bg-[#101319] border-[#232734] text-slate-300 hover:text-[#00f5c4]' : 'bg-[#ede7dc] border-[#d8d0bf] text-[#3d3830] hover:text-emerald-700'} border flex items-center justify-center transition-colors`}
            >
              {isDark ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Center Enclosure */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center relative z-10">
        
        {/* Central Provisioning Card Enclosure */}
        <div className={`w-full max-w-xl ${isDark ? 'bg-[#0a0d14] border-[#232734]' : 'bg-[#ebe5d8] border-[#d8d0bf] shadow-xl'} border p-4 sm:p-8 corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br relative transition-all`}>
          
          

          {/* Centerpiece: Precision Engineered BHASHA Brand Geometry Frame with Animated Scanline */}
          <div className="relative w-full max-w-md mx-auto mb-6">
            <div className={`relative p-3.5 sm:p-5 ${isDark ? 'bg-[#080a0f]/90 border-[#232734]' : 'bg-[#fbf9f4] border-[#d8d0bf] shadow-sm'} border corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br backdrop-blur-md`}>
              
              {/* Animated Scanline Sweep across Datum Frame */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
                <div className="anim-scanline" />
              </div>

              {/* Datum Header inside Frame */}
              <div className={`flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 mb-2.5 border-b ${isDark ? 'border-[#232734]' : 'border-[#d8d0bf]'} pb-1.5`}>
                <span className="flex items-center gap-1">
                  <span className="text-[#00f5c4]">⎡</span>
                  <span className={isDark ? 'text-slate-400' : 'text-[#5e584f]'}>AUTONOMOUS CLOUD IDE</span>
                </span>
                <span className="hidden xs:inline text-slate-500">NEXT-GEN DEV RUNTIME</span>
                <span className="flex items-center gap-1">
                  <span className={isDark ? 'text-slate-400' : 'text-[#5e584f]'}>PROVISION TENANT</span>
                  <span className="text-[#00f5c4]">⎤</span>
                </span>
              </div>

              {/* Iconic BHASHA Brand Logo */}
              <div className="flex flex-col items-center justify-center py-2 sm:py-3 px-2 relative">
                <img
                  src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                  alt="BHASHA"
                  className="h-8 sm:h-10 w-auto object-contain select-none drop-shadow-[0_0_24px_rgba(0,245,196,0.3)]"
                />
              </div>

              {/* Datum Footer inside Frame */}
              <div className={`flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 mt-2.5 border-t ${isDark ? 'border-[#232734]' : 'border-[#d8d0bf]'} pt-1.5`}>
                <span className="text-[#00f5c4] truncate">⎣ INITIALIZE CLOUD ID</span>
                <span className={`hidden xs:inline ${isDark ? 'text-slate-400' : 'text-[#5e584f]'}`}>MULTI-TENANT DEV</span>
                <span className="text-[#00f5c4] truncate">PORT: 3000 ⎦</span>
              </div>

            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-5 p-3 bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-mono flex items-start gap-2.5 animate-fadeIn">
              <span className="text-red-400 font-bold">[ERR]</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 bg-emerald-950/40 border border-[#00f5c4]/50 text-[#00f5c4] text-xs font-mono flex items-start gap-2.5 animate-fadeIn">
              <span className="font-bold">[OK]</span>
              <span className="flex-1">{success}</span>
            </div>
          )}

          {/* Google Federated Authentication Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isLoading}
            className={`w-full py-2.5 px-4 ${isDark ? 'bg-[#101319] hover:bg-[#161922] border-[#232734]' : 'bg-[#ede7dc] hover:bg-[#e2dbce] border-[#d8d0bf]'} border hover:border-[#00f5c4] transition-all flex items-center justify-between font-mono text-xs ${isDark ? 'text-white' : 'text-[#201d1a]'} mb-5 group cursor-pointer disabled:opacity-60`}
          >
            <div className="flex items-center gap-2.5">
              <GoogleIcon className="w-4 h-4" />
              <span className={`font-medium ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-[#201d1a] group-hover:text-black'}`}>
                {isGoogleLoading ? 'Provisioning Google Identity...' : 'Continue with Federated Google'}
              </span>
            </div>
            <span className={`text-[10px] text-[#00f5c4] px-1.5 py-0.5 ${isDark ? 'bg-[#080a0f]' : 'bg-[#f5f2eb]'} border border-[#00f5c4]/30`}>
              1-CLICK ONBOARDING
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-[#232734]' : 'border-[#d8d0bf]'}`}></div>
            </div>
            <div className={`relative px-3 ${isDark ? 'bg-[#0a0d14]' : 'bg-[#ebe5d8]'} text-[10px] font-mono text-slate-500 uppercase tracking-wider`}>
              OR REGISTER WITH DEVELOPER CREDENTIALS
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Field 1: Developer Username */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <label htmlFor="register-name">DEVELOPER USERNAME</label>
                <span className="text-[10px] text-slate-500">[ID: UNIQUE]</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  required
                  className={`w-full px-3.5 py-2.5 ${isDark ? 'bg-[#050608] border-[#232734] text-white' : 'bg-[#fbf9f4] border-[#d8d0bf] text-[#201d1a]'} border font-mono text-xs focus:border-[#00f5c4] outline-none transition-colors pr-10`}
                />
                <span className="absolute right-3 text-slate-500 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Field 2: Email */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <label htmlFor="register-email">EMAIL ADDRESS</label>
                <span className="text-[10px] text-slate-500">[VERIFY: REQUIRED]</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@domain.com"
                  required
                  className={`w-full px-3.5 py-2.5 ${isDark ? 'bg-[#050608] border-[#232734] text-white' : 'bg-[#fbf9f4] border-[#d8d0bf] text-[#201d1a]'} border font-mono text-xs focus:border-[#00f5c4] outline-none transition-colors pr-10`}
                />
                <span className="absolute right-3 text-slate-500 pointer-events-none">
                  <AtSignIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Field 3: Password */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <label htmlFor="register-password">SECRET MASTER PASSWORD</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#00f5c4] hover:underline"
                >
                  {showPassword ? '[HIDE SECRET]' : '[SHOW SECRET]'}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  minLength={8}
                  className={`w-full px-3.5 py-2.5 ${isDark ? 'bg-[#050608] border-[#232734] text-white' : 'bg-[#fbf9f4] border-[#d8d0bf] text-[#201d1a]'} border font-mono text-xs focus:border-[#00f5c4] outline-none transition-colors pr-10`}
                />
                <span className="absolute right-3 text-slate-500 pointer-events-none">
                  <KeyIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="accent-[#00f5c4] w-3.5 h-3.5 rounded"
                />
                <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-[#3d3830]'}`}>
                  I agree to the <Link to="/privacy" className="text-[#00f5c4] hover:underline">Terms & Conditions</Link> and workspace quota protection.
                </span>
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-3 bg-[#00f5c4] hover:bg-[#00f5c4]/90 text-[#080a0f] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,245,196,0.3)] disabled:opacity-60 cursor-pointer"
            >
              <span>{isLoading ? 'INITIALIZING WORKSPACE...' : 'INITIALIZE IDENTITY & SCATTER WORKSPACE'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

          </form>

          {/* Footer Login Link */}
          <div className={`flex items-center justify-between text-xs font-mono pt-6 mt-6 border-t ${isDark ? 'border-[#232734]' : 'border-[#d8d0bf]'} text-slate-400`}>
            <span>Already have an AI browser identity?</span>
            <Link to="/login" className="text-[#00f5c4] hover:underline flex items-center gap-1 font-semibold">
              <span>Sign In to Session</span>
              <span>→</span>
            </Link>
          </div>

        </div>

        {/* Provision Status Enclave below Card */}
        <div className={`w-full max-w-xl mt-4 p-3 ${isDark ? 'bg-[#080a0f] border-[#232734]' : 'bg-[#ede7dc] border-[#d8d0bf]'} border text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left`}>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span>ROOT DIRECTORY AUTO-SCAFFOLD:</span>
            <span className="text-[#00f5c4]">READY</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
            <span>LANGGRAPH AGENT: <span className="text-[#00f5c4]">READY</span></span>
            <span className="text-slate-600">|</span>
            <span>VIRTUAL FILESYSTEM: <span className={isDark ? 'text-slate-300' : 'text-[#3d3830]'}>STANDBY</span></span>
          </div>
        </div>

      </main>

      {/* Comprehensive Landing-Style Footer */}
      <footer className={`w-full ${isDark ? 'bg-[#050608] border-[#232734]' : 'bg-[#ede7dc] border-[#d8d0bf]'} border-t mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            
            {/* Brand Column */}
            <div className="sm:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                  alt="BHASHA"
                  className="h-7 w-auto object-contain"
                />
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4] text-[#00f5c4]">
                  AI-IDE
                </span>
              </div>
              <p className={`font-sans text-xs ${isDark ? 'text-slate-400' : 'text-[#5e584f]'} max-w-sm leading-relaxed`}>
                The AI-first cloud development environment. Engineered for autonomous cognitive flow, multi-file code synthesis, and instant live app previews.
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <div className={`flex items-center gap-2 px-2.5 py-1 ${isDark ? 'bg-[#101319] border-[#232734]' : 'bg-[#ebe5d8] border-[#d8d0bf]'}`}>
                  <span className="w-2 h-2 bg-[#00f5c4] anim-pulse-dot"></span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-300' : 'text-[#201d1a]'}`}>All Systems Operational (99.99%)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">v2.0-STABLE</span>
              </div>
            </div>

            {/* Links Column 1: Product */}
            <div>
              <div className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#201d1a]'} uppercase tracking-wider mb-3`}>
                PRODUCT
              </div>
              <ul className={`space-y-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5e584f]'}`}>
                <li><Link to="/#features" className="hover:text-[#00f5c4] transition-colors">AI Pair Programmer</Link></li>
                <li><Link to="/#simulator" className="hover:text-[#00f5c4] transition-colors">Cloud Workspaces</Link></li>
                <li><Link to="/#features" className="hover:text-[#00f5c4] transition-colors">Live App Preview</Link></li>
                <li><Link to="/#terminal" className="hover:text-[#00f5c4] transition-colors">Cloud Terminal</Link></li>
                <li><Link to="/payment" className="hover:text-[#00f5c4] transition-colors">Pricing & Plans</Link></li>
              </ul>
            </div>

            {/* Links Column 2: Platform */}
            <div>
              <div className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#201d1a]'} uppercase tracking-wider mb-3`}>
                PLATFORM
              </div>
              <ul className={`space-y-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5e584f]'}`}>
                <li><Link to="/#platform" className="hover:text-[#00f5c4] transition-colors">Global Edge Ingress</Link></li>
                <li><Link to="/#platform" className="hover:text-[#00f5c4] transition-colors">Virtual Filesystem</Link></li>
                <li><Link to="/#platform" className="hover:text-[#00f5c4] transition-colors">LangGraph AI Engine</Link></li>
                <li><Link to="/#platform" className="hover:text-[#00f5c4] transition-colors">Sandboxed Containers</Link></li>
                <li><Link to="/#platform" className="hover:text-[#00f5c4] transition-colors">Security Hardening</Link></li>
              </ul>
            </div>

            {/* Links Column 3: Resources */}
            <div>
              <div className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#201d1a]'} uppercase tracking-wider mb-3`}>
                RESOURCES
              </div>
              <ul className={`space-y-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5e584f]'}`}>
                <li><Link to="/privacy" className="hover:text-[#00f5c4] transition-colors">Privacy Policy</Link></li>
                <li><a href="https://github.com/KRISHNA-0425/BHASHA" target="_blank" rel="noreferrer" className="hover:text-[#00f5c4] transition-colors">GitHub Repository</a></li>
                <li><Link to="/#features" className="hover:text-[#00f5c4] transition-colors">Feature Highlights</Link></li>
                <li><Link to="/privacy" className="hover:text-[#00f5c4] transition-colors">Terms of Service</Link></li>
                <li><Link to="/#platform" className="hover:text-[#00f5c4] transition-colors">System Status</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Persistent Telemetry & Legal */}
          <div className={`pt-6 border-t ${isDark ? 'border-[#232734]' : 'border-[#d8d0bf]'} flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] sm:text-[11px] text-slate-500`}>
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-center md:text-left">
              <span>© 2026</span>
              <img
                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                alt="BHASHA"
                className="h-3.5 w-auto object-contain inline-block align-middle mx-1"
              />
              <span>Labs, Inc. The AI-first Cloud IDE engineered for autonomous developer flow.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <a href="https://github.com/KRISHNA-0425/BHASHA" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">Security</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}

export default Register
