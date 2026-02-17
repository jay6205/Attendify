import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Lecture time slot (e.g. "13:00" – "14:00")
    startTime: {
        type: String,
        default: null
    },
    endTime: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Leave'],
        default: 'Present',
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Prevent duplicate attendance for the same student in the same course on the same date + time slot
attendanceSchema.index({ student: 1, course: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
