import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000; // 5 seconds

const connectDB = async () => {
    let retries = 0;

    const connect = async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000, // 10s timeout for initial connection
                socketTimeoutMS: 45000,          // 45s socket timeout
            });
            logger.info(`MongoDB Connected: ${conn.connection.host}`);
        } catch (error) {
            retries++;
            if (retries <= MAX_RETRIES) {
                logger.warn(`MongoDB connection attempt ${retries}/${MAX_RETRIES} failed: ${error.message}. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                return connect();
            }
            logger.error(`MongoDB connection failed after ${MAX_RETRIES} attempts: ${error.message}`);
            process.exit(1);
        }
    };

    await connect();

    // Runtime connection event handlers for graceful recovery
    mongoose.connection.on('connected', () => {
        logger.info('MongoDB connection established');
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB connection lost. Mongoose will attempt to reconnect automatically.');
    });

    mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
    });
};

export default connectDB;
