import Assessment from '../models/Assessment.js';
import StudentMark from '../models/StudentMark.js';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get institute-wide performance overview
// @route   GET /api/v2/admin/performance/institute
// @access  Private/Admin
export const getInstitutePerformance = async (req, res) => {
    try {
        const orgId = req.user.organization;
        if (!orgId) return res.status(400).json({ message: 'Organization context required' });

        const orgObjectId = new mongoose.Types.ObjectId(orgId);

        // 1. Overall marks aggregation
        const overallAgg = await StudentMark.aggregate([
            { $match: { organization: orgObjectId } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $addFields: {
                    percentage: {
                        $cond: [
                            { $gt: ['$assessmentInfo.maxMarks', 0] },
                            { $multiply: [{ $divide: ['$obtainedMarks', '$assessmentInfo.maxMarks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgPercentage: { $avg: '$percentage' },
                    totalMarksEntries: { $sum: 1 },
                    passCount: {
                        $sum: { $cond: [{ $gte: ['$percentage', 40] }, 1, 0] }
                    }
                }
            }
        ]);

        const overall = overallAgg[0] || { avgPercentage: 0, totalMarksEntries: 0, passCount: 0 };
        const passRate = overall.totalMarksEntries > 0
            ? Math.round((overall.passCount / overall.totalMarksEntries) * 100)
            : 0;

        // 2. Exam-type breakdown
        const examTypeAgg = await StudentMark.aggregate([
            { $match: { organization: orgObjectId } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $addFields: {
                    percentage: {
                        $cond: [
                            { $gt: ['$assessmentInfo.maxMarks', 0] },
                            { $multiply: [{ $divide: ['$obtainedMarks', '$assessmentInfo.maxMarks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$assessmentInfo.examType',
                    avgPercentage: { $avg: '$percentage' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Per-course summary
        const courseAgg = await StudentMark.aggregate([
            { $match: { organization: orgObjectId } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            {
                $addFields: {
                    percentage: {
                        $cond: [
                            { $gt: ['$assessmentInfo.maxMarks', 0] },
                            { $multiply: [{ $divide: ['$obtainedMarks', '$assessmentInfo.maxMarks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$course',
                    courseName: { $first: '$courseInfo.name' },
                    courseCode: { $first: '$courseInfo.code' },
                    avgPercentage: { $avg: '$percentage' },
                    totalEntries: { $sum: 1 },
                    passCount: {
                        $sum: { $cond: [{ $gte: ['$percentage', 40] }, 1, 0] }
                    },
                    uniqueStudents: { $addToSet: '$student' }
                }
            },
            {
                $addFields: {
                    studentCount: { $size: '$uniqueStudents' },
                    passRate: {
                        $cond: [
                            { $gt: ['$totalEntries', 0] },
                            { $multiply: [{ $divide: ['$passCount', '$totalEntries'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $project: { uniqueStudents: 0 }
            },
            { $sort: { courseName: 1 } }
        ]);

        // 4. Attendance summary (org-wide)
        const attendanceAgg = await Attendance.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            { $match: { 'courseInfo.organization': orgObjectId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const attendanceSummary = { Present: 0, Absent: 0, Leave: 0 };
        attendanceAgg.forEach(a => { attendanceSummary[a._id] = a.count; });
        const totalAttendance = attendanceSummary.Present + attendanceSummary.Absent + attendanceSummary.Leave;
        const attendanceRate = totalAttendance > 0
            ? Math.round((attendanceSummary.Present / totalAttendance) * 100)
            : 0;

        // 5. Total students count
        const totalStudents = await User.countDocuments({
            organization: orgObjectId,
            role: 'student',
            isActive: true
        });

        res.json({
            overview: {
                totalStudents,
                avgPercentage: Math.round((overall.avgPercentage || 0) * 10) / 10,
                passRate,
                attendanceRate
            },
            examTypeBreakdown: examTypeAgg.map(e => ({
                examType: e._id,
                avgPercentage: Math.round(e.avgPercentage * 10) / 10,
                count: e.count
            })),
            coursePerformance: courseAgg.map(c => ({
                courseId: c._id,
                courseName: c.courseName,
                courseCode: c.courseCode,
                avgPercentage: Math.round(c.avgPercentage * 10) / 10,
                passRate: Math.round(c.passRate * 10) / 10,
                studentCount: c.studentCount,
                totalEntries: c.totalEntries
            })),
            attendanceSummary: {
                ...attendanceSummary,
                total: totalAttendance,
                attendanceRate
            }
        });
    } catch (error) {
        console.error('Institute performance error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get class-wise (course) performance
// @route   GET /api/v2/admin/performance/courses/:courseId
// @access  Private/Admin
export const getCoursePerformance = async (req, res) => {
    try {
        const orgId = req.user.organization;
        const { courseId } = req.params;

        if (!orgId) return res.status(400).json({ message: 'Organization context required' });
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        const orgObjectId = new mongoose.Types.ObjectId(orgId);
        const courseObjectId = new mongoose.Types.ObjectId(courseId);

        // Verify course belongs to org
        const course = await Course.findOne({ _id: courseObjectId, organization: orgObjectId })
            .populate('teacher', 'name email')
            .populate('semester', 'name status')
            .populate('students', 'name email details.studentId');

        if (!course) return res.status(404).json({ message: 'Course not found' });

        // 1. Per-assessment breakdown
        const assessmentAgg = await StudentMark.aggregate([
            { $match: { organization: orgObjectId, course: courseObjectId } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $addFields: {
                    percentage: {
                        $cond: [
                            { $gt: ['$assessmentInfo.maxMarks', 0] },
                            { $multiply: [{ $divide: ['$obtainedMarks', '$assessmentInfo.maxMarks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$assessment',
                    title: { $first: '$assessmentInfo.title' },
                    examType: { $first: '$assessmentInfo.examType' },
                    maxMarks: { $first: '$assessmentInfo.maxMarks' },
                    date: { $first: '$assessmentInfo.date' },
                    avgPercentage: { $avg: '$percentage' },
                    highest: { $max: '$obtainedMarks' },
                    lowest: { $min: '$obtainedMarks' },
                    studentCount: { $sum: 1 }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // 2. Per-student summary in this course
        const studentAgg = await StudentMark.aggregate([
            { $match: { organization: orgObjectId, course: courseObjectId } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $addFields: {
                    percentage: {
                        $cond: [
                            { $gt: ['$assessmentInfo.maxMarks', 0] },
                            { $multiply: [{ $divide: ['$obtainedMarks', '$assessmentInfo.maxMarks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$student',
                    studentName: { $first: '$studentInfo.name' },
                    studentId: { $first: '$studentInfo.details.studentId' },
                    avgPercentage: { $avg: '$percentage' },
                    assessmentCount: { $sum: 1 }
                }
            },
            { $sort: { avgPercentage: -1 } }
        ]);

        // 3. Attendance for this course
        const attendanceAgg = await Attendance.aggregate([
            { $match: { course: courseObjectId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const attendanceSummary = { Present: 0, Absent: 0, Leave: 0 };
        attendanceAgg.forEach(a => { attendanceSummary[a._id] = a.count; });

        res.json({
            course: {
                _id: course._id,
                name: course.name,
                code: course.code,
                teacher: course.teacher,
                semester: course.semester,
                studentCount: course.students?.length || 0
            },
            assessments: assessmentAgg.map(a => ({
                assessmentId: a._id,
                title: a.title,
                examType: a.examType,
                maxMarks: a.maxMarks,
                date: a.date,
                avgPercentage: Math.round(a.avgPercentage * 10) / 10,
                highest: a.highest,
                lowest: a.lowest,
                studentCount: a.studentCount
            })),
            students: studentAgg.map(s => ({
                studentId: s._id,
                name: s.studentName,
                rollNo: s.studentId || 'N/A',
                avgPercentage: Math.round(s.avgPercentage * 10) / 10,
                assessmentCount: s.assessmentCount
            })),
            attendanceSummary
        });
    } catch (error) {
        console.error('Course performance error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get individual student performance
// @route   GET /api/v2/admin/performance/students/:studentId
// @access  Private/Admin
export const getStudentPerformance = async (req, res) => {
    try {
        const orgId = req.user.organization;
        const { studentId } = req.params;
        const { courseId } = req.query;

        if (!orgId) return res.status(400).json({ message: 'Organization context required' });
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }

        const orgObjectId = new mongoose.Types.ObjectId(orgId);
        const studentObjectId = new mongoose.Types.ObjectId(studentId);

        // Verify student belongs to org
        const student = await User.findOne({
            _id: studentObjectId,
            organization: orgObjectId,
            role: 'student'
        }).select('name email details.studentId details.batch details.currentSemester');

        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Build match filter
        const markMatch = { organization: orgObjectId, student: studentObjectId };
        if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
            markMatch.course = new mongoose.Types.ObjectId(courseId);
        }

        // 1. Per-assessment data with class averages
        const marksAgg = await StudentMark.aggregate([
            { $match: markMatch },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            {
                $addFields: {
                    percentage: {
                        $cond: [
                            { $gt: ['$assessmentInfo.maxMarks', 0] },
                            { $multiply: [{ $divide: ['$obtainedMarks', '$assessmentInfo.maxMarks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { 'assessmentInfo.date': 1 } }
        ]);

        // Calculate class averages for each assessment
        const assessmentIds = marksAgg.map(m => m.assessment);
        const classAvgAgg = await StudentMark.aggregate([
            { $match: { assessment: { $in: assessmentIds } } },
            {
                $lookup: {
                    from: 'assessments',
                    localField: 'assessment',
                    foreignField: '_id',
                    as: 'assessmentInfo'
                }
            },
            { $unwind: '$assessmentInfo' },
            {
                $group: {
                    _id: '$assessment',
                    avgObtained: { $avg: '$obtainedMarks' },
                    maxMarks: { $first: '$assessmentInfo.maxMarks' }
                }
            }
        ]);

        const classAvgMap = {};
        classAvgAgg.forEach(ca => {
            classAvgMap[ca._id.toString()] = ca.maxMarks > 0
                ? Math.round((ca.avgObtained / ca.maxMarks) * 1000) / 10
                : 0;
        });

        const trendData = marksAgg.map(m => ({
            name: m.assessmentInfo.title,
            courseName: m.courseInfo.name,
            courseCode: m.courseInfo.code,
            examType: m.assessmentInfo.examType,
            date: m.assessmentInfo.date,
            obtained: m.obtainedMarks,
            max: m.assessmentInfo.maxMarks,
            percentage: Math.round(m.percentage * 10) / 10,
            studentPercentage: Math.round(m.percentage * 10) / 10,
            classAveragePercentage: classAvgMap[m.assessment.toString()] || 0
        }));

        // 2. Summary stats
        let summary = null;
        if (trendData.length > 0) {
            const percentages = trendData.map(d => d.percentage);
            const avg = (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1);
            const best = Math.max(...percentages);
            const latest = percentages[percentages.length - 1];
            const improvement = percentages.length > 1 ? Math.round((latest - percentages[0]) * 10) / 10 : 0;
            summary = { avg: parseFloat(avg), best, latest, improvement };
        }

        // 3. Per-course attendance for this student
        const attendanceMatch = { student: studentObjectId };
        if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
            attendanceMatch.course = new mongoose.Types.ObjectId(courseId);
        }

        const attendanceAgg = await Attendance.aggregate([
            { $match: attendanceMatch },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            { $match: { 'courseInfo.organization': orgObjectId } },
            {
                $group: {
                    _id: { course: '$course', status: '$status' },
                    courseName: { $first: '$courseInfo.name' },
                    courseCode: { $first: '$courseInfo.code' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Reshape attendance into per-course data
        const courseAttendanceMap = {};
        attendanceAgg.forEach(a => {
            const cId = a._id.course.toString();
            if (!courseAttendanceMap[cId]) {
                courseAttendanceMap[cId] = {
                    courseName: a.courseName,
                    courseCode: a.courseCode,
                    Present: 0, Absent: 0, Leave: 0
                };
            }
            courseAttendanceMap[cId][a._id.status] = a.count;
        });

        const courseAttendance = Object.entries(courseAttendanceMap).map(([cId, data]) => {
            const total = data.Present + data.Absent + data.Leave;
            return {
                courseId: cId,
                courseName: data.courseName,
                courseCode: data.courseCode,
                present: data.Present,
                absent: data.Absent,
                leave: data.Leave,
                total,
                attendanceRate: total > 0 ? Math.round((data.Present / total) * 100) : 0
            };
        });

        // 4. Courses this student is enrolled in (for dropdown)
        const enrolledCourses = await Course.find({
            organization: orgObjectId,
            students: studentObjectId
        }).select('name code').sort({ name: 1 });

        res.json({
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                studentId: student.details?.studentId || 'N/A',
                batch: student.details?.batch || 'N/A',
                currentSemester: student.details?.currentSemester || null
            },
            trendData,
            comparisonData: trendData, // Same shape, for StudentVsClassTrendChart
            summary,
            courseAttendance,
            enrolledCourses
        });
    } catch (error) {
        console.error('Student performance error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
