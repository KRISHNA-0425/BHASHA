import crypto from 'crypto'
import Order from '../models/order.model.js'
import Subscription from '../models/subscription.model.js'
import { PLANS, getPlanById } from '../constants/plans.js'
import { getRazorpayClient } from '../config/razorpay.js'

/**
 * Public catalog of available subscription plans and add-on products
 */
export const getAvailablePlans = async (req, res) => {
    try {
        const publicPlans = Object.values(PLANS).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            priceInRupees: p.price / 100,
            currency: p.currency,
            interval: p.interval,
            features: p.features,
            tokens: p.tokens || 0
        }))

        return res.status(200).json({
            success: true,
            plans: publicPlans
        })
    } catch (error) {
        console.error('[PaymentController] getAvailablePlans error:', error.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription plans'
        })
    }
}

/**
 * Creates a server-authoritative Razorpay order
 * Security: Amount is calculated on the server from the planId, NEVER accepted from frontend request
 */
export const createPaymentOrder = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const userEmail = req.headers['x-user-email'] || ''
        const { planId } = req.body || {}

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required: missing user identity'
            })
        }

        const plan = getPlanById(planId)
        if (!plan) {
            return res.status(400).json({
                success: false,
                message: `Invalid or unrecognized planId: "${planId}"`
            })
        }

        if (plan.price === 0) {
            return res.status(400).json({
                success: false,
                message: 'Free tier does not require checkout order creation'
            })
        }

        const razorpay = getRazorpayClient()
        const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

        const razorpayOrder = await razorpay.orders.create({
            amount: plan.price, // in paise
            currency: plan.currency,
            receipt,
            notes: {
                userId: String(userId),
                userEmail: String(userEmail),
                planId: plan.id,
                planName: plan.name
            }
        })

        // Persist order in database for transaction tracking and idempotency
        const orderDoc = await Order.create({
            userId: String(userId),
            orderId: razorpayOrder.id,
            planId: plan.id,
            amount: plan.price,
            currency: plan.currency,
            status: 'CREATED',
            receipt,
            notes: razorpayOrder.notes
        })

        return res.status(201).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            plan: {
                id: plan.id,
                name: plan.name,
                priceInRupees: plan.price / 100
            }
        })
    } catch (error) {
        console.error('[PaymentController] createPaymentOrder error:', error.message)
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal error creating payment order'
        })
    }
}

/**
 * Cryptographically verifies Razorpay payment signature using timing-safe HMAC SHA-256
 * Security: Idempotent - protects against duplicate activations on retries
 */
export const verifyPaymentSignature = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body || {}

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            })
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required Razorpay payment confirmation parameters'
            })
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET
        if (!keySecret) {
            throw new Error('Server misconfiguration: RAZORPAY_KEY_SECRET is not defined')
        }

        // 1. Calculate expected HMAC SHA-256 digest
        const payload = `${razorpay_order_id}|${razorpay_payment_id}`
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(payload)
            .digest('hex')

        // 2. Perform timing-safe buffer comparison to prevent timing attacks
        const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
        const providedBuffer = Buffer.from(String(razorpay_signature), 'utf-8')

        if (
            expectedBuffer.length !== providedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
        ) {
            // Log security failure and mark order as FAILED
            await Order.findOneAndUpdate(
                { orderId: razorpay_order_id },
                {
                    status: 'FAILED',
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature,
                    errorDetails: {
                        description: 'HMAC signature verification failed: signature mismatch'
                    }
                }
            )

            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature: verification failed'
            })
        }

        // 3. Find matching database order
        const order = await Order.findOne({ orderId: razorpay_order_id })
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Payment order record not found'
            })
        }

        // 4. Idempotency guard: If already marked PAID, return success immediately
        if (order.status === 'PAID') {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified and processed',
                orderId: order.orderId,
                planId: order.planId
            })
        }

        // 5. Update order status to PAID
        order.status = 'PAID'
        order.paymentId = razorpay_payment_id
        order.signature = razorpay_signature
        order.paidAt = new Date()
        await order.save()

        // 6. Fulfill customer subscription / tokens
        const plan = getPlanById(order.planId)
        let subscription = await Subscription.findOne({ userId: String(userId) })

        if (!subscription) {
            subscription = new Subscription({
                userId: String(userId)
            })
        }

        if (plan && (plan.id === 'PRO_MONTHLY' || plan.id === 'PRO_YEARLY')) {
            const startDate = new Date()
            const endDate = new Date(startDate.getTime() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000)

            subscription.planId = plan.id
            subscription.status = 'ACTIVE'
            subscription.currentPeriodStart = startDate
            subscription.currentPeriodEnd = endDate
            subscription.lastOrderId = razorpay_order_id
            subscription.lastPaymentId = razorpay_payment_id
        } else if (plan && plan.tokens) {
            // Extra token pack add-on
            subscription.extraTokens = (subscription.extraTokens || 0) + plan.tokens
            subscription.lastOrderId = razorpay_order_id
            subscription.lastPaymentId = razorpay_payment_id
        }

        await subscription.save()

        return res.status(200).json({
            success: true,
            message: 'Payment successfully verified and subscription activated',
            subscription: {
                planId: subscription.planId,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                extraTokens: subscription.extraTokens
            }
        })
    } catch (error) {
        console.error('[PaymentController] verifyPaymentSignature error:', error.message)
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error verifying payment'
        })
    }
}

