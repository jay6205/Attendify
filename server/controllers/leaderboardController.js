import StudentMark from '../models/StudentMark.js';
import Assessment from '../models/Assessment.js';

// Helper: build competition-ranked leaderboard from sorted marks
const buildRankedLeaderboard = (marks) => {
    const leaderboard = [];
    let currentRank = 1;

    for (let i = 0; i < marks.length; i++) {
        if (i > 0 && marks[i].obtainedMarks < marks[i - 1].obtainedMarks) {
            currentRank = i + 1;
        }
        leaderboard.push({
            rank: currentRank,
            studentId: marks[i].student._id || marks[i].student,
            name: marks[i].student.name || '',
            email: marks[i].student.email || '',
            obtainedMarks: marks[i].obtainedMarks
        });
    }
    return leaderboard;
};

// @desc    Get leaderboard for a specific assessment
// @route   GET /api/v2/leaderboard/assessment/:assessmentId
// @access  Student, Teacher, Admin
export const getAssessmentLeaderboard = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        // Verify assessment exists
        const assessment = await Assessment.findById(assessmentId)
            .populate('course', 'name code organization teacher students'); // Added fields for RBAC
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        const role = req.user.role;
        const course = assessment.course;

        // RBAC validation
        if (role === 'student') {
            if (!course.students.some(id => id.toString() === req.user._id.toString())) {
                return res.status(403).json({ message: 'Not enrolled in this course' });
            }
        } else if (role === 'teacher') {
            if (course.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized for this course' });
            }
        } else if (role === 'admin') {
            if (course.organization.toString() !== req.user.organization.toString()) {
                return res.status(403).json({ message: 'Not authorized for this organization' });
            }
        }

        // Fetch all marks sorted descending
        const marks = await StudentMark.find({ assessment: assessmentId })
            .populate('student', 'name email')
            .sort({ obtainedMarks: -1 });

        if (marks.length === 0) {
            return res.json({
                assessment: {
                    _id: assessment._id,
                    title: assessment.title,
                    maxMarks: assessment.maxMarks,
                    course: assessment.course
                },
                leaderboard: [],
                myEntry: null
            });
        }

        // Build current leaderboard
        const leaderboard = buildRankedLeaderboard(marks);

        // --- Rank Change: find previous assessment for same course ---
        const previousAssessment = await Assessment.findOne({
            course: assessment.course._id || assessment.course,
            date: { $lt: assessment.date },
            _id: { $ne: assessment._id }
        }).sort({ date: -1 });

        let prevRankMap = {}; // studentId -> rank

        if (previousAssessment) {
            const prevMarks = await StudentMark.find({ assessment: previousAssessment._id })
                .populate('student', 'name email')
                .sort({ obtainedMarks: -1 });

            if (prevMarks.length > 0) {
                const prevLeaderboard = buildRankedLeaderboard(prevMarks);
                prevLeaderboard.forEach(e => {
                    prevRankMap[e.studentId.toString()] = e.rank;
                });
            }
        }

        // Attach rankChange to each entry
        leaderboard.forEach(entry => {
            const prevRank = prevRankMap[entry.studentId.toString()];

            if (prevRank == null) {
                entry.rankChange = { status: 'NEW', changeValue: 0 };
            } else if (entry.rank < prevRank) {
                entry.rankChange = { status: 'UP', changeValue: prevRank - entry.rank };
            } else if (entry.rank > prevRank) {
                entry.rankChange = { status: 'DOWN', changeValue: entry.rank - prevRank };
            } else {
                entry.rankChange = { status: 'SAME', changeValue: 0 };
            }
        });

        // Build response
        const responseData = {
            assessment: {
                _id: assessment._id,
                title: assessment.title,
                maxMarks: assessment.maxMarks,
                course: {
                    _id: assessment.course._id,
                    name: assessment.course.name,
                    code: assessment.course.code
                }
            }
        };

        if (role === 'student') {
            const top10 = leaderboard.slice(0, 10);
            const myEntry = leaderboard.find(e => e.studentId.toString() === req.user._id.toString()) || null;

            responseData.leaderboard = top10;
            responseData.myEntry = myEntry;
            responseData.totalStudents = leaderboard.length;
        } else {
            responseData.leaderboard = leaderboard;
            responseData.totalStudents = leaderboard.length;
        }

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
