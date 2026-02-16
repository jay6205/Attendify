import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['ABSENT', 'MARKS_PUBLISHED', 'LOW_ATTENDANCE', 'GENERAL'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        // Future: courseId, assessmentId, date, etc.
    },
    readByPortals: {
        type: [String],
        default: []
        // Tracks which portals have read this alert, e.g. ['student'], ['parent'], ['student', 'parent']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    // Future-ready fields (comments only):
    // priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' }
    // deliveryChannel: { type: [String], enum: ['IN_APP', 'EMAIL', 'WHATSAPP'], default: ['IN_APP'] }
    // scheduledAt: { type: Date }
    // expiresAt: { type: Date }
});

// Index for fast user-specific queries sorted by newest first
alertSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Alert', alertSchema);
