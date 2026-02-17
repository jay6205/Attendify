import User from '../models/User.js';
import ChatHistory from '../models/ChatHistory.js';
import Attendance from '../models/Attendance.js';
import StudentMark from '../models/StudentMark.js';
import Assessment from '../models/Assessment.js';
import Alert from '../models/Alert.js';
import Course from '../models/Course.js';
import { computeStudentAttendanceTruth } from './attendanceTruth.service.js';
import { detectChatIntent } from './chatIntent.service.js';
import { extractEntities } from './entityExtraction.service.js';

/**
 * Main Orchestrator for Chat Queries
 * @param {Object} user - The authenticated user object
 * @param {string} message - The raw message string
 * @returns {Promise<{ intent: string, response: string }>}
 */
export const handleChatQuery = async (user, message) => {
    try {
        // 0. Check Context (Did the bot ask a question previously?)
        const lastChat = await ChatHistory.findOne({ user: user._id, sender: 'bot' }).sort({ timestamp: -1 });
        let intent = 'UNKNOWN';
        let contextEntities = {};

        // If the last message from bot has metadata expecting input
        if (lastChat && lastChat.meta && lastChat.meta.awaitingInput) {
            // Check if current message is a valid response (e.g. a number)
            const numberMatch = message.match(/(\d+)/);
            if (numberMatch) {
                // Restore intent and merge entities
                intent = lastChat.meta.originalIntent;
                contextEntities = { ...lastChat.meta.entities, threshold: parseInt(numberMatch[0]) };
            }
        }

        // 1. Detect Intent (if not restored from context)
        if (intent === 'UNKNOWN') {
            intent = detectChatIntent(message);
        }

        // 2. Extract Entities (Subject, Batch, etc.)
        const extractedEntities = await extractEntities(message, user.organization);

        // Merge context entities with extracted entities
        const entities = { ...contextEntities, ...extractedEntities };
        if (contextEntities.threshold && !extractedEntities.threshold) {
            entities.threshold = contextEntities.threshold;
        }

        // 3. Route to specific handler based on Intent & Role
        let response = "";
        let meta = null;

        switch (intent) {
            case 'GET_ATTENDANCE':
                response = await handleGetAttendance(user, entities);
                break;
            case 'GET_MARKS':
                response = await handleGetMarks(user, entities);
                break;
            case 'GET_NEXT_TEST':
                response = await handleGetNextTest(user);
                break;
            case 'GET_CHILD_ATTENDANCE':
                response = await handleGetChildAttendance(user);
                break;
            case 'GET_ALERTS':
                response = await handleGetAlerts(user);
                break;
            case 'GET_LATEST_TEST_RESULT':
                response = await handleGetLatestTestResult(user);
                break;
            case 'GET_LOW_ATTENDANCE_STUDENTS':
                response = await handleGetLowAttendanceStudents(user, entities);
                break;
            case 'GET_WEAK_STUDENTS_BATCH':
                const result = await handleGetWeakStudentsBatch(user, entities);
                response = result.response;
                meta = result.meta;
                break;
            case 'GREETING':
                response = `Hello ${user.name.split(' ')[0]}! I'm your Attendify Assistant. Ask me about attendance, marks, or upcoming tests.`;
                break;
            case 'UNKNOWN':
            default:
                response = "Sorry, I didn't quite catch that. Try asking about 'my attendance', 'physics marks', or 'next test'.";
                break;
        }

        return { intent, response, meta };

    } catch (error) {
        console.error("Chat Logic Error:", error);
        return {
            intent: 'ERROR',
            response: "I'm having trouble accessing the records right now. Please try again later."
        };
    }
};

// --- HANDLERS ---

/**
 * Handle GET_ATTENDANCE
 * Roles: Student (Own), Parent (Block - use GET_CHILD_ATTENDANCE), Teacher (Block)
 */
const handleGetAttendance = async (user, entities) => {
    if (user.role !== 'student') {
        return `As a ${user.role}, please use the dashboard to view attendance records.`;
    }

    const truth = await computeStudentAttendanceTruth(user._id);

    // If subject specified
    if (entities.subjectName) {
        // Fuzzy match from truth details
        // courseName in truth details might differ slightly from extracted entity, but entity extractor returned a valid course name from DB
        const specificCourse = truth.details.find(c => c.courseName === entities.subjectName || c.courseCode === entities.subjectName); // simplified match

        if (specificCourse) {
            return `Your attendance in ${specificCourse.courseName} is ${specificCourse.percentage}%. (${specificCourse.present}/${specificCourse.total} classes)`;
        } else {
            // Fallback: search loosely
            const looseMatch = truth.details.find(c => c.courseName.toLowerCase().includes(entities.subjectName.toLowerCase()));
            if (looseMatch) {
                return `Your attendance in ${looseMatch.courseName} is ${looseMatch.percentage}%.`;
            }
            return `I couldn't find attendance records for ${entities.subjectName}.`;
        }
    }

    // Overall
    let response = `Your overall attendance is ${truth.attendancePercent}%.`;
    if (truth.status === 'WARNING' || truth.status === 'CRITICAL') {
        const lowCourses = truth.details.filter(c => c.percentage < 75).map(c => c.courseName).join(', ');
        response += ` You are below 75% in: ${lowCourses}.`;
    } else {
        response += ` You are doing well!`;
    }
    return response;
};

