import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { chatWithAI, getHistory } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', protect, chatWithAI);
router.get('/history', protect, getHistory);

export default router;
