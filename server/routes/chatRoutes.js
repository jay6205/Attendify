import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { chatQuery, getChatHistory } from '../controllers/chatController.js';

const router = express.Router();

router.post('/query', protect, chatQuery);
router.get('/history', protect, getChatHistory);

export default router;
