import express from 'express';
import { getAssessmentLeaderboard } from '../controllers/leaderboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
    '/assessment/:assessmentId',
    protect,
    authorize('student', 'teacher', 'admin'),
    getAssessmentLeaderboard
);

export default router;
