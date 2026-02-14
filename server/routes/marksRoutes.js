import express from 'express';
import { 
    createAssessment, 
    enterMarks, 
    getAssessmentMarks, 
    getMyMarks,
    getTeacherAssessments
} from '../controllers/marksController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Teacher Routes
router.get('/assessment/teacher/all', protect, authorize('teacher', 'admin'), getTeacherAssessments);
router.post('/assessment/create', protect, authorize('teacher', 'admin'), createAssessment);
router.post('/assessment/:assessmentId/enter', protect, authorize('teacher', 'admin'), enterMarks);
router.get('/assessment/:assessmentId', protect, authorize('teacher', 'admin'), getAssessmentMarks);

// Student Routes
router.get('/my', protect, authorize('student'), getMyMarks);

export default router;
