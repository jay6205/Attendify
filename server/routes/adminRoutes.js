
import express from 'express';
import {
    createTeacher,
    createSemester,
    updateSemester,
    createCourse,
    enrollStudent,
    getTeachers,
    getStudents,
    deleteTeacher,
    deleteCourse
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/admin
router.use(protect); // All routes require auth
router.use(authorize('admin')); // All routes require admin role

router.get('/teachers', getTeachers);
router.get('/students', getStudents);
router.post('/teachers', createTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.post('/semesters', createSemester);
router.put('/semesters/:id', updateSemester);
router.post('/courses', createCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/enroll', enrollStudent);

export default router;
