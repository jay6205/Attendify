import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Generates a response using Google Gemini API.
 * @param {string} systemPrompt - The system context/instruction
 * @param {string} userMessage - The user's input
 * @returns {Promise<string|null>} The generated text or null if failure
 */
export const generateLLMResponse = async (systemPrompt, userMessage) => {
    try {
        // Use gemini-2.5-flash for speed and efficiency
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Improve Prompt Structure for better instruction following
        const finalPrompt = `
        SYSTEM INSTRUCTIONS:
        ${systemPrompt}

        USER MESSAGE:
        "${userMessage}"
        
        RESPONSE:
        `;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        return text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error.message || error);
        return null; // Fallback to template
    }
};
