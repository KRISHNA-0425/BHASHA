import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDb from './config/db.js'
import paymentRouter from './routes/payment.route.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

const port = process.env.PORT || 8006
const app = express()

// CORS setup
app.use(cors({
    origin: true,
    credentials: true
}))

// Body parser with raw body buffer capture for webhook HMAC verification
app.use(express.json({
    verify: (req, _, buf) => {
        req.rawBody = buf
    }
}))
app.use(express.urlencoded({ extended: true }))

// Mount Payment routes
app.use('/api/payment', paymentRouter)

// Health check endpoint
app.get('/', (_, res) => {
    res.json({
        success: true,
        service: 'payment',
        port,
        gatewayCompatible: true,
        currency: 'INR'
    })
})

const startServer = async () => {
    try {
        await connectDb()
        app.listen(port, () => {
            console.log(`payment service started at port: ${port}`)
        })
    } catch (error) {
        console.error('Failed to start payment service:', error.message)
        // Allow app to still listen even if initial DB fails so healthcheck reports status
        app.listen(port, () => {
            console.log(`payment service started (offline db mode) at port: ${port}`)
        })
    }
}

startServer()
