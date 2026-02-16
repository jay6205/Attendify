import Alert from '../models/Alert.js';

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
    } catch (error) {
        console.error('[AlertService] Failed to create alert:', error.message);
    }
};

/**
 * Create alerts for multiple users at once (e.g. bulk absence marking).
 * Uses insertMany for performance.
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

        await Alert.insertMany(docs);
    } catch (error) {
        console.error('[AlertService] Failed to create bulk alerts:', error.message);
    }
};
