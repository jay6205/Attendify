
import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    documents: [{
        url: String,
        fileType: String, // e.g. 'application/pdf', 'image/jpeg'
        uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    handledBy: { // Admin or Teacher who approved/rejected
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    handledAt: {
        type: Date
    },
    comments: { // Admin comments on rejection/approval
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
