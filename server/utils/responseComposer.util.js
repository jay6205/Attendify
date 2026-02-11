/**
 * Composes a structured response object based on truth and intent.
 * This is the "Brain" that decides WHAT to say, but not exactly HOW to say it (LLM does that).
 * @param {Object} truthObject 
 * @param {string} intent 
 * @returns {Object} Structured response context
 */
export const buildStructuredResponse = (truthObject, intent) => {
    const { attendancePercent, details, institutionTarget } = truthObject;
    const riskCourses = details.filter(c => c.percentage < 75);
    const safeCourses = details.filter(c => c.percentage >= 75);
    
    // Base Check
    if (truthObject.status === "NO_ENROLLMENT") {
        return {
            coreMessage: "No enrollment found.",
            stats: null,
            toneHint: "informational",
            intentDetected: intent
        };
    }

    // Intent-Specific Logic
    switch (intent) {
        case 'RISK_QUESTION':
            if (riskCourses.length > 0) {
                return {
                    coreMessage: "User is asking about risk. They HAVE risk.",
                    criticalInfo: `You have ${riskCourses.length} courses below ${institutionTarget}%: ${riskCourses.map(c => c.courseName).join(', ')}.`,
                    advice: "Do not skip more. Attendance is critical now.",
                    stats: { current: attendancePercent, target: institutionTarget },
                    toneHint: "firm_warning",
                    intentDetected: intent
                };
            } else {
                return {
                    coreMessage: "User is asking about risk. They are currently SAFE.",
                    criticalInfo: "All courses are above 75%.",
                    advice: "You have some buffer, but maintaining streak is best.",
                    stats: { current: attendancePercent, target: institutionTarget },
                    toneHint: "cautious_optimism",
                    intentDetected: intent
                };
            }

        case 'STATUS_CHECK':
        default:
             return {
                coreMessage: `Overall attendance is ${attendancePercent}%.`,
                criticalInfo: riskCourses.length > 0 
                    ? `Warning needed for: ${riskCourses.map(c => c.courseName).join(', ')}.`
                    : "Everything looks good.",
                stats: { current: attendancePercent, target: institutionTarget },
                toneHint: "helpful_summary",
                intentDetected: intent
            };
    }
};

/**
 * Generates a dynamic template fallback if LLM is unavailable.
 * @param {Object} structuredResponse 
 * @returns {string}
 */
export const getDynamicTemplate = (structuredResponse) => {
    const { intentDetected, criticalInfo, stats, advice } = structuredResponse;

    if (!stats) return "You are not enrolled in any courses.";

    if (intentDetected === 'RISK_QUESTION') {
        if (structuredResponse.toneHint === 'firm_warning') {
            return `⚠️ Careful. ${criticalInfo} ${advice}`;
        } else {
            return `✅ You are currently safe. ${criticalInfo} However, ${advice}`;
        }
    }

    return `Here is your status: You have ${stats.current}% overall attendance. ${criticalInfo}`;
};
