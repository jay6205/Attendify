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
    } catch (error) {
        // For BulkWriteError, log but don't rethrow — some docs may have been inserted
        if (error.name === 'BulkWriteError' || error.name === 'MongoBulkWriteError') {
            const dupCount = (error.writeErrors || []).filter(e => e.code === 11000).length;
            const otherErrors = (error.writeErrors || []).filter(e => e.code !== 11000);
            if (otherErrors.length > 0) {
                console.error(`[AlertService] Bulk alert partial failure: ${otherErrors.length} non-duplicate errors`, otherErrors);
            }
            if (dupCount > 0) {
                console.warn(`[AlertService] Bulk alert: ${dupCount} duplicate(s) skipped`);
            }
        } else {
            console.error('[AlertService] Failed to create bulk alerts:', error.message);
        }
    }
};
