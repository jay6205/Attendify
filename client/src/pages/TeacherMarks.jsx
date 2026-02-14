import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import AssessmentCard from '../components/marks/AssessmentCard';

const TeacherMarks = () => {
    const { user } = useContext(AuthContext);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/marks/assessment/teacher/all');
                setAssessments(res.data);
            } catch (err) {
                console.error("Failed to fetch assessments", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssessments();
    }, [user]);

    const filteredAssessments = assessments.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.course?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">
                            Marks Management
                        </h1>
                        <p className="text-slate-400">
                            Create assessments and enter marks for your courses.
                        </p>
                    </div>
                    <Link 
                        to="/teacher/marks/create" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Create Assessment
                    </Link>
                </header>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search assessments by title or course..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center p-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
                    </div>
                ) : filteredAssessments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssessments.map(assessment => (
                            <AssessmentCard key={assessment._id} assessment={assessment} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">No assessments found</p>
                        <p className="mb-6">Get started by creating your first assessment.</p>
                        <Link 
                            to="/teacher/marks/create" 
                            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            <Plus size={18} /> Create New
                        </Link>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default TeacherMarks;
