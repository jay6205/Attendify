/**
 * Detects the user's intent based on keywords.
 * @param {string} message - User's chat message
 * @returns {string} One of: 'RISK_QUESTION' | 'STATUS_CHECK' | 'POLICY_QUESTION' | 'GREETING' | 'GENERAL'
 */
export const detectIntent = (message) => {
    if (!message) return 'GENERAL';
    const lowerMsg = message.toLowerCase();

    // 1. Risk / Bunking / Skipping
    // "Can I skip?", "Is it safe to bunk?", "How many misses left?"
    if (lowerMsg.match(/(skip|bunk|miss|safe|risk|warning|danger|fail|detain)/)) {
        return 'RISK_QUESTION';
    }

    // 2. Status / Summary
    // "How am I doing?", "Check status", "Summary", "Attendance report"
    if (lowerMsg.match(/(status|check|summary|report|doing|attendance|average|percentage)/)) {
        return 'STATUS_CHECK';
    }

    // 3. Policy / Rules
    // "What is the rule?", "Why 75?", "institution requirement"
    if (lowerMsg.match(/(rule|policy|require|mandatory|institution|college|university|limit)/)) {
        return 'POLICY_QUESTION';
    }

    // 4. Greeting
    if (lowerMsg.match(/^(hi|hello|hey|greetings)/)) {
        return 'GREETING';
    }

    return 'GENERAL';
};
