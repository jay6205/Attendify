import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceSubmission from '../models/AttendanceSubmission.js';
import Course from '../models/Course.js';
import { processSubmission } from '../services/answerValidation.service.js';

// @desc    Start a Question-Based Attendance Session
// @route   POST /api/v2/attendance/ai/session/start
// @access  Private (Teacher)
export const startSession = async (req, res) => {
    try {
        const { courseId, question, keywords, durationMinutes = 10 } = req.body;

        // 1. Ownership Check
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        // 2. Close any existing active sessions for this course
        await AttendanceSession.updateMany(
            { course: courseId, isActive: true },
            { isActive: false }
        );

        // 3. Create New Session
        const expiresAt = new Date(Date.now() + durationMinutes * 60000);

        const session = await AttendanceSession.create({
            course: courseId,
            teacher: req.user._id,
            question,
            keywords: keywords || [],
            expiresAt,
            isActive: true
        });

        res.status(201).json(session);

    } catch (error) {
        console.error("Start Session Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit Answer for Attendance
// @route   POST /api/v2/attendance/ai/session/submit
// @access  Private (Student)
// @desc    Submit Answer for Attendance (with Retry Logic)
// @route   POST /api/v2/attendance/ai/session/submit
// @access  Private (Student)
export const submitAnswer = async (req, res) => {
    try {
        const { sessionId, answer } = req.body;
        const studentId = req.user._id;

        // 1. Find Active Session
        const session = await AttendanceSession.findOne({ _id: sessionId, isActive: true });

        if (!session) {
            return res.status(404).json({ message: 'Session invalid or expired' });
        }

        // 2. Expiry Check
        if (new Date() > new Date(session.expiresAt)) {
            // Close it lazily
            session.isActive = false;
            await session.save();
            return res.status(400).json({ message: 'Session expired' });
        }

        // 3. Enrollment Check
        const course = await Course.findById(session.course);
        if (!course.students.includes(studentId)) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        // 4. Retry / Duplicate Logic
        let submission = await AttendanceSubmission.findOne({ session: sessionId, student: studentId });
        const RETRY_LIMIT = 3; // Configurable?

        if (submission) {
            // A. If already approved, block.
            if (submission.status === 'Approved') {
                return res.status(400).json({ message: 'Attendance already marked (Approved).' });
            }
            
            // B. If pending, block (wait for result).
            if (submission.status === 'Pending') {
                 return res.status(400).json({ message: 'Previous submission is still pending.' });
            }

            // C. If rejected, check attempts.
            if (submission.status === 'Rejected' || submission.status === 'Failed') {
                if (submission.attempts >= RETRY_LIMIT) {
                    return res.status(400).json({ message: `Max attempts (${RETRY_LIMIT}) reached.` });
                }
                
                // Allow Retry: Update existing submission
                submission.answer = answer;
                submission.status = 'Pending';
                submission.verificationMethod = 'Manual'; // Reset or set to 'LLM' later
                submission.attempts += 1;
                await submission.save();

                // Trigger Validation again
                const result = await processSubmission(submission._id);
                
                return res.json({
                    message: 'Retry submitted',
                    status: result.status,
                    attempts: submission.attempts,
                    maxAttempts: RETRY_LIMIT
                });
            }
        } else {
            // 5. Create New Submission
            submission = await AttendanceSubmission.create({
                student: studentId,
                session: sessionId,
                answer,
                status: 'Pending',
                attempts: 1
            });
    
            // 6. Trigger Validation
            const result = await processSubmission(submission._id);
    
            return res.status(201).json({
                message: 'Submission received',
                status: result.status,
                method: result.method
            });
        }

    } catch (error) {
        console.error("Submit Answer Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Stop Session & Finalize Attendance
// @route   POST /api/v2/attendance/ai/session/stop
// @access  Private (Teacher)
export const stopSession = async (req, res) => {
    console.log(`[StopSession] Request received for session: ${req.body.sessionId}`);
    try {
        const { sessionId } = req.body;
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
            console.error(`[StopSession] Session not found: ${sessionId}`);
            return res.status(404).json({ message: 'Session not found' });
        }
        
        // Ownership
        if (session.teacher.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'Not authorized' });
        }

        if (!session.isActive) {
            console.warn(`[StopSession] Session already inactive: ${sessionId}`);
            // We might still want to run finalization if it was missed? For now, just return.
            // return res.status(400).json({ message: 'Session is already inactive' });
            // Actually, let's allow re-running finalization for debugging!
        }

        // 1. Close Session
        session.isActive = false;
        await session.save();
        console.log(`[StopSession] Session marked inactive.`);

        // 2. Finalize Attendance: Mark Absentees
        
        // A. Get All Enrolled Students
        const course = await Course.findById(session.course).populate('semester');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const allStudentIds = course.students.map(s => s.toString());
        console.log(`[StopSession] Total Enrolled: ${allStudentIds.length}`);

        // B. Get All Present Students
        // We look for Attendance records for this Course + Date (normalized).
        const attendanceDate = new Date(session.createdAt);
        attendanceDate.setHours(0,0,0,0);
        
        console.log(`[StopSession] Looking for Present records on Date: ${attendanceDate.toISOString()}`);

        const Attendance = (await import('../models/Attendance.js')).default;
        const presentRecords = await Attendance.find({
            course: course._id,
            date: attendanceDate,
            status: 'Present'
        }).select('student');

        const presentStudentIds = new Set(presentRecords.map(r => r.student.toString()));
        console.log(`[StopSession] Found Present: ${presentStudentIds.size}`);

        // C. Find Absentees
        const absentees = allStudentIds.filter(id => !presentStudentIds.has(id));
        console.log(`[StopSession] Identified Absentees: ${absentees.length}`);

        // D. Bulk Create Absent Records
        if (absentees.length > 0) {
            const absentDocs = absentees.map(studentId => ({
                student: studentId,
                course: course._id,
                semester: course.semester._id,
                date: attendanceDate,
                status: 'Absent',
                markedBy: req.user._id
            }));

            // Use insertMany with ordered: false
            try {
                const result = await Attendance.insertMany(absentDocs, { ordered: false });
                console.log(`[StopSession] Bulk Write Success. Inserted: ${result.length}`);
            } catch (err) {
                if (err.code !== 11000) {
                    console.error("[StopSession] Bulk Write Error:", err);
                } else {
                    console.log(`[StopSession] Partial duplicates ignored. Inserted: ${err.result?.nInserted}`);
                }
            }
        } else {
            console.log(`[StopSession] No absentees to mark.`);
        }

        res.json({
            message: 'Session stopped and attendance finalized.',
            summary: {
                totalEnrolled: allStudentIds.length,
                present: presentStudentIds.size,
                markedAbsent: absentees.length
            }
        });

    } catch (error) {
        console.error("[StopSession] Critical Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Active Session for a Course (For Student Dashboard)
// @route   GET /api/v2/attendance/ai/session/active/:courseId
// @access  Private
export const getActiveSession = async (req, res) => {
    try {
        const { courseId } = req.params;
        const session = await AttendanceSession.findOne({
            course: courseId,
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).select('-keywords'); // Hide keywords from students!

        if (!session) return res.json(null);

        res.json(session);
    } catch (error) {
        console.error("Get Active Session Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Stats for a specific Session (For Teacher Monitoring)
// @route   GET /api/v2/attendance/ai/session/:sessionId/stats
// @access  Private (Teacher)
export const getSessionStats = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await AttendanceSession.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Verify Ownership
        if (session.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const course = await Course.findById(session.course);
        const totalStudents = course.students.length;

        // Aggregation for Submissions
        const stats = await AttendanceSubmission.aggregate([
            { $match: { session: session._id } },
            {
                $group: {
                    _id: null,
                    totalSubmitted: { $sum: 1 },
                    approved: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } 
                    },
                    rejected: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } 
                    },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } 
                    },
                    failed: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } 
                    }
                }
            }
        ]);

        const data = stats[0] || { totalSubmitted: 0, approved: 0, rejected: 0, pending: 0, failed: 0 };

        res.json({
            session: {
                question: session.question,
                isActive: session.isActive,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt
            },
            stats: {
                totalEnrolled: totalStudents,
                ...data
            }
        });

    } catch (error) {
        console.error("Get Session Stats Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
