import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getSummary, getHeatmap, simulateBunk, getDashboard } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/summary', protect, getSummary);
router.get('/heatmap', protect, getHeatmap);
router.get('/dashboard', protect, getDashboard);
router.post('/bunk/simulate', protect, simulateBunk);

export default router;
