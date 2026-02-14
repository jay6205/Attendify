import Assessment from '../models/Assessment.js';
import StudentMark from '../models/StudentMark.js';
import Course from '../models/Course.js';

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
// @desc    Get all assessments by teacher
// @route   GET /api/v2/marks/assessment/teacher/all
// @access  Teacher
export const getTeacherAssessments = async (req, res) => {
    try {
        const assessments = await Assessment.find({ teacher: req.user._id })
            .populate('course', 'name code')
            .sort({ date: -1 });

        // Get submission counts for each assessment
        const assessmentsWithCounts = await Promise.all(assessments.map(async (assessment) => {
            const submissionCount = await StudentMark.countDocuments({ assessment: assessment._id });
            return {
                ...assessment.toObject(),
                submissionCount
            };
        }));

        res.json(assessmentsWithCounts);
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

        // 2. Get Class Averages for these assessments
        const assessmentIds = marks.map(m => m.assessment._id);

        const stats = await StudentMark.aggregate([
            { $match: { assessment: { $in: assessmentIds } } },
            {
                $group: {
                    _id: "$assessment",
                    avgMarks: { $avg: "$obtainedMarks" }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(s => {
            statsMap[s._id.toString()] = s.avgMarks;
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

            const avg = statsMap[mark.assessment._id.toString()] || 0;
            // Calculate avg percentage: (avgMarks / maxMarks) * 100
            const max = mark.assessment.maxMarks;
            const avgPercentage = max > 0 ? ((avg / max) * 100).toFixed(1) : 0;

            acc[courseCode].assessments.push({
                _id: mark.assessment._id,
                title: mark.assessment.title,
                type: mark.assessment.examType,
                obtained: mark.obtainedMarks,
                max: mark.assessment.maxMarks,
                date: mark.assessment.date,
                classAverageMarks: parseFloat(avg.toFixed(1)),
                classAveragePercentage: parseFloat(avgPercentage)
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
