import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, Loader2 } from 'lucide-react';
import RatingQuestion from './RatingQuestion';
import TextQuestion from './TextQuestion';
import api from '../../api/axios';

const FeedbackFormModal = ({ form, onClose, onSubmitted }) => {
    const [answers, setAnswers] = useState(
        form.questions.map((_, idx) => ({
            questionIndex: idx,
            ratingValue: null,
            textValue: null
        }))
    );
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const submitTimeoutRef = useRef(null);

    // Cleanup timeout on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (submitTimeoutRef.current) {
                clearTimeout(submitTimeoutRef.current);
            }
        };
    }, []);

    const handleAnswerChange = (index, value) => {
        setAnswers(prev =>
            prev.map((a, i) =>
                i === index
                    ? {
                        ...a,
                        ratingValue: form.questions[index].type === 'RATING' ? value : null,
                        textValue: form.questions[index].type === 'TEXT' ? value : null
                    }
                    : a
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate: all rating questions must have a value
        const missingRating = form.questions.some(
            (q, i) => q.type === 'RATING' && !answers[i].ratingValue
        );
        if (missingRating) {
            setError('Please rate all required questions');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/feedback/submit', {
                formId: form._id,
                answers
            });
            setSubmitted(true);
            if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
            submitTimeoutRef.current = setTimeout(() => {
                onSubmitted?.();
                onClose();
            }, 1500);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit feedback';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const feedbackLabel = form.type === 'POST_ASSESSMENT'
        ? `Assessment Feedback — ${form.assessment?.title || 'Test'}`
        : `Course Feedback — ${form.course?.name || 'Course'}`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="feedback-modal-title"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">{feedbackLabel}</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Teacher: {form.teacher?.name || 'Unknown'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close feedback form"
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Success State */}
                    {submitted ? (
                        <div className="p-12 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12 }}
                            >
                                <CheckCircle size={64} className="text-emerald-400 mb-4" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-100">Thank You!</h3>
                            <p className="text-slate-400 mt-2">Your feedback has been submitted anonymously.</p>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                🔒 Your feedback is <span className="text-indigo-400 font-medium">completely anonymous</span>.
                                Teachers will only see aggregated results.
                            </p>

                            {form.questions.map((q, idx) =>
                                q.type === 'RATING' ? (
                                    <RatingQuestion
                                        key={idx}
                                        question={q.questionText}
                                        index={idx}
                                        value={answers[idx].ratingValue || 0}
                                        onChange={(val) => handleAnswerChange(idx, val)}
                                        scaleMax={q.scaleMax || 5}
                                    />
                                ) : (
                                    <TextQuestion
                                        key={idx}
                                        question={q.questionText}
                                        index={idx}
                                        value={answers[idx].textValue}
                                        onChange={(val) => handleAnswerChange(idx, val)}
                                    />
                                )
                            )}

                            {error && (
                                <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3 border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FeedbackFormModal;
