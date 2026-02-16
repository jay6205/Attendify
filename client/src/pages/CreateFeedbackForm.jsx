import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Send, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import PageTransition from '../components/PageTransition';
import AuthContext from '../context/AuthContext';

// Default question sets from the PRD
const POST_ASSESSMENT_DEFAULTS = [
    { questionText: 'How clear was the teaching for this topic?', type: 'RATING', scaleMax: 5 },
    { questionText: 'How well did the test align with what was taught?', type: 'RATING', scaleMax: 5 },
    { questionText: 'Any additional comments? (optional)', type: 'TEXT', scaleMax: 5 }
];

const END_COURSE_DEFAULTS = [
    { questionText: 'Overall teaching quality', type: 'RATING', scaleMax: 5 },
    { questionText: 'Doubt solving support', type: 'RATING', scaleMax: 5 },
    { questionText: 'Pace of teaching', type: 'RATING', scaleMax: 5 },
    { questionText: 'Assessment fairness', type: 'RATING', scaleMax: 5 },
    { questionText: 'Would you recommend this teacher?', type: 'RATING', scaleMax: 5 },
    { questionText: 'Any additional feedback? (optional)', type: 'TEXT', scaleMax: 5 }
];

const CreateFeedbackForm = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';

    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [feedbackType, setFeedbackType] = useState('POST_ASSESSMENT');
    const [selectedAssessment, setSelectedAssessment] = useState('');
    const [questions, setQuestions] = useState(POST_ASSESSMENT_DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [assessmentsLoading, setAssessmentsLoading] = useState(false);

    // Fetch courses (admin sees all org courses, teacher sees own)
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isAdmin) {
                    // Admin: fetch all org courses with teacher info
                    const res = await api.get('/academic/courses');
                    setCourses(res.data.map(c => ({
                        _id: c._id,
                        name: c.name,
                        code: c.code,
                        teacherName: c.teacher?.name || 'Unassigned'
                    })));
                } else {
                    // Teacher: extract courses from own assessments
                    const res = await api.get('/marks/assessment/teacher/all');
                    const courseMap = new Map();
                    const allAssessments = [];

                    res.data.forEach(a => {
                        const c = a.course;
                        if (c && !courseMap.has(c._id)) {
                            courseMap.set(c._id, { _id: c._id, name: c.name, code: c.code });
                        }
                        allAssessments.push({
                            _id: a._id,
                            title: a.title,
                            courseId: c?._id
                        });
                    });

                    setCourses(Array.from(courseMap.values()));
                    setAssessments(allAssessments);
                }
            } catch (err) {
                console.error('Failed to fetch courses:', err);
            } finally {
                setCoursesLoading(false);
            }
        };
        fetchData();
    }, [isAdmin]);

    // Admin: fetch assessments when course changes
    useEffect(() => {
        if (!isAdmin || !selectedCourse) return;
        const fetchAssessments = async () => {
            setAssessmentsLoading(true);
            try {
                const res = await api.get(`/marks/assessment/course/${selectedCourse}`);
                setAssessments(res.data.map(a => ({ _id: a._id, title: a.title, courseId: a.course?._id })));
            } catch (err) {
                console.error('Failed to fetch assessments:', err);
            } finally {
                setAssessmentsLoading(false);
            }
        };
        fetchAssessments();
    }, [isAdmin, selectedCourse]);

    // Swap default questions when type changes
    useEffect(() => {
        setQuestions(
            feedbackType === 'POST_ASSESSMENT'
                ? POST_ASSESSMENT_DEFAULTS
                : END_COURSE_DEFAULTS
        );
    }, [feedbackType]);

    const filteredAssessments = assessments.filter(a => a.courseId === selectedCourse);

    const addQuestion = () => {
        setQuestions(prev => [
            ...prev,
            { questionText: '', type: 'RATING', scaleMax: 5 }
        ]);
    };

    const removeQuestion = (idx) => {
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx, field, value) => {
        setQuestions(prev =>
            prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedCourse) {
            setError('Please select a course');
            return;
        }
        if (feedbackType === 'POST_ASSESSMENT' && !selectedAssessment) {
            setError('Please select an assessment');
            return;
        }
        if (questions.length === 0 || questions.some(q => !q.questionText.trim())) {
            setError('All questions must have text');
            return;
        }

        setLoading(true);
        try {
            await api.post('/feedback/create', {
                courseId: selectedCourse,
                assessmentId: feedbackType === 'POST_ASSESSMENT' ? selectedAssessment : undefined,
                type: feedbackType,
                questions
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            // Reset
            setSelectedCourse('');
            setSelectedAssessment('');
            setQuestions(POST_ASSESSMENT_DEFAULTS);
            setFeedbackType('POST_ASSESSMENT');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create feedback form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20 max-w-2xl">
                {/* Header */}
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                        Create Feedback Form
                    </h1>
                    <p className="text-slate-400">
                        Set up an anonymous feedback form for students
                    </p>
                </header>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400"
                    >
                        <CheckCircle size={20} />
                        <span className="font-medium">Feedback form created successfully!</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Feedback Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Feedback Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { val: 'POST_ASSESSMENT', label: 'Post Assessment', desc: 'After a test (3–5 questions)' },
                                { val: 'END_COURSE', label: 'End of Course', desc: 'Course completion (5–8 questions)' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => setFeedbackType(opt.val)}
                                    className={`p-4 rounded-xl border text-left transition-all ${feedbackType === opt.val
                                        ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                        : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                                        }`}
                                >
                                    <p className="font-medium text-slate-200 text-sm">{opt.label}</p>
                                    <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Course Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Course</label>
                        {coursesLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Loader2 size={14} className="animate-spin" /> Loading...
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => {
                                        setSelectedCourse(e.target.value);
                                        setSelectedAssessment('');
                                    }}
                                    className="w-full appearance-none bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="">— Select course —</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.code} — {c.name}{isAdmin && c.teacherName ? ` (${c.teacherName})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Assessment Selector (only for POST_ASSESSMENT) */}
                    {feedbackType === 'POST_ASSESSMENT' && selectedCourse && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Assessment</label>
                            <div className="relative">
                                <select
                                    value={selectedAssessment}
                                    onChange={(e) => setSelectedAssessment(e.target.value)}
                                    className="w-full appearance-none bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="">— Select assessment —</option>
                                    {filteredAssessments.map(a => (
                                        <option key={a._id} value={a._id}>{a.title}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-300">Questions</label>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                <Plus size={14} /> Add Question
                            </button>
                        </div>

                        {questions.map((q, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-700/50 rounded-md w-6 h-6 flex items-center justify-center shrink-0 mt-1">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={q.questionText}
                                            onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                                            placeholder="Question text..."
                                            className="w-full bg-slate-900/50 border border-slate-600/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                        />
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={q.type}
                                                onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                                                className="bg-slate-900/50 border border-slate-600/30 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                                            >
                                                <option value="RATING">⭐ Rating</option>
                                                <option value="TEXT">💬 Text</option>
                                            </select>
                                            {q.type === 'RATING' && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span>Scale:</span>
                                                    <select
                                                        value={q.scaleMax}
                                                        onChange={(e) => updateQuestion(idx, 'scaleMax', Number(e.target.value))}
                                                        className="bg-slate-900/50 border border-slate-600/30 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                                                    >
                                                        {[3, 5, 7, 10].map(n => (
                                                            <option key={n} value={n}>1–{n}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(idx)}
                                            className="text-slate-500 hover:text-rose-400 transition-colors mt-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3 border border-red-500/20">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Creating...</>
                        ) : (
                            <><Send size={18} /> Create Feedback Form</>
                        )}
                    </button>
                </form>
            </div>
        </PageTransition>
    );
};

export default CreateFeedbackForm;
