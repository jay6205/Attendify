import React, { useState, useEffect, useContext } from 'react';
import { Calendar, CheckCircle, XCircle, Users, Save, CheckSquare, Brain } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import TeacherSessionModal from '../components/TeacherSessionModal';
import TeacherActiveSessionWidget from '../components/TeacherActiveSessionWidget';

const TeacherAttendance = () => {
    const { user } = useContext(AuthContext);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: 'Present' | 'Absent' }
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [showAiModal, setShowAiModal] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);

    // 1. Fetch Teacher's Courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/academic/courses');
                let fetchedCourses = res.data;
                // Filter for this teacher
                if (user && user.role === 'teacher') {
                    fetchedCourses = fetchedCourses.filter(c => c.teacher?._id === user._id || c.teacher === user._id);
                }
                setCourses(fetchedCourses);
                if (fetchedCourses.length > 0) {
                    setSelectedCourse(fetchedCourses[0]._id);
                }
            } catch (err) {
                console.error("Failed to fetch courses", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [user]);

    // 2. Fetch Students AND Existing Attendance when Course or Date Changes
    useEffect(() => {
        if (!selectedCourse || !selectedDate) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Parallel Fetch: Course Details (for students) & Existing Attendance (for status)
                const [courseRes, attRes] = await Promise.all([
                    api.get(`/academic/courses/${selectedCourse}`),
                    api.get(`/attendance/course/${selectedCourse}?date=${selectedDate}`) // Assuming query param support or client filtering
                ]);

                const courseStudents = courseRes.data.students || [];
                setStudents(courseStudents);

                // Process Existing Attendance
                // attRes.data is array of attendance records.
                // We need to map studentId -> status for the selected date.
                // Note: The API /attendance/course/:id might return ALL history. 
                // We should filter for selectedDate if backend doesn't support ?date query param.

                const existingRecords = attRes.data || [];
                const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0];

                const initialMap = {};

                courseStudents.forEach(s => {
                    // Find record for this student on this date
                    const record = existingRecords.find(r => {
                        const rDate = new Date(r.date).toISOString().split('T')[0];
                        return r.student._id === s._id && rDate === selectedDateStr;
                    });

                    initialMap[s._id] = record ? record.status : 'Present'; // Default to Present if no record
                });

                setAttendanceMap(initialMap);

            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCourse, selectedDate]);

    const handleToggle = (studentId) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
        }));
    };

    const handleMarkAll = (status) => {
        const newMap = {};
        students.forEach(s => newMap[s._id] = status);
        setAttendanceMap(newMap);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setMsg({ type: '', text: '' });

        try {
            const promises = students.map(student => {
                return api.post('/attendance/mark', {
                    studentId: student._id,
                    courseId: selectedCourse,
                    date: selectedDate,
                    status: attendanceMap[student._id]
                });
            });

            await Promise.all(promises);

            setMsg({ type: 'success', text: 'Attendance marked successfully!' });

            // Re-fetch logic is handled by the dependency array of useEffect [selectedCourse, selectedDate]
            // But we might need to manually trigger if date didn't change.
            // Actually, since we just updated the backend, we don't strictly need to refetch 
            // if we trust our local state `attendanceMap` which is what we just sent.
            // But for correctness, we could. For now, visual feedback is enough.

            setTimeout(() => setMsg({ type: '', text: '' }), 3000);

        } catch (err) {
            console.error("Attendance Submit Error", err);
            setMsg({ type: 'error', text: 'Failed to submit attendance.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">
                        Mark Attendance
                    </h1>
                    <p className="text-slate-400">
                        Select a course and date to record student attendance.
                    </p>
                </header>

                

                {activeSessionId && (
                    <TeacherActiveSessionWidget 
                        sessionId={activeSessionId} 
                        onClose={() => setActiveSessionId(null)} 
                    />
                )}

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Select Course</label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="" disabled>Select a course...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Select Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setShowAiModal(true)}
                        disabled={!selectedCourse}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <Brain size={18} />
                        Start AI Session
                    </button>
                </div>

                {/* Feedback Message */}
                {msg.text && (
                    <div className={`p-4 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {msg.text}
                    </div>
                )}

                {/* Student List */}
                {loading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>
                ) : students.length > 0 ? (
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                                <Users size={18} /> Class List ({students.length})
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => handleMarkAll('Present')} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500/20 transition-colors">
                                    Mark All Present
                                </button>
                                <button onClick={() => handleMarkAll('Absent')} className="text-xs bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded hover:bg-rose-500/20 transition-colors">
                                    Mark All Absent
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-700/50">
                            {students.map(student => (
                                <div key={student._id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-slate-200">{student.name}</p>
                                        <p className="text-xs text-slate-500">{student.email} • {student.details?.studentId || 'No ID'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(student._id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${attendanceMap[student._id] === 'Present'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}
                                    >
                                        {attendanceMap[student._id] === 'Present' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        {attendanceMap[student._id]}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-800/50 border-t border-slate-700/50 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            >
                                {submitting ? (
                                    <>Saving...</>
                                ) : (
                                    <> <Save size={20} /> Submit Attendance </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 text-slate-500">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No students enrolled in this course.</p>
                    </div>
                )}
            {showAiModal && (
                <TeacherSessionModal 
                    courseId={selectedCourse}
                    onClose={() => setShowAiModal(false)}
                    onSuccess={(sessionId) => {
                        setMsg({ type: 'success', text: 'AI Session Started Successfully!' });
                        if (sessionId) setActiveSessionId(sessionId);
                    }}
                />
            )}
            </div>
        </PageTransition>
    );
};

export default TeacherAttendance;
