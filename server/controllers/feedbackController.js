import FeedbackForm from '../models/FeedbackForm.js';
import FeedbackResponse from '../models/FeedbackResponse.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';

// @desc    Create a new feedback form
// @route   POST /api/v2/feedback/create
// @access  Teacher, Admin
export const createFeedbackForm = async (req, res) => {
    try {
        const { courseId, assessmentId, type, questions } = req.body;
        // Validate courseId
        if (!courseId) {
            return res.status(400).json({ message: 'courseId is required' });
        }

        // Validate type
        if (!['POST_ASSESSMENT', 'END_COURSE'].includes(type)) {
            return res.status(400).json({ message: 'Invalid feedback type. Must be POST_ASSESSMENT or END_COURSE' });
        }

        // POST_ASSESSMENT requires an assessmentId
        if (type === 'POST_ASSESSMENT' && !assessmentId) {
            return res.status(400).json({ message: 'assessmentId is required for POST_ASSESSMENT feedback' });
        }
        if (type === 'POST_ASSESSMENT') {
            const assessment = await Assessment.findOne({
                _id: assessmentId,
                course: courseId
            });
            if (!assessment) {
                return res.status(404).json({ message: 'Assessment not found or does not belong to this course' });
            }
        }

        // Validate questions
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'At least one question is required' });
        }

        // Verify course belongs to this organization
        const course = await Course.findOne({
            _id: courseId,
            organization: req.organizationId
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found in your organization' });
        }

        const form = await FeedbackForm.create({
            organization: req.organizationId,
            course: courseId,
            assessment: type === 'POST_ASSESSMENT' ? assessmentId : null,
            teacher: course.teacher,
            type,
            questions,
            isActive: true
        });

        res.status(201).json(form);
    } catch (error) {
        // Handle duplicate form
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A feedback form already exists for this course/assessment combination' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get active feedback forms for the logged-in student
// @route   GET /api/v2/feedback/active
// @access  Student
export const getActiveFeedback = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Find courses the student is enrolled in (within their org)
        const enrolledCourses = await Course.find({
            organization: req.organizationId,
            students: studentId
        }).select('_id');

        const courseIds = enrolledCourses.map(c => c._id);

        if (courseIds.length === 0) {
            return res.json([]);
        }

        // Find active forms for those courses
        const activeForms = await FeedbackForm.find({
            organization: req.organizationId,
            course: { $in: courseIds },
            isActive: true
        })
            .populate('course', 'name code')
            .populate('teacher', 'name')
            .populate('assessment', 'title');

        // Find which forms this student has already submitted
        const submittedFormIds = await FeedbackResponse.find({
            student: studentId,
            formId: { $in: activeForms.map(f => f._id) }
        }).distinct('formId');

        const submittedSet = new Set(submittedFormIds.map(id => id.toString()));

        // Filter out already-submitted forms
        const pendingForms = activeForms.filter(
            form => !submittedSet.has(form._id.toString())
        );

        res.json(pendingForms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit a feedback response
// @route   POST /api/v2/feedback/submit
// @access  Student
export const submitFeedback = async (req, res) => {
    try {
        const { formId, answers } = req.body;
        const studentId = req.user._id;

        // Validate formId
        const form = await FeedbackForm.findOne({
            _id: formId,
            organization: req.organizationId,
            isActive: true
        });

        if (!form) {
            return res.status(404).json({ message: 'Feedback form not found or is no longer active' });
        }

        // Validate answers array
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Answers are required' });
        }
        // Validate answers match form questions
        for (const answer of answers) {
            const questionIndex = answer.questionIndex;
            if (questionIndex == null || questionIndex < 0 || questionIndex >= form.questions.length) {
                return res.status(400).json({ message: `Invalid questionIndex: ${questionIndex}` });
            }
            const question = form.questions[questionIndex];
            if (question.type === 'RATING') {
                if (answer.ratingValue == null || answer.ratingValue < 1 || answer.ratingValue > question.scaleMax) {
                    return res.status(400).json({ message: `Invalid rating for question ${questionIndex}` });
                }
            }
        }


        // Verify student is enrolled in the course
        const course = await Course.findOne({
            _id: form.course,
            organization: req.organizationId,
            students: studentId
        });

        if (!course) {
            return res.status(403).json({ message: 'You are not enrolled in this course' });
        }

        const response = await FeedbackResponse.create({
            organization: req.organizationId,
            course: form.course,
            assessment: form.assessment,
            teacher: form.teacher,
            student: studentId,
            formId: form._id,
            answers
        });

        res.status(201).json({ message: 'Feedback submitted successfully', responseId: response._id });
    } catch (error) {
        // Duplicate submission guard
        if (error.code === 11000) {
            return res.status(409).json({ message: 'You have already submitted feedback for this form' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get aggregated feedback summary for a course
// @route   GET /api/v2/feedback/summary/:courseId
// @access  Teacher, Admin
export const getFeedbackSummary = async (req, res) => {
    try {
        const { courseId } = req.params;
        // Verify teacher has access to this course (owns it or is admin)
        const course = await Course.findOne({
            _id: courseId,
            organization: req.organizationId
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isTeacher = course.teacher.toString() === req.user._id.toString();
        if (!isAdmin && !isTeacher) {
            return res.status(403).json({ message: 'Not authorized to view this course feedback' });
        }

        // Find all forms for this course within the org
        const forms = await FeedbackForm.find({
            organization: req.organizationId,
            course: courseId
        }).populate('assessment', 'title');

        if (forms.length === 0) {
            return res.json({ forms: [], summaries: [] });
        }

        const summaries = [];

        for (const form of forms) {
            // Aggregation pipeline for this form
            const responses = await FeedbackResponse.find({ formId: form._id });
            const totalResponses = responses.length;

            if (totalResponses === 0) {
                summaries.push({
                    formId: form._id,
                    type: form.type,
                    assessment: form.assessment,
                    totalResponses: 0,
                    questionSummaries: form.questions.map((q, idx) => ({
                        questionIndex: idx,
                        questionText: q.questionText,
                        questionType: q.type,
                        scaleMax: q.scaleMax,
                        averageRating: null,
                        textResponses: []
                    }))
                });
                continue;
            }

            // Build per-question summary
            const questionSummaries = form.questions.map((q, idx) => {
                const answersForQ = responses
                    .map(r => r.answers.find(a => a.questionIndex === idx))
                    .filter(Boolean);

                if (q.type === 'RATING') {
                    const ratings = answersForQ
                        .map(a => a.ratingValue)
                        .filter(v => v != null);
                    const avg = ratings.length > 0
                        ? parseFloat((ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(2))
                        : null;

                    return {
                        questionIndex: idx,
                        questionText: q.questionText,
                        questionType: 'RATING',
                        scaleMax: q.scaleMax,
                        averageRating: avg,
                        ratingCount: ratings.length,
                        textResponses: []
                    };
                } else {
                    // TEXT type — return anonymous comments
                    const texts = answersForQ
                        .map(a => a.textValue)
                        .filter(v => v && v.trim().length > 0);

                    return {
                        questionIndex: idx,
                        questionText: q.questionText,
                        questionType: 'TEXT',
                        scaleMax: null,
                        averageRating: null,
                        textResponses: texts
                    };
                }
            });

            summaries.push({
                formId: form._id,
                type: form.type,
                assessment: form.assessment,
                totalResponses,
                questionSummaries
            });
        }

        res.json({ forms, summaries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
