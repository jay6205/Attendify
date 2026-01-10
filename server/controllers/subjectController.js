import Subject from '../models/Subject.js';
import TimetableEntry from '../models/TimetableEntry.js';
import AttendanceLog from '../models/AttendanceLog.js';
import { calculateCurrentPercentage, getSafeBunks, getRequiredClasses } from '../utils/bunkCalculator.js';

// ... existing imports ...

// ... existing functions ...

// @desc    Get all subjects
// @access  Private
export const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user.id });

        // Inject logic: Calculate status, safe bunks, or required classes for each subject
        const enhancedSubjects = subjects.map(subject => {
            const sub = subject.toObject();
            const percentage = calculateCurrentPercentage(sub.attended, sub.total);
            const target = req.user.attendanceRequirement || 75; // Default to 75 if not set

            sub.percentage = Math.round(percentage); // Return rounded percentage
            sub.isSafe = percentage >= target;

            if (sub.isSafe) {
                sub.safeBunks = getSafeBunks(sub.attended, sub.total, target);
                sub.statusMsg = `Safe to bunk: ${sub.safeBunks}`;
            } else {
                sub.requiredClasses = getRequiredClasses(sub.attended, sub.total, target);
                sub.statusMsg = `Must attend: ${sub.requiredClasses}`;
            }

            return sub;
        });

        res.status(200).json(enhancedSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new subject
// @route   POST /api/v1/subjects
// @access  Private
export const addSubject = async (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({ message: 'Please add a subject name' });
    }

    try {
        const subject = await Subject.create({
            name: req.body.name,
            type: req.body.type, // Optional: 'Theory', 'Lab', etc.
            userId: req.user.id,
            attended: req.body.attended || 0,
            total: req.body.total || 0
        });

        res.status(200).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update subject (usually attendance)
// @route   PUT /api/v1/subjects/:id
// @access  Private
export const updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Check for user
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Make sure the logged in user matches the subject user
        if (subject.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedSubject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedSubject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete subject
// @route   DELETE /api/v1/subjects/:id
// @access  Private
export const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (subject.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Cascade delete: Remove related Timetable Entries and Attendance Logs
        await TimetableEntry.deleteMany({ subjectId: subject._id });
        await AttendanceLog.deleteMany({ subjectId: subject._id });

        await subject.deleteOne();

        res.status(200).json({ id: req.params.id, message: `Deleted ${subject.name} and all associated data.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
