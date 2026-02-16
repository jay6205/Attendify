import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MessageCircle, Users, ChevronDown, Star, Loader2 } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const TeacherFeedbackSummary = () => {
    const { user } = useContext(AuthContext);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(true);

    // Fetch courses (role-aware)
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                if (isAdmin) {
                    // Admin: fetch all org courses
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
                    res.data.forEach(assessment => {
                        const c = assessment.course;
                        if (c && !courseMap.has(c._id)) {
                            courseMap.set(c._id, { _id: c._id, name: c.name, code: c.code });
                        }
                    });
                    setCourses(Array.from(courseMap.values()));
                }
            } catch (err) {
                console.error('Failed to fetch courses:', err);
            } finally {
                setCoursesLoading(false);
            }
        };
        fetchCourses();
    }, [isAdmin]);

    // Fetch feedback summary when course changes
    useEffect(() => {
        if (!selectedCourse) {
            setSummaryData(null);
            return;
        }

        const controller = new AbortController();

        const fetchSummary = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/feedback/summary/${selectedCourse}`, {
                    signal: controller.signal
                });
                if (!controller.signal.aborted) {
                    setSummaryData(res.data);
                }
            } catch (err) {
                if (controller.signal.aborted) return; // Ignore aborted requests
                console.error('Failed to fetch feedback summary:', err);
                setSummaryData(null);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchSummary();

        return () => controller.abort();
    }, [selectedCourse]);

    const renderRatingBar = (avg, max) => {
        const pct = avg != null && max > 0 ? (avg / max) * 100 : 0;
        return (
            <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                    />
                </div>
                <span className="text-sm font-semibold text-amber-400 min-w-[50px] text-right">
                    {avg != null ? `${avg}/${max}` : 'N/A'}
                </span>
            </div>
        );
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                        Feedback Summary
                    </h1>
                    <p className="text-slate-400">
                        View aggregated anonymous feedback from students
                    </p>
                </header>

                {/* Course Selector */}
                <div className="relative max-w-md">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Course
                    </label>
                    {coursesLoading ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 size={16} className="animate-spin" /> Loading courses...
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full appearance-none bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 cursor-pointer"
                            >
                                <option value="">— Choose a course —</option>
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

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-indigo-400" />
                    </div>
                )}

                {/* No Data */}
                {!loading && selectedCourse && summaryData && summaryData.summaries.length === 0 && (
                    <div className="text-center py-16">
                        <BarChart3 size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400">No feedback forms found for this course</p>
                    </div>
                )}

                {/* Summaries */}
                {!loading && summaryData && summaryData.summaries.map((summary, sIdx) => (
                    <motion.div
                        key={summary.formId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sIdx * 0.1 }}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        {/* Form Header */}
                        <div className="p-6 border-b border-slate-700/30 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${summary.type === 'POST_ASSESSMENT'
                                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                        }`}>
                                        {summary.type === 'POST_ASSESSMENT' ? 'Post Assessment' : 'End of Course'}
                                    </span>
                                    {summary.assessment && (
                                        <span className="text-sm text-slate-400">
                                            — {summary.assessment.title}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Users size={16} />
                                <span className="text-sm font-medium">
                                    {summary.totalResponses} response{summary.totalResponses !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="p-6 space-y-6">
                            {summary.totalResponses === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">
                                    No responses yet
                                </p>
                            ) : (
                                summary.questionSummaries.map((qs, qIdx) => (
                                    <div key={qIdx} className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            {qs.questionType === 'RATING' ? (
                                                <Star size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                            ) : (
                                                <MessageCircle size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                            )}
                                            <p className="text-sm font-medium text-slate-200">
                                                {qs.questionText}
                                            </p>
                                        </div>

                                        {qs.questionType === 'RATING' ? (
                                            <div className="pl-6">
                                                {renderRatingBar(qs.averageRating, qs.scaleMax)}
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {qs.ratingCount} rating{qs.ratingCount !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="pl-6 space-y-2 max-h-48 overflow-y-auto">
                                                {qs.textResponses.length === 0 ? (
                                                    <p className="text-xs text-slate-500 italic">No comments</p>
                                                ) : (
                                                    qs.textResponses.map((text, tIdx) => (
                                                        <div
                                                            key={tIdx}
                                                            className="bg-slate-800/60 border border-slate-700/30 rounded-lg p-3 text-sm text-slate-300"
                                                        >
                                                            "{text}"
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageTransition>
    );
};

export default TeacherFeedbackSummary;
