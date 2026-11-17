import mongoose from "mongoose"
import dotenv from 'dotenv'
dotenv.config();

const uri = process.env.MONGO_URL;

const connectDb = async () => {
    try {
        await mongoose.connect(uri);
        console.log('database is connected');
    } catch (error) {
        console.error('error to connect the db', error);
    }
}

export default connectDb;