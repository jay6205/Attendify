import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import FeedbackFormModal from './FeedbackFormModal';

const FeedbackBanner = () => {
    const [pendingForms, setPendingForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchActive = async () => {
        try {
            const res = await api.get('/feedback/active');
            setPendingForms(res.data);
        } catch (err) {
            console.error('Failed to fetch active feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActive();
    }, []);

    const handleSubmitted = () => {
        // Refresh the list after submission
        fetchActive();
        setSelectedForm(null);
    };

    if (loading || pendingForms.length === 0) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
            >
                {pendingForms.map((form) => (
                    <motion.div
                        key={form._id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedForm(form)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedForm(form);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-4 cursor-pointer hover:border-indigo-400/50 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/20">
                                    <MessageSquare size={20} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-100">
                                        📝 Feedback Available
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {form.type === 'POST_ASSESSMENT'
                                            ? `Assessment: ${form.assessment?.title || 'Test'}`
                                            : `Course: ${form.course?.name || 'Course'}`}
                                        {' — '}
                                        <span className="text-slate-500">{form.course?.code}</span>
                                    </p>
                                </div>
                            </div>
                            <ChevronRight
                                size={18}
                                className="text-slate-500 group-hover:text-indigo-400 transition-colors"
                            />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedForm && (
                    <FeedbackFormModal
                        form={selectedForm}
                        onClose={() => setSelectedForm(null)}
                        onSubmitted={handleSubmitted}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default FeedbackBanner;
