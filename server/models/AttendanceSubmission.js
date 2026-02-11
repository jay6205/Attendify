import mongoose from 'mongoose';

const attendanceSubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession',
        required: true
    },
    answer: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Failed'],
        default: 'Pending'
    },
    verificationMethod: {
        type: String,
        enum: ['Keyword', 'LLM', 'Manual'],
        default: 'Keyword'
    },
    confidenceScore: {
        type: Number, // 0.0 to 1.0 (for LLM)
        default: 0
    },
    processedAt: {
        type: Date
    },
    attempts: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Prevent duplicate submissions per session per student
attendanceSubmissionSchema.index({ session: 1, student: 1 }, { unique: true });

export default mongoose.model('AttendanceSubmission', attendanceSubmissionSchema);
