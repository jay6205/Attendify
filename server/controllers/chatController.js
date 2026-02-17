import { handleChatQuery } from '../services/chatResponse.service.js';
import ChatHistory from '../models/ChatHistory.js';

// @desc    Process a rule-based chat query
// @route   POST /api/v2/chat/query
// @access  Private
// @flow    Controller -> chatResponse.service -> Intent/Entity Services
export const chatQuery = async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // 1. Process Query via Service
        const { intent, response, meta } = await handleChatQuery(user, message);

        // 2. Store History (Audit Trail)
        // Reusing existing ChatHistory model for compatibility
        await ChatHistory.create({
            user: user._id,
            message,
            reply: response,
            meta: meta || { intent, mode: 'rule-based' }
        });

        // 3. Return Response
        res.status(200).json({
            response,
            intent
        });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({
            response: "System encountered an error. Please try again.",
            intent: "ERROR"
        });
    }
};

// @desc    Get Chat History
// @route   GET /api/v2/chat/history
// @access  Private
export const getChatHistory = async (req, res) => {
    try {
        const history = await ChatHistory.find({ user: req.user._id })
            .sort({ timestamp: -1 })
            .limit(50);
        // Reverse to get chronological order for display
        history.reverse();

        // Flatten for frontend consumption (same format as old AI history)
        const flatList = [];
        history.forEach(h => {
            flatList.push({
                id: h._id + '_u',
                sender: 'user',
                text: h.message,
                timestamp: h.timestamp
            });
            flatList.push({
                id: h._id + '_b',
                sender: 'bot',
                text: h.reply,
                timestamp: h.timestamp
            });
        });

        res.status(200).json(flatList);

    } catch (error) {
        console.error("Chat History Error:", error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};
