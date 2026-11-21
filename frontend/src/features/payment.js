import api from '../utils/axios'

/**
 * Dynamically loads the official Razorpay Checkout SDK
 * Returns a promise that resolves when window.Razorpay is ready
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            return resolve(true)
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => {
            console.error('Failed to load Razorpay SDK')
            resolve(false)
        }
        document.body.appendChild(script)
    })
}

/**
 * Retrieves public subscription plans catalog
 */
export const getPlans = async () => {
    const { data } = await api.get('/api/payment/plans')
    return data
}

/**
 * Creates a server-authoritative Razorpay order
 */
export const createPaymentOrder = async (planId) => {
    const { data } = await api.post('/api/payment/create-order', { planId })
    return data
}

/**
 * Submits payment confirmation payload for cryptographic HMAC SHA-256 verification
 */
export const verifyPayment = async (confirmationPayload) => {
    const { data } = await api.post('/api/payment/verify', confirmationPayload)
    return data
}

/**
 * Retrieves the current user's active subscription status and token entitlement
 */
export const getUserSubscription = async () => {
    const { data } = await api.get('/api/payment/subscription')
    return data
}

/**
 * Retrieves user's transaction and payment history
 */
export const getPaymentHistory = async () => {
    const { data } = await api.get('/api/payment/history')
    return data
}
