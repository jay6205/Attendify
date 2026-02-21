
import User from '../models/User.js';
import Semester from '../models/Semester.js';
import Course from '../models/Course.js';
import bcrypt from 'bcryptjs';

// @desc    Create a new Teacher account
// @route   POST /api/v2/admin/teachers
// @access  Private/Admin
export const createTeacher = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { name, email, password, department, qualification } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const teacher = await User.create({
            name,
            email,
            passwordHash: hashedPassword,
            role: 'teacher',
            organization: req.user.organization, // FIX: Multi-tenant orphaned data prevention
            details: {
                department,
                qualification
            }
        });

        res.status(201).json({
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            role: teacher.role,
            organization: teacher.organization,
            details: teacher.details
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new Semester
// @route   POST /api/v2/admin/semesters
// @access  Private/Admin
export const createSemester = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { name, startDate, endDate } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide name, start date, and end date' });
        }

        const semester = await Semester.create({
            organization: req.user.organization, // FIX: Tenant scope
            name,
            startDate,
            endDate,
            status: 'upcoming'
        });

        res.status(201).json(semester);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Semester (Activate/Archived)
// @route   PUT /api/v2/admin/semesters/:id
// @access  Private/Admin
export const updateSemester = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { status, name, startDate, endDate } = req.body;
        const validStatuses = ['upcoming', 'active', 'completed', 'archived'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (startDate !== undefined) updateData.startDate = startDate;
        if (endDate !== undefined) updateData.endDate = endDate;
        if (status !== undefined) updateData.status = status;

        const semester = await Semester.findOneAndUpdate(
            { _id: req.params.id, organization: req.user.organization }, // FIX: Verify org ownership
            updateData,
            { new: true, runValidators: true }
        );

        if (!semester) {
            return res.status(404).json({ message: 'Semester not found or access denied' });
        }

        res.json(semester);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create Course and assign Teacher
// @route   POST /api/v2/admin/courses
// @access  Private/Admin
export const createCourse = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { name, code, semesterId, teacherId, credits } = req.body;

        if (!name || !code || !semesterId || !teacherId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }

        const semester = await Semester.findOne({ _id: semesterId, organization: req.user.organization }); // FIX: Tenant scoped
        if (!semester) {
            return res.status(400).json({ message: 'Invalid semester ID or access denied' });
        }
        if (!req.user.organization) {
            return res.status(400).json({ message: 'Admin organization not configured' });
        }

        const course = await Course.create({
            name,
            code,
            semester: semesterId,
            teacher: teacherId,
            credits: credits || 3,
            organization: req.user.organization
        });

        res.status(201).json(course);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Enroll Student into Course
// @route   POST /api/v2/admin/enroll
// @access  Private/Admin
export const enrollStudent = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { studentEmail, courseId } = req.body;

        if (!studentEmail || !courseId) {
            return res.status(400).json({ message: 'Student Email and Course ID are required' });
        }

        // Changed from ID lookup to Email lookup for better UX
        const student = await User.findOne({
            email: studentEmail.toLowerCase().trim(),
            role: 'student',
            organization: req.user.organization // FIX: IDOR/Tenant Leak
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found in your organization with this email' });
        }

        const studentId = student._id;

        const course = await Course.findOne({
            _id: courseId,
            organization: req.user.organization // FIX: IDOR/Tenant Leak
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found in your organization' });
        }

        // Check if now enrolled
        if (course.students.includes(studentId)) {
            return res.status(400).json({ message: 'Student already enrolled' });
        }

        course.students.push(studentId);
        await course.save();

        res.json({ message: `Student '${student.name}' enrolled successfully`, courseId: course._id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all Teachers
// @route   GET /api/v2/admin/teachers
// @access  Private/Admin
export const getTeachers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const teachers = await User.find({
            role: 'teacher',
            organization: req.user.organization // FIX: Tenant scoped query
        }).select('-passwordHash');
        res.json(teachers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Soft Delete a Teacher
// @route   DELETE /api/v2/admin/teachers/:id
// @access  Private/Admin
export const deleteTeacher = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const teacher = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'teacher', organization: req.user.organization },
            { isActive: false },
            { new: true }
        );

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found or unauthorized' });
        }

        res.json({ message: 'Teacher deactivated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Soft Delete a Course
// @route   DELETE /api/v2/admin/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const course = await Course.findOneAndUpdate(
            { _id: req.params.id, organization: req.user.organization },
            { isActive: false },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        res.json({ message: 'Course deactivated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
