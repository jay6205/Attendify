import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    reply: { 
        type: String, 
        required: true 
    },
    meta: { 
        type: Object 
    },
    timestamp: { 
        type: Date, 
        default: Date.now, 
        expires: '30d' // Auto-delete after 30 days
    }
});

export default mongoose.model('ChatHistory', ChatHistorySchema);
