import QuestionPaper from '../models/QuestionPaper.js';
import { generateQuestions } from '../services/geminiQuestionGenerator.service.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';

// Create Manual Paper
export const createManualPaper = async (req, res) => {
  try {
    const { course, assessment, title, totalMarks, questions } = req.body;
    const teacher = req.user._id;

    // Resolve organization from logged-in user
    // req.user.organization might be an object (populated) or an ID
    const organization = req.user.organization?._id || req.user.organization;

    if (!organization) {
      return res.status(400).json({ message: 'Teacher is not associated with any organization' });
    }

    // Basic validation
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'Questions are required' });
    }

    const calculatedTotal = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
    if (calculatedTotal !== Number(totalMarks)) {
      return res.status(400).json({
        message: `Total marks mismatch. Expected ${totalMarks}, but questions sum to ${calculatedTotal}`
      });
    }

    const newPaper = new QuestionPaper({
      organization,
      course,
      assessment,
      teacher,
      title,
      totalMarks,
      mode: 'MANUAL',
      questions,
      isPublished: true // Manual creation assumes it's ready, or we could add a draft status later
    });

    await newPaper.save();
    res.status(201).json(newPaper);

  } catch (error) {
    console.error('Create Manual Paper Error:', error);
    res.status(500).json({ message: 'Failed to create question paper', error: error.message });
  }
};

// Generate Paper (LLM) - Returns Draft, DOES NOT SAVE to DB yet
export const generatePaperAI = async (req, res) => {
  try {
    const { courseId, topic, difficulty, questionSchema } = req.body;

    // Fetch course name for better context
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Call Gemini Service
    // questionSchema is expected to be [{ type, count, marks }]
    const generatedData = await generateQuestions(course.name, topic, difficulty, questionSchema);

    res.status(200).json(generatedData);

  } catch (error) {
    console.error('Generate Paper AI Error:', error);
    res.status(500).json({
      message: 'Failed to generate questions. ' + (error.message || 'AI Service Error'),
      details: error.toString()
    });
  }
};

// Save Generated/Edited Paper
export const saveGeneratedPaper = async (req, res) => {
  try {
    const { course, assessment, title, totalMarks, questions } = req.body;
    const teacher = req.user._id;

    // Resolve organization from logged-in user
    const organization = req.user.organization?._id || req.user.organization;

    if (!organization) {
      return res.status(400).json({ message: 'Teacher is not associated with any organization' });
    }

    // Validate totals again as user might have edited the AI draft
    const calculatedTotal = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
    if (calculatedTotal !== Number(totalMarks)) {
      return res.status(400).json({
        message: `Total marks mismatch. Expected ${totalMarks}, but questions sum to ${calculatedTotal}`
      });
    }

    const newPaper = new QuestionPaper({
      organization,
      course,
      assessment,
      teacher,
      title,
      totalMarks,
      mode: 'LLM',
      questions,
      isPublished: true
    });

    await newPaper.save();
    res.status(201).json(newPaper);

  } catch (error) {
    console.error('Save Generated Paper Error:', error);
    res.status(500).json({ message: 'Failed to save question paper', error: error.message });
  }
};

// Get Paper by ID
export const getPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id)
      .populate('course', 'name code')
      .populate('assessment', 'title');

    if (!paper) {
      return res.status(404).json({ message: 'Question paper not found' });
    }
    res.json(paper);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch paper', error: error.message });
  }
};

// Get All Papers for a Teacher/Course
export const getPapersByTeacher = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = { teacher: req.user._id };
    if (courseId) query.course = courseId;

    const papers = await QuestionPaper.find(query)
      .sort({ createdAt: -1 })
      .populate('course', 'name')
      .populate('assessment', 'title');

    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch papers', error: error.message });
  }
};

// Update details
export const updatePaper = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If updating questions, re-validate marks
    if (updates.questions) {
      // If totalMarks is also updated use that, else use existing
      // This is complex, simplified for now: assume full update if questions change
      // For now mainly used for changing publication status or title
    }

    const paper = await QuestionPaper.findByIdAndUpdate(id, updates, { new: true });
    if (!paper) return res.status(404).json({ message: 'Paper not found' });

    res.json(paper);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};
