import User from '../models/User.js';
import Achievement from '../models/Achievement.js';
import Attendance from '../models/Attendance.js';
import StudentMark from '../models/StudentMark.js';
import Assessment from '../models/Assessment.js';
import { createAlert } from './alert.service.js';

/**
 * Ensures a default achievement exists returning its ID.
 */
const getOrCreateAchievement = async (condition, name, description, icon, xp) => {
    const achievement = await Achievement.findOneAndUpdate(
        { condition },
        { $setOnInsert: { condition, name, description, icon, xp } },
        { upsert: true, new: true }
    );
    return achievement;
};
/**
 * Awards an achievement to a user if they don't already have it.
 */
const awardAchievement = async (studentId, achievement) => {
    // Atomically find user, ensure achievement isn't already earned, add it, and increment XP.
    const updatedUser = await User.findOneAndUpdate(
        {
            _id: studentId,
            'details.earnedAchievements.achievementId': { $ne: achievement._id }
        },
        {
            $addToSet: { 'details.earnedAchievements': { achievementId: achievement._id } },
            $inc: { 'details.xp': achievement.xp }
        },
        { new: true }
    );

    // If updatedUser is null, it means either the user doesn't exist OR they already had the achievement
    if (!updatedUser) return false;

    // Fire an alert
    if (updatedUser.organization) {
        createAlert(
            studentId,
            updatedUser.organization,
            'SYSTEM', // Or a new type 'ACHIEVEMENT' if added to Alert model
            `Achievement Unlocked: ${achievement.name}`,
            `Congratulations! You earned '${achievement.name}' and gained ${achievement.xp} XP!`,
            { achievementId: achievement._id, icon: achievement.icon }
        ).catch(err => console.error(`[AchievementAlert] Failed:`, err.message));
    }

    return true;
};

/**
 * Called after marking attendance to check for attendance-related achievements.
 */
export const evaluateAttendanceAchievements = async (studentId, organizationId) => {
    try {
        // 1. Check for First Attendance (Present)
        const totalPresent = await Attendance.countDocuments({ student: studentId, status: 'Present' });

        if (totalPresent === 1) {
            const ach = await getOrCreateAchievement(
                'FIRST_ATTENDANCE',
                'First Steps',
                'Attended your first class!',
                'Footprints', // Lucide icon
                50
            );
            await awardAchievement(studentId, ach);
        }

        // 2. Check for Perfect Week (Present 5 times in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPresentCount = await Attendance.countDocuments({
            student: studentId,
            status: 'Present',
            date: { $gte: sevenDaysAgo }
        });

        if (recentPresentCount >= 5) {
            const ach = await getOrCreateAchievement(
                'ATTENDANCE_PERFECT_WEEK',
                'Perfect Week',
                'Attended 5 classes in a single week.',
                'CalendarCheck',
                100
            );
            await awardAchievement(studentId, ach);
        }

    } catch (error) {
        console.error('[AchievementService] Attendance eval error:', error);
    }
};

/**
 * Called after marks are published to check for academic achievements.
 */
export const evaluateAcademicAchievements = async (assessmentId) => {
    try {
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment || assessment.maxMarks <= 0) return;

        const allMarks = await StudentMark.find({ assessment: assessmentId });
        if (allMarks.length === 0) return;

        // Find the highest score
        const highestScore = Math.max(...allMarks.map(m => m.obtainedMarks));

        for (const mark of allMarks) {
            // Check for Perfect Score (100%)
            if (mark.obtainedMarks === assessment.maxMarks) {
                const ach = await getOrCreateAchievement(
                    'PERFECT_SCORE',
                    'Flawless Victory',
                    'Achieved a 100% score on an assessment.',
                    'Star',
                    200
                );
                await awardAchievement(mark.student, ach);
            }

            // Check for Highest in Class
            // Wait, if everyone got 0, highest is 0... Let's only award if > 50%
            if (mark.obtainedMarks === highestScore && highestScore > (assessment.maxMarks / 2)) {
                const ach = await getOrCreateAchievement(
                    'TOP_SCORE',
                    'Top of the Class',
                    'Got the highest score in the class for an assessment.',
                    'Trophy',
                    150
                );
                await awardAchievement(mark.student, ach);
            }
        }
    } catch (error) {
        console.error('[AchievementService] Academic eval error:', error);
    }
};

/**
 * Called when a leave request is approved.
 */
export const evaluateLeaveAchievements = async (studentId) => {
    try {
        const ach = await getOrCreateAchievement(
            'FIRST_LEAVE_APPROVED',
            'Time Off',
            'Got your first leave request approved.',
            'Coffee',
            20
        );
        await awardAchievement(studentId, ach);
    } catch (error) {
        console.error('[AchievementService] Leave eval error:', error);
    }
};
