import User from '../models/User.js';

// @desc    Update phone number (first login capture for parents)
// @route   PUT /api/v2/users/update-phone
// @access  Private (any authenticated user, enforced popup for parent only)
export const updatePhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Validate phone format: 10-15 digits, numeric only (MVP)
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ 
                message: 'Invalid phone number. Must be 10-15 digits, numeric only.' 
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.phoneNumber = phoneNumber;
        user.phoneRequired = false;
        // TODO: Future — trigger OTP verification here, set phoneVerified = true after OTP
        await user.save();

        res.status(200).json({ 
            message: 'Phone number updated successfully',
            phoneNumber: user.phoneNumber
        });
    } catch (error) {
        console.error('Update Phone Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
