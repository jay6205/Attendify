import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
    uploadTimetable,
    getTimetable,
    addEntry,
    deleteEntry,
    bulkAddEntries
} from '../controllers/timetableController.js';

const router = express.Router();

// Multer Config
const upload = multer({ dest: 'uploads/' });

router.post('/upload', protect, upload.single('file'), uploadTimetable);
router.post('/bulk', protect, bulkAddEntries);
router.get('/', protect, getTimetable);

router.route('/entries')
    .post(protect, addEntry);

router.route('/entries/:id')
    .delete(protect, deleteEntry);

export default router;
