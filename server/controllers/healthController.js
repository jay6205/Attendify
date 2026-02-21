import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// @desc    Health Check
// @route   GET /api/v2/health
// @access  Public
export const getHealth = (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState;
        const statusMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };

        const isHealthy = dbStatus === 1;

        if (!isHealthy) {
            logger.warn('Health check failed: Database not connected');
        }

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'OK' : 'ERROR',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: statusMap[dbStatus] || 'unknown'
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
    }
};
