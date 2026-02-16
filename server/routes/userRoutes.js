import express from 'express';
import { updatePhone } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/update-phone', protect, updatePhone);

export default router;