/**
 * Retrieves the current user's active subscription status and token entitlement
 */
export const getUserSubscription = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' })
        }

        let subscription = await Subscription.findOne({ userId: String(userId) })
        if (!subscription) {
            subscription = await Subscription.create({
                userId: String(userId),
                planId: 'FREE',
                status: 'ACTIVE'
            })
        }

        // Check if subscription has expired
        if (subscription.currentPeriodEnd && new Date() > new Date(subscription.currentPeriodEnd)) {
            subscription.planId = 'FREE'
            subscription.status = 'EXPIRED'
            await subscription.save()
        }

        const activePlan = getPlanById(subscription.planId) || PLANS.FREE

        return res.status(200).json({
            success: true,
            subscription: {
                planId: subscription.planId,
                planName: activePlan.name,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                extraTokens: subscription.extraTokens,
                features: activePlan.features
            }
        })
    } catch (error) {
        console.error('[PaymentController] getUserSubscription error:', error.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription'
        })
    }
}

/**
 * Retrieves payment history for the authenticated user
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' })
        }

        const orders = await Order.find({ userId: String(userId) })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()

        const formatted = orders.map((o) => ({
            id: o._id,
            orderId: o.orderId,
            paymentId: o.paymentId,
            planId: o.planId,
            amountInRupees: o.amount / 100,
            currency: o.currency,
            status: o.status,
            receipt: o.receipt,
            createdAt: o.createdAt,
            paidAt: o.paidAt
        }))

        return res.status(200).json({
            success: true,
            orders: formatted
        })
    } catch (error) {
        console.error('[PaymentController] getPaymentHistory error:', error.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment history'
        })
    }
}

/**
 * Webhook handler for asynchronous Razorpay notifications
 * Security: Verifies X-Razorpay-Signature using RAZORPAY_WEBHOOK_SECRET and raw unparsed request buffer
 */
export const handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature']
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

        if (!webhookSecret) {
            console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Webhook rejected.')
            return res.status(500).json({ error: 'Webhook secret unconfigured' })
        }

        if (!webhookSignature) {
            console.warn('[Webhook] Missing X-Razorpay-Signature header')
            return res.status(400).json({ error: 'Missing webhook signature' })
        }

        // Ensure raw buffer was captured
        const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex')

        const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
        const providedBuffer = Buffer.from(String(webhookSignature), 'utf-8')

        if (
            expectedBuffer.length !== providedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
        ) {
            console.warn('[Webhook] Invalid webhook signature detected')
            return res.status(400).json({ error: 'Invalid webhook signature' })
        }

        const event = typeof req.body === 'object' ? req.body : JSON.parse(req.body.toString('utf-8'))
        const eventType = event.event
        console.log(`[Webhook] Verified event received: ${eventType}`)

        // Process order / payment events
        const paymentEntity = event.payload?.payment?.entity
        const orderEntity = event.payload?.order?.entity
        const orderId = paymentEntity?.order_id || orderEntity?.id

        if (orderId) {
            const order = await Order.findOne({ orderId })
            if (order) {
                // Log webhook payload
                order.rawWebhookLogs.push({
                    event: eventType,
                    receivedAt: new Date(),
                    payload: event
                })

                if (eventType === 'payment.captured' || eventType === 'order.paid') {
                    if (order.status !== 'PAID') {
                        order.status = 'PAID'
                        order.paymentId = paymentEntity?.id || order.paymentId
                        order.paidAt = new Date()
                        await order.save()

                        // Fulfill subscription if not already done
                        const plan = getPlanById(order.planId)
                        if (plan && order.userId) {
                            let subscription = await Subscription.findOne({ userId: order.userId })
                            if (!subscription) {
                                subscription = new Subscription({ userId: order.userId })
                            }
                            if (plan.id === 'PRO_MONTHLY' || plan.id === 'PRO_YEARLY') {
                                const startDate = new Date()
                                const endDate = new Date(startDate.getTime() + (plan.durationDays || 30) * 86400000)
                                subscription.planId = plan.id
                                subscription.status = 'ACTIVE'
                                subscription.currentPeriodStart = startDate
                                subscription.currentPeriodEnd = endDate
                            } else if (plan.tokens) {
                                subscription.extraTokens = (subscription.extraTokens || 0) + plan.tokens
                            }
                            await subscription.save()
                        }
                    }
                } else if (eventType === 'payment.failed') {
                    order.status = 'FAILED'
                    order.errorDetails = {
                        code: paymentEntity?.error_code,
                        description: paymentEntity?.error_description,
                        source: paymentEntity?.error_source,
                        step: paymentEntity?.error_step,
                        reason: paymentEntity?.error_reason
                    }
                    await order.save()
                }
            }
        }

        return res.status(200).json({ status: 'ok' })
    } catch (error) {
        console.error('[Webhook] handleWebhook error:', error.message)
        return res.status(500).json({ error: error.message })
    }
}
