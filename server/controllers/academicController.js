import Semester from '../models/Semester.js';
import Course from '../models/Course.js';

// @desc    Get single course by ID (with students)
// @route   GET /api/v2/academic/courses/:id
// @access  Private
export const getCourseById = async (req, res) => {
    try {
        if (!req.user || !req.user.organization) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const course = await Course.findOne({
            _id: req.params.id,
            organization: req.user.organization
        })
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
// @access  Private
export const getAllSemesters = async (req, res) => {
    try {
        if (!req.user || !req.user.organization) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const semesters = await Semester.find({
            organization: req.user.organization
        }).sort({ startDate: -1 });
        res.json(semesters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all courses (optional filter by semester)
// @route   GET /api/v2/academic/courses
// @access  Private
export const getAllCourses = async (req, res) => {
    try {
        if (!req.user || !req.user.organization) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const query = { organization: req.user.organization };
        if (req.query.semesterId) {
            query.semester = req.query.semesterId;
        }

        const courses = await Course.find(query)
            .populate('teacher', 'name email details')
            .populate('semester', 'name status startDate endDate');

        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
