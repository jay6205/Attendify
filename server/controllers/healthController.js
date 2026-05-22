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
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                api: 'operational',
                database: statusMap[dbStatus] || 'unknown',
            }
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Internal Server Error',
            services: {
                api: 'error',
                database: 'unknown',
            }
        });
    }
};

// @desc    Lightweight ping for uptime monitors (root-level, no middleware)
// @route   GET /health
// @access  Public
export const getPing = (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    res.status(dbStatus === 1 ? 200 : 503).json({
        status: dbStatus === 1 ? 'OK' : 'DEGRADED',
        db: dbStatus === 1 ? 'connected' : 'not_ready',
        uptime: process.uptime(),
    });
};
