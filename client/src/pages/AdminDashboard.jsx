import React, { useState, useEffect, useContext } from 'react';
import { Plus, UserPlus, BookOpen, Calendar, Users, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'semesters' | 'courses' | 'enroll'

    // Data Loading States
    const [teachers, setTeachers] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Forms State
    const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '', department: '', qualification: '' });
    const [semesterForm, setSemesterForm] = useState({ name: '', startDate: '', endDate: '' });
    const [courseForm, setCourseForm] = useState({ name: '', code: '', semesterId: '', teacherId: '', credits: 3 });
    const [enrollForm, setEnrollForm] = useState({ studentEmail: '', courseId: '' });
    // To resolve Email -> ID, I need a helper endpoint or just try to send email if backend supports it.
    // Backend `enrollStudent` expects `studentId`. 
    // I can't easily resolve Email to ID without an endpoint.
    // Backend `adminController` doesn't have `getStudentByEmail`. 
    // I'll stick to 'Student ID' for now to match backend strictness, or ask user later.

    // ------------------------------------------
    // Data Fetchers
    // ------------------------------------------
    const fetchTeachers = async () => {
        try { const res = await api.get('/admin/teachers'); setTeachers(res.data); } catch (e) { console.error(e); }
    };
    const fetchSemesters = async () => {
        try { const res = await api.get('/academic/semesters'); setSemesters(res.data); } catch (e) { console.error(e); }
    };
    const fetchCourses = async () => {
        try { const res = await api.get('/academic/courses'); setCourses(res.data); } catch (e) { console.error(e); }
    };
    const fetchStudents = async () => {
        try { const res = await api.get('/admin/students'); setStudents(res.data); } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (activeTab === 'courses') { fetchTeachers(); fetchSemesters(); }
        if (activeTab === 'enroll') { fetchCourses(); fetchStudents(); }
        if (activeTab === 'semesters') { fetchSemesters(); }
    }, [activeTab]);


    // ------------------------------------------
    // Handlers
    // ------------------------------------------
    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        setLoading(true); setMsg({ type: '', text: '' });
        try {
            await api.post('/admin/teachers', teacherForm);
            setMsg({ type: 'success', text: 'Teacher created successfully!' });
            setTeacherForm({ name: '', email: '', password: '', department: '', qualification: '' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally { setLoading(false); }
    };

    const handleCreateSemester = async (e) => {
        e.preventDefault();
        setLoading(true); setMsg({ type: '', text: '' });
        try {
            await api.post('/admin/semesters', semesterForm);
            setMsg({ type: 'success', text: 'Semester created successfully!' });
            setSemesterForm({ name: '', startDate: '', endDate: '' });
            fetchSemesters(); // Refresh the list
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally { setLoading(false); }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setLoading(true); setMsg({ type: '', text: '' });
        try {
            await api.post('/admin/courses', courseForm);
            setMsg({ type: 'success', text: 'Course created successfully!' });
            setCourseForm({ name: '', code: '', semesterId: '', teacherId: '', credits: 3 });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally { setLoading(false); }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        setLoading(true); setMsg({ type: '', text: '' });
        try {
            await api.post('/admin/enroll', { studentEmail: enrollForm.studentEmail, courseId: enrollForm.courseId });
            setMsg({ type: 'success', text: 'Student enrolled successfully!' });
            setEnrollForm({ studentEmail: '', courseId: '' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally { setLoading(false); }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setActiveTab(id); setMsg({ type: '', text: '' }); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent mb-1">
                        Admin Portal
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-400">
                        <p>Manage system resources and enrollments.</p>
                        {user?.organization && (
                            <span className="bg-slate-700/50 px-3 py-1 rounded-full text-indigo-300 text-sm border border-slate-600 w-fit">
                                Org Code: <span className="font-mono font-bold text-white">{user.organization.code || 'N/A'}</span>
                            </span>
                        )}
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full">
                    <TabButton id="teachers" label="Teacher" icon={UserPlus} />
                    <TabButton id="semesters" label="Semester" icon={Calendar} />
                    <TabButton id="courses" label="Course" icon={BookOpen} />
                    <TabButton id="enroll" label="Enroll" icon={Users} />
                </div>

                {/* Feedback */}
                {msg.text && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                        {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        {msg.text}
                    </div>
                )}

                {/* Forms Area */}
                <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm max-w-3xl w-full">

                    {activeTab === 'teachers' && (
                        <form onSubmit={handleCreateTeacher} className="space-y-4 sm:space-y-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="flex items-center gap-2"><UserPlus size={20} className="text-indigo-400" /> New Teacher Account</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Full Name</label><input required className="input-field text-sm sm:text-base" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} type="text" /></div>
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Email</label><input required className="input-field text-sm sm:text-base" value={teacherForm.email} onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} type="email" /></div>
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Password</label><input required className="input-field text-sm sm:text-base" value={teacherForm.password} onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })} type="password" /></div>
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Department</label><input required className="input-field text-sm sm:text-base" value={teacherForm.department} onChange={e => setTeacherForm({ ...teacherForm, department: e.target.value })} type="text" /></div>
                                <div className="md:col-span-2"><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Qualification</label><input required className="input-field text-sm sm:text-base" value={teacherForm.qualification} onChange={e => setTeacherForm({ ...teacherForm, qualification: e.target.value })} type="text" /></div>
                            </div>
                            <button disabled={loading} type="submit" className="btn-primary w-full mt-2 sm:mt-0">{loading ? 'Creating...' : 'Create Teacher'}</button>
                        </form>
                    )}

                    {activeTab === 'semesters' && (
                        <div className="space-y-8">
                            <form onSubmit={handleCreateSemester} className="space-y-4 sm:space-y-6 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2"><Calendar size={20} className="text-indigo-400" /> New Semester</h2>
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Semester Name (e.g. Spring 2024)</label><input required className="input-field text-sm sm:text-base bg-slate-900" value={semesterForm.name} onChange={e => setSemesterForm({ ...semesterForm, name: e.target.value })} type="text" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Start Date</label><input required className="input-field text-sm sm:text-base bg-slate-900" value={semesterForm.startDate} onChange={e => setSemesterForm({ ...semesterForm, startDate: e.target.value })} type="date" /></div>
                                    <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">End Date</label><input required className="input-field text-sm sm:text-base bg-slate-900" value={semesterForm.endDate} onChange={e => setSemesterForm({ ...semesterForm, endDate: e.target.value })} type="date" /></div>
                                </div>
                                <button disabled={loading} type="submit" className="btn-primary w-full mt-2 sm:mt-0">{loading ? 'Creating...' : 'Create Semester'}</button>
                            </form>

                            <div className="pt-4 border-t border-slate-700/50">
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                                    <Calendar size={18} className="text-indigo-400" /> Existing Semesters ({semesters.length})
                                </h3>

                                {semesters.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                        No semesters created yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {semesters.map(semester => {
                                            const now = new Date();
                                            const start = new Date(semester.startDate);
                                            const end = new Date(semester.endDate);

                                            // Normalize to start of day in local time for consistent comparison
                                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                            const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                                            const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                                            let status = 'Active';
                                            let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                                            if (today < startDay) {
                                                status = 'Upcoming';
                                                badgeClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                                            } else if (today > endDay) {
                                                status = 'Completed';
                                                badgeClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                                            }
                                            return (
                                                <div key={semester._id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-bold text-slate-200">{semester.name}</h4>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                                                {status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400">
                                                            {new Date(semester.startDate).toLocaleDateString()} — {new Date(semester.endDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <form onSubmit={handleCreateCourse} className="space-y-4 sm:space-y-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2"><BookOpen size={20} className="text-indigo-400" /> New Course</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Course Name</label><input required className="input-field text-sm sm:text-base" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} type="text" /></div>
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Course Code</label><input required className="input-field text-sm sm:text-base" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} type="text" /></div>

                                <div>
                                    <label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Semester</label>
                                    <select required className="input-field text-sm sm:text-base" value={courseForm.semesterId} onChange={e => setCourseForm({ ...courseForm, semesterId: e.target.value })}>
                                        <option value="">Select Semester...</option>
                                        {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Department Teacher</label>
                                    <select required className="input-field text-sm sm:text-base" value={courseForm.teacherId} onChange={e => setCourseForm({ ...courseForm, teacherId: e.target.value })}>
                                        <option value="">Select Teacher...</option>
                                        {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.details?.department})</option>)}
                                    </select>
                                </div>
                                <div><label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Credits</label><input required className="input-field text-sm sm:text-base" value={courseForm.credits} onChange={e => setCourseForm({ ...courseForm, credits: e.target.value })} type="number" /></div>
                            </div>
                            <button disabled={loading} type="submit" className="btn-primary w-full mt-2 sm:mt-0">{loading ? 'Creating...' : 'Create Course'}</button>
                        </form>
                    )}

                    {activeTab === 'enroll' && (
                        <form onSubmit={handleEnroll} className="space-y-4 sm:space-y-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 sm:mb-6 flex items-center gap-2"><Users size={20} className="text-indigo-400" /> Enroll Student</h2>
                            <div>
                                <label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Select Student</label>
                                <select required className="input-field text-sm sm:text-base" value={enrollForm.studentEmail} onChange={e => setEnrollForm({ ...enrollForm, studentEmail: e.target.value })}>
                                    <option value="">Select Student...</option>
                                    {students.map(s => <option key={s._id} value={s.email}>{s.name} ({s.email})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-400 text-[13px] sm:text-sm mb-1 block">Select Course</label>
                                <select required className="input-field text-sm sm:text-base" value={enrollForm.courseId} onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })}>
                                    <option value="">Select Course...</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                                </select>
                            </div>
                            <button disabled={loading} type="submit" className="btn-primary w-full mt-2 sm:mt-0">{loading ? 'Enrolling...' : 'Enroll Student'}</button>
                        </form>
                    )}

                </div>

                {/* CSS Helper for inputs (since I can't use detailed classes everywhere in one line) */}
                <style>{`
                    .input-field {
                        width: 100%;
                        max-width: 100%;
                        background-color: rgb(15 23 42);
                        border: 1px solid rgb(51 65 85);
                        border-radius: 0.5rem;
                        padding: 0.6rem 0.75rem;
                        color: rgb(226 232 240);
                        outline: none;
                        transition: all 0.2s;
                    }
                    @media (min-width: 640px) {
                        .input-field {
                            padding: 0.75rem 1rem;
                        }
                    }
                    .input-field:focus {
                        border-color: rgb(79 70 229);
                    }
                    .btn-primary {
                        background-color: rgb(79 70 229);
                        color: white;
                        font-weight: 600;
                        padding: 0.75rem;
                        border-radius: 0.75rem;
                        transition: all 0.2s;
                    }
                    .btn-primary:hover:not(:disabled) {
                        background-color: rgb(67 56 202);
                    }
                    .btn-primary:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </PageTransition>
    );
};

export default AdminDashboard;
