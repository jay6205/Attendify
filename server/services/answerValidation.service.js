import { generateLLMResponse } from './llm.service.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceSubmission from '../models/AttendanceSubmission.js';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import { llmQueue } from './llmQueue.service.js';

// --- Helper: Hard Filters ---
const runHardFilters = (answer) => {
    if (!answer) return { passed: false, reason: "Empty answer" };
    
    const trimmed = answer.toString().trim();
    const lower = trimmed.toLowerCase();

    // 1. Length Check
    if (trimmed.length < 3) return { passed: false, reason: "Too short" };
    // User asked for < 5 chars, but 'Yes' is 3. 
    // Wait, user said: "If answer length < 5 characters -> FAIL".
    // User also listed "yes", "no" as Stop Words to FAIL.
    // So < 5 is correct per user request.
    if (trimmed.length < 5) return { passed: false, reason: "Too short (< 5 chars)" };

    // 2. Stop Words (Low effort)
    const cleanAnswer = lower.replace(/[^a-z ]/g, ''); // Remove punctuation
    const stopWords = [
        'yes', 'no', 'yeah', 'yep', 'nope', 
        'ok', 'okay', 
        'present', 'here', 'present sir', 'present mam', 
        'done', 'completed', 
        'idk', 'i dont know', 'dont know', 'dunno', 
        'attendance', 'marked', 'marking'
    ];
    if (stopWords.includes(cleanAnswer)) return { passed: false, reason: "Low effort stop-word" };

    // 3. Keyword Spam (Repetition)
    const words = lower.split(/\s+/);
    const counts = {};
    for (const w of words) {
        if (!w) continue;
        counts[w] = (counts[w] || 0) + 1;
        if (counts[w] > 3) return { passed: false, reason: "Keyword spam" };
    }

    return { passed: true };
};

// --- 1. Main Validation Orchestrator ---
export const processSubmission = async (submissionId) => {
    const submission = await AttendanceSubmission.findById(submissionId).populate('session');
    if (!submission) throw new Error('Submission not found');

    const { session, answer } = submission;

    // A. Hard Filters
    const filterResult = runHardFilters(answer);
    if (!filterResult.passed) {
        await AttendanceSubmission.findByIdAndUpdate(submissionId, {
            status: 'Rejected',
            verificationMethod: 'HardFilter',
            confidenceScore: 0,
            processedAt: new Date()
        });
        return { status: 'Rejected', method: 'HardFilter', reason: filterResult.reason };
    }

    // B. Keyword Check (Prerequisite if keywords exist)
    let keywordPassed = false;
    let keywordRequired = false;

    if (session.keywords && session.keywords.length > 0) {
        keywordRequired = true;
        const lowerAnswer = answer.toLowerCase();
        // Check if ANY keyword is present
        keywordPassed = session.keywords.some(k => lowerAnswer.includes(k.toLowerCase()));
        
        // Strict Rule: If keywords exist but NONE match -> Fail immediately (AND logic)
        if (!keywordPassed) {
            await AttendanceSubmission.findByIdAndUpdate(submissionId, {
                status: 'Rejected',
                verificationMethod: 'KeywordMissing',
                confidenceScore: 0,
                processedAt: new Date()
            });
            return { status: 'Rejected', method: 'KeywordMissing' };
        }
    }

    // So far:
    // - If keywords required: we passed here (matched).
    // - If keywords not required: we passed here.

    // C. LLM Check
    if (session.config.llmEnabled || session.config.llmEnabled === undefined) { 
        // Default to enabled if undefined? Or check model. 
        // Assuming session.config might be just generic, but usually bool.
        // If enabled, we enqueue.
        // Note: Even if keywordPassed is true, we STILL check LLM if enabled (Strict AND).
        
        llmQueue.enqueue(submissionId, session.question, answer, session._id);
        return { status: 'Pending', method: 'LLM_Queue' };
    }

    // D. Fallback (LLM Disabled)
    // If LLM is disabled, we rely solely on Keywords if they exist.
    if (keywordPassed) {
        await AttendanceSubmission.findByIdAndUpdate(submissionId, {
            status: 'Approved',
            verificationMethod: 'KeywordOnly',
            confidenceScore: 1.0,
            processedAt: new Date()
        });
        await markAttendanceAfterValidation(submissionId);
        return { status: 'Approved', method: 'KeywordOnly' };
    }

    // If matches nothing and LLM disabled -> Reject
    await AttendanceSubmission.findByIdAndUpdate(submissionId, {
        status: 'Rejected',
        verificationMethod: 'Manual',
        processedAt: new Date()
    });
    return { status: 'Rejected', method: 'Fail' };
};

