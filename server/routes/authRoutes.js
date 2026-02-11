
import express from 'express';
import { registerUser, loginUser, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser); // Forces Student role
router.post('/login', loginUser);
router.put('/password', protect, changePassword);
router.get('/me', protect, getMe);

export default router;
