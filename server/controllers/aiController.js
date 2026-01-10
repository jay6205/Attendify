import { GoogleGenerativeAI } from '@google/generative-ai';
import Subject from '../models/Subject.js';
import ChatHistory from '../models/ChatHistory.js';
import { calculateCurrentPercentage } from '../utils/bunkCalculator.js';

// @desc    Chat with AI Advisor
// @route   POST /api/v1/ai/chat
// @access  Private
export const chatWithAI = async (req, res) => {
    const { message } = req.body;

    if (!process.env.GOOGLE_API_KEY) {
        return res.status(503).json({ 
            response: "AI Service Not Configured. Please add GOOGLE_API_KEY to server .env file." 
        });
    }

    try {
        // 1. Gather Context
        const subjects = await Subject.find({ userId: req.user.id });
        let context = "User's Attendance Data:\n";
        
        subjects.forEach(sub => {
            const pct = Math.round(calculateCurrentPercentage(sub.attended, sub.total));
            context += `- Subject: ${sub.name}, Attended: ${sub.attended}/${sub.total} (${pct}%).\n`;
        });
        
        const target = req.user.attendanceRequirement || 75;
        context += `Target Attendance Requirement: ${target}%.\n`;

        // 2. Construct Prompt
        const systemPrompt = `You are 'Attendify AI', a helpful student assistant. 
        Analyze the student's attendance data provided below. 
        Answer their question based on this data. 
        If they ask about 'bunking', calculate if it is safe based on their target. 
        Be concise, encouraging, and a bit witty.
        
        ${context}`;

        // 3. Save User Message
        await ChatHistory.create({
            userId: req.user.id,
            role: 'user',
            message: message
        });

        // 4. Call Gemini
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([systemPrompt, message]);
        const response = await result.response;
        const text = response.text();

        // 5. Save AI Response
        await ChatHistory.create({
            userId: req.user.id,
            role: 'model',
            message: text
        });

        res.status(200).json({ response: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "AI Service Error: " + error.message });
    }
};

// @desc    Get chat history
// @route   GET /api/v1/ai/history
// @access  Private
export const getHistory = async (req, res) => {
    try {
        const history = await ChatHistory.find({ userId: req.user.id })
            .sort({ timestamp: 1 }) // Oldest first
            .limit(50); // Limit to last 50

        // Format for frontend
        const formatted = history.map(msg => ({
            id: msg._id,
            sender: msg.role === 'user' ? 'user' : 'bot',
            text: msg.message,
            timestamp: msg.timestamp
        }));

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
