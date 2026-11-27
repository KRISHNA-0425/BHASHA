import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiHome,
  FiTerminal,
  FiCompass,
  FiFileText,
  FiCreditCard
} from 'react-icons/fi'

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-neutral-200 font-sans flex flex-col justify-between selection:bg-neutral-800 selection:text-white relative overflow-hidden">
      {/* Background Subtle Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Minimal Header */}
      <header className="relative z-10 w-full border-b border-neutral-800/80 bg-[#090a0f]/80 backdrop-blur-md px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2.5 text-white font-semibold tracking-tight hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold font-mono">
            B
          </div>
          <span className="text-sm font-bold tracking-wider">BHASHA</span>
        </Link>

        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <Link to="/home" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/payment" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
        </div>
      </header>

      {/* Main Animated 404 Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        {/* Floating Animated 404 Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-6"
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="text-8xl sm:text-9xl font-extrabold tracking-tighter text-white font-mono select-none drop-shadow-sm"
          >
            404
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
            <span>ERR_NOT_FOUND</span>
          </motion.div>
        </motion.div>

        {/* Heading & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Page does not exist
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            The workspace route or resource you are trying to access cannot be found. It may have been moved, deleted, or never existed.
          </p>
        </motion.div>

        {/* Terminal Diagnostic Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="w-full mt-8 p-4 rounded-xl bg-[#0e1017] border border-neutral-800 text-left font-mono text-xs shadow-lg"
        >
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-800/80 text-neutral-500 text-[11px]">
            <FiTerminal className="text-neutral-400" />
            <span>bhasha-runtime-diagnostic</span>
          </div>
          <div className="space-y-1.5 text-neutral-400 text-[11px]">
            <p className="text-neutral-300">
              <span className="text-emerald-400">$</span> bhasha router resolve --uri "{location.pathname}"
            </p>
            <p className="text-amber-400/90">
              [warn] Target path returned HTTP 404 (Not Found)
            </p>
            <p className="text-neutral-500">
              [hint] Check the URL or navigate back to an existing project workspace.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <FiArrowLeft className="text-sm" />
            <span>Go Back</span>
          </button>

          <Link
            to="/home"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <FiHome className="text-sm" />
            <span>Return to Dashboard</span>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="mt-10 pt-8 border-t border-neutral-800/60 w-full flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500"
        >
          <Link to="/home" className="hover:text-neutral-300 flex items-center gap-1.5 transition-colors">
            <FiCompass className="text-xs" />
            <span>Projects</span>
          </Link>
          <Link to="/payment" className="hover:text-neutral-300 flex items-center gap-1.5 transition-colors">
            <FiCreditCard className="text-xs" />
            <span>Pricing & Plans</span>
          </Link>
          <Link to="/privacy" className="hover:text-neutral-300 flex items-center gap-1.5 transition-colors">
            <FiFileText className="text-xs" />
            <span>Privacy Policy</span>
          </Link>
        </motion.div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="relative z-10 w-full border-t border-neutral-800/80 bg-[#090a0f] px-6 sm:px-10 py-5 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© 2026 BHASHA Cloud IDE. All rights reserved.</span>
        <div className="flex items-center gap-4 text-[11px] text-neutral-400">
          <Link to="/home" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default NotFound
