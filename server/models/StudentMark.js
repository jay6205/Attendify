import mongoose from 'mongoose';

const studentMarkSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true // Duplicate for fast queries
    },
    obtainedMarks: {
        type: Number,
        required: true,
        min: 0
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Prevent duplicate marks entry for the same assessment and student
studentMarkSchema.index({ assessment: 1, student: 1 }, { unique: true });

// Optimize queries for student's marks in a specific course
studentMarkSchema.index({ student: 1, course: 1 });

// Performance & Multi-tenant Indexes
studentMarkSchema.index({ organization: 1, assessment: 1 });

export default mongoose.model('StudentMark', studentMarkSchema);
