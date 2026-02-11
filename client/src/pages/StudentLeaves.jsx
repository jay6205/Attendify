import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const StudentLeaves = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [leaves, setLeaves] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        courseId: '',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Enrolled Courses (using getAllCourses and filtering)
                // Ideally backend should provide /my-courses, but we filter client-side for now
                const coursesRes = await api.get('/academic/courses');
                // Filter where student is in 'students' array
                const enrolled = coursesRes.data.filter(c => c.students.some(s => s._id === user._id || s === user._id));
                setCourses(enrolled);

                // 2. Fetch My Leaves
                const leavesRes = await api.get('/leaves'); // API handles showing own leaves for students
                setLeaves(leavesRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        
        try {
            await api.post('/leaves', formData);
            setMsg({ type: 'success', text: 'Leave request submitted successfully!' });
            setFormData({ courseId: '', startDate: '', endDate: '', reason: '' });
            // Refresh list
            const res = await api.get('/leaves');
            setLeaves(res.data);
            setTimeout(() => setActiveTab('history'), 1500); // Auto switch to history
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
        const icons = {
            'Pending': <Clock size={14} />,
            'Approved': <CheckCircle size={14} />,
            'Rejected': <XCircle size={14} />,
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${styles[status] || styles['Pending']}`}>
                {icons[status] || icons['Pending']}
                {status}
            </span>
        );
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                            My Leaves
                        </h1>
                        <p className="text-slate-400">Apply for leaves and track your request history.</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700/50">
                    <button 
                        onClick={() => setActiveTab('new')}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        New Request
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Request History
                    </button>
                </div>

                {activeTab === 'new' && (
                    <div className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm max-w-2xl">
                        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <Plus className="text-indigo-400" /> Apply for Leave
                        </h2>
                        
                        {msg.text && (
                            <div className={`mb-6 p-4 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Subject / Course</label>
                                <select 
                                    required
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">Select a course...</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">From Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">To Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Reason</label>
                                <textarea 
                                    required
                                    rows="4"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    placeholder="Please explain why you need leave..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25">
                                Submit Request
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {loading && <p className="text-slate-500 text-center py-10">Loading history...</p>}
                        
                        {!loading && leaves.length === 0 && (
                            <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 dashed-border">
                                <FileText size={48} className="mx-auto mb-4 text-slate-600" />
                                <p className="text-slate-500">No leave history found.</p>
                            </div>
                        )}

                        {leaves.map(leave => (
                            <div key={leave._id} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-slate-200">{leave.course?.name || 'Unknown Course'}</h3>
                                        <StatusBadge status={leave.status} />
                                    </div>
                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                        <Calendar size={14} /> 
                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-1">"{leave.reason}"</p>
                                </div>
                                <div className="text-right text-xs text-slate-500 shrink-0">
                                    Applied on {new Date(leave.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default StudentLeaves;
