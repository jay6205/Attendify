// ... existing imports ...
import Subject from '../models/Subject.js';
import AttendanceLog from '../models/AttendanceLog.js';
import TimetableEntry from '../models/TimetableEntry.js';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ... existing code ...

// @desc    Delete entry (AND THE ENTIRE SUBJECT)
// @route   DELETE /api/v1/timetable/entries/:id
// @access  Private
export const deleteEntry = async (req, res) => {
    try {
        const entry = await TimetableEntry.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        if (entry.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const subjectId = entry.subjectId;

        // CASCADE DELETE: Requirement is to remove EVERYTHING if a class is deleted
        // 1. Delete the Subject
        await Subject.findByIdAndDelete(subjectId);

        // 2. Delete All Attendance Logs for this subject
        await AttendanceLog.deleteMany({ subjectId: subjectId });

        // 3. Delete All Timetable Entries for this subject (including this one)
        await TimetableEntry.deleteMany({ subjectId: subjectId });

        res.status(200).json({
            id: req.params.id,
            message: 'Subject and all associated data deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... existing code ...

export const uploadTimetable = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
    }

    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY is not defined');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert file to base64
        const fileData = fs.readFileSync(req.file.path);
        const imagePart = {
            inlineData: {
                data: fileData.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        const prompt = `
            Analyze this timetable image and extract the class schedule into a JSON format.
            Return ONLY a valid JSON array of objects. Do not wrap in markdown code blocks.
            Each object should have:
            - "day" (Monday, Tuesday, Wednesday, Thursday, Friday)
            - "startTime" (HH:MM in 24h format, e.g. "09:00", "14:30")
            - "endTime" (HH:MM in 24h format)
            - "subject" (Name of the subject)
            - "type" (Lecture, Lab, or Tutorial - guess based on context)
            - "room" (Room number if visible, else null)

            If the image is not a timetable or unclear, return an empty array [].
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if Gemini adds it
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonStr);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: 'File processed successfully',
            parsedData: parsedData
        });
    } catch (error) {
        console.error("OCR Error:", error);
        // Clean up file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'OCR Failed: ' + error.message });
    }
};

// @desc    Get whole timetable
// @route   GET /api/v1/timetable
// @access  Private
// @desc    Get whole timetable
// @route   GET /api/v1/timetable
// @access  Private
// @desc    Get whole timetable
// @route   GET /api/v1/timetable
// @access  Private
export const getTimetable = async (req, res) => {
    try {
        const entries = await TimetableEntry.find({ userId: req.user.id })
            .populate('subjectId', 'name type');

        // 1. Filter out orphan entries (where subject was deleted)
        const validEntries = entries.filter(entry => entry.subjectId != null);

        // 2. Group by Day
        const groupedSchedule = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
        };

        validEntries.forEach(entry => {
            if (groupedSchedule[entry.day]) {
                groupedSchedule[entry.day].push(entry);
            }
        });

        // 3. Sort entries by start time within each day
        for (const day in groupedSchedule) {
            groupedSchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
        }

        res.status(200).json({
            success: true,
            count: validEntries.length,
            days: groupedSchedule
        });
    } catch (error) {
        console.error("Get Timetable Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Could not fetch timetable",
            days: {}
        });
    }
};

// @desc    Add single entry
// @route   POST /api/v1/timetable/entries
// @access  Private
// Body: { subjectId, day, startTime, endTime, frequency }
export const addEntry = async (req, res) => {
    try {
        const entry = await TimetableEntry.create({
            userId: req.user.id,
            ...req.body
        });
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ... existing code ...

// @desc    Bulk add entries (from OCR)
// @route   POST /api/v1/timetable/bulk
// @access  Private
export const bulkAddEntries = async (req, res) => {
    const { entries } = req.body; // Expects [{ subject: 'Maths', day: 'Monday', ... }]

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ message: 'No entries provided' });
    }

    try {
        const resultEntries = [];

        for (const entry of entries) {
            // 1. Find or Create Subject
            let subjectName = entry.subject ? entry.subject.trim() : 'Unknown';
            // Case-insensitive search
            let subject = await Subject.findOne({
                userId: req.user.id,
                name: { $regex: new RegExp(`^${subjectName}$`, 'i') }
            });

            if (!subject) {
                // Robust Type Normalization
                let normalizedType = 'Theory'; // Default
                const rawType = entry.type ? entry.type.toLowerCase() : '';

                if (rawType.includes('lab') || rawType.includes('practical')) {
                    normalizedType = 'Lab';
                } else if (rawType.includes('tut')) {
                    normalizedType = 'Tutorial';
                } else if (rawType.includes('other')) {
                    normalizedType = 'Other';
                }
                // 'Lecture', 'Class', 'Theory' fall through to default 'Theory'

                // Auto-create subject if not exists
                subject = await Subject.create({
                    userId: req.user.id,
                    name: subjectName,
                    type: normalizedType,
                    attended: 0,
                    total: 0
                });
            }

            // 2. Create Timetable Entry
            const newEntry = await TimetableEntry.create({
                userId: req.user.id,
                subjectId: subject._id,
                day: entry.day,
                startTime: entry.startTime,
                endTime: entry.endTime,
                room: entry.room
            });

            resultEntries.push(newEntry);
        }

        res.status(201).json({
            message: `Successfully added ${resultEntries.length} classes`,
            data: resultEntries
        });
    } catch (error) {
        console.error("Bulk Add Error:", error);
        res.status(500).json({ message: 'Failed to save schedule' });
    }
};
