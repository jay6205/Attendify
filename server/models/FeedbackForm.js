import mongoose from 'mongoose';

const feedbackFormSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        default: null // Only for POST_ASSESSMENT type
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['POST_ASSESSMENT', 'END_COURSE'],
        required: true
    },
    questions: [
        {
            questionText: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ['RATING', 'TEXT'],
                required: true
            },
            scaleMax: {
                type: Number,
                default: 5 // Only relevant for RATING type
            }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    expirationDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Prevent duplicate forms for the same course + type + assessment combo
feedbackFormSchema.index(
    { course: 1, type: 1, assessment: 1 },
    { unique: true }
);

export default mongoose.model('FeedbackForm', feedbackFormSchema);
