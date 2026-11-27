import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiShield,
  FiLock,
  FiFileText,
  FiCheckCircle,
  FiEyeOff,
  FiServer,
  FiCreditCard,
  FiTrash2,
  FiMail
} from 'react-icons/fi'
import Footer from '../components/Footer.jsx'

const PrivacyPolicy = () => {
  const navigate = useNavigate()

  const sections = [
    {
      id: 'overview',
      title: '1. Overview & Commitment',
      icon: FiShield,
      content: [
        'BHASHA ("we", "our", or "us") provides a browser-based cloud integrated development environment (IDE) with AI-assisted software development, terminal execution, and real-time preview tools.',
        'We believe developer privacy and code confidentiality are foundational rights. This Privacy Policy details the exact data we collect, why we collect it, how it is secured, and your rights over your data.'
      ]
    },
    {
      id: 'code-privacy',
      title: '2. Code Privacy & Intellectual Property (No Model Training)',
      icon: FiEyeOff,
      highlight: true,
      content: [
        'Your code and intellectual property belong entirely to you.',
        'We do NOT use your private repository code, workspace files, or terminal session logs to train public artificial intelligence models without your explicit written authorization.',
        'When you use our AI features (such as autonomous code edits or terminal command generation), code snippets relevant to your prompt are transmitted via encrypted channels to our isolated AI microservice strictly to fulfill the immediate request in memory.'
      ]
    },
    {
      id: 'information-collected',
      title: '3. Information We Collect',
      icon: FiFileText,
      content: [
        'Account Data: When you register or log in, we collect your name, email address, and authentication credentials through encrypted protocols (including OAuth providers like Google or GitHub).',
        'Workspace & Project Data: To enable cloud editing, we persist your project file trees, document contents, and project settings in encrypted databases.',
        'Terminal & Execution Metrics: We record active socket session IDs and error logs strictly for container maintenance, crash debugging, and rate-limiting enforcement.',
        'Payment Information: All financial transactions are handled directly by Razorpay, a certified PCI-DSS Level 1 compliant payment processor. We store order IDs, payment IDs, and subscription validity periods, but NEVER store raw credit card numbers or CVVs on our servers.'
      ]
    },
    {
      id: 'security-measures',
      title: '4. Data Security & Storage',
      icon: FiLock,
      content: [
        'End-to-End Transport Security: All data in transit between your browser, our API Gateway, and downstream microservices is encrypted using TLS 1.3.',
        'Encryption at Rest: Sensitive database records and persistent workspace volumes are encrypted using industry-standard AES-256.',
        'Isolated Runtimes: Virtual terminal sandboxes run in resource-constrained, isolated environments to prevent cross-tenant data leakage.',
        'Timing-Safe Verification: Payment webhooks and signature callbacks employ constant-time cryptographic verification (HMAC SHA-256) to eliminate timing attack vectors.'
      ]
    },
    {
      id: 'subprocessors',
      title: '5. Third-Party Sub-processors',
      icon: FiServer,
      content: [
        'Razorpay: Secure payment processing, UPI settlement, and subscription recurring billing.',
        'Firebase / Google Identity: User authentication, JWT issuance, and secure token refresh.',
        'MongoDB Atlas: Cloud database hosting with SOC 2 compliance and encrypted persistence.',
        'Redis: In-memory transient caching, socket channel distribution, and rate-limiting.'
      ]
    },
    {
      id: 'user-rights',
      title: '6. User Rights & Data Deletion',
      icon: FiTrash2,
      content: [
        'Export Data: You have full control to download your source files, projects, and code at any time from the dashboard.',
        'Project Deletion: When you delete a project, its files and directory tree are permanently purged from our database and disk storage.',
        'Account Erasure: You may request complete erasure of your account, profile, and associated records by contacting our data protection team.'
      ]
    },
    {
      id: 'contact',
      title: '7. Contact & Data Protection',
      icon: FiMail,
      content: [
        'If you have any questions or concerns regarding this Privacy Policy or our security practices, please contact our team:',
        'Email: privacy@bhasha.dev',
        'Physical address inquiries and legal notices can be submitted via the contact information published in our official GitHub repository.'
      ]
    }
  ]

  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-neutral-200 font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-800 bg-[#090a0f]/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between">
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
            <Link to="/payment" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <span className="text-white font-medium">
              Privacy
            </span>
          </nav>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 transition-all cursor-pointer"
        >
          <FiArrowLeft className="text-xs" />
          <span>Go Back</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto space-y-3 pb-10 border-b border-neutral-800"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-300">
            <FiShield className="text-emerald-400 text-xs" />
            <span>Developer First Privacy Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Last Updated: November 2026 · Effective Immediately
          </p>
        </motion.div>

        {/* Quick Summary Pill Highlights */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0e1017] border border-neutral-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 shrink-0">
              <FiEyeOff className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Zero Model Training</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Your private code is never used to train public AI models.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1017] border border-neutral-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 shrink-0">
              <FiLock className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">256-Bit Encryption</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">TLS 1.3 transport security & AES-256 storage protection.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1017] border border-neutral-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 shrink-0">
              <FiCreditCard className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">PCI-DSS Payments</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">All transactions processed securely via Razorpay.</p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="mt-12 space-y-8">
          {sections.map((section, idx) => {
            const Icon = section.icon
            return (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                className={`p-6 rounded-2xl border transition-colors ${
                  section.highlight
                    ? 'bg-[#11141d] border-neutral-700 shadow-md'
                    : 'bg-[#0e1017] border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg border ${
                    section.highlight
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}>
                    <Icon className="text-sm" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {section.content.map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.section>
            )
          })}
        </div>

        {/* Bottom Acknowledgment Card */}
        <div className="mt-12 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-xs font-semibold text-white">Have a specific data or security question?</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Our engineering and security teams are happy to review your queries.</p>
          </div>
          <a
            href="mailto:privacy@bhasha.dev"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-colors whitespace-nowrap"
          >
            Contact Privacy Team
          </a>
        </div>
      </main>

      {/* Reusable Footer */}
      <Footer theme="dark" />
    </div>
  )
}

export default PrivacyPolicy
