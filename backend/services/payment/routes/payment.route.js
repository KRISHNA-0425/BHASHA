import express from 'express'
import {
    getAvailablePlans,
    createPaymentOrder,
    verifyPaymentSignature,
    getUserSubscription,
    getPaymentHistory,
    handleWebhook
} from '../controllers/payment.controller.js'

const paymentRouter = express.Router()

// Public route to view plans
paymentRouter.get('/plans', getAvailablePlans)

// Protected user routes (Gateway injects x-user-id)
paymentRouter.post('/create-order', createPaymentOrder)
paymentRouter.post('/verify', verifyPaymentSignature)
paymentRouter.get('/subscription', getUserSubscription)
paymentRouter.get('/history', getPaymentHistory)

// Razorpay asynchronous Webhook endpoint (Requires raw unparsed body for signature check)
paymentRouter.post('/webhook', handleWebhook)

export default paymentRouter
