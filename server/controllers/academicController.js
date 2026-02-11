import Semester from '../models/Semester.js';
import Course from '../models/Course.js';

// @desc    Get single course by ID (with students)
// @route   GET /api/v2/academic/courses/:id
// @access  Public/Authenticated
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('teacher', 'name email details')
            .populate('semester', 'name status startDate endDate')
            .populate('students', 'name email details.studentId'); // Essential for attendance marking

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all semesters
// @route   GET /api/v2/academic/semesters
// @access  Public/Authenticated
export const getAllSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ startDate: -1 });
        res.json(semesters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all courses (optional filter by semester)
// @route   GET /api/v2/academic/courses
// @access  Public/Authenticated
export const getAllCourses = async (req, res) => {
    try {
        const query = {};
        if (req.query.semesterId) {
            query.semester = req.query.semesterId;
        }

        const courses = await Course.find(query)
            .populate('teacher', 'name email details')
            .populate('semester', 'name status');

        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
