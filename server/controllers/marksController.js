import Assessment from '../models/Assessment.js';
import StudentMark from '../models/StudentMark.js';
import Course from '../models/Course.js';
import { createBulkAlert } from '../services/alert.service.js';
import { evaluateAcademicAchievements } from '../services/achievement.service.js';

// @desc    Create a new assessment
// @route   POST /api/v2/marks/assessment/create
// @access  Teacher
export const createAssessment = async (req, res) => {
    try {
        const { courseId, title, maxMarks, examType, date } = req.body;

        // 1. Verify teacher owns the course
        const course = await Course.findOne({
            _id: courseId,
            teacher: req.user._id
        });

        if (!course) {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        // 2. Check for duplicate assessment title in this course
        const existingAssessment = await Assessment.findOne({
            course: courseId,
            title: title
        });

        if (existingAssessment) {
            return res.status(400).json({ message: 'Assessment with this title already exists' });
        }

        // 3. Create Assessment
        const assessment = await Assessment.create({
            course: courseId,
            teacher: req.user._id,
            organization: req.user.organization,
            title,
            maxMarks,
            examType,
            date
        });

        res.status(201).json(assessment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all assessments by teacher
// @route   GET /api/v2/marks/assessment/teacher/all
// @access  Teacher
export const getTeacherAssessments = async (req, res) => {
    try {
        const assessments = await Assessment.find({ 
            teacher: req.user._id,
            organization: req.user.organization // FIX: Tenant scoped
        })
            .populate('course', 'name code')
            .sort({ date: -1 });

        // Get stats for all assessments in one aggregation
        const assessmentIds = assessments.map(a => a._id);
        const stats = await StudentMark.aggregate([
            { $match: { assessment: { $in: assessmentIds } } },
            {
                $group: {
                    _id: "$assessment",
                    count: { $sum: 1 },
                    avg: { $avg: "$obtainedMarks" },
                    highest: { $max: "$obtainedMarks" },
                    lowest: { $min: "$obtainedMarks" }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(s => { statsMap[s._id.toString()] = s; });

        const assessmentsWithStats = assessments.map(assessment => {
            const s = statsMap[assessment._id.toString()] || {};
            return {
                ...assessment.toObject(),
                submissionCount: s.count || 0,
                avgMarks: s.avg != null ? parseFloat(s.avg.toFixed(1)) : null,
                highestMarks: s.highest ?? null,
                lowestMarks: s.lowest ?? null
            };
        });

        res.json(assessmentsWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Enter or update marks for an assessment
// @route   POST /api/v2/marks/assessment/:assessmentId/enter
// @access  Teacher
export const enterMarks = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const marksData = req.body; // Expecting array: [{ studentId, obtainedMarks }]

        if (!Array.isArray(marksData) || marksData.length === 0) {
            return res.status(400).json({ message: 'Invalid marks data' });
        }

        // 1. Fetch Assessment and verify ownership
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        if (assessment.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this assessment' });
        }

        // 2. Fetch Course to validate students
        const course = await Course.findById(assessment.course);
        if (!course) {
            return res.status(404).json({ message: 'Associated course not found' });
        }

        const validStudentIds = new Set(course.students.map(id => id.toString()));
        const bulkOps = [];
        const errors = [];

        for (const entry of marksData) {
            const { studentId, obtainedMarks } = entry;

            // Validation: Student must be in course
            if (!validStudentIds.has(studentId)) {
                errors.push(`Student ${studentId} not enrolled in course`);
                continue;
            }

            // Validation: Marks checks
            if (obtainedMarks < 0 || obtainedMarks > assessment.maxMarks) {
                errors.push(`Marks for student ${studentId} invalid (Max: ${assessment.maxMarks})`);
                continue;
            }

            // Prepare upsert operation
            bulkOps.push({
                updateOne: {
                    filter: { assessment: assessmentId, student: studentId },
                    update: {
                        $set: {
                            obtainedMarks,
                            enteredBy: req.user._id,
                            course: assessment.course // Keep redundant link for query speed
                        }
                    },
                    upsert: true
                }
            });
        }

        if (bulkOps.length > 0) {
            await StudentMark.bulkWrite(bulkOps);

            // ALERT TRIGGER: notify students that marks have been published
            if (course.organization) {
                const studentIds = marksData
                    .filter(e => validStudentIds.has(e.studentId))
                    .map(e => e.studentId);
                createBulkAlert(
                    studentIds,
                    course.organization,
                    'MARKS_PUBLISHED',
                    `Marks published: ${assessment.title}`,
                    `Marks for "${assessment.title}" in ${course.name} (${course.code}) have been published.`,
                    { assessmentId: assessment._id, courseId: course._id, assessmentTitle: assessment.title }
                ).catch(err => console.error(`[AlertTrigger] Failed marks alert for assessment=${assessment._id} course=${course._id}:`, err.message));
            }

            // ACHIEVEMENT TRIGGER: evaluate for top score or perfect score (fire-and-forget)
            evaluateAcademicAchievements(assessmentId).catch(err => 
                console.error(`[AchievementTrigger] Failed academic eval for assessment=${assessmentId}:`, err.message)
            );
        }

        res.json({
            message: 'Marks processed',
            processed: bulkOps.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all marks for a specific assessment
// @route   GET /api/v2/marks/assessment/:assessmentId
// @access  Teacher (Owner)
export const getAssessmentMarks = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        const assessment = await Assessment.findById(assessmentId)
            .populate('course', 'name code');

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        if (assessment.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const marks = await StudentMark.find({ assessment: assessmentId })
            .populate('student', 'name email details.studentId');

        res.json({
            assessment,
            marks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all marks for the logged-in student
// @route   GET /api/v2/marks/my
// @access  Student
export const getMyMarks = async (req, res) => {
    try {
        // 1. Find all marks for this student
        const marks = await StudentMark.find({ student: req.user._id })
            .populate({
                path: 'assessment',
                select: 'title maxMarks examType date'
            })
            .populate({
                path: 'course',
                select: 'name code'
            })
            .sort({ createdAt: -1 });

        // 2. Get Class Stats for these assessments (avg, highest, lowest, all scores)
        const assessmentIds = marks.map(m => m.assessment._id);

        const stats = await StudentMark.aggregate([
            { $match: { assessment: { $in: assessmentIds } } },
            {
                $group: {
                    _id: "$assessment",
                    avgMarks: { $avg: "$obtainedMarks" },
                    highestMarks: { $max: "$obtainedMarks" },
                    lowestMarks: { $min: "$obtainedMarks" },
                    totalStudents: { $sum: 1 },
                    allScores: { $push: "$obtainedMarks" }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(s => {
            statsMap[s._id.toString()] = s;
        });

        // 3. Group by course
        const grouped = marks.reduce((acc, mark) => {
            const courseCode = mark.course.code;
            if (!acc[courseCode]) {
                acc[courseCode] = {
                    courseName: mark.course.name,
                    assessments: []
                };
            }

            const stat = statsMap[mark.assessment._id.toString()] || {};
            const avg = stat.avgMarks || 0;
            const max = mark.assessment.maxMarks;
            const avgPercentage = max > 0 ? ((avg / max) * 100).toFixed(1) : 0;

            // Calculate percentile: (students scoring <= this student / total) * 100
            const allScores = stat.allScores || [];
            const totalStudents = stat.totalStudents || 1;
            const studentScore = mark.obtainedMarks;
            const studentsAtOrBelow = allScores.filter(s => s <= studentScore).length;
            const percentile = parseFloat(((studentsAtOrBelow / totalStudents) * 100).toFixed(1));

            acc[courseCode].assessments.push({
                _id: mark.assessment._id,
                title: mark.assessment.title,
                type: mark.assessment.examType,
                obtained: mark.obtainedMarks,
                max: mark.assessment.maxMarks,
                date: mark.assessment.date,
                classAverageMarks: parseFloat(avg.toFixed(1)),
                classAveragePercentage: parseFloat(avgPercentage),
                classHighest: stat.highestMarks || 0,
                classLowest: stat.lowestMarks || 0,
                totalStudents,
                percentile
            });
            return acc;
        }, {});

        // Convert to array
        const result = Object.values(grouped);

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all assessments for a specific course
// @route   GET /api/v2/marks/assessment/course/:courseId
// @access  Teacher, Admin
export const getAssessmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Role-based authorization
        if (req.user.role === 'teacher') {
            const course = await Course.findOne({
                _id: courseId,
                teacher: req.user._id
            });
            if (!course) {
                return res.status(403).json({ message: 'Not authorized for this course' });
            }
        } else if (req.user.role === 'admin') {
            const course = await Course.findOne({
                _id: courseId,
                organization: req.user.organization
            });
            if (!course) {
                return res.status(403).json({ message: 'Not authorized for this course' });
            }
        } else {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        const assessments = await Assessment.find({ course: courseId })
            .populate('course', 'name code')
            .sort({ date: -1 });
        res.json(assessments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};