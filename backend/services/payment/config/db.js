import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const uri = process.env.MONGO_URL

const connectDb = async () => {
    try {
        if (!uri) {
            throw new Error('MONGO_URL environment variable is missing for Payment service')
        }
        await mongoose.connect(uri)
        console.log('payment database is connected')
    } catch (error) {
        console.error('error to connect the payment db:', error.message)
        throw error
    }
}

export default connectDb
