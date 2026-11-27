import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, ToastContainer } from 'react-toastify'
import {
  FiCheck,
  FiShield,
  FiZap,
  FiRefreshCw,
  FiArrowLeft,
  FiHelpCircle,
  FiCreditCard,
  FiUser,
  FiSun,
  FiMoon
} from 'react-icons/fi'
import {
  createPaymentOrder,
  verifyPayment,
  getUserSubscription,
  loadRazorpayScript
} from '../features/payment'
import Footer from '../components/Footer.jsx'
import { animateHeroReveal } from '../utils/animations.js'

const Payment = () => {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)

  // Theme state
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', next)
      } catch {}
      return next
    })
  }

  const isDark = theme === 'dark'

  // Billing cycle: 'monthly' | 'yearly'
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const heroRef = useRef(null)

  // Fetch active subscription on mount
  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await getUserSubscription()
        if (res?.subscription) {
          setCurrentSubscription(res.subscription)
        }
      } catch (err) {
        console.error('Failed to fetch user subscription:', err)
      }
    }
    fetchSub()
    if (heroRef.current) {
      animateHeroReveal(heroRef.current)
    }
  }, [])

  const isPro = currentSubscription?.status?.toUpperCase() === 'ACTIVE' &&
    (currentSubscription?.planId === 'PRO_MONTHLY' || currentSubscription?.planId === 'PRO_YEARLY')

  // Handle Razorpay Checkout for Pro Plan
  const handleUpgrade = async () => {
    if (isPro) {
      toast.info('You already have an active Pro subscription.')
      return
    }

    try {
      setIsCheckingOut(true)

      // 1. Dynamically load official Razorpay script
      const scriptReady = await loadRazorpayScript()
      if (!scriptReady) {
        toast.error('Unable to load Razorpay SDK. Please check your network connection.')
        return
      }

      // 2. Target plan based on billing cycle
      const targetPlanId = billingCycle === 'yearly' ? 'PRO_YEARLY' : 'PRO_MONTHLY'

      // 3. Create server-authoritative order
      toast.info('Initiating secure payment...')
      const orderRes = await createPaymentOrder(targetPlanId)

      if (!orderRes?.success || !orderRes?.orderId) {
        throw new Error(orderRes?.message || 'Failed to initiate order with payment server')
      }

      // 4. Configure Razorpay modal
      const options = {
        key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'BHASHA Cloud IDE',
        description: `Pro Developer Pass (${billingCycle === 'yearly' ? '365 Days' : '30 Days'})`,
        order_id: orderRes.orderId,
        image: 'https://cdn-icons-png.flaticon.com/512/919/919851.png',
        handler: async (response) => {
          try {
            toast.info('Verifying payment signature...')
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes?.success) {
              toast.success('Payment verified! Welcome to BHASHA Pro.')
              setCurrentSubscription(verifyRes.subscription)
            } else {
              toast.error(verifyRes?.message || 'Payment verification failed.')
            }
          } catch (err) {
            console.error('Payment verification error:', err)
            toast.error(err.response?.data?.message || 'Payment verification failed')
          }
        },
        prefill: {
          name: userData?.name || '',
          email: userData?.email || ''
        },
        theme: {
          color: isDark ? '#18181b' : '#0f172a'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment checkout closed')
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (err) => {
        toast.error(`Payment failed: ${err.error?.description || 'Transaction declined'}`)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment checkout error:', err)
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Handle Razorpay Checkout for AI Token Boost Pack
  const handleBuyTokens = async () => {
    try {
      setIsCheckingOut(true)

      const scriptReady = await loadRazorpayScript()
      if (!scriptReady) {
        toast.error('Unable to load Razorpay SDK. Please check your network connection.')
        return
      }

      toast.info('Initiating token pack checkout...')
      const orderRes = await createPaymentOrder('AI_BOOST_100K')

      if (!orderRes?.success || !orderRes?.orderId) {
        throw new Error(orderRes?.message || 'Failed to initiate order with payment server')
      }

      const options = {
        key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'BHASHA Cloud IDE',
        description: 'AI Boost 100K Tokens (Never Expires)',
        order_id: orderRes.orderId,
        image: 'https://cdn-icons-png.flaticon.com/512/919/919851.png',
        handler: async (response) => {
          try {
            toast.info('Verifying token purchase signature...')
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes?.success) {
              toast.success('🎉 100,000 AI tokens added to your account!')
              setCurrentSubscription(verifyRes.subscription)
            } else {
              toast.error(verifyRes?.message || 'Payment verification failed.')
            }
          } catch (err) {
            console.error('Payment verification error:', err)
            toast.error(err.response?.data?.message || 'Payment verification failed')
          }
        },
        prefill: {
          name: userData?.name || '',
          email: userData?.email || ''
        },
        theme: {
          color: isDark ? '#18181b' : '#0f172a'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment checkout closed')
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (err) => {
        toast.error(`Payment failed: ${err.error?.description || 'Transaction declined'}`)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment checkout error:', err)
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const faqs = [
    {
      q: 'Is this an auto-renewing subscription or a fixed pass?',
      a: 'BHASHA uses upfront fixed-period passes: ₹499 for 30 days of Pro access or ₹4,999 for 365 days. There are NO hidden automatic recurring auto-debits on your card, UPI, or bank account. When your period concludes, you choose if and when to renew manually.'
    },
    {
      q: 'What payment methods does BHASHA support?',
      a: 'We support all major payment methods via Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit and Debit Cards (Visa, MasterCard, RuPay, Maestro), NetBanking from 50+ banks, and leading digital wallets.'
    },
    {
      q: 'What are AI Tokens and do they expire?',
      a: 'AI Tokens power the autonomous LangGraph pair programmer during code generation, tool calls, and refactoring. The AI Boost 100K token pack (₹99) carries zero expiration date—tokens remain in your balance until used, even across different billing cycles.'
    },
    {
      q: 'What happens to my code and projects if my plan expires?',
      a: 'Your code, repositories, and workspace files remain completely safe and untouched. You can still open, edit, run, and export all your projects on the Starter tier.'
    },
    {
      q: 'Is my payment secure?',
      a: 'Yes. All payments are processed through Razorpay using industry-standard 256-bit SSL encryption and PCI-DSS Level 1 compliance. We never store or process your card or banking credentials on our servers.'
    }
  ]

  return (
    <div className={`min-h-screen w-full font-sans flex flex-col justify-between transition-colors duration-200 ${
      isDark
        ? 'bg-[#090a0f] text-neutral-200 selection:bg-neutral-800 selection:text-white'
        : 'bg-[#f5f2eb] text-[#201d1a] selection:bg-amber-100 selection:text-amber-900'
    }`}>
      <div>
        {/* Top Back Action & Theme Toggle */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between">
            <button
            onClick={() => navigate('/home')}
            className={`inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium px-3 sm:px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark
                ? 'text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700 bg-neutral-900/80'
                : 'text-[#201d1a] hover:text-black border-[#d8d0bf] hover:border-[#c8bfae] bg-[#ebe5d8]'
            }`}
          >
            <FiArrowLeft className="text-sm" />
            <span>Back to Dashboard</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                : 'bg-[#ebe5d8] border-[#d8d0bf] text-[#201d1a] hover:text-black hover:border-[#c8bfae]'
            }`}
          >
            {isDark ? <FiMoon className="text-sm" /> : <FiSun className="text-sm text-amber-500" />}
          </motion.button>
        </div>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Active Subscription Alert */}
          {isPro && (
            <div className={`mb-8 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-[#ebe5d8] border-[#d8d0bf] shadow-xs'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <FiCheck className="text-sm stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Pro Plan Active ({currentSubscription?.planId === 'PRO_YEARLY' ? 'Annual Pass' : 'Monthly Pass'})
                    </p>
                    {currentSubscription?.currentPeriodEnd && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        Valid until {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {currentSubscription?.extraTokens > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/30 text-amber-400">
                        {currentSubscription.extraTokens.toLocaleString()} Bonus Tokens
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Your Pro pass is active. Unlimited workspaces, multi-language compiler runner, and autonomous AI pair programming are unlocked.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/home')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                  isDark
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                Go to Workspace
              </button>
            </div>
          )}

          {/* Hero Section */}
          <div ref={heroRef} className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Simple, predictable pricing.
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed max-w-xl mx-auto ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Everything you need to write, execute, and ship full-stack code in the cloud with autonomous AI assistance.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className={`pt-3 inline-flex items-center gap-1 p-1 rounded-xl border transition-colors ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-[#ede7dc] border-[#d8d0bf]'
            }`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? isDark
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'bg-[#ebe5d8] text-[#201d1a] shadow-xs'
                    : isDark
                      ? 'text-neutral-400 hover:text-neutral-200'
                      : 'text-[#5e584f] hover:text-[#201d1a]'
                }`}
              >
                Monthly
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBillingCycle('yearly')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'yearly'
                    ? isDark
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'bg-[#ebe5d8] text-[#201d1a] shadow-xs'
                    : isDark
                      ? 'text-neutral-400 hover:text-neutral-200'
                      : 'text-[#5e584f] hover:text-[#201d1a]'
                }`}
              >
                <span>Yearly</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  Save 17%
                </span>
              </motion.button>
            </div>
          </div>

          {/* 3 Tier Cards Grid */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {/* 1. Starter Tier */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-colors ${
                isDark ? 'bg-[#0e1017] border-neutral-800' : 'bg-[#ebe5d8] border-[#d8d0bf] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm sm:text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#201d1a]'}`}>Starter</h3>
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                    isDark ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-400' : 'bg-[#fbf9f4] border-[#d8d0bf] text-[#3d3830]'
                  }`}>
                    Free
                  </span>
                </div>
                <p className={`text-xs sm:text-[13px] mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  For personal learning and lightweight coding in the browser.
                </p>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹0</span>
                    <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>/ forever</span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>No credit card required</p>
                </div>

                <div className={`border-t pt-5 ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
                  <p className={`text-xs font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Included features
                  </p>
                  <ul className={`space-y-2.5 text-xs sm:text-[13px] ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Monaco editor with multi-language syntax</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Integrated web terminal sandbox</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Up to 5 active workspace projects</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Live client-side web preview</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Community support</span>
                    </li>
                  </ul>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/home')}
                className={`mt-8 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer text-center ${
                  isDark
                    ? 'text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isPro ? 'Included' : 'Current Plan'}
              </motion.button>
            </motion.div>

            {/* 2. Pro Developer Tier (Featured) */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`relative rounded-2xl border-2 p-6 flex flex-col justify-between shadow-xl transition-colors ${
                isDark
                  ? 'bg-[#11141d] border-neutral-600'
                  : 'bg-white border-slate-900 ring-1 ring-slate-900/10'
              }`}
            >
              {/* Top pill badge */}
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold rounded-full border uppercase tracking-wider ${
                isDark
                  ? 'bg-neutral-800 text-neutral-200 border-neutral-600'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}>
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm sm:text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Pro Developer</h3>
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    Autonomous AI
                  </span>
                </div>
                <p className={`text-xs sm:text-[13px] mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  For developers building, executing, and shipping full-stack projects.
                </p>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {billingCycle === 'yearly' ? '₹4,999' : '₹499'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      {billingCycle === 'yearly' ? '/ year' : '/ month'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {billingCycle === 'yearly'
                      ? '365-day access pass · One-time payment · Save 17%'
                      : '30-day access pass · One-time payment · No auto-debit'}
                  </p>
                </div>

                <div className={`border-t pt-5 ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
                  <p className={`text-xs font-medium mb-3 ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                    Everything in Starter, plus:
                  </p>
                  <ul className={`space-y-2.5 text-xs sm:text-[13px] ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Unlimited workspace projects & storage</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span>Autonomous LangGraph AI pair programmer</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span>Multi-file code generation & terminal command execution</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span>Persistent background terminal processes</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span>Dual-engine live code & React preview</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span>Priority microservice compute & zero cold starts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <span>Priority 24/7 developer support</span>
                    </li>
                  </ul>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleUpgrade}
                disabled={isCheckingOut || isPro}
                className={`mt-8 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'text-black bg-white hover:bg-neutral-200'
                    : 'text-white bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                      isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'
                    }`} />
                    <span>Connecting to Razorpay...</span>
                  </span>
                ) : isPro ? (
                  'Current Active Plan'
                ) : (
                  `Upgrade to Pro (${billingCycle === 'yearly' ? '₹4,999/yr' : '₹499/mo'})`
                )}
              </motion.button>
            </motion.div>

            {/* 3. Team & Enterprise Tier */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-colors ${
                isDark ? 'bg-[#0e1017] border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm sm:text-[15px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Team</h3>
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                    isDark ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    Organizations
                  </span>
                </div>
                <p className={`text-xs sm:text-[13px] mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  For engineering teams needing central control, custom models, and SLAs.
                </p>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹2,499</span>
                    <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>/ user / mo</span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>Volume discounts available</p>
                </div>

                <div className={`border-t pt-5 ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
                  <p className={`text-xs font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Everything in Pro, plus:
                  </p>
                  <ul className={`space-y-2.5 text-xs sm:text-[13px] ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Shared team workspaces & real-time collaboration</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Bring Your Own API Key (BYOK) for OpenAI & Claude</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Custom Docker sandboxes & memory limits</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Dedicated isolated compute containers</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>99.9% uptime SLA & dedicated account manager</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FiCheck className={`text-sm mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                      <span>Centralized billing, GST invoices & POs</span>
                    </li>
                  </ul>
                </div>
              </div>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="mailto:support@bhasha.dev?subject=Team%20Plan%20Inquiry"
                className={`mt-8 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer text-center block ${
                  isDark
                    ? 'text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'
                }`}
              >
                Contact Sales
              </motion.a>
            </motion.div>
          </div>

          {/* AI Token Boost Instant Add-on Section */}
          <div className={`mt-8 sm:mt-10 p-4 sm:p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 transition-colors ${
            isDark
              ? 'bg-[#10131c] border-indigo-950/60 shadow-lg'
              : 'bg-indigo-50/50 border-indigo-100 shadow-xs'
          }`}>
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <FiZap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Boost: 100,000 High-Speed Tokens
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-wide">
                    Zero Expiration
                  </span>
                </div>
                <p className={`text-xs mt-1 max-w-xl leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Need extra fuel for the autonomous LangGraph pair programmer? Top up 100,000 tokens instantly for multi-file scaffolding and complex logic. Tokens stay in your account forever until consumed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
              <div className="text-right">
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹99</div>
                <div className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>one-time top-up</div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyTokens}
                disabled={isCheckingOut}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isCheckingOut ? 'Connecting...' : 'Buy Token Pack'}
              </motion.button>
            </div>
          </div>

          {/* Security & Guarantee Strip */}
          <div className={`mt-12 p-6 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-colors ${
            isDark
              ? 'bg-neutral-900/60 border-neutral-800/80'
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <FiShield className="text-base" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Razorpay Secure</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>256-bit encrypted checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <FiZap className="text-base" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Instant Activation</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Pro unlocked immediately</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <FiRefreshCw className="text-base" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cancel Anytime</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>No lock-in or hidden fees</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <FiCreditCard className="text-base" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>UPI & All Cards</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>GPay, PhonePe, Cards, NetBanking</p>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className={`text-base sm:text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Frequently Asked Questions</h2>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                Have questions about billing, plans, or features? Here are answers.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      isDark ? 'bg-neutral-900/60 border-neutral-800/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className={`w-full p-4 text-left flex items-center justify-between gap-4 text-xs font-medium transition-colors cursor-pointer ${
                        isDark ? 'text-white hover:text-neutral-200' : 'text-slate-900 hover:text-slate-700'
                      }`}
                    >
                      <span>{faq.q}</span>
                      <span className={`text-sm font-mono shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className={`px-4 pb-4 text-xs leading-relaxed border-t pt-3 ${
                        isDark
                          ? 'text-neutral-400 border-neutral-800/40'
                          : 'text-slate-600 border-slate-100'
                      }`}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Reusable Footer */}
      <Footer theme={theme} />

      {/* Toast notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  )
}

export default Payment
