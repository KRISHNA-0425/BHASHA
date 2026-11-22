import Razorpay from 'razorpay'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const key_id = process.env.RAZORPAY_KEY_ID
const key_secret = process.env.RAZORPAY_KEY_SECRET

const isConfigured = Boolean(
    key_id &&
    key_secret &&
    !key_id.includes('your_razorpay') &&
    !key_id.includes('placeholder')
)

let razorpayInstance = null

if (isConfigured) {
    try {
        razorpayInstance = new Razorpay({
            key_id,
            key_secret
        })
        console.log('[Razorpay] Client initialized successfully')
    } catch (err) {
        console.error('[Razorpay] Failed to initialize client:', err.message)
    }
} else {
    console.warn('[Razorpay] Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured or using placeholder.')
}

export const getRazorpayClient = () => {
    // Re-check in case environment was loaded or changed
    if (!razorpayInstance) {
        const activeKeyId = process.env.RAZORPAY_KEY_ID
        const activeSecret = process.env.RAZORPAY_KEY_SECRET
        if (activeKeyId && activeSecret && !activeKeyId.includes('your_razorpay')) {
            razorpayInstance = new Razorpay({
                key_id: activeKeyId,
                key_secret: activeSecret
            })
            return razorpayInstance
        }
        throw new Error('Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
    }
    return razorpayInstance
}

export default razorpayInstance
