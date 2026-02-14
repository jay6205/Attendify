import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 0
    },
    examType: {
        type: String,
        enum: ['quiz', 'midsem', 'final', 'custom'],
        default: 'custom'
    },
    date: {
        type: Date,
        default: Date.now
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Prevent duplicate assessment titles within the same course
assessmentSchema.index({ course: 1, title: 1 }, { unique: true });

export default mongoose.model('Assessment', assessmentSchema);
