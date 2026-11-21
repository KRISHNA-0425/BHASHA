import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        planId: {
            type: String,
            enum: ['FREE', 'PRO_MONTHLY', 'PRO_YEARLY'],
            default: 'FREE'
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
            default: 'ACTIVE',
            index: true
        },
        currentPeriodStart: {
            type: Date,
            default: Date.now
        },
        currentPeriodEnd: {
            type: Date,
            default: null // null indicates lifetime or free
        },
        extraTokens: {
            type: Number,
            default: 0
        },
        lastOrderId: {
            type: String,
            default: null
        },
        lastPaymentId: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
)

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription
