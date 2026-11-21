import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast, ToastContainer } from 'react-toastify'
import {
  FiCheck,
  FiShield,
  FiZap,
  FiRefreshCw,
  FiArrowLeft,
  FiHelpCircle,
  FiCreditCard,
  FiUser
} from 'react-icons/fi'
import {
  createPaymentOrder,
  verifyPayment,
  getUserSubscription,
  loadRazorpayScript
} from '../features/payment'

const Payment = () => {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)

  // Billing cycle: 'monthly' | 'yearly'
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

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
  }, [])

  const isPro = currentSubscription?.status === 'active' &&
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
        description: `Pro Developer Subscription (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
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
          color: '#18181b'
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
      q: 'What payment methods does BHASHA support?',
      a: 'We support all major payment methods via Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit and Debit Cards (Visa, MasterCard, RuPay, Maestro), NetBanking from 50+ banks, and leading digital wallets.'
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes, you can cancel your subscription at any time with no questions asked. Your Pro privileges will continue until the end of your paid billing period.'
    },
    {
      q: 'What happens to my code and projects if my plan expires?',
      a: 'Your code, repositories, and workspace files remain completely safe. You will still have free access to open, edit, and export all your projects on the Starter tier.'
    },
    {
      q: 'Is my payment secure?',
      a: 'Yes. All payments are processed through Razorpay using industry-standard 256-bit SSL encryption and PCI-DSS compliance. We never store or process your credit card or banking credentials on our servers.'
    }
  ]

  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-neutral-200 font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-800 bg-[#090a0f]/90 backdrop-blur-md sticky top-0 z-20 px-6 sm:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/home" className="flex items-center gap-2.5 text-white font-semibold tracking-tight hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold font-mono">
              B
            </div>
            <span className="text-sm font-bold tracking-wider">BHASHA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-400">
            <Link to="/home" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-white font-medium">
              Pricing
            </span>
            <a
              href="https://github.com/KRISHNA-0425/BHASHA"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Docs
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 transition-all cursor-pointer"
          >
            <FiArrowLeft className="text-xs" />
            <span>Back to Dashboard</span>
          </button>

          {userData && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-neutral-800 text-xs text-neutral-400">
              <FiUser className="text-neutral-500" />
              <span>{userData.name || userData.email}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Active Subscription Alert */}
        {isPro && (
          <div className="mb-8 p-4 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FiCheck className="text-sm stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Pro Plan Active ({currentSubscription?.planId === 'PRO_YEARLY' ? 'Annual' : 'Monthly'})
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Your subscription is live. All Pro features, unlimited workspaces, and autonomous AI pair programming are unlocked.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium border border-neutral-700 transition-colors"
            >
              Go to Workspace
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Simple, predictable pricing.
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Everything you need to write, execute, and ship full-stack code in the cloud with autonomous AI assistance.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="pt-4 inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Tier Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Starter Tier */}
          <div className="rounded-2xl bg-[#0e1017] border border-neutral-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">Starter</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 text-neutral-400">
                  Free
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                For personal learning and lightweight coding in the browser.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">₹0</span>
                  <span className="text-xs text-neutral-500">/ forever</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">No credit card required</p>
              </div>

              <div className="border-t border-neutral-800 pt-5">
                <p className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider text-[10px]">
                  Included features
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Monaco editor with multi-language syntax</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Integrated web terminal sandbox</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Up to 5 active workspace projects</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Live client-side web preview</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Community support</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-8 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer text-center"
            >
              {isPro ? 'Included' : 'Current Plan'}
            </button>
          </div>

          {/* 2. Pro Developer Tier (Featured) */}
          <div className="relative rounded-2xl bg-[#11141d] border-2 border-neutral-600 p-6 flex flex-col justify-between shadow-xl">
            {/* Top pill badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-neutral-800 text-neutral-200 text-[10px] font-bold rounded-full border border-neutral-600 uppercase tracking-wider">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Pro Developer</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Autonomous AI
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                For developers building, executing, and shipping full-stack projects.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {billingCycle === 'yearly' ? '₹4,999' : '₹499'}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {billingCycle === 'yearly' ? '/ year' : '/ month'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {billingCycle === 'yearly'
                    ? 'Billed annually (equivalent to ₹416/mo · 2 months free)'
                    : 'Billed monthly · cancel anytime'}
                </p>
              </div>

              <div className="border-t border-neutral-800 pt-5">
                <p className="text-xs font-medium text-neutral-300 mb-3 uppercase tracking-wider text-[10px]">
                  Everything in Starter, plus:
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-200">
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span className="font-medium text-white">Unlimited workspace projects & storage</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span>Autonomous LangGraph AI pair programmer</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span>Multi-file code generation & terminal command execution</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span>Persistent background terminal processes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span>Dual-engine live code & React preview</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span>Priority microservice compute & zero cold starts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-emerald-400 text-sm mt-0.5 shrink-0" />
                    <span>Priority 24/7 developer support</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isCheckingOut || isPro}
              className="mt-8 w-full py-3 px-4 rounded-xl text-xs font-semibold text-black bg-white hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer shadow-md text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Connecting to Razorpay...</span>
                </span>
              ) : isPro ? (
                'Current Active Plan'
              ) : (
                `Upgrade to Pro (${billingCycle === 'yearly' ? '₹4,999/yr' : '₹499/mo'})`
              )}
            </button>
          </div>

          {/* 3. Team & Enterprise Tier */}
          <div className="rounded-2xl bg-[#0e1017] border border-neutral-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">Team</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 text-neutral-400">
                  Organizations
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                For engineering teams needing central control, custom models, and SLAs.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">₹2,499</span>
                  <span className="text-xs text-neutral-500">/ user / mo</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Volume discounts available</p>
              </div>

              <div className="border-t border-neutral-800 pt-5">
                <p className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider text-[10px]">
                  Everything in Pro, plus:
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Shared team workspaces & real-time collaboration</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Bring Your Own API Key (BYOK) for OpenAI & Claude</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Custom Docker sandboxes & memory limits</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Dedicated isolated compute containers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>99.9% uptime SLA & dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FiCheck className="text-neutral-400 text-sm mt-0.5 shrink-0" />
                    <span>Centralized billing, GST invoices & POs</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href="mailto:support@bhasha.dev?subject=Team%20Plan%20Inquiry"
              className="mt-8 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer text-center block"
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* Security & Guarantee Strip */}
        <div className="mt-12 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700/60">
              <FiShield className="text-base" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Razorpay Secure</p>
              <p className="text-[11px] text-neutral-400">256-bit encrypted checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700/60">
              <FiZap className="text-base" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Instant Activation</p>
              <p className="text-[11px] text-neutral-400">Pro unlocked immediately</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700/60">
              <FiRefreshCw className="text-base" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Cancel Anytime</p>
              <p className="text-[11px] text-neutral-400">No lock-in or hidden fees</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700/60">
              <FiCreditCard className="text-base" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">UPI & All Cards</p>
              <p className="text-[11px] text-neutral-400">GPay, PhonePe, Cards, NetBanking</p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Have questions about billing, plans, or features? Here are answers.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-neutral-900/60 border border-neutral-800/80 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 text-xs font-medium text-white hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-neutral-400 text-sm font-mono shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full border-t border-neutral-800 bg-[#090a0f] px-6 sm:px-10 py-6 mt-16 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>© 2026 BHASHA Cloud IDE. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-[11px] text-neutral-400">
          <Link to="/home" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <a
            href="https://github.com/KRISHNA-0425/BHASHA"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <span>Payments powered by Razorpay</span>
        </div>
      </footer>

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
        theme="dark"
      />
    </div>
  )
}

export default Payment
