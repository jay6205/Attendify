import express from 'express';
import { registerUser, loginUser, getMe, changePassword, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser); // Forces Student role
router.post('/login', loginUser);
router.post('/logout', logoutUser); // Handled by client-side token deletion
router.put('/password', protect, changePassword);
router.get('/me', protect, getMe);

export default router;
