import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleAuthProvider } from '../config/firebase.js'
import { googleLogin, emailLogin } from '../features/login.js'
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

const IdCardIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="14" x="3" y="5" rx="2"></rect>
    <line x1="7" x2="11" y1="9" y2="9"></line>
    <line x1="7" x2="17" y1="13" y2="13"></line>
    <line x1="7" x2="13" y1="17" y2="17"></line>
  </svg>
)

const KeyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"></circle>
    <path d="m21 2-9.6 9.6"></path>
    <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
  </svg>
)

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [enforceZkp, setEnforceZkp] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Local theme management
  const [theme, setTheme] = useState(() => {
    try {
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
      setSuccess("Session authenticated! Launching workspace...")
      setTimeout(() => {
        navigate('/home')
      }, 600)
      dispatch(setUserData(res))
    } catch (err) {
      console.error("Google login failed:", err)
      setError(err.response?.data?.message || err.message || "Failed to authenticate with Google")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim() || !password) {
      setError("Identity address and passcode are required.")
      return
    }

    setIsLoading(true)
    try {
      const data = await emailLogin(email.trim(), password)
      setSuccess("Session authenticated! Launching workspace...")
      setTimeout(() => {
        navigate('/home')
      }, 600)
      dispatch(setUserData(data))
    } catch (err) {
      console.error("Authentication error:", err)
      setError(err.response?.data?.message || err.message || "Authentication failed. Check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#080a0f] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans antialiased selection:bg-[#00f5c4] selection:text-[#080a0f] flex flex-col justify-between overflow-x-hidden transition-colors duration-200 circuit-grid relative`}>
      
      {/* Top Navbar */}
      <header className={`w-full ${isDark ? 'bg-[#080a0f]/90 border-[#232734]' : 'bg-white/90 border-slate-200'} border-b backdrop-blur-md px-4 sm:px-6 py-2.5 z-20`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Brand & Status Markers */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-2.5 h-2.5 bg-[#00f5c4] inline-block"></span>
              <img
                src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
                alt="BHASHA"
                className="h-5 sm:h-6 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#101319] border border-[#00f5c4] text-[#00f5c4]">
                AI-IDE
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 bg-[#101319] border border-[#232734] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00f5c4] anim-pulse-dot"></span>
                <span className="text-[#00f5c4]">INGRESS ACTIVE</span>
              </span>
              <span className="px-2 py-0.5 bg-[#101319] border border-[#232734] text-slate-400">
                ED25519 AUTH PROTOCOL
              </span>
              <span className="px-2 py-0.5 bg-[#101319] border border-[#232734] text-slate-400">
                KERNEL V0.32-STABLE
              </span>
            </div>
          </div>

          {/* Right Header Navigation Pills */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 bg-[#101319] border border-[#00f5c4] text-[#00f5c4] font-semibold text-[11px] hidden sm:inline-block">
              AUTH_GATE
            </span>
            <Link to="/#platform" className="px-2.5 py-1 bg-[#101319] border border-[#232734] text-slate-400 hover:text-white hover:border-slate-500 text-[11px] hidden lg:inline-block transition-colors">
              CLUSTER_NODES
            </Link>
            <Link to="/#features" className="px-2.5 py-1 bg-[#101319] border border-[#232734] text-slate-400 hover:text-white hover:border-slate-500 text-[11px] hidden lg:inline-block transition-colors">
              KEY_REGISTRY
            </Link>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={`p-1.5 ${isDark ? 'bg-[#101319] border-[#232734] text-slate-300 hover:text-[#00f5c4]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-emerald-600'} border flex items-center justify-center transition-colors`}
            >
              {isDark ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Center Enclosure */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center relative z-10">
        
        {/* Architectural Datum Overlay (Coordinates & Protocol) */}
        <div className="w-full max-w-xl flex items-center justify-between text-[10px] font-mono text-slate-500 mb-3 px-1 hidden md:flex">
          <div>
            <span className="text-slate-400">[GATEWAY-COORD: 40.7128° N, 74.0060° W]</span><br/>
            <span>SYS_STATUS: READY // QUANTUM_RESISTANT_INIT</span>
          </div>
          <div className="text-right">
            <span className="text-[#00f5c4]">AUTH_PROTOCOL: ED25519_OAUTH</span><br/>
            <span>INGRESS: SECURE // CIPHER: AES-256-GCM</span>
          </div>
        </div>

        {/* Central Authentication Card Enclosure */}
        <div className={`w-full max-w-xl ${isDark ? 'bg-[#0a0d14] border-[#232734]' : 'bg-white border-slate-300 shadow-xl'} border p-4 sm:p-8 corner-ch corner-ch-tl corner-ch-tr corner-ch-bl corner-ch-br relative transition-all`}>
          
          {/* Card Top Metadata Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono pb-3 mb-5 sm:mb-6 border-b border-[#232734] gap-2">
            <span className="text-[#00f5c4] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#00f5c4]"></span>
              <span>SYS.GATEWAY.ID_01</span>
            </span>
            <span className="text-[#00f5c4] font-bold tracking-wider text-[9px] sm:text-[10px] shrink-0">
              [SCAN: ACTIVE] :: SECURE
            </span>
          </div>

          {/* Center Brand Wordmark */}
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src={isDark ? "/bhasha-logo-white.png" : "/bhasha-logo-transparent.png"}
              alt="BHASHA"
              className="h-8 sm:h-9 w-auto object-contain select-none mb-2 drop-shadow-[0_0_20px_rgba(0,245,196,0.25)]"
            />
            <div className="text-[#00f5c4] font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-1">
              IDENTITY AUTHENTICATION // SESSION GATEWAY
            </div>
            <p className="text-slate-400 font-sans text-xs mt-1.5 max-w-md">
              Authenticate runtime execution permissions for isolated workspace pods.
            </p>
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
            className={`w-full py-2.5 px-3 sm:px-4 ${isDark ? 'bg-[#101319] hover:bg-[#161922] border-[#232734]' : 'bg-slate-100 hover:bg-slate-200 border-slate-300'} border hover:border-[#00f5c4] transition-all flex items-center justify-between font-mono text-xs text-white mb-5 group cursor-pointer disabled:opacity-60 gap-2`}
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span className="font-medium text-slate-200 group-hover:text-white truncate">
                {isGoogleLoading ? 'Verifying Session...' : 'Continue with Google'}
                <span className="hidden sm:inline"> Workspace</span>
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#00f5c4] px-1.5 py-0.5 bg-[#080a0f] border border-[#00f5c4]/30 shrink-0">
              JWT VERIFIED
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#232734]"></div>
            </div>
            <div className={`relative px-3 ${isDark ? 'bg-[#0a0d14]' : 'bg-white'} text-[10px] font-mono text-slate-500 uppercase tracking-wider`}>
              OR AUTHENTICATE WITH DEVELOPER CREDENTIALS
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Field 1: Email */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <label htmlFor="login-email">USER IDENTITY / EMAIL</label>
                <span className="text-[10px] text-slate-500">[SEC: SHA-256]</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@bhasha.ai"
                  required
                  className={`w-full px-3.5 py-2.5 ${isDark ? 'bg-[#050608] border-[#232734] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border font-mono text-xs focus:border-[#00f5c4] outline-none transition-colors pr-10`}
                />
                <span className="absolute right-3 text-slate-500 pointer-events-none">
                  <IdCardIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <label htmlFor="login-password">PASSCODE / TOKEN</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#00f5c4] hover:underline"
                >
                  {showPassword ? '[HIDE TOKEN]' : '[SHOW TOKEN]'}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className={`w-full px-3.5 py-2.5 ${isDark ? 'bg-[#050608] border-[#232734] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border font-mono text-xs focus:border-[#00f5c4] outline-none transition-colors pr-10`}
                />
                <span className="absolute right-3 text-slate-500 pointer-events-none">
                  <KeyIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enforceZkp}
                  onChange={(e) => setEnforceZkp(e.target.checked)}
                  className="accent-[#00f5c4] w-3.5 h-3.5 rounded"
                />
                <span className="text-[11px] text-slate-300">Enforce Zero-Knowledge Session (ZKP Guard)</span>
              </label>
              <Link to="/privacy" className="text-[11px] text-slate-400 hover:text-[#00f5c4] transition-colors">
                Lost Key / Recovery?
              </Link>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-3 bg-[#00f5c4] hover:bg-[#00f5c4]/90 text-[#080a0f] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,245,196,0.3)] disabled:opacity-60 cursor-pointer"
            >
              <span>{isLoading ? 'AUTHENTICATING ENCLAVE...' : 'AUTHENTICATE SESSION'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

          </form>

          {/* Footer Register Link */}
          <div className="flex items-center justify-between text-xs font-mono pt-6 mt-6 border-t border-[#232734] text-slate-400">
            <span>Need an AI browser identity?</span>
            <Link to="/register" className="text-[#00f5c4] hover:underline flex items-center gap-1 font-semibold">
              <span>Register New Identity</span>
              <span>→</span>
            </Link>
          </div>

        </div>

        {/* Node Security Envelope Status below Card */}
        <div className="w-full max-w-xl mt-4 p-3 bg-[#080a0f] border border-[#232734] text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span>SEC_ENCLAVE: HARDWARE_TPM_2.0 :: </span>
            <span className="text-[#00f5c4]">STATUS: SEALED</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
            <span>NODE: US_VA_03</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">INGRESS [OK]</span>
            <span className="text-[#00f5c4]">AUTH [LIVE]</span>
            <span className="text-slate-400">SESSION [CACHED]</span>
          </div>
        </div>

      </main>

      {/* Bottom Persistent Telemetry Footer */}
      <footer className={`w-full ${isDark ? 'bg-[#050608] border-[#232734]' : 'bg-slate-100 border-slate-200'} border-t px-3 sm:px-6 py-3 font-mono text-[9px] sm:text-[10px] text-slate-500 z-10`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>BHASHA RUNTIME ENVIRONMENT</span>
            <span className="text-slate-700">//</span>
            <span>ZERO-TRUST SEC_LAYER LEVEL 4</span>
            <span className="text-slate-700">//</span>
            <span className="text-[#00f5c4]">FIPS-140-3 COMPLIANT</span>
          </div>
          <div className="text-center sm:text-right">
            <span>LATENCY: 4ms [US-EAST-VA] | © 2026 BHASHA COMPUTING ARCHITECTURE</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Login
