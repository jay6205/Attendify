import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { globalLimiter, authLimiter, chatLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';
import { startTelegramBot } from './scripts/telegramBot.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Trust reverse proxy (if deployed behind Nginx, Render, Heroku)
app.set('trust proxy', 1);

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: (message) => logger.http(message.trim()) }
    }));
}

// Security Middleware
app.use(helmet());

// Global Rate Limiting
app.use('/api/', globalLimiter);

// Body Parsing Middleware
app.use(express.json());

// Payload Sanitization (must be after express.json)
app.use(mongoSanitize());

const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return sanitizeHtml(value);
    }
    if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((key) => {
            value[key] = sanitizeValue(value[key]);
        });
    }
    return value;
};

const sanitizeBody = (req, res, next) => {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.query) req.query = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
    next();
};

app.use(sanitizeBody);
app.use(cors({
    origin: (origin, callback) => {
        // Strip trailing slashes from allowed origins
        const allowedOrigins = process.env.CLIENT_URL 
            ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, '')) 
            : [];
            
        // Strip trailing slash from incoming origin
        const incomingOrigin = origin ? origin.replace(/\/$/, '') : null;

        if (!incomingOrigin || allowedOrigins.includes(incomingOrigin)) {
            callback(null, true);
        } else {
            console.error(`[CORS Blocked] Origin missing from CLIENT_URL: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Route files (V2)
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import aiAttendanceRoutes from './routes/aiAttendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import superAdminMetricsRoutes from './routes/superAdminMetricsRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import userRoutes from './routes/userRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Mount routers
app.use('/api/v2/auth', authLimiter, authRoutes); // Stricter rate limit for Auth
app.use('/api/v2/super-admin', superAdminRoutes); // Super Admin Routes
app.use('/api/v2/super-admin/organizations', organizationRoutes); // Organization Routes
app.use('/api/v2/super-admin/metrics', superAdminMetricsRoutes); // Metrics Routes
app.use('/api/v2/admin', adminRoutes);
app.use('/api/v2/academic', academicRoutes);
app.use('/api/v2/attendance', attendanceRoutes);
app.use('/api/v2/attendance/ai', aiAttendanceRoutes); // New AI Attendance Route
app.use('/api/v2/leaves', leaveRoutes);
app.use('/api/v2/health', healthRoutes);
app.use('/api/v2/ai', aiRoutes);
app.use('/api/v2/marks', marksRoutes);
app.use('/api/v2/leaderboard', leaderboardRoutes);
app.use('/api/v2/feedback', feedbackRoutes);
app.use('/api/v2/users', userRoutes);
app.use('/api/v2/alerts', alertRoutes);

app.use('/api/v2/telegram', telegramRoutes);
app.use('/api/v2/chat', chatLimiter, chatRoutes); // Stricter rate limit for chat

import questionPaperRoutes from './routes/questionPaperRoutes.js';
app.use('/api/v2/question-paper', questionPaperRoutes);


// Root
app.get('/', (req, res) => {
    res.send('Attendify API v2 is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

    // Start Telegram Bot polling asynchronously side-by-side with web server
    startTelegramBot();
});
