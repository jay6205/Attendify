import User from '../models/User.js';
import Subject from '../models/Subject.js';
import TimetableEntry from '../models/TimetableEntry.js';
import AttendanceLog from '../models/AttendanceLog.js';

// @desc    Get user settings
// @route   GET /api/v1/settings
// @access  Private
export const getSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            id: user._id,
            email: user.email,
            attendanceRequirement: user.attendanceRequirement
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user settings
// @route   PUT /api/v1/settings
// @access  Private
// Body: { attendanceRequirement: 75 }
export const updateSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.attendanceRequirement) {
            user.attendanceRequirement = req.body.attendanceRequirement;
        }

        await user.save();

        res.status(200).json({
            id: user._id,
            attendanceRequirement: user.attendanceRequirement,
            message: 'Settings updated'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Semester Data
// @route   POST /api/v1/settings/reset
// @access  Private
export const resetData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete all data associated with the user
        await Subject.deleteMany({ userId });
        await TimetableEntry.deleteMany({ userId });
        await AttendanceLog.deleteMany({ userId });

        res.status(200).json({ message: 'Semester data cleared successfully.' });
    } catch (error) {
        console.error("Reset Data Error:", error);
        res.status(500).json({ message: 'Failed to reset data' });
    }
};
