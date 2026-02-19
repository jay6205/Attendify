import express from 'express';
import {
  createManualPaper,
  generatePaperAI,
  saveGeneratedPaper,
  getPaper,
  getPapersByTeacher,
  updatePaper
} from '../controllers/questionPaperController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require teacher role
router.use(protect);
router.use(authorize('teacher', 'admin')); // Allowing admin too just in case

router.post('/manual/create', createManualPaper);
router.post('/llm/generate', generatePaperAI);
router.post('/save', saveGeneratedPaper);
router.get('/list', getPapersByTeacher);
router.get('/:id', getPaper);
router.put('/:id', updatePaper);

export default router;
