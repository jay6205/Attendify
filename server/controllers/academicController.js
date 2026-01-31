
import Semester from '../models/Semester.js';
import Course from '../models/Course.js';

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
