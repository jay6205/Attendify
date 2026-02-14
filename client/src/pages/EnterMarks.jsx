import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import api from '../api/axios';
import PageTransition from '../components/PageTransition';
import MarksTable from '../components/marks/MarksTable';

const EnterMarks = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [marksMap, setMarksMap] = useState({}); // { studentId: marks }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Assessment & Existing Marks
                const marksRes = await api.get(`/marks/assessment/${assessmentId}`);
                const { assessment: assessmentData, marks: existingMarks } = marksRes.data;
                
                setAssessment(assessmentData);

                // Initialize marks map
                const initialMap = {};
                existingMarks.forEach(m => {
                    initialMap[m.student._id] = m.obtainedMarks;
                });
                setMarksMap(initialMap);

                // 2. Fetch Course Details to get ALL Students
                // We need the course ID from the assessment data
                if (assessmentData.course?._id) {
                    const courseRes = await api.get(`/academic/courses/${assessmentData.course._id}`);
                    const allStudents = courseRes.data.students || [];
                    setStudents(allStudents);

                    // Check if ALL students have marks
                    if (existingMarks.length > 0 && existingMarks.length === allStudents.length) {
                        setIsReadOnly(true);
                    }
                }

            } catch (err) {
                console.error("Failed to load data", err);
                setMsg({ type: 'error', text: 'Failed to load assessment data.' });
            } finally {
                setLoading(false);
            }
        };

        if (assessmentId) fetchData();
    }, [assessmentId]);

    const handleMarkChange = (studentId, value) => {
        setMarksMap(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg({ type: '', text: '' });

        try {
            // Convert map to array for API
            const marksArray = Object.entries(marksMap)
                .filter(([_, marks]) => marks !== '' && marks !== null) // Only send entered marks
                .map(([studentId, marks]) => ({
                    studentId,
                    obtainedMarks: Number(marks)
                }));

            if (marksArray.length === 0) {
                setMsg({ type: 'error', text: 'No marks entered to save.' });
                setSaving(false);
                return;
            }

            await api.post(`/marks/assessment/${assessmentId}/enter`, marksArray);
            
            setMsg({ type: 'success', text: 'Marks saved successfully!' });
            
            // Redirect after short delay
            setTimeout(() => {
                navigate('/teacher/marks');
            }, 1000);

        } catch (err) {
            console.error("Save failed", err);
            const errorMsg = err.response?.data?.errors 
                ? err.response.data.errors.join(', ')
                : 'Failed to save marks.';
            setMsg({ type: 'error', text: errorMsg });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-indigo-500" /></div>;
    if (!assessment) return <div className="p-10 text-center text-slate-500">Assessment not found.</div>;

    return (
        <PageTransition>
            <div className="space-y-6 pb-20">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/teacher/marks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Marks
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                                {assessment.title}
                            </span>
                            <span className="text-lg font-medium text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                                Max: {assessment.maxMarks}
                            </span>
                        </h1>
                        <p className="text-slate-400">
                            {assessment.course?.name} ({assessment.course?.code})
                        </p>
                    </div>

                    {isReadOnly ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            Marks Finalized
                        </div>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                        >
                            {saving ? 'Saving...' : <><Save size={20} /> Save Marks</>}
                        </button>
                    )}
                </header>

                {msg.text && (
                    <div className={`p-4 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {msg.text}
                    </div>
                )}

                <MarksTable 
                    students={students} 
                    marksMap={marksMap} 
                    onMarkChange={handleMarkChange} 
                    maxMarks={assessment.maxMarks}
                    readOnly={isReadOnly}
                />
            </div>
        </PageTransition>
    );
};

export default EnterMarks;
