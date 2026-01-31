
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Tracking attendance for the whole class for this specific session
    records: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late', 'Excused'],
            default: 'Present'
        },
        remarks: {
            type: String,
            trim: true
        }
    }],
    recordedBy: { // Teacher who marked it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one attendance record per course per day? 
// Might depend on if multiple sessions exist. For now, leave flexible.

export default mongoose.model('Attendance', attendanceSchema);
