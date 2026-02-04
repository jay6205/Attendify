import LeaveRequest from '../models/LeaveRequest.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';

// @desc    Submit a leave request
// @route   POST /api/v2/leaves
// @access  Private (Student only)
export const submitLeaveRequest = async (req, res) => {
    try {
        const { courseId, startDate, endDate, reason, comments } = req.body;

        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can submit leave requests' });
        }

        if (!courseId || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Normalize time
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        if (start > end) {
             return res.status(400).json({ message: 'Start date cannot be after end date' });
        }

        // Verify Enrollment
        const course = await Course.findById(courseId).populate('semester');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (!course.students.includes(req.user._id)) {
            return res.status(403).json({ message: 'You are not enrolled in this course' });
        }

        // Verify Semester Dates
        const semester = course.semester;
        if (!semester) {
             return res.status(400).json({ message: 'Course semester not found' });
        }

        if (start < new Date(semester.startDate) || end > new Date(semester.endDate)) {
            return res.status(400).json({ message: 'Leave dates are outside the semester duration' });
        }

        const leaveRequest = await LeaveRequest.create({
            student: req.user._id,
            course: courseId,
            semester: semester._id,
            startDate: start,
            endDate: end,
            reason,
            status: 'Pending'
        });

        res.status(201).json(leaveRequest);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get leave requests
// @route   GET /api/v2/leaves
// @access  Private
export const getLeaveRequests = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'student') {
            query.student = req.user._id;
        } else if (req.user.role === 'teacher') {
            // Find courses where this user is the teacher
            const courses = await Course.find({ teacher: req.user._id }).select('_id');
            const courseIds = courses.map(c => c._id);
            query.course = { $in: courseIds };
        } else if (req.user.role === 'admin') {
            // Admin sees all? Or maybe filter by params
            // For now, let admin see all
        } else {
             return res.status(403).json({ message: 'Access denied' });
        }

        // Optional query params
        if (req.query.status) query.status = req.query.status;
        if (req.query.courseId) query.course = req.query.courseId;

        const requests = await LeaveRequest.find(query)
            .populate('student', 'name email details.studentId')
            .populate('course', 'name code')
            .sort({ createdAt: -1 });

        res.json(requests);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Handle (Approve/Reject) leave request
// @route   PUT /api/v2/leaves/:id
// @access  Private (Teacher only)
export const handleLeaveRequest = async (req, res) => {
    try {
        const { status, comments } = req.body;
        const leaveId = req.params.id;

        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied: Teachers only' });
        }

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leaveRequest = await LeaveRequest.findById(leaveId).populate('course');
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Verify Teacher ownership
        // We use leaveRequest.course which we populated. 
        // Note: Course model has 'teacher' field as ObjectId.
        if (leaveRequest.course.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        // Update Request
        leaveRequest.status = status;
        leaveRequest.handledBy = req.user._id;
        leaveRequest.handledAt = Date.now();
        if (comments) leaveRequest.comments = comments;

        await leaveRequest.save();

        // IF APPROVED -> UPDATE ATTENDANCE
        if (status === 'Approved') {
            const start = new Date(leaveRequest.startDate);
            const end = new Date(leaveRequest.endDate);
            const datesToMark = [];

            // Loop from start to end
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                datesToMark.push(new Date(d));
            }

            // Execute parallel updates
            await Promise.all(datesToMark.map(async (date) => {
                // Upsert 'Leave' status
                return Attendance.findOneAndUpdate(
                    {
                        student: leaveRequest.student,
                        course: leaveRequest.course._id,
                        date: date
                    },
                    {
                        student: leaveRequest.student,
                        course: leaveRequest.course._id,
                        semester: leaveRequest.semester, // Assuming semester ID is on the leave request
                        date: date,
                        status: 'Leave',
                        markedBy: req.user._id
                    },
                    { upsert: true, new: true }
                );
            }));
        }

        res.json(leaveRequest);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
