import ChatHistory from '../models/ChatHistory.js';
import { computeStudentAttendanceTruth } from '../services/attendanceTruth.service.js';
import { generateHybridResponse } from '../services/aiResponse.service.js';

// @desc    Chat with AI Advisor (Hybrid Architecture)
// @route   POST /api/v2/ai/chat
// @access  Private
// @flow    Controller -> attendanceTruth.service -> aiResponse.service -> llm.service (optional)
export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // 1. Compute Deterministic Truth (Rule Engine)
        // This MUST happen before any AI generation to ensure facts are grounded.
        const truthObject = await computeStudentAttendanceTruth(userId);

        // 2. Generate Response (Hybrid Orchestrator)
        const responseText = await generateHybridResponse({
            truthObject,
            userMessage: message
        });

        // 3. Store Conversation (Audit Trail)
        await ChatHistory.create({
            user: userId,
            message,
            reply: responseText,
            meta: truthObject // Store snapshot of stats at that moment
        });

        // 4. Return to Client
        // 'response' and 'reply' for backward compatibility
        res.status(200).json({
            response: responseText,
            reply: responseText,
            meta: truthObject
        });

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({
            response: "System is experiencing high load. Please check your dashboard natively.",
            reply: "System Error"
        });
    }
};

// @desc    Get Chat History
// @route   GET /api/v2/ai/history
// @access  Private
export const getHistory = async (req, res) => {
    try {
        const history = await ChatHistory.find({ user: req.user._id })
            .sort({ timestamp: 1 })
            .limit(50);

        // Flatten for frontend
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
        console.error("History Error:", error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};
