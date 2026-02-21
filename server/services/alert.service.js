import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { sendTelegramMessage, buildTelegramMessage } from './telegram.service.js';
import logger from '../utils/logger.js';

// ─── Telegram Dispatch (fire-and-forget) ───────────────────────────────────────

/**
 * Send a Telegram message for a single user if they have Telegram linked.
 * Runs async — never blocks the caller.
 */
const dispatchTelegramForUser = (userId, type, title, message, metadata) => {
    // Intentionally NOT awaited — fire-and-forget
    (async () => {
        try {
            const user = await User.findById(userId).select('telegramLinked telegramChatId').lean();
            if (user?.telegramLinked && user?.telegramChatId) {
                const text = buildTelegramMessage(type, title, message, metadata);
                await sendTelegramMessage(user.telegramChatId, text);
            }
        } catch (err) {
            logger.error(`[AlertService] Telegram dispatch failed for user ${userId}: ${err.message}`);
        }
    })();
};

/**
 * Send Telegram messages to multiple users who have Telegram linked.
 * Runs async — never blocks the caller.
 */
const dispatchTelegramForBulk = (userIds, type, title, message, metadata) => {
    // Intentionally NOT awaited — fire-and-forget
    (async () => {
        try {
            const users = await User.find({
                _id: { $in: userIds },
                telegramLinked: true,
                telegramChatId: { $ne: null }
            }).select('telegramChatId').lean();

            if (users.length === 0) return;

            const text = buildTelegramMessage(type, title, message, metadata);
            // Send in parallel, each independently caught
            await Promise.allSettled(
                users.map(u => sendTelegramMessage(u.telegramChatId, text))
            );
        } catch (err) {
            logger.error(`[AlertService] Bulk Telegram dispatch failed: ${err.message}`);
        }
    })();
};

// ─── Alert Creation ────────────────────────────────────────────────────────────

/**
 * Create a single alert for a user.
 * Fire-and-forget: errors are logged but never thrown to the caller.
 */
export const createAlert = async (userId, orgId, type, title, message, metadata = null) => {
    try {
        await Alert.create({
            user: userId,
            organization: orgId,
            type,
            title,
            message,
            metadata
        });

        // Telegram delivery — async, non-blocking
        dispatchTelegramForUser(userId, type, title, message, metadata);
    } catch (error) {
        logger.error(`[AlertService] Failed to create alert: ${error.message}`);
    }
};

/**
 * Create alerts for multiple users at once (e.g. bulk absence marking).
 * Uses insertMany with { ordered: false } so valid docs are still inserted when some fail.
 */
export const createBulkAlert = async (userIds, orgId, type, title, message, metadata = null) => {
    try {
        if (!userIds || userIds.length === 0) return;

        const docs = userIds.map(userId => ({
            user: userId,
            organization: orgId,
            type,
            title,
            message,
            metadata
        }));

        await Alert.insertMany(docs, { ordered: false });

        // Telegram delivery — async, non-blocking
        dispatchTelegramForBulk(userIds, type, title, message, metadata);
    } catch (error) {
        // For BulkWriteError, log but don't rethrow — some docs may have been inserted
        if (error.name === 'BulkWriteError' || error.name === 'MongoBulkWriteError') {
            const writeErrors = error.writeErrors || [];
            const dupCount = writeErrors.filter(e => e.code === 11000).length;
            const otherErrors = writeErrors.filter(e => e.code !== 11000);
            if (otherErrors.length > 0) {
                logger.error(`[AlertService] Bulk alert partial failure: ${otherErrors.length} non-duplicate errors`, { otherErrors });
            }
            if (dupCount > 0) {
                logger.warn(`[AlertService] Bulk alert: ${dupCount} duplicate(s) skipped`);
            }
            // Only dispatch Telegram for successfully inserted users
            const failedIndices = new Set(writeErrors.map(e => e.index));
            const successUserIds = userIds.filter((_, idx) => !failedIndices.has(idx));
            if (successUserIds.length > 0) {
                dispatchTelegramForBulk(successUserIds, type, title, message, metadata);
            }
        } else {
            logger.error(`[AlertService] Failed to create bulk alerts: ${error.message}`);
        }
    }
};
