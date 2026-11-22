import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        paymentId: {
            type: String,
            sparse: true,
            index: true
        },
        signature: {
            type: String,
            default: null
        },
        planId: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true // in paise (e.g. 49900 = ₹499.00)
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true
        },
        status: {
            type: String,
            enum: ['CREATED', 'ATTEMPTED', 'PAID', 'FAILED', 'REFUNDED'],
            default: 'CREATED',
            index: true
        },
        receipt: {
            type: String,
            required: true,
            unique: true
        },
        notes: {
            type: Map,
            of: String,
            default: {}
        },
        errorDetails: {
            code: String,
            description: String,
            source: String,
            step: String,
            reason: String
        },
        paidAt: {
            type: Date,
            default: null
        },
        rawWebhookLogs: [
            {
                event: String,
                receivedAt: { type: Date, default: Date.now },
                payload: mongoose.Schema.Types.Mixed
            }
        ]
    },
    {
        timestamps: true
    }
)

const Order = mongoose.model('Order', orderSchema)

export default Order
