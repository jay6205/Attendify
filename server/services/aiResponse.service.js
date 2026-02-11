import { generateLLMResponse } from './llm.service.js';
import { validateResponse } from '../utils/aiGuardrails.js';
import { detectIntent } from '../utils/intentDetection.util.js';
import { buildStructuredResponse, getDynamicTemplate } from '../utils/responseComposer.util.js';

/**
 * Generates the final response using Hybrid logic (Refined Flow).
 * Flow: Truth -> Intent -> Truth Injection -> LLM Conversation -> Guardrails -> Response
 * @param {Object} params 
 * @param {Object} params.truthObject - The deterministic truth
 * @param {string} params.userMessage - User's input
 * @returns {Promise<string>}
 */
export const generateHybridResponse = async ({ truthObject, userMessage }) => {
    // 1. Detect Intent (Rule-based, fast)
    const intent = detectIntent(userMessage);

    // 2. Compose Structured Response (The "Meaning" of the reply - effectively the Truth Snapshot)
    const structuredResponse = buildStructuredResponse(truthObject, intent);

    // 3. Check AI Mode (Fallback to Dynamic Template if Rule mode)
    const aiMode = process.env.GOOGLE_API_KEY ? 'hybrid' : 'rule';

    if (aiMode === 'rule') {
        return getDynamicTemplate(structuredResponse);
    }

    // 4. HYBRID MODE: LLM Primary Voice
    if (aiMode === 'hybrid') {
        try {
            const systemPrompt = `
                You are the Attendify Academic Success Assistant.
                You are a helpful, professional, and slightly strict student guide.
                
                CRITICAL RULE: YOU MUST USE THE PROVIDED DATA. DO NOT INVENT NUMBERS.
                
                --- STUDENT DATA (TRUTH SOURCE) ---
                Overall Attendance: ${truthObject.attendancePercent}%
                Required Target: ${truthObject.institutionalTarget}%
                Status: ${truthObject.status}
                
                Risk Courses (<75%): ${truthObject.details.filter(c => c.percentage < 75).map(c => `${c.courseName} (${c.percentage}%)`).join(', ') || "None"}
                Safe Courses (>75%): ${truthObject.details.filter(c => c.percentage >= 75).map(c => `${c.courseName} (${c.percentage}%)`).join(', ') || "None"}
                -----------------------------------

                USER INTENT: ${intent}
                SUGGESTED TONE: ${structuredResponse.toneHint}
                CORE MESSAGE: "${structuredResponse.coreMessage}"

                INSTRUCTIONS:
                - Answer the user's message naturally as a conversation.
                - WEAVE the student data into your response to prove you know their status.
                - If they ask "Can I skip?", reference their specific situation (e.g., "You are at 72%, so skipping is dangerous").
                - NEVER say "I am an AI" unless asked.
                - Keep it under 60 words.
            `;

            // Call LLM Service
            const llmResponse = await generateLLMResponse(systemPrompt, userMessage);

            if (!llmResponse) {
                return getDynamicTemplate(structuredResponse);
            }

            // Validate Response (Guardrails)
            if (validateResponse(llmResponse, truthObject)) {
                return llmResponse;
            } else {
                console.warn("LLM Response failed guardrails. Falling back to template.");
                return getDynamicTemplate(structuredResponse);
            }

        } catch (error) {
            console.error("LLM Generation Failed:", error);
            return getDynamicTemplate(structuredResponse);
        }
    }

    return getDynamicTemplate(structuredResponse);
};
