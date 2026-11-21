import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, ToastContainer } from 'react-toastify'
import {
  FiShield,
  FiLock,
  FiCheck,
  FiZap,
  FiCpu,
  FiServer,
  FiCreditCard,
  FiActivity,
  FiArrowRight,
  FiRefreshCw,
  FiPlus,
  FiMinus,
  FiKey
} from 'react-icons/fi'
import {
  VscSparkle,
  VscTerminal,
  VscFlame,
  VscVerified,
  VscCheck,
  VscGlobe
} from 'react-icons/vsc'
import {
  getPlans,
  createPaymentOrder,
  verifyPayment,
  getUserSubscription,
  loadRazorpayScript
} from '../features/payment'

const Payment = () => {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)

  // Billing & Tier Selection States
  const [billingCycle, setBillingCycle] = useState('yearly') // 'monthly' | 'yearly'
  const [selectedTier, setSelectedTier] = useState('PRO') // 'STARTER' | 'PRO' | 'CLUSTER'
  const [currency, setCurrency] = useState('USD') // 'USD' | 'INR'

  // Compute Add-ons States
  const [tokenQuantity, setTokenQuantity] = useState(1) // 1M tokens multiplier
  const [isSgxEnclaveEnabled, setIsSgxEnclaveEnabled] = useState(true)

  // Settlement Rail Tab
  const [settlementRail, setSettlementRail] = useState('razorpay') // 'razorpay' | 'card' | 'crypto'

  // Mock card inputs
  const [cardNumber, setCardNumber] = useState('4829 9012 3456 7810')
  const [cardExpiry, setCardExpiry] = useState('09/28')
  const [cardCvc, setCardCvc] = useState('884')
  const [postalCode, setPostalCode] = useState('94107 - US (California)')

  // Loading & Data States
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

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

  // User DID generator
  const userDid = useMemo(() => {
    if (!userData?._id && !userData?.id) return 'node::did:bhasha:70a2'
    const id = String(userData._id || userData.id).slice(-4)
    return `node::did:bhasha:${id}`
  }, [userData])

  const userName = userData?.name || 'Developer'

  // Currency multiplier (1 USD ≈ 83 INR for reference display)
  const fxRate = 83

  // Base pricing matrix
  const pricingData = useMemo(() => {
    if (billingCycle === 'yearly') {
      return {
        starter: { monthly: 0, total: 0 },
        pro: { monthly: 24, total: 288 },
        cluster: { monthly: 199, total: 2388 },
        tokens: 10 * tokenQuantity,
        sgx: isSgxEnclaveEnabled ? 15 : 0
      }
    }
    return {
      starter: { monthly: 0, total: 0 },
      pro: { monthly: 29, total: 29 },
      cluster: { monthly: 249, total: 249 },
      tokens: 10 * tokenQuantity,
      sgx: isSgxEnclaveEnabled ? 15 : 0
    }
  }, [billingCycle, tokenQuantity, isSgxEnclaveEnabled])

  // Total calculation
  const totalAmount = useMemo(() => {
    if (selectedTier === 'STARTER') return 0
    const basePlanTotal = selectedTier === 'PRO' ? pricingData.pro.total : pricingData.cluster.total
    const addOns = (pricingData.tokens || 0) + (pricingData.sgx || 0)
    return basePlanTotal + addOns
  }, [selectedTier, pricingData])

  const formatPrice = (usdAmount) => {
    if (currency === 'INR') {
      const inr = Math.round(usdAmount * fxRate)
      return `₹${inr.toLocaleString('en-IN')}`
    }
    return `$${usdAmount.toFixed(2)}`
  }

  // Handle Checkout / Razorpay Integration
  const handleUpgrade = async () => {
    if (selectedTier === 'STARTER') {
      toast.info('Starter node tier is already active on your account.')
      return
    }

    try {
      setIsCheckingOut(true)

      // 1. Load Razorpay script dynamically
      const scriptReady = await loadRazorpayScript()
      if (!scriptReady) {
        toast.error('Razorpay SDK failed to load. Please verify your network connection.')
        return
      }

      // 2. Select backend plan ID (PRO_YEARLY or PRO_MONTHLY)
      const targetPlanId = billingCycle === 'yearly' ? 'PRO_YEARLY' : 'PRO_MONTHLY'

      // 3. Request server to create Razorpay Order
      toast.info('Generating cryptographic payment enclave order...')
      const orderRes = await createPaymentOrder(targetPlanId)

      if (!orderRes?.success || !orderRes?.orderId) {
        throw new Error(orderRes?.message || 'Failed to initiate secure order')
      }

      // 4. Configure Razorpay modal
      const options = {
        key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'BHASHA AI-IDE',
        description: `${selectedTier === 'PRO' ? 'Pro Developer Accelerator' : 'Autonomous Cluster'} (${billingCycle})`,
        order_id: orderRes.orderId,
        image: 'https://cdn-icons-png.flaticon.com/512/919/919851.png',
        handler: async (response) => {
          try {
            toast.info('Verifying HMAC SHA-256 enclave signature...')
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes?.success) {
              toast.success('🎉 Enclave activated! Pro Developer Accelerator is live.')
              setCurrentSubscription(verifyRes.subscription)
            } else {
              toast.error(verifyRes?.message || 'Signature verification failed.')
            }
          } catch (err) {
            console.error('Verification error:', err)
            toast.error(err.response?.data?.message || 'Signature verification failed')
          }
        },
        prefill: {
          name: userData?.name || 'Developer',
          email: userData?.email || '',
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

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.25) 50%, transparent 85%)'
        }}
      />

      {/* TOP HEADER */}
      <header className="relative z-10 w-full border-b border-white/[0.07] bg-[#07090e]/90 backdrop-blur-xl px-6 lg:px-12 py-3.5 flex items-center justify-between">
        {/* Left Logo & Cluster Pill */}
        <div className="flex items-center gap-4">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#07090e] rounded-[6px] flex items-center justify-center">
                <FiCpu className="text-cyan-400 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-wider text-white">BHASHA</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
                ID
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>cluster-01.ord // active</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
          <Link to="/home" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/home" className="hover:text-white transition-colors">
            IDE Workspace
          </Link>
          <Link
            to="/payment"
            className="text-white font-semibold flex items-center gap-1 border-b-2 border-indigo-500 pb-0.5"
          >
            Plans & Checkout
          </Link>
          <a
            href="https://github.com/KRISHNA-0425/BHASHA"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Docs
          </a>
        </nav>

        {/* Right User Tag & Currency Toggle */}
        <div className="flex items-center gap-4">
          {/* Currency Toggle */}
          <div className="flex items-center bg-white/[0.05] p-0.5 rounded-lg border border-white/[0.08] text-[11px] font-mono">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                currency === 'USD' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                currency === 'INR' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              INR (₹)
            </button>
          </div>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">{userName}</div>
              <div className="text-[10px] font-mono text-slate-500">{userDid}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* HERO TITLE SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/[0.06]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>QUOTA POOL // CLUSTER ORBITAL-04 // SPEC v2.4.9</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Choose Your Compute & Neural Tier
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              Scale your AI-assisted browser workspace with dedicated hardware TEE enclaves, zero-knowledge
              attestation, and unlimited neural credits.
            </p>
          </div>

          {/* Monthly / Yearly Segmented Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/10 shadow-lg shrink-0">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                Save 20% + 2 Mo Free
              </span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN GRID (COMPUTE TIERS & CHECKOUT ENCLAVE) */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: TIERS + SPECS + ADDONS (7 COLS ON LARGE) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* THREE CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. STARTER PLAN */}
              <div
                onClick={() => setSelectedTier('STARTER')}
                className={`relative flex flex-col justify-between p-5 rounded-2xl transition-all cursor-pointer border ${
                  selectedTier === 'STARTER'
                    ? 'bg-slate-900/80 border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                    : 'bg-[#0b0f17]/90 border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                    <span>NODE // 01</span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 text-[10px] border border-white/[0.06]">
                      Active Plan
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">Starter</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Free Local Node</p>

                  <div className="my-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">{formatPrice(0)}</span>
                      <span className="text-xs text-slate-500">/ mo</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">Forever non-metered</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 my-4">
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>50K Neural context tokens/mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>Shared community cluster node</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>Browser-native local storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>Community Discord attestation</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-6 w-full py-2.5 text-xs font-mono font-medium rounded-xl bg-white/[0.04] text-slate-500 border border-white/[0.06] text-center"
                >
                  Current Session
                </button>
              </div>

              {/* 2. PRO DEVELOPER (RECOMMENDED ACCELERATOR) */}
              <div
                onClick={() => setSelectedTier('PRO')}
                className={`relative flex flex-col justify-between p-5 rounded-2xl transition-all cursor-pointer border-2 ${
                  selectedTier === 'PRO'
                    ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-[#0b0f17] border-indigo-500 shadow-2xl shadow-indigo-950/50 scale-[1.02]'
                    : 'bg-[#0b0f17]/90 border-indigo-500/40 hover:border-indigo-500/70'
                }`}
              >
                {/* Floating Top Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
                  <VscSparkle className="text-amber-300 text-xs" />
                  <span>RECOMMENDED ACCELERATOR</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 mb-2 mt-1">
                    <span>NODE // PRO-02</span>
                    <div className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/50 flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <span>Pro Developer</span>
                  </h3>
                  <p className="text-xs text-indigo-300/80 mt-0.5">Autonomous Agent Accelerator</p>

                  <div className="my-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        {formatPrice(billingCycle === 'yearly' ? 24 : 29)}
                      </span>
                      <span className="text-xs text-slate-400">/ mo</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {billingCycle === 'yearly' ? `Billed annually (${formatPrice(288)}/yr)` : 'Billed monthly'}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-200 my-4">
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-indigo-400 text-sm shrink-0" />
                      <span className="font-medium">2.5M Neural context tokens/mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-indigo-400 text-sm shrink-0" />
                      <span>Dedicated TPM/TEE hardware enclave</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-indigo-400 text-sm shrink-0" />
                      <span>WebRTC zero-latency data stream</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-indigo-400 text-sm shrink-0" />
                      <span>Claude 3.7 Sonnet Hybrid & GPT-4o</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-indigo-400 text-sm shrink-0" />
                      <span>Unlimited project repositories</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    selectedTier === 'PRO'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                  }`}
                >
                  {selectedTier === 'PRO' ? 'Active Selection' : 'Select Accelerator'}
                </button>
              </div>

              {/* 3. AUTONOMOUS CLUSTER */}
              <div
                onClick={() => setSelectedTier('CLUSTER')}
                className={`relative flex flex-col justify-between p-5 rounded-2xl transition-all cursor-pointer border ${
                  selectedTier === 'CLUSTER'
                    ? 'bg-slate-900/80 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                    : 'bg-[#0b0f17]/90 border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                    <span>NODE // HIGH-SPEC</span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 text-[10px] border border-white/[0.06]">
                      High Concurrency
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">Autonomous Cluster</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Custom Sovereign Cloud</p>

                  <div className="my-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        {formatPrice(billingCycle === 'yearly' ? 199 : 249)}
                      </span>
                      <span className="text-xs text-slate-500">/ mo</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {billingCycle === 'yearly' ? `Billed annually (${formatPrice(2388)}/yr)` : 'Billed monthly'}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 my-4">
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>Dedicated multi-region enclave cluster</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>Custom fine-tuned weights hosting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>SOC2 & ZKP attestation compliance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <VscCheck className="text-emerald-400 text-sm shrink-0" />
                      <span>99.99% Hardware Enclave SLA</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 text-xs font-mono font-medium rounded-xl border transition-all ${
                    selectedTier === 'CLUSTER'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-slate-400 border-white/[0.08] hover:text-white hover:border-white/20'
                  }`}
                >
                  Select Cluster
                </button>
              </div>
            </div>

            {/* TEE HARDWARE SPECIFICATION BAR */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FiCpu className="text-base" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">TEE Hardware Specification</div>
                  <div className="text-[11px] text-slate-400">
                    AMD SEV-SNP & Intel SGX enclave verification with zero memory leakage.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>ZKP ATTESTED</span>
              </div>
            </div>

            {/* COMPUTE ADD-ONS & NEURAL SCALING SECTION */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Compute Add-ons & Neural Scaling</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamically allocate additional capacity to your browser execution enclave without service
                  interruption.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add-on 1: Additional Neural Tokens */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiZap className="text-amber-400 text-sm" />
                        <span className="text-xs font-bold text-white">Additional Neural Tokens</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        +{formatPrice(10)} / 1M tokens
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Shared across autonomous agent background workers and code generation subroutines.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.05]">
                    <span className="text-xs text-slate-400">Quantity:</span>
                    <div className="flex items-center gap-2 bg-[#07090e] p-1 rounded-lg border border-white/10">
                      <button
                        onClick={() => setTokenQuantity((q) => Math.max(0, q - 1))}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <FiMinus className="text-xs" />
                      </button>
                      <span className="w-10 text-center font-mono text-xs font-bold text-white">
                        {tokenQuantity}M
                      </span>
                      <button
                        onClick={() => setTokenQuantity((q) => q + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <FiPlus className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add-on 2: Dedicated SGX Enclave */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiServer className="text-cyan-400 text-sm" />
                        <span className="text-xs font-bold text-white">Dedicated SGX Enclave</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        +{formatPrice(15)} / mo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Isolates your compilation sandbox from multi-tenant shared memory pools.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.05]">
                    <span className="text-xs text-slate-400">TEE State:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSgxEnclaveEnabled}
                        onChange={(e) => setIsSgxEnclaveEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          isSgxEnclaveEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            isSgxEnclaveEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-300">
                        {isSgxEnclaveEnabled ? 'Provisional' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* CRYPTOGRAPHIC & RUNTIME ENCLAVE SPECS (3 CARDS) */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Cryptographic & Runtime Enclave Specs</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Spec 1 */}
                <div className="p-4 rounded-xl bg-[#0b0f17] border border-white/[0.06] space-y-2">
                  <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                    ATTESTATION PROTOCOL
                  </div>
                  <div className="text-sm font-bold text-white font-mono">ed25519 ZK-STARK</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Every code mutation in the IDE is verifiable on-chain via succinct non-interactive arguments.
                  </p>
                </div>

                {/* Spec 2 */}
                <div className="p-4 rounded-xl bg-[#0b0f17] border border-white/[0.06] space-y-2">
                  <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                    LATENCY BUDGET
                  </div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">&lt; 4.2ms WebRTC</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Direct P2P socket connection from your browser tab to your provisioned hardware cluster.
                  </p>
                </div>

                {/* Spec 3 */}
                <div className="p-4 rounded-xl bg-[#0b0f17] border border-white/[0.06] space-y-2">
                  <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                    CREDENTIAL INTEGRITY
                  </div>
                  <div className="text-sm font-bold text-white font-mono">W3C DID v1.1</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Autonomous agent handles carry sovereign portable identity keys across workspaces.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ENCLAVE CHECKOUT PANEL (5 COLS ON LARGE) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
            <div className="rounded-2xl bg-[#0b0f17] border border-white/10 p-6 shadow-2xl shadow-black/80 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <FiLock className="text-indigo-400 text-sm" />
                  <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                    ENCLAVE CHECKOUT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">SESSION ::e831f</span>
              </div>

              {/* Line Items */}
              <div className="space-y-3.5 text-xs">
                {/* Primary Plan Line */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      {selectedTier === 'STARTER'
                        ? 'Starter Local Node'
                        : selectedTier === 'PRO'
                        ? `Pro Developer (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`
                        : `Autonomous Cluster (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedTier === 'STARTER'
                        ? 'Community tier local storage'
                        : 'Includes 2.5M neural context tokens & high-speed sandbox'}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white shrink-0 ml-3">
                    {selectedTier === 'STARTER'
                      ? formatPrice(0)
                      : selectedTier === 'PRO'
                      ? formatPrice(pricingData.pro.total)
                      : formatPrice(pricingData.cluster.total)}
                  </div>
                </div>

                {/* Surcharge Line */}
                {isSgxEnclaveEnabled && selectedTier !== 'STARTER' && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Hardware Enclave Surcharge</span>
                    <span className="font-mono text-slate-300">+{formatPrice(15)} / mo</span>
                  </div>
                )}

                {/* Neural Pool Line */}
                {tokenQuantity > 0 && selectedTier !== 'STARTER' && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Additional Neural Pool ({tokenQuantity}M)</span>
                    <span className="font-mono text-slate-300">+{formatPrice(10 * tokenQuantity)}</span>
                  </div>
                )}

                {/* Waived Line */}
                <div className="flex items-center justify-between text-slate-400">
                  <span>Cryptographic ZKP Anchor Fee</span>
                  <span className="font-mono text-emerald-400 font-medium">Waived</span>
                </div>

                {/* Included Line */}
                <div className="flex items-center justify-between text-slate-400">
                  <span>Multi-Region Failover</span>
                  <span className="font-mono text-slate-300">Included</span>
                </div>
              </div>

              {/* Total Due Today */}
              <div className="pt-4 border-t border-white/[0.08] flex items-baseline justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Total Due Today:</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Applicable local taxes computed at settlement.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {formatPrice(totalAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                    14-Day Guarantee
                  </div>
                </div>
              </div>

              {/* Settlement Rail Tabs */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider block">
                  SELECT SETTLEMENT RAIL
                </span>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-white/[0.06]">
                  <button
                    onClick={() => setSettlementRail('razorpay')}
                    className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      settlementRail === 'razorpay'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FiCreditCard className="text-xs" />
                    <span>UPI / Razorpay</span>
                  </button>
                  <button
                    onClick={() => setSettlementRail('card')}
                    className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      settlementRail === 'card'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FiCreditCard className="text-xs" />
                    <span>Card / Stripe</span>
                  </button>
                  <button
                    onClick={() => setSettlementRail('crypto')}
                    className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      settlementRail === 'crypto'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FiKey className="text-xs" />
                    <span>Crypto DID</span>
                  </button>
                </div>
              </div>

              {/* Settlement Form Fields */}
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                    <span>{settlementRail === 'razorpay' ? 'Instant UPI / Card Payment' : 'Card Details'}</span>
                    <span className="text-[10px] text-slate-500">
                      {settlementRail === 'razorpay' ? 'GPay · PhonePe · Cards · NetBanking' : 'Visa · Mastercard · Amex'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly={settlementRail === 'razorpay'}
                      value={settlementRail === 'razorpay' ? 'Auto-routed via Razorpay Gateway' : cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs font-mono outline-none focus:border-indigo-500"
                    />
                    <FiLock className="absolute right-3.5 top-3 text-slate-500 text-xs" />
                  </div>
                </div>

                {settlementRail === 'card' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="CVC"
                        className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-slate-300 text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Big CTA Action Button */}
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isCheckingOut || selectedTier === 'STARTER'}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold tracking-wide text-white uppercase bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 active:scale-[0.99] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Provisioning Hardware Enclave...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedTier === 'STARTER'
                        ? 'Current Session Active'
                        : `UPGRADE TO ${selectedTier === 'PRO' ? 'PRO ACCELERATOR' : 'SOVEREIGN CLUSTER'} →`}
                    </span>
                  </>
                )}
              </button>

              {/* Security Footnote */}
              <div className="pt-2 text-center space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                  <FiShield className="text-indigo-400 text-xs" />
                  <span>256-Bit Hardware Enclave Vault & Razorpay PCI Zero-Retention</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  ● 4ms Active Pipeline &nbsp; ● 14-Day Money Back &nbsp; ● No Lock-in
                </div>
              </div>

              {/* Node Agent Provisioning Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.05] flex items-start gap-2.5 text-[11px] text-slate-400 font-mono">
                <VscTerminal className="text-indigo-400 text-sm shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-medium block">Auto-provisioning node agent</span>
                  <span>Enclave signature ed25519 will bind to DID on successful auth.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full border-t border-white/[0.07] bg-[#07090e] px-6 lg:px-12 py-6 mt-16 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Zero-Knowledge Note */}
        <div className="flex items-center gap-2">
          <FiLock className="text-slate-400" />
          <span>
            <strong className="text-slate-300">Zero-Knowledge State Verification:</strong> Cryptographically
            settled via ed25519 signatures. Enclave runtime secured.
          </span>
        </div>

        {/* Center Pill */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>TLS 1.3 // 256-BIT ENCRYPTION</span>
          <span>|</span>
          <span>PCI-DSS COMPLIANT</span>
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-5 text-[11px]">
          <a href="#security" className="hover:text-slate-300 transition-colors">
            Security Protocol
          </a>
          <a href="#subprocessors" className="hover:text-slate-300 transition-colors">
            Sub-processors
          </a>
          <span>© 2026 BHASHA ID Engine</span>
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
