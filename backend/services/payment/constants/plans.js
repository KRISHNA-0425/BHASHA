// Server-side authoritative catalog of subscription plans and token add-ons
// All amounts are in smallest currency unit (paise: 100 paise = 1 INR)
export const PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Starter',
        price: 0, // ₹0
        currency: 'INR',
        interval: 'lifetime',
        features: [
            'Full Monaco Code Editor',
            'Integrated Virtual Terminal',
            'Two-Way Filesystem Sync',
            '5 Projects Workspace Capacity',
            'Community Support'
        ]
    },
    PRO_MONTHLY: {
        id: 'PRO_MONTHLY',
        name: 'Pro Monthly',
        price: 49900, // ₹499.00
        currency: 'INR',
        interval: 'month',
        durationDays: 30,
        features: [
            'Everything in Starter',
            'Unlimited Projects & Cloud Storage',
            'Autonomous LangGraph AI Pair Programmer',
            'High-Speed Dedicated Microservice Priority',
            'Dual-Engine Live Code & React Preview',
            'Full Stack Development & Code Runner'
        ]
    },
    PRO_YEARLY: {
        id: 'PRO_YEARLY',
        name: 'Pro Yearly',
        price: 499900, // ₹4,999.00 (Save ~17%)
        currency: 'INR',
        interval: 'year',
        durationDays: 365,
        features: [
            'Everything in Pro Monthly',
            '2 Months Free Equivalent Discount',
            'Priority 24/7 SLA Support',
            'Early Access to New Language Runtimes',
            'VIP Cloud Compute Allocation'
        ]
    },
    AI_BOOST_100K: {
        id: 'AI_BOOST_100K',
        name: 'AI Boost 100K Tokens',
        price: 9900, // ₹99.00
        currency: 'INR',
        interval: 'one_time',
        tokens: 100000,
        features: [
            '100,000 High-Speed AI Agent Tokens',
            'Zero Expiration — Never Expires',
            'Compatible with Any Tier'
        ]
    }
}

export const getPlanById = (planId) => {
    if (!planId || typeof planId !== 'string') return null
    return PLANS[planId.toUpperCase().trim()] || null
}
