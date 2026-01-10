import Subject from '../models/Subject.js';
import AttendanceLog from '../models/AttendanceLog.js';
import { calculateCurrentPercentage } from '../utils/bunkCalculator.js';

// @desc    Get attendance summary for all subjects
// @route   GET /api/v1/attendance
// @access  Private
export const getAttendanceSummary = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user.id });

        const summary = subjects.map(sub => ({
            id: sub._id,
            name: sub.name,
            attended: sub.attended,
            total: sub.total,
            percentage: Math.round(calculateCurrentPercentage(sub.attended, sub.total))
        }));

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Log specific attendance (Day-by-day)
// @route   POST /api/v1/attendance/logs/:subjectId
// @access  Private
// Body: { date, status: 'Present'|'Absent'|'Cancelled' }
export const logAttendance = async (req, res) => {
    const { subjectId } = req.params;
    const { status, date } = req.body;

    try {
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Create log
        const log = await AttendanceLog.create({
            userId: req.user.id,
            subjectId,
            date: date || new Date(),
            status
        });

        // Update aggregate counters on Subject
        if (status === 'Present') {
            subject.attended += 1;
            subject.total += 1;
        } else if (status === 'Absent') {
            subject.total += 1;
        }
        // Cancelled doesn't affect counters

        await subject.save();

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Quick +/- update (No detailed log)
// @route   PUT /api/v1/attendance/update/:subjectId
// @access  Private
// Body: { type: 'inc' | 'dec', field: 'attended' | 'total' }
export const quickUpdate = async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const { type, field } = req.body; // type: 'inc'/'dec', field: 'attended'/'total'

        if (type === 'inc') {
            subject[field]++;
        } else if (type === 'dec' && subject[field] > 0) {
            subject[field]--;
        }

        await subject.save();
        res.status(200).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logs for a subject
// @route   GET /api/v1/attendance/logs/:subjectId
// @access  Private
export const getLogs = async (req, res) => {
    try {
        const logs = await AttendanceLog.find({
            subjectId: req.params.subjectId,
            userId: req.user.id
        }).sort({ date: -1 });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Delete log and revert stats
// @route   DELETE /api/v1/attendance/logs/:logId
// @access  Private
export const deleteLog = async (req, res) => {
    try {
        const log = await AttendanceLog.findById(req.params.logId);
        if (!log) return res.status(404).json({ message: 'Log not found' });

        if (log.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const subject = await Subject.findById(log.subjectId);
        if (subject) {
            // Revert the stats based on what the log was
            if (log.status === 'Present') {
                subject.attended = Math.max(0, subject.attended - 1);
                subject.total = Math.max(0, subject.total - 1);
            } else if (log.status === 'Absent') {
                subject.total = Math.max(0, subject.total - 1);
            }
            await subject.save();
        }

        await log.deleteOne();
        res.status(200).json({ message: 'Log deleted', subjectId: log.subjectId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
