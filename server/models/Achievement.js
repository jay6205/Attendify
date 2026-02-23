import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        required: true,
        default: 'Award' // Lucide icon name
    },
    condition: {
        type: String,
        required: true,
        enum: [
            'ATTENDANCE_100',      // 100% attendance over a period / course
            'ATTENDANCE_PERFECT_WEEK', // 100% attendance in a week
            'FIRST_ATTENDANCE',    // First time marked present
            'TOP_SCORE',           // Highest mark in an assessment
            'PERFECT_SCORE',       // 100% marks in an assessment
            'FIRST_LEAVE_APPROVED' // First leave request approved
        ]
    },
    xp: {
        type: Number,
        required: true,
        default: 50
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Achievement', achievementSchema);