// --- 2. LLM Logic ---
export const validateWithLLM = async (question, answer) => {
    const systemPrompt = `
    You are a strict academic answer validator.
    
    Rules:
    1. You must be STRICT.
    2. If answer is vague, unrelated, or generic -> mark isValid: FALSE.
    3. If answer is only 1 keyword or guessing -> mark isValid: FALSE.
    4. If answer is filler text -> mark isValid: FALSE.
    5. Only mark isValid: TRUE if answer clearly addresses the question meaningfully.
    
    Examples of WRONG answers:
    - "present"
    - "idk" / "i don't know"
    - "attendance"
    - Copying question text
    - Random unrelated sentence
    
    Output JSON ONLY:
    {
        "isValid": boolean,
        "confidence": number,
        "reason": string
    }
    `;

    try {
        // Pass strictly separated System Prompt and User Message
        const responseText = await generateLLMResponse(systemPrompt, `Question: ${question}\nStudent Answer: ${answer}`);
        
        if (!responseText) return { isValid: false, confidence: 0 };

        // Parse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { isValid: false, confidence: 0 };
        
        const result = JSON.parse(jsonMatch[0]);
        
        // Strict Confidence Threshold
        const threshold = 0.8;
        const passed = result.isValid && (result.confidence >= threshold);

        return {
            isValid: passed,
            confidence: result.confidence || 0,
            reason: result.reason
        };
    } catch (error) {
        console.error("LLM Validation Error:", error);
        return { isValid: false, confidence: 0 };
    }
};

// --- 3. Finalize: Write to Real Attendance Table ---
// --- 3. Finalize: Write to Real Attendance Table ---
export const markAttendanceAfterValidation = async (submissionId) => {
    console.log(`[ValidationService] markAttendanceAfterValidation called for ${submissionId}`);
    try {
        const submission = await AttendanceSubmission.findById(submissionId).populate('session');
        if (!submission) {
             console.error(`[ValidationService] Submission ${submissionId} not found.`);
             return;
        }
        if (submission.status !== 'Approved') {
             console.log(`[ValidationService] Submission ${submissionId} is not Approved (Status: ${submission.status}). Aborting write.`);
             return;
        }

        const { student, session } = submission;
        const courseId = session.course;

        // 1. Fetch Course with Semester (Critical for Attendance Model)
        const course = await Course.findById(courseId).populate('semester');
        if (!course) {
            console.error(`[ValidationService] AI Attendance Error: Course not found for ${courseId}`);
            return;
        }

        if (!course.semester) {
            console.error(`[ValidationService] AI Attendance Error: Course ${courseId} has no linked semester`);
            return;
        }

        // 2. Normalize Date (Identical to Manual Controller)
        // Use the SESSION creation time, not "now", to handle late processing?
        // User requested: "date: sessionLectureDate" (implied).
        // If session was started today, use today.
        // Let's use session.createdAt to be safe, so if processed late, it still marks for the correct day.
        const attendanceDate = new Date(session.createdAt); 
        attendanceDate.setHours(0, 0, 0, 0);

        console.log(`[ValidationService] Writing Attendance: Student=${student}, Course=${courseId}, Date=${attendanceDate.toISOString()}`);
        console.log(`[ValidationService] Target Collection: ${Attendance.collection.name}`);

        // 3. Write to Attendance Collection
        const result = await Attendance.findOneAndUpdate(
            {
                student: student,
                course: courseId,
                date: attendanceDate
            },
            {
                student: student,
                course: courseId,
                semester: course.semester._id, // Must be ID
                date: attendanceDate,
                status: 'Present',
                markedBy: session.teacher
            },
            { new: true, upsert: true }
        );

        if (result) {
            console.log(`✅ [ValidationService] AI Attendance Marked: ID=${result._id} | Student ${student} | Course ${courseId}`);
        } else {
            console.error(`❌ [ValidationService] AI Attendance Write returned NULL for ${student} in ${courseId}`);
        }

    } catch (error) {
        console.error("❌ [ValidationService] AI Attendance Write Failed:", error);
    }
};
