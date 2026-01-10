import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
        type: String, // Format: "HH:mm" (24h)
        required: true
    },
    endTime: {
        type: String, // Format: "HH:mm" (24h)
        required: true
    },
    frequency: {
        type: String,
        enum: ['Weekly', 'Bi-Weekly'],
        default: 'Weekly'
    }
});

export default mongoose.model('TimetableEntry', timetableEntrySchema);
