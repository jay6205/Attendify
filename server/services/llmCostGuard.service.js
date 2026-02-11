import AttendanceSession from '../models/AttendanceSession.js';

// Simple in-memory tracker for rate limiting (global)
// Note: For production with multiple instances, use Redis.
const GLOBAL_RATE_LIMIT = {
    windowStart: Date.now(),
    count: 0,
    limit: 100, // Global MAX LLM calls per minute
    windowMs: 60 * 1000
};

export const checkLlmQuota = async (sessionId) => {
    // 1. Global Rate Limit Check
    const now = Date.now();
    if (now - GLOBAL_RATE_LIMIT.windowStart > GLOBAL_RATE_LIMIT.windowMs) {
        GLOBAL_RATE_LIMIT.windowStart = now;
        GLOBAL_RATE_LIMIT.count = 0;
    }

    if (GLOBAL_RATE_LIMIT.count >= GLOBAL_RATE_LIMIT.limit) {
        console.warn('Global LLM Rate Limit Exceeded');
        return false;
    }

    // 2. Session Limit Check
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return false;

    if (session.metadata.llmCallsCount >= session.config.maxLlmCalls) {
        console.warn(`Session ${sessionId} LLM Limit Exceeded`);
        return false; // Fallback to keyword or reject
    }

    return true;
};

export const incrementLlmUsage = async (sessionId) => {
    GLOBAL_RATE_LIMIT.count++;
    await AttendanceSession.findByIdAndUpdate(sessionId, {
        $inc: { 'metadata.llmCallsCount': 1 }
    });
};
