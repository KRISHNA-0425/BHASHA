import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  VscCheck,
  VscClose,
  VscSparkle,
  VscShield,
  VscFlame
} from 'react-icons/vsc'
import { FiZap } from 'react-icons/fi'
import {
  getPlans,
  createPaymentOrder,
  verifyPayment,
  getUserSubscription,
  loadRazorpayScript
} from '../../features/payment'

const PricingModal = ({ isOpen, onClose, user, onSubscriptionUpdated }) => {
  const [plans, setPlans] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [processingPlanId, setProcessingPlanId] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'

  useEffect(() => {
    if (isOpen) {
      fetchPlansAndSubscription()
    }
  }, [isOpen])

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true)
      const [plansRes, subRes] = await Promise.all([
        getPlans().catch(() => ({ plans: [] })),
        getUserSubscription().catch(() => ({ subscription: null }))
      ])
      if (plansRes?.plans) setPlans(plansRes.plans)
      if (subRes?.subscription) setCurrentSubscription(subRes.subscription)
    } catch (err) {
      console.error('Failed to load pricing info:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan) => {
    if (plan.price === 0) {
      toast.info('You are already on the Starter plan')
      return
    }

    if (currentSubscription?.planId === plan.id && currentSubscription?.status === 'ACTIVE') {
      toast.info(`You are currently subscribed to ${plan.name}`)
      return
    }

    try {
      setProcessingPlanId(plan.id)

      // 1. Load Razorpay SDK
      const isSdkLoaded = await loadRazorpayScript()
      if (!isSdkLoaded) {
        toast.error('Unable to connect to Razorpay checkout. Please check internet connection.')
        return
      }

      // 2. Request server to create Razorpay Order
      const orderData = await createPaymentOrder(plan.id)
      if (!orderData?.success || !orderData?.orderId) {
        throw new Error(orderData?.message || 'Failed to initialize payment order')
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BHASHA AI-IDE',
        description: `Upgrade to ${plan.name}`,
        order_id: orderData.orderId,
        image: 'https://cdn-icons-png.flaticon.com/512/919/919851.png',
        handler: async (response) => {
          try {
            toast.info('Verifying payment cryptographically...')
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes?.success) {
              toast.success(plan.tokens ? '🎉 100,000 AI tokens added to your balance!' : '🎉 Payment verified! Your Pro pass is now active.')
              if (onSubscriptionUpdated) {
                onSubscriptionUpdated(verifyRes.subscription)
              }
              onClose()
            } else {
              toast.error(verifyRes?.message || 'Payment signature verification failed.')
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr)
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed.')
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment checkout dismissed')
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (failedRes) => {
        toast.error(`Payment failed: ${failedRes.error?.description || 'Transaction declined'}`)
      })
      rzp.open()
    } catch (err) {
      console.error('Order creation error:', err)
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed')
    } finally {
      setProcessingPlanId(null)
    }
  }

  if (!isOpen) return null

  // Group plans
  const starterPlan = plans.find((p) => p.id === 'FREE') || {
    id: 'FREE',
    name: 'Starter',
    priceInRupees: 0,
    features: ['Monaco Code Editor', 'Terminal PTY Session', '5 Projects Workspace', 'Community Support']
  }

  const proMonthly = plans.find((p) => p.id === 'PRO_MONTHLY') || {
    id: 'PRO_MONTHLY',
    name: 'Pro Monthly',
    priceInRupees: 499,
    features: [
      'Everything in Starter',
      'Unlimited Projects & Cloud Storage',
      'Autonomous LangGraph AI Pair Programmer',
      'Multi-Language Code Runner (C++, C, Python, Java)',
      'Dual-Engine React & HTML Live Preview',
      'High-Speed Microservice Priority'
    ]
  }

  const proYearly = plans.find((p) => p.id === 'PRO_YEARLY') || {
    id: 'PRO_YEARLY',
    name: 'Pro Yearly',
    priceInRupees: 4999,
    features: [
      'Everything in Pro Monthly',
      '2 Months Free Equivalent Discount',
      'Priority 24/7 Support',
      'VIP Cloud Compute Allocation',
      'Early Access to New Runtimes'
    ]
  }

  const tokenBoost = plans.find((p) => p.id === 'AI_BOOST_100K') || {
    id: 'AI_BOOST_100K',
    name: 'AI Boost 100K',
    priceInRupees: 99,
    features: ['100,000 Extra AI Tokens', 'Never Expires', 'Stackable With Any Plan']
  }

  const selectedProPlan = billingCycle === 'monthly' ? proMonthly : proYearly

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 text-slate-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <VscClose className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 pt-2 sm:pt-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-medium tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <VscSparkle className="w-4 h-4" />
              <span>Unlock Full Cloud IDE Potential</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Supercharge your pair programming workflow with unlimited AI pair programmer iterations, multi-language compiler runtimes, and cloud workspaces.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-4 sm:mt-6 inline-flex flex-wrap sm:flex-nowrap items-center justify-center p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-full gap-1 sm:gap-0">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30-Day Pass
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>365-Day Pass</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 font-bold rounded-full">
                  Save ~17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Starter Plan */}
            <div className="relative flex flex-col p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{starterPlan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Essential tools for individual developers</p>
                </div>
                {(!currentSubscription || currentSubscription.planId === 'FREE') && (
                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                    Active Plan
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-xs text-slate-400">/ forever free</span>
              </div>

              <ul className="space-y-3 my-6 flex-1 text-xs text-slate-300">
                {starterPlan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <VscCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-400 cursor-not-allowed text-center"
              >
                Current Included Tier
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="relative flex flex-col p-4 sm:p-6 rounded-2xl bg-[#0f1422] border-2 border-slate-700 shadow-xl shadow-black/40">
              {/* Top Badge */}
              <div className="absolute -top-3 right-6 px-3 py-0.5 bg-slate-800 text-slate-200 border border-slate-600 text-[10px] font-bold rounded-full shadow flex items-center gap-1 uppercase tracking-wider">
                <VscFlame className="w-3.5 h-3.5 text-amber-400" />
                <span>MOST POPULAR</span>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedProPlan.name}</span>
                    <FiZap className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">For serious developers & high-velocity builders</p>
                </div>
                {currentSubscription?.planId === selectedProPlan.id && currentSubscription?.status?.toUpperCase() === 'ACTIVE' && (
                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    Active Pass
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 my-4 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  ₹{selectedProPlan.priceInRupees.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400">
                  /{billingCycle === 'monthly' ? '30 days' : '365 days'}
                </span>
                {billingCycle === 'yearly' && (
                  <span className="text-[11px] text-emerald-400 font-medium ml-1 sm:ml-2">
                    (₹{Math.round(selectedProPlan.priceInRupees / 12)}/mo · Save 17%)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 -mt-2 mb-4">
                One-time upfront payment · No surprise recurring auto-debits
              </p>

              <ul className="space-y-3 my-6 flex-1 text-xs text-slate-200">
                {selectedProPlan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <VscCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-medium">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(selectedProPlan)}
                disabled={processingPlanId === selectedProPlan.id}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {processingPlanId === selectedProPlan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Opening Razorpay Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <VscShield className="w-4 h-4" />
                    <span>Upgrade to {selectedProPlan.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Add-on Token Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <VscSparkle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{tokenBoost.name}</span>
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold rounded-full">
                    Instant Add-On
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Top up your workspace with 100,000 high-speed AI code-generation tokens that never expire.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectPlan(tokenBoost)}
              disabled={processingPlanId === tokenBoost.id}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex-shrink-0 cursor-pointer"
            >
              {processingPlanId === tokenBoost.id ? 'Connecting...' : `Buy for ₹${tokenBoost.priceInRupees}`}
            </button>
          </div>

          {/* Trust Footnote */}
          <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <VscShield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bank-grade 256-bit encryption via Razorpay. UPI, NetBanking, Cards & Wallets accepted.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PricingModal
