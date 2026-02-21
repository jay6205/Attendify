import rateLimit from 'express-rate-limit';

// Global API Rate Limiter
// 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Stricter Rate Limiter for Auth Routes
// 15 requests per 15 minutes per IP
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 15,
    message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter Rate Limiter for Chat Endpoints
// 30 requests per minute per IP to prevent spam/cost
export const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 30,
    message: { success: false, message: 'Too many messages sent, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
});
