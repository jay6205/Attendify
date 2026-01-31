
import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser); // Forces Student role
router.post('/login', loginUser);
router.get('/me', protect, getMe);

export default router;
