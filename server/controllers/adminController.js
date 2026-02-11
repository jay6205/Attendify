
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

        const { status } = req.body;
        const validStatuses = ['upcoming', 'active', 'completed', 'archived'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const semester = await Semester.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!semester) {
            return res.status(404).json({ message: 'Semester not found' });
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

        const semester = await Semester.findById(semesterId);
        if (!semester) {
            return res.status(400).json({ message: 'Invalid semester ID' });
        }

        const course = await Course.create({
            name,
            code,
            semester: semesterId,
            teacher: teacherId,
            credits: credits || 3
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
        const student = await User.findOne({ email: studentEmail.toLowerCase().trim(), role: 'student' });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found with this email' });
        }

        const studentId = student._id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
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

        const teachers = await User.find({ role: 'teacher' }).select('-passwordHash');
        res.json(teachers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
