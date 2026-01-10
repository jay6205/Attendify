import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Theory', 'Lab', 'Tutorial', 'Other'],
        default: 'Theory'
    },
    attended: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    }
});

export default mongoose.model('Subject', subjectSchema);
