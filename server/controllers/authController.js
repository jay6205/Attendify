import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        email,
        passwordHash: hashedPassword,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    // ... existing loginUser code ...
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
        res.json({
            _id: user.id,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Change password
// @route   PUT /api/v1/auth/password
// @access  Private
export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both old and new passwords' });
    }

    const user = await User.findById(req.user.id);

    if (user && (await bcrypt.compare(oldPassword, user.passwordHash))) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } else {
        res.status(400).json({ message: 'Invalid old password' });
    }
};

// @desc    Forgot password (Mock)
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Mock reset token
    const resetToken = 'mock-reset-token-' + Date.now();
    console.log(`\n[MOCK EMAIL] Reset Link for ${email}: http://localhost:5173/reset-password/${resetToken}\n`);

    res.status(200).json({ message: 'Email sent (Check server console)' });
};

// @desc    Reset password (Mock)
// @route   PUT /api/v1/auth/resetpassword/:token
// @access  Public
export const resetPassword = async (req, res) => {
    const { password } = req.body;
    // In a real app, verify token hash and expiration
    // Here we just accept it for demo simplicity, assuming we'd look up user by token
    res.status(200).json({ message: 'Password reset successful (Mock)' });
};

// @desc    Get user data
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
    // In a stateless JWT system, the server doesn't 'delete' the token unless using a blacklist (Redis).
    // For now, we just respond success, and the client deletes the token.
    res.status(200).json({ message: 'Logged out successfully' });
};
