import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, Users, Calendar } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const TeacherCourses = () => {
    const { user } = useContext(AuthContext);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fetch all courses (The backend might return all, so we might need to filter client-side if the API doesn't filtering by teacher yet)
                // Ideally, the API should support ?teacherId=... or the controller should filter by req.user role.
                // Based on previous analysis, academicController returns all. We will filter client-side for safety.
                const res = await api.get('/academic/courses');
                
                let fetchedCourses = res.data;
                
                // Client-side filter to ensure we only show courses for this teacher
                if (user && user.role === 'teacher') {
                    fetchedCourses = fetchedCourses.filter(course => 
                        course.teacher?._id === user._id || course.teacher === user._id
                    );
                }

                setCourses(fetchedCourses);
            } catch (err) {
                console.error("Failed to fetch courses", err);
                setError("Failed to load courses. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                        My Courses
                    </h1>
                    <p className="text-slate-400">
                        Manage your assigned courses and student enrollments.
                    </p>
                </header>

                {courses.length === 0 ? (
                    <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 dashed-border">
                        <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-medium text-slate-300">No Courses Assigned</h3>
                        <p className="text-slate-500 mt-2">You haven't been assigned to any courses yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div 
                                key={course._id} 
                                className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:border-indigo-500/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-slate-300">
                                        {course.code}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-100 mb-2">{course.name}</h3>
                                
                                <div className="space-y-2 text-sm text-slate-400 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-slate-500" />
                                        <span>{course.semester?.name || 'Unknown Semester'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-slate-500" />
                                        <span>{course.students?.length || 0} Students Enrolled</span>
                                    </div>
                                </div>

                                <button className="w-full py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium">
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default TeacherCourses;
