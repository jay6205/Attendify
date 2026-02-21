import QuestionPaper from '../models/QuestionPaper.js';
import { generateQuestions } from '../services/geminiQuestionGenerator.service.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';

// Create Manual Paper
export const createManualPaper = async (req, res) => {
  try {
    const { course, assessment, title, totalMarks, questions } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!course) {
      return res.status(400).json({ message: 'Course is required' });
    }
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
    // Verify teacher has access to the course
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (courseDoc.organization.toString() !== organization.toString()) {
      return res.status(403).json({ message: 'Not authorized to create papers for this course' });
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

    if (!questionSchema || !Array.isArray(questionSchema) || questionSchema.length === 0) {
      return res.status(400).json({ message: 'Question schema is required' });
    }
    // Fetch course name for better context
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Authorization check: Only the teacher of the course can generate papers
    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate papers for this course' });
    }

    // Call Gemini Service
    // questionSchema is expected to be [{ type, count, marks }]
    const generatedData = await generateQuestions(course.name, topic, difficulty, questionSchema);

    res.status(200).json(generatedData);

  } catch (error) {
    console.error('Generate Paper AI Error:', error);
    res.status(500).json({
      message: 'Failed to generate questions. ' + (error.message || 'AI Service Error')
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
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!course) {
      return res.status(400).json({ message: 'Course is required' });
    }
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'Questions are required' });
    }

    // Verify course exists and teacher has access
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (courseDoc.organization.toString() !== organization.toString()) {
      return res.status(403).json({ message: 'Not authorized to create papers for this course' });
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
export const getPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id)
      .populate('course', 'name code')
      .populate('assessment', 'title');

    if (!paper) {
      return res.status(404).json({ message: 'Question paper not found' });
    }

    // Verify access
    if (paper.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this paper' });
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

    // 1. Fetch the paper first (Critical for IDOR check)
    const paper = await QuestionPaper.findById(id);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // 2. Authorization check (IDOR prevention)
    // Only the teacher who created the paper (or admin) can update it
    if (paper.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this paper' });
    }

    // 3. Whitelist allowed fields (Mass-assignment prevention)
    const allowedFields = ['title', 'questions', 'totalMarks', 'isPublished', 'difficulty', 'topic']; // Added topic/difficulty as they might be editable
    const sanitizedUpdates = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    });

    // 4. Validate Questions & Marks logic
    if (sanitizedUpdates.questions) {
      const calculatedTotal = sanitizedUpdates.questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      const targetTotal = sanitizedUpdates.totalMarks !== undefined ? Number(sanitizedUpdates.totalMarks) : paper.totalMarks;

      if (calculatedTotal !== targetTotal) {
        return res.status(400).json({
          message: `Total marks mismatch. Expected ${targetTotal}, but questions sum to ${calculatedTotal}`
        });
      }

      // Normalize totalMarks to ensure consistency
      sanitizedUpdates.totalMarks = calculatedTotal;
    } else if (sanitizedUpdates.totalMarks !== undefined) {
      const calculatedTotal = paper.questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      const targetTotal = Number(sanitizedUpdates.totalMarks);

      if (calculatedTotal !== targetTotal) {
        return res.status(400).json({
          message: `Total marks mismatch. Expected ${targetTotal}, but questions sum to ${calculatedTotal}`
        });
      }
    }

    // 5. Apply updates using Mongoose document-save (triggers hooks if any)
    Object.assign(paper, sanitizedUpdates);

    // Explicitly update only allowed fields. 
    // This avoids overwriting protected fields like teacher, organization, mode, createdAt.

    await paper.save();

    res.json(paper);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};