/**
 * Handle GET_MARKS
 * Roles: Student
 */
const handleGetMarks = async (user, entities) => {
    if (user.role !== 'student') {
        return "Please use the dashboard for detailed marks analysis.";
    }

    const query = { student: user._id };

    // If subject specified, filter by course
    if (entities.subjectId) { // entities.subjectId comes from Course model, but StudentMark has 'course' field
        query.course = entities.subjectId;
    }

    const marks = await StudentMark.find(query)
        .populate('assessment', 'title maxMarks date')
        .populate('course', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

    if (!marks || marks.length === 0) {
        return entities.subjectName
            ? `No marks found for ${entities.subjectName}.`
            : "No marks recorded for you yet.";
    }

    if (entities.subjectName) {
        // Summary for specific subject
        const latest = marks[0];
        if (!latest.course || !latest.assessment) {
            return `Found marks for ${entities.subjectName} but course/assessment details are unavailable.`;
        }
        return `In ${latest.course.name}, you scored ${latest.obtainedMarks}/${latest.assessment.maxMarks} in ${latest.assessment.title}.`;
    }

    // General Summary (latest 3)
    const summary = marks.slice(0, 3).map(m => `${m.course.name} (${m.assessment.title}): ${m.obtainedMarks}/${m.assessment.maxMarks}`).join('\n');
    return `Here are your recent marks:\n${summary}`;
};

/**
 * Handle GET_NEXT_TEST
 * Roles: Student
 */
const handleGetNextTest = async (user) => {
    if (user.role !== 'student') return "Upcoming tests are visible on your calendar.";

    // Find assessments with date > now
    // We need to find courses the student is enrolled in first
    const enrolledCourses = await Course.find({ students: user._id }).select('_id');
    const courseIds = enrolledCourses.map(c => c._id);

    const nextTest = await Assessment.findOne({
        course: { $in: courseIds },
        date: { $gte: new Date() }
    })
        .sort({ date: 1 })
        .populate('course', 'name');

    if (!nextTest) {
        return "No upcoming tests scheduled.";
    }

    const dateOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const dateStr = new Date(nextTest.date).toLocaleString('en-US', dateOptions);

    return `Next test: ${nextTest.title} for ${nextTest.course.name} is on ${dateStr}.`;
};

/**
 * Handle GET_CHILD_ATTENDANCE
 * Roles: Parent
 */
const handleGetChildAttendance = async (user) => {
    if (user.role !== 'parent') return "This query is for parents only.";

    if (!user.linkedChildren || user.linkedChildren.length === 0) {
        return "No students are linked to your account. Please contact the administrator.";
    }

    let response = "";
    for (const childId of user.linkedChildren) {
        // Fetch Child Name
        const child = await User.findById(childId).select('name');
        if (!child) continue;

        const truth = await computeStudentAttendanceTruth(childId);
        response += `${child.name}: ${truth.attendancePercent}% Overall.\n`;

        const lowCourses = truth.details.filter(c => c.percentage < 75);
        if (lowCourses.length > 0) {
            response += `⚠️ Low in: ${lowCourses.map(c => c.courseName).join(', ')}.\n`;
        }
    }

    return response || "Could not fetch child data.";
};

/**
 * Handle GET_ALERTS
 * Roles: Parent
 */
const handleGetAlerts = async (user) => {
    if (user.role !== 'parent') return "This query is for parents only.";

    // Alerts for the parent user regarding their children
    // In Alert model, 'user' is the recipient? Or the subject? 
    // Usually 'user' in Alert is the recipient. 
    // So we just check alerts where user = parent._id

    const alerts = await Alert.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(3);

    if (alerts.length === 0) return "No recent alerts.";

    return "Recent Alerts:\n" + alerts.map(a => `• ${a.title}: ${a.message}`).join('\n');
};

/**
 * Handle GET_LATEST_TEST_RESULT (Parent)
 */
const handleGetLatestTestResult = async (user) => {
    if (user.role !== 'parent') return "This query is for parents only.";

    if (!user.linkedChildren || user.linkedChildren.length === 0) return "No linked students.";

    let response = "";
    for (const childId of user.linkedChildren) {
        const child = await User.findById(childId).select('name');
        if (!child) continue;

        const latestMark = await StudentMark.findOne({ student: childId })
            .sort({ createdAt: -1 })
            .populate('assessment', 'title maxMarks')
            .populate('course', 'name');

        if (latestMark) {
            response += `${child.name} scored ${latestMark.obtainedMarks}/${latestMark.assessment.maxMarks} in ${latestMark.course.name} (${latestMark.assessment.title}).\n`;
        } else {
            response += `${child.name}: No marks recorded yet.\n`;
        }
    }
    return response || "No data found.";
};

/**
 * Handle GET_LOW_ATTENDANCE_STUDENTS
 * Roles: Teacher
 */
const handleGetLowAttendanceStudents = async (user, entities) => {
    if (user.role !== 'teacher') return "Access restricted to teachers.";

    const threshold = entities.threshold || 75;

    // 1. Get Teacher's Courses
    const courses = await Course.find({ teacher: user._id }).populate('students', 'name email');
    if (!courses || courses.length === 0) return "You are not assigned to any courses.";

    let report = [];

    // 2. For each course, check attendance
    // Optimized: This is heavy. In real app, we should aggregate. 
    // Here we iterate for simplicity as per requirements (Performance Rules: "Avoid DB calls for intent detection" - but data fetch is allowed)

    // Let's pick the first 3 courses to avoid timeout if many
    for (const course of courses.slice(0, 3)) {
        const result = await Attendance.aggregate([
            { $match: { course: course._id } },
            {
                $group: {
                    _id: "$student",
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
                }
            },
            {
                $project: {
                    percentage: {
                        $cond: [
                            { $eq: ["$total", 0] },
                            0,
                            { $multiply: [{ $divide: ["$present", "$total"] }, 100] }
                        ]
                    }
                }
            },
            { $match: { percentage: { $lt: threshold } } }
        ]);

        if (result.length > 0) {
            // Map IDs back to names
            const defaulterIds = result.map(r => r._id.toString());
            const defaulterNames = course.students
                .filter(s => defaulterIds.includes(s._id.toString()))
                .map(s => s.name);

            if (defaulterNames.length > 0) {
                report.push(`${course.code}: ${defaulterNames.slice(0, 5).join(', ')}${defaulterNames.length > 5 ? '...' : ''}`);
            }
        }
    }

    if (report.length === 0) return `No students below ${threshold}% in your courses.`;

    return `Defaulters list (<${threshold}%):\n` + report.join('\n');
};

/**
 * Handle GET_WEAK_STUDENTS_BATCH
 * Roles: Teacher
 */
const handleGetWeakStudentsBatch = async (user, entities) => {
    if (user.role !== 'teacher') return { response: "Access restricted to teachers." };

    // 1. Check if threshold is provided
    if (!entities.threshold) {
        return {
            response: "What is the threshold percentage for identifying weak students? (e.g. 40)",
            meta: {
                awaitingInput: true,
                originalIntent: 'GET_WEAK_STUDENTS_BATCH',
                entities: entities
            }
        };
    }

    const threshold = entities.threshold;

    // 2. Logic to find students with avg marks < threshold
    const courses = await Course.find({ teacher: user._id }).populate('students', 'name');
    if (!courses || courses.length === 0) return { response: "You are not assigned to any courses." };

    let report = [];

    for (const course of courses.slice(0, 3)) {
        // Aggregate marks for this course
        // We will look for students whose average percentage across all assessments in this course is < threshold.

        const studentPerformance = await StudentMark.aggregate([
            { $match: { course: course._id } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentDetails'
                }
            },
            { $unwind: '$assessmentDetails' },
            {
                $group: {
                    _id: '$student',
                    totalObtained: { $sum: '$obtainedMarks' },
                    totalMax: { $sum: '$assessmentDetails.maxMarks' }
                }
            },
            {
                $project: {
                    percentage: {
                        $cond: [
                            { $eq: ['$totalMax', 0] },
                            0,
                            { $multiply: [{ $divide: ['$totalObtained', '$totalMax'] }, 100] }
                        ]
                    }
                }
            },
            { $match: { percentage: { $lt: threshold } } }
        ]);

        if (studentPerformance.length > 0) {
            const weakIds = studentPerformance.map(s => s._id.toString());
            const weakNames = course.students
                .filter(s => weakIds.includes(s._id.toString()))
                .map(s => s.name);

            if (weakNames.length > 0) {
                report.push(`${course.code}: ${weakNames.join(', ')}`);
            }
        }
    }

    if (report.length === 0) return { response: `No students found with average marks below ${threshold}% in your courses.` };

    return { response: `Weak Students (<${threshold}%):\n` + report.join('\n') };
};
