
import express from 'express';
import {
    createTeacher,
    createSemester,
    updateSemester,
    createCourse,
    enrollStudent,
    getTeachers
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/admin
router.use(protect); // All routes require auth (Admin role check inside controller)

router.get('/teachers', getTeachers);
router.post('/teachers', createTeacher);
router.post('/semesters', createSemester);
router.put('/semesters/:id', updateSemester);
router.post('/courses', createCourse);
router.post('/enroll', enrollStudent);

export default router;
