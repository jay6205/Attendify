import AttendanceLog from '../models/AttendanceLog.js';
import Subject from '../models/Subject.js';
import { calculateCurrentPercentage, getSafeBunks, getRequiredClasses } from './bunkCalculator.js';
import moment from 'moment';

/**
 * Generates heatmap data for GitHub-style graph
 * @param {string} userId 
 * @returns {Array} Array of { date: 'YYYY-MM-DD', count: number }
 */
export const generateHeatmapData = async (userId) => {
    // Aggregation pipeline to group by date
    const pipeline = [
        { $match: { userId: userId, status: 'Present' } }, // Only count present days? Or all logs? PRD implies activity. Let's count Present.
        { 
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ];

    const data = await AttendanceLog.aggregate(pipeline); // Mongoose model aggregate needs ObjectId cast usually handled by mongoose if passed correctly, but userId is stored as ObjectId in Schema. Check if we need to cast input string to ObjectId.
    // In controller we pass req.user.id which is string. Mongoose queries auto-cast, but Aggregate pipeline might NOT.
    // Let's rely on controller to pass ObjectId if needed, or handle it here.
    // Actually, req.user from authMiddleware is a Mongoose Document, so req.user._id is ObjectId. req.user.id is string.
    
    // Correction: We'll do it in Controller safely.
    return data.map(item => ({ date: item._id, count: item.count }));
};

/**
 * Calculates overall health status
 * @param {string} userId 
 * @param {number} target 
 */
export const calculateHealth = async (userId, target = 75) => {
    const subjects = await Subject.find({ userId });
    
    let safeCount = 0;
    let riskCount = 0;
    
    subjects.forEach(sub => {
        const pct = calculateCurrentPercentage(sub.attended, sub.total);
        if (pct >= target) safeCount++;
        else riskCount++;
    });

    return { safeCount, riskCount, totalSubjects: subjects.length };
};
