import React from 'react'
import { Link } from 'react-router-dom'
import {
  FiGithub,
  FiTerminal,
  FiShield,
  FiExternalLink,
  FiFileText,
  FiCreditCard,
  FiCode,
  FiServer
} from 'react-icons/fi'

const Footer = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark'

  return (
    <footer
      className={`w-full border-t transition-colors duration-200 font-sans ${
        isDark
          ? 'bg-[#090a0f] border-neutral-800/80 text-neutral-400'
          : 'bg-[#ede7dc] border-[#d8d0bf] text-[#5e584f]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-10 sm:pb-12 border-b border-inherit">
          {/* Brand & Mission (Spans 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/home" className="inline-flex items-center gap-2.5 group">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-transform group-hover:scale-105 ${
                  isDark
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-slate-900 text-white shadow-xs'
                }`}
              >
                B
              </div>
              <span className={`text-sm font-bold tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                BHASHA
              </span>
            </Link>

            <p className={`text-xs sm:text-sm max-w-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Browser-native cloud IDE equipped with autonomous AI pair programming, sandboxed terminal runtimes, and real-time live preview.
            </p>

            {/* Operational Status Pill */}
            <div className="pt-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Microservices Operational</span>
              </div>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3 text-xs">
            <p className={`font-semibold uppercase tracking-wider text-[11px] ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
              Product
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/home"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiCode className="text-xs" />
                  <span>Cloud Editor</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/home"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiTerminal className="text-xs" />
                  <span>Web Terminal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/payment"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiCreditCard className="text-xs" />
                  <span>Pricing & Plans</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/home"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiServer className="text-xs" />
                  <span>Container Sandboxes</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources & Developers */}
          <div className="space-y-3 text-xs">
            <p className={`font-semibold uppercase tracking-wider text-[11px] ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
              Resources
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/KRISHNA-0425/BHASHA"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiGithub className="text-xs" />
                  <span>GitHub Repository</span>
                  <FiExternalLink className="text-[10px] opacity-70" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/KRISHNA-0425/BHASHA#api-documentation"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiFileText className="text-xs" />
                  <span>API Documentation</span>
                </a>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  <FiShield className="text-xs" />
                  <span>Security Overview</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Trust */}
          <div className="space-y-3 text-xs">
            <p className={`font-semibold uppercase tracking-wider text-[11px] ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
              Legal & Trust
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/privacy"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy#code-privacy"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Code Confidentiality
                </Link>
              </li>
              <li>
                <Link
                  to="/payment"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Razorpay PCI Settlement
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@bhasha.dev"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className={isDark ? 'text-neutral-500' : 'text-slate-500'}>
            © 2026 BHASHA Cloud IDE. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[11px]">
            <Link
              to="/home"
              className={`transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/payment"
              className={`transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Pricing
            </Link>
            <Link
              to="/privacy"
              className={`transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Privacy Policy
            </Link>
            <a
              href="https://github.com/KRISHNA-0425/BHASHA"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1 transition-colors ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiGithub className="text-xs" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
