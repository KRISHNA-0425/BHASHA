import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleAuthProvider } from '../config/firebase.js'
import { googleLogin, emailLogin } from '../features/login.js'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice.js'

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);


    const dispatch = useDispatch()

    const handleGoogleAuth = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            const data = await signInWithPopup(auth, googleAuthProvider);
            const token = await data.user.getIdToken();
            const res = await googleLogin(token);
            setSuccess("Session authenticated! Launching workspace...");
            setTimeout(() => {
                navigate('/home');
            }, 600);

            // setting the data i.e. payload
            dispatch(setUserData(res))

        } catch (err) {
            console.error("Google login failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to authenticate with Google");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email.trim() || !password) {
            setError("Identity address and passphrase are required.");
            return;
        }

        setIsLoading(true);
        try {
            const data = await emailLogin(email.trim(), password);
            setSuccess("Session authenticated! Launching workspace...");

            setTimeout(() => {
                navigate('/home');
            }, 600);

            dispatch(setUserData(data));

        } catch (err) {
            console.error("Authentication error:", err);
            setError(err.response?.data?.message || err.message || "Authentication failed. Check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };


    
    return (
        <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col justify-between items-center selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden px-4 sm:px-6 py-5">
            
            {/* Ambient Cyber Lighting / Radial Glow */}
            <div 
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(22, 40, 72, 0.45) 0%, rgba(12, 18, 30, 0.3) 40%, rgba(7, 9, 14, 0.98) 75%)'
                }}
            />

            {/* Subtle background tech grid */}
            <div 
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                    backgroundSize: '48px 48px'
                }}
            />

            {/* Top Bar Branding */}
            <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-1 mb-2">
                <div className="flex items-center gap-3">
                    <img 
                        src="/bhasha-logo-white.png" 
                        alt="BHASHA" 
                        className="h-4 sm:h-5 object-contain opacity-90 hover:opacity-100 transition-opacity" 
                    />
                    <div className="h-3 w-px bg-slate-800 hidden sm:block"></div>
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase hidden sm:inline-block">
                        AI—IDE
                    </span>
                </div>

            </header>

            {/* Main Center Area */}
            <main className="relative z-10 w-full flex flex-col items-center justify-center  my-auto py-2">
                
                {/* Central Card */}
                <div className="w-full lg:h-[550px] max-w-[440px] sm:max-w-[460px] bg-[#10131b]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_-8px_rgba(30,64,120,0.22)] transition-all flex flex-col justify-between">
                    
                    <div>
                        
                        {/* Header Title with Logo Badge */}
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <h1 className="text-2xl sm:text-[25px] font-semibold text-white tracking-tight">
                                Sign in to
                            </h1>
                            <div className="bg-black/95 border border-white/20 rounded-lg px-3 py-1.5 flex items-center shadow-inner">
                                <img 
                                    src="/bhasha-logo-white.png" 
                                    alt="BHASHA" 
                                    className="h-4 sm:h-5 object-contain" 
                                />
                            </div>
                        </div>

                        {/* Feedback Messages */}
                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-2.5 animate-fadeIn">
                                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm flex items-start gap-2.5 animate-fadeIn">
                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span className="flex-1">{success}</span>
                            </div>
                        )}

                        {/* Google Sign In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={isGoogleLoading || isLoading}
                            className="w-full bg-[#151922] hover:bg-[#1a202c] active:bg-[#12161f] text-slate-100 border border-slate-700/60 hover:border-slate-600 rounded-xl py-3 px-5 flex items-center justify-center gap-3 font-medium text-base sm:text-[17px] transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isGoogleLoading ? (
                                <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                            )}
                            <span>Continue with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="flex items-center my-4">
                            <div className="flex-1 border-t border-slate-800"></div>
                            <span className="px-3 text-xs sm:text-[13px] font-semibold tracking-wider text-slate-400 uppercase select-none">
                                OR CONTINUE WITH EMAIL
                            </span>
                            <div className="flex-1 border-t border-slate-800"></div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            
                            {/* Aura Identity Address Input */}
                            <div>
                                <label className="block text-sm sm:text-[15px] font-medium text-slate-200 mb-1.5 text-left">
                                    Email Address
                                </label>
                                <div className="relative flex items-center bg-[#090b10] border border-slate-800 rounded-xl px-4 py-3 focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/25 transition-all">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@domain.com"
                                        className="w-full bg-transparent text-base sm:text-[16px] text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
                                    />
                                    <span className="text-slate-500 text-base sm:text-lg font-light select-none px-0.5">@</span>
                                </div>
                            </div>

                            {/* Passphrase / Master Key Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm sm:text-[15px] font-medium text-slate-200">
                                        Password
                                    </label>
                                    {/* <button
                                        type="button"
                                        onClick={() => setError("Recovery instructions dispatched to your identity address.")}
                                        className="text-sm sm:text-[14px] text-[#38bdf8] hover:text-[#7dd3fc] font-medium transition-colors cursor-pointer"
                                    >
                                        Forgot key?
                                    </button> */}
                                </div>
                                <div className="relative flex items-center bg-[#090b10] border border-slate-800 rounded-xl px-4 py-3 focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/25 transition-all">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-transparent text-base sm:text-[16px] text-slate-100 placeholder:text-slate-500 focus:outline-none tracking-widest font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer focus:outline-none"
                                        aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Action Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full bg-[#f1f3f7] hover:bg-white active:bg-slate-200 text-[#0a0d14] font-semibold text-base sm:text-lg py-3 px-5 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-black/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99] mt-2"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-[#0a0d14]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <span>Authenticate Session</span>
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Link to Register Component */}
                    <div className="pt-3 pb-1 text-center text-sm sm:text-base text-slate-400">
                        Need an AI browser identity?{' '}
                        <Link
                            to="/register"
                            className="text-[#38bdf8] hover:text-[#7dd3fc] font-semibold transition-colors hover:underline cursor-pointer ml-1"
                        >
                            Create account
                        </Link>
                    </div>

                </div>

                {/* Under-Card Badges */}
               

            </main>
        </div>
    )
}

export default Login
