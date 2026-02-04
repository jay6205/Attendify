import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import LeaveRequest from '../models/LeaveRequest.js';

// @desc    Mark attendance for a student (Teacher only)
// @route   POST /api/v2/attendance/mark
// @access  Private (Teacher)
export const markAttendance = async (req, res) => {
    try {
        const { studentId, courseId, date, status } = req.body;

        // 1. RBAC: Only Teachers can mark attendance
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied: Teachers only' });
        }

        // 2. Validate Input
        if (!studentId || !courseId || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const validStatuses = ['Present', 'Absent', 'Leave'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        // Normalize date to remove time component for consistent unique checks
        attendanceDate.setHours(0, 0, 0, 0);

        // 3. Verify Course and Teacher Ownership
        const course = await Course.findById(courseId).populate('semester');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        // 4. Verify Student Enrollment
        if (!course.students.includes(studentId)) {
            return res.status(400).json({ message: 'Student is not enrolled in this course' });
        }

        // 5. Verify Semester Date Range
        const semester = course.semester;
        if (!semester) {
             return res.status(400).json({ message: 'Course is not linked to a valid semester' });
        }
        
        if (attendanceDate < new Date(semester.startDate) || attendanceDate > new Date(semester.endDate)) {
            return res.status(400).json({ message: 'Date is outside the semester duration' });
        }

        // 6. Prevent Duplicate & Create/Update
        // We use findOneAndUpdate with upsert to handle both create and update in one go if desired, 
        // OR check existence first. User asked to "Prevent duplicate", which likely means error or update.
        // Let's UPDATE if exists, or CREATE if new, to be user-friendly, OR fail. 
        // "Prevent duplicate attendance" usually implies unique constraint. 
        // Let's try to update if it exists, otherwise create.
        
        const attendance = await Attendance.findOneAndUpdate(
            {
                student: studentId,
                course: courseId,
                date: attendanceDate
            },
            {
                student: studentId,
                course: courseId,
                semester: semester._id,
                date: attendanceDate,
                status: status,
                markedBy: req.user._id
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(attendance);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get attendance records
// @route   GET /api/v2/attendance/course/:courseId
// @access  Private (Teacher: All, Student: Own)
export const getAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let query = { course: courseId };

        // RBAC Logic
        if (req.user.role === 'teacher') {
            // Teacher can see all records for THEIR course
            if (course.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized for this course' });
            }
            // Optional: Filter by specific student or date if query params provided
            if (req.query.studentId) query.student = req.query.studentId;
            if (req.query.date) query.date = new Date(req.query.date);

        } else if (req.user.role === 'student') {
            // Student can ONLY see their OWN records
            // First, check enrollment? Not strictly necessary if we only show their data, but good practice.
            if (!course.students.includes(req.user._id.toString())) {
                return res.status(403).json({ message: 'Not enrolled in this course' });
            }
            query.student = req.user._id;

        } else {
            // Admins? 
            if (req.user.role !== 'admin') {
                 return res.status(403).json({ message: 'Access denied' });
            }
        }

        const attendance = await Attendance.find(query)
            .populate('student', 'name email details.studentId')
            .sort({ date: -1 });

        res.json(attendance);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get weekly summary dashboard (Teacher)
// @route   GET /api/v2/attendance/weekly-summary
// @access  Private (Teacher)
export const getWeeklySummary = async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied: Teachers only' });
        }

        const { courseId } = req.query;
        let courses = [];

        // 1. Identify Target Courses
        if (courseId) {
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).json({ message: 'Course not found' });
            if (course.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized for this course' });
            }
            courses = [course];
        } else {
            courses = await Course.find({ teacher: req.user._id });
        }

        if (courses.length === 0) {
            return res.json([]);
        }

        const courseIds = courses.map(c => c._id);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 2. Aggregate Attendance (Last 7 Days)
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    course: { $in: courseIds },
                    date: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$course',
                    total: { $sum: 1 },
                    present: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } 
                    },
                    absent: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } 
                    },
                    leave: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // 3. Aggregate Leaves (Submitted or Handled Last 7 Days)
        const leavesData = await LeaveRequest.aggregate([
            {
                $match: {
                    course: { $in: courseIds },
                    $or: [
                        { createdAt: { $gte: sevenDaysAgo } },
                        { handledAt: { $gte: sevenDaysAgo } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$course',
                    total: { $sum: 1 },
                    approved: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } 
                    },
                    rejected: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } 
                    },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // 4. Construct Response
        const response = courses.map(course => {
            const att = attendanceData.find(a => a._id.toString() === course._id.toString()) || { total: 0, present: 0, absent: 0, leave: 0 };
            const lvs = leavesData.find(l => l._id.toString() === course._id.toString()) || { total: 0, approved: 0, rejected: 0, pending: 0 };

            return {
                courseId: course._id,
                courseName: course.name,
                courseCode: course.code,
                weeklyAttendance: {
                    total: att.total,
                    present: att.present,
                    absent: att.absent,
                    leave: att.leave,
                    percentage: att.total > 0 ? Math.round((att.present / att.total) * 100) : 0
                },
                weeklyLeaves: {
                    total: lvs.total,
                    approved: lvs.approved,
                    rejected: lvs.rejected,
                    pending: lvs.pending
                },
                atRiskStudents: [] // Placeholder for future logic
            };
        });

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
