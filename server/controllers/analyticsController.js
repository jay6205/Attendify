import { generateHeatmapData, calculateHealth } from '../utils/analyticsEngine.js';
import { getSafeBunks } from '../utils/bunkCalculator.js';
import Subject from '../models/Subject.js';
import mongoose from 'mongoose';
import moment from 'moment';

// @desc    Get overall analytics summary
// @route   GET /api/v1/analytics/summary
// @access  Private
export const getSummary = async (req, res) => {
    try {
        const target = req.user.attendanceRequirement || 75;
        const health = await calculateHealth(req.user.id, target);
        res.status(200).json(health);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get full dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Heatmap Data
        const heatmap = await generateHeatmapData(userId);

        // 2. Trend Data (Last 4 Weeks)
        const trend = [];
        const today = moment().endOf('day');

        for (let i = 3; i >= 0; i--) {
            const end = moment(today).subtract(i, 'weeks').endOf('week'); // End of that week
            const start = moment(end).clone().startOf('week'); // Start of that week

            // Find logs in this range
            // Note: This is an expensive loop query practice, aggregation is better but this is simpler for MVP with low data volume
            const logs = await mongoose.model('AttendanceLog').find({
                userId,
                date: { $gte: start.toDate(), $lte: end.toDate() },
                status: { $in: ['Present', 'Absent'] } // Ignore Cancelled
            });

            let percentage = 0;
            if (logs.length > 0) {
                const present = logs.filter(l => l.status === 'Present').length;
                percentage = Math.round((present / logs.length) * 100);
            }

            trend.push({
                week: `Week ${4 - i}`, // Week 1, 2, 3, 4
                attendance: percentage,
                dateLabel: end.format('MMM DD')
            });
        }

        // 3. Subject Data (Bar Chart)
        const subjectsRaw = await Subject.find({ userId });
        const subjects = subjectsRaw.map(sub => ({
            name: sub.name,
            Attended: sub.attended,
            Total: sub.total,
            Skipped: sub.total - sub.attended
        }));

        // 4. Health
        const health = await calculateHealth(userId, req.user.attendanceRequirement || 75);

        res.status(200).json({
            heatmap,
            trend,
            subjects,
            health
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get heatmap data (Legacy/Specific)
// @route   GET /api/v1/analytics/heatmap
// @access  Private
export const getHeatmap = async (req, res) => {
    try {
        const data = await generateHeatmapData(req.user._id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Simulate skipping days
// @route   POST /api/v1/analytics/bunk/simulate
// @access  Private
// Body: { subjectId, daysToSkip }
export const simulateBunk = async (req, res) => {
    const { subjectId, daysToSkip } = req.body;

    try {
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const newTotal = subject.total + daysToSkip;
        // Attended stays same as we are skipping
        const newPct = (subject.attended / newTotal) * 100;
        const target = req.user.attendanceRequirement || 75;

        res.status(200).json({
            originalPercentage: Math.round((subject.attended / subject.total) * 100),
            newPercentage: Math.round(newPct),
            isSafe: newPct >= target,
            status: newPct >= target ? 'Safe' : 'Risk'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
