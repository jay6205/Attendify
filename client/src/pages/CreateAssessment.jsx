import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Save, Calendar, CheckSquare, Type } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const CreateAssessment = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        courseId: '',
        title: '',
        maxMarks: 20,
        examType: 'custom',
        date: new Date().toISOString().split('T')[0]
    });

    // Fetch My Courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/academic/courses');
                // Filter for this teacher (though backend usually handles this security, good UX to filter)
                const myCourses = res.data.filter(c => c.teacher?._id === user._id || c.teacher === user._id);
                setCourses(myCourses);
                if (myCourses.length > 0) {
                    setFormData(prev => ({ ...prev, courseId: myCourses[0]._id }));
                }
            } catch (err) {
                console.error("Failed to fetch courses", err);
                setError("Failed to load courses.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await api.post('/marks/assessment/create', formData);
            navigate('/teacher/marks'); // Redirect to dashboard
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create assessment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageTransition>
            <div className="max-w-2xl mx-auto space-y-8 pb-20">
                <header>
                    <Link to="/teacher/marks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={18} /> Back to Marks
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-100">
                        Create Assessment
                    </h1>
                </header>

                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Select Course</label>
                            <div className="relative">
                                <select
                                    name="courseId"
                                    value={formData.courseId}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none transition-colors"
                                >
                                    <option value="" disabled>Select a course...</option>
                                    {courses.map(course => (
                                        <option key={course._id} value={course._id}>
                                            {course.name} ({course.code})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <CheckSquare size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Assessment Title</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Mid Semester Exam"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            </div>
                        </div>

                        {/* Row: Max Marks & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Max Marks</label>
                                <input
                                    type="number"
                                    name="maxMarks"
                                    value={formData.maxMarks}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Exam Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
                            <div className="flex gap-4">
                                {['quiz', 'midsem', 'final', 'custom'].map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="examType"
                                            value={type}
                                            checked={formData.examType === type}
                                            onChange={handleChange}
                                            className="form-radio text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                                        />
                                        <span className="text-slate-300 capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || loading}
                                className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            >
                                {submitting ? 'Creating...' : <><Save size={20} /> Create Assessment</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageTransition>
    );
};

export default CreateAssessment;
