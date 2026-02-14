import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Create a new Admin
// @route   POST /api/v2/super-admin/admins
// @access  Super Admin
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password, organization } = req.body;

        if (!name || !email || !password || !organization) {
            return res.status(400).json({ message: 'Please provide all fields including organization' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with role 'admin'
        const user = await User.create({
            name,
            email,
            passwordHash: hashedPassword,
            role: 'admin',
            isActive: true,
            organization
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all Admins
// @route   GET /api/v2/super-admin/admins
// @access  Super Admin
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' })
            .select('-passwordHash')
            .populate('organization', 'name code');
        res.json(admins);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Disable/Enable Admin (Toggle)
// @route   PATCH /api/v2/super-admin/admins/:id/toggle-status
// @access  Super Admin
export const toggleAdminStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ message: 'Can only disable users with role "admin"' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `Admin ${user.isActive ? 'enabled' : 'disabled'}`, isActive: user.isActive });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset Admin Password
// @route   PUT /api/v2/super-admin/admins/:id/password
// @access  Super Admin
export const resetAdminPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ message: 'Can only reset password for "admin" role' });
        }

        if (!password) {
            return res.status(400).json({ message: 'New password required' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        await user.save();

        res.json({ message: 'Admin password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
