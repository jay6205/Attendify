
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true // e.g. "CS101"
    },
    credits: {
        type: Number,
        default: 3
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Performance Indexes
courseSchema.index({ organization: 1 });
courseSchema.index({ organization: 1, teacher: 1 });
courseSchema.index({ organization: 1, semester: 1 });

// Compound index to ensure uniqueness of course code within a semester if needed
// courseSchema.index({ code: 1, semester: 1 }, { unique: true });

export default mongoose.model('Course', courseSchema);
