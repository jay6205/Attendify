import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStudentAchievements } from '../controllers/achievementController.js';

const router = express.Router();

router.get('/my-achievements', protect, getStudentAchievements);

export default router;
