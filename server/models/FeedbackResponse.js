import mongoose from 'mongoose';

const feedbackResponseSchema = new mongoose.Schema({
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
        default: null
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackForm',
        required: true
    },
    answers: [
        {
            questionIndex: {
                type: Number,
                required: true
            },
            ratingValue: {
                type: Number,
                default: null
            },
            textValue: {
                type: String,
                default: null
            }
        }
    ],
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Prevent duplicate submissions: one student, one form
feedbackResponseSchema.index(
    { student: 1, formId: 1 },
    { unique: true }
);

export default mongoose.model('FeedbackResponse', feedbackResponseSchema);
