import User from '../models/User.js';
import Achievement from '../models/Achievement.js';

// @desc    Get current student's achievements and XP
// @route   GET /api/v2/achievements/my-achievements
// @access  Private (Student)
export const getStudentAchievements = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students have achievements' });
        }

        // Fetch user with specifically populated earned achievements
        const user = await User.findById(req.user._id)
            .populate({
                path: 'earnedAchievements.achievementId',
                select: 'name description icon condition xp'
            })
            .select('xp earnedAchievements details.studentId name');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all possible achievements to show "locked" ones
        const allAchievements = await Achievement.find({}).select('name description icon condition xp');

        // Filter out any achievements that may have been deleted
        const validEarnedAchievements = user.earnedAchievements.filter(ea => ea.achievementId != null);
        const earnedIds = new Set(validEarnedAchievements.map(ea => ea.achievementId._id.toString()));

        // Map earned achievements beautifully
        const earned = validEarnedAchievements.map(ea => ({
            id: ea.achievementId._id,
            name: ea.achievementId.name,
            description: ea.achievementId.description,
            icon: ea.achievementId.icon,
            xp: ea.achievementId.xp,
            earnedAt: ea.earnedAt
        }));
        // Determine which ones are locked
        const locked = allAchievements
            .filter(ach => !earnedIds.has(ach._id.toString()))
            .map(ach => ({
                id: ach._id,
                name: ach.name,
                description: ach.description,
                icon: ach.icon,
                xp: ach.xp
            }));

        res.status(200).json({
            student: {
                name: user.name,
                xp: user.xp || 0
            },
            earned,
            locked
        });

    } catch (error) {
        console.error('[AchievementController] getStudentAchievements error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
