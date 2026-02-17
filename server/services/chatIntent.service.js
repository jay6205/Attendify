/**
 * Service to detect user intent from chat messages using keyword matching.
 * Pure deterministic logic.
 */

const INTENT_MAP = {
    // Specific Intents First (Teacher/Parent) to avoid being caught by generic keywords
    GET_CHILD_ATTENDANCE: ['child attendance', 'son attendance', 'daughter attendance', 'my child', 'my ward', 'kid attendance'],
    GET_LOW_ATTENDANCE_STUDENTS: ['low attendance', 'below threshold', 'defaulters', 'short attendance', 'list of students', 'below 75', 'how many students'],
    GET_WEAK_STUDENTS_BATCH: ['weak students', 'struggling', 'below average', 'fail', 'poor performance'],
    GET_LATEST_TEST_RESULT: ['latest result', 'recent test', 'last exam', 'recent marks'],
    GET_ALERTS: ['alert', 'notification', 'warning', 'notice'],

    // Generic Intents (Student)
    GET_ATTENDANCE: ['attendance', 'present', 'absent', 'percentage', 'attendance %'],
    GET_MARKS: ['marks', 'score', 'result', 'performance', 'grade', 'cgpa', 'sgpa'],
    GET_NEXT_TEST: ['next test', 'upcoming test', 'exam', 'assessment', 'midsem', 'quiz', 'sessional'],
    
    GREETING: ['hi', 'hello', 'hey', 'greetings', 'morning', 'afternoon', 'evening']
};


/**
 * Detects the intent of the message.
 * Priority: Exact match -> Keyword match (Sequence matters in INTENT_MAP definition for overlapping keywords if any)
 * @param {string} message 
 * @returns {string} Intent key or 'UNKNOWN'
 */
export const detectChatIntent = (message) => {
    if (!message || typeof message !== 'string') return 'UNKNOWN';
    const lowerMsg = message.toLowerCase();

    // specific multi-word checks first to avoid partial overrides
    // (e.g. "child attendance" should not be caught by "attendance" first if we iterate blindly)
    // But since "attendance" is in GET_ATTENDANCE, we must be careful with order.
    // Actually, distinct keywords help. "child" + "attendance" is specific.

    // Let's check specifically for complex intents first
    if (lowerMsg.includes('child') && (lowerMsg.includes('attendance') || lowerMsg.includes('present'))) {
        return 'GET_CHILD_ATTENDANCE';
    }

    for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
        for (const keyword of keywords) {
             if (lowerMsg.includes(keyword)) {
                 return intent;
             }
        }
    }

    return 'UNKNOWN';
};
