import express from 'express';
const router = express.Router();
import {
    registerUser,
    loginUser,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword,
    logoutUser,
    googleAuthCallback
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import passport from 'passport';

router.post('/register', registerUser);
router.post('/login', loginUser);

// Google Auth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleAuthCallback
);

router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.post('/logout', protect, logoutUser);

export default router;
