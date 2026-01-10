import express from 'express';
const router = express.Router();
import {
    registerUser,
    loginUser,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword,
    logoutUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.post('/logout', protect, logoutUser);

export default router;
