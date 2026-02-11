import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    keywords: [{
        type: String, // Simple keyword matching for fast-path
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    config: {
        llmEnabled: { type: Boolean, default: true },
        maxLlmCalls: { type: Number, default: 80 }
    },
    metadata: {
        totalSubmissions: { type: Number, default: 0 },
        llmCallsCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Index for finding active sessions for a course
attendanceSessionSchema.index({ course: 1, isActive: 1 });

export default mongoose.model('AttendanceSession', attendanceSessionSchema);
