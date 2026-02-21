import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, Bot, Loader2, ArrowLeft, FileText, CheckCircle, AlertCircle, List, Eye, Calendar, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../../components/PageTransition";

const QuestionPaperBuilderPage = () => {
    const navigate = useNavigate();
    // View State: 'BUILDER' | 'LIST'
    const [viewMode, setViewMode] = useState("BUILDER");

    const [courses, setCourses] = useState([]);
    const [savedPapers, setSavedPapers] = useState([]);

    // Builder State
    const [selectedCourse, setSelectedCourse] = useState("");
    const [paperTitle, setPaperTitle] = useState("");
    const [totalMarks, setTotalMarks] = useState(100);
    const [mode, setMode] = useState("MANUAL"); // MANUAL | LLM
    const [questions, setQuestions] = useState([]);

    // LLM Mode State
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [loadingAI, setLoadingAI] = useState(false);

    // Schema Builder State
    const [schemaRows, setSchemaRows] = useState([
        { type: "MCQ", count: 5, marks: 1 }
    ]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (viewMode === "LIST") {
            fetchSavedPapers();
        }
    }, [viewMode]);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get(`${API_URL}/academic/courses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCourses(response.data);
        } catch (error) {
            console.error("Error fetching courses", error);
        }
    };

    const fetchSavedPapers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return; // Added token guard
            const response = await axios.get(`${API_URL}/question-paper/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSavedPapers(response.data);
        } catch (error) {
            console.error("Error fetching saved papers", error);
        }
    };

    const loadPaper = (paper) => {
        setSelectedCourse(paper.course?._id || paper.course); // Handle populated or raw ID
        setPaperTitle(paper.title);
        setTotalMarks(paper.totalMarks);
        setQuestions(paper.questions.map(q => ({ ...q, id: q._id || Date.now() + Math.random() }))); // Ensure IDs for frontend handling
        setMode(paper.mode || "MANUAL");
        setViewMode("BUILDER");
    };

    const resetBuilder = () => {
        setPaperTitle("");
        setTotalMarks(100);
        setQuestions([]);
        setTopic("");
        setSchemaRows([{ type: "MCQ", count: 5, marks: 1 }]);
        setMode("MANUAL");
        setViewMode("BUILDER");
    };

    // --- Functions (Logic remains same, only UI changes) ---
    const addManualQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: Date.now(),
                questionText: "",
                questionType: "MCQ",
                marks: 1,
                options: ["", "", "", ""],
            },
        ]);
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
    };

    const updateOption = (qId, optIndex, value) => {
        setQuestions(questions.map((q) => q.id === qId ? { ...q, options: q.options.map((opt, i) => (i === optIndex ? value : opt)) } : q));
    };

    const deleteQuestion = (id) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const addSchemaRow = () => {
        setSchemaRows([...schemaRows, { type: "MCQ", count: 1, marks: 1 }]);
    };

    const updateSchemaRow = (index, field, value) => {
        const newRows = [...schemaRows];
        newRows[index][field] = value;
        setSchemaRows(newRows);
    };

    const deleteSchemaRow = (index) => {
        if (schemaRows.length > 1) {
            const newRows = schemaRows.filter((_, i) => i !== index);
            setSchemaRows(newRows);
        }
    };

    const generateWithAI = async () => {
        if (!selectedCourse || !topic) {
            alert("Please select a course and enter a topic.");
            return;
        }

        setLoadingAI(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                courseId: selectedCourse,
                topic,
                difficulty,
                questionSchema: schemaRows.map(row => ({
                    type: row.type,
                    count: parseInt(row.count),
                    marks: parseInt(row.marks)
                }))
            };

            const response = await axios.post(
                `${API_URL}/question-paper/llm/generate`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const generatedQuestions = (response.data.questions || []).map((q) => ({
                ...q,
                id: Date.now() + Math.random(),
            }));

            setQuestions(generatedQuestions);
            setPaperTitle(response.data.title || `${topic} - ${difficulty}`);

            const genTotal = generatedQuestions.reduce((sum, q) => sum + parseInt(q.marks), 0);
            setTotalMarks(genTotal);

        } catch (error) {
            console.error("AI Generation failed", error);
            alert("Failed to generate details. Please try again.");
        } finally {
            setLoadingAI(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCourse || !paperTitle) {
            alert("Please check Course and Title fields.");
            return;
        }

        const currentTotal = questions.reduce((sum, q) => sum + Number(q.marks), 0);
        if (currentTotal !== Number(totalMarks)) {
            alert(`Validation Error: Questions total (${currentTotal}) does not match Total Marks (${totalMarks}).`);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const payload = {
                // organization handled by backend
                course: selectedCourse,
                title: paperTitle,
                totalMarks: Number(totalMarks),
                questions: questions.map(({ id, ...rest }) => rest), // Remove local IDs
            };

            const endpoint = mode === 'LLM' ? '/save' : '/manual/create';

            await axios.post(
                `${API_URL}/question-paper${endpoint}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Question Paper Saved Successfully!");
            setViewMode("LIST"); // Switch to list view after save

        } catch (error) {
            console.error("Save failed", error);
            alert(error.response?.data?.message || "Failed to save paper");
        }
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                            Question Paper {viewMode === "LIST" ? "Archive" : "Builder"}
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {viewMode === "LIST" ? "View and manage your saved question papers." : "Design assessments manually or with AI assistance."}
                        </p>
                    </div>

                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => {
                                setViewMode("LIST");
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "LIST"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <List size={16} /> Saved Papers
                        </button>
                        <button
                            onClick={resetBuilder}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "BUILDER"
                                ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <Plus size={16} /> Create New
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === "LIST" ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {savedPapers.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                                    <FileText size={48} className="mx-auto text-slate-600 mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-300">No Papers Found</h3>
                                    <p className="text-slate-500 mt-2">Create your first question paper to see it here.</p>
                                    <button
                                        onClick={resetBuilder}
                                        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Create Now
                                    </button>
                                </div>
                            ) : (
                                savedPapers.map((paper) => (
                                    <div key={paper._id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FileText size={100} />
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${paper.mode === 'LLM' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-indigo-500/20 text-indigo-400'
                                                }`}>
                                                {paper.mode === 'LLM' ? 'AI Generated' : 'Manual'}
                                            </span>
                                            <span className="text-slate-500 text-xs flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(paper.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{paper.title}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                            <BookOpen size={14} />
                                            <span>{paper.course?.name || "Unknown Course"}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-slate-400 border-t border-slate-700/50 pt-4 mt-auto">
                                            <div>
                                                <span className="text-slate-200 font-bold">{paper.questions?.length || 0}</span> Questions
                                            </div>
                                            <div>
                                                <span className="text-slate-200 font-bold">{paper.totalMarks}</span> Marks
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => loadPaper(paper)}
                                            className="w-full mt-4 bg-slate-700 hover:bg-indigo-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                        >
                                            <Eye size={16} /> View / Edit
                                        </button>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="builder"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* --- Builder UI (Basic Details, AI Config, Questions List) --- */}
                            {/* Basic Details Card */}
                            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                                        <FileText size={20} className="text-indigo-400" />
                                        Paper Details
                                    </h3>
                                    <div className="flex bg-slate-900 p-1 rounded-lg">
                                        <button
                                            onClick={() => setMode("MANUAL")}
                                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "MANUAL"
                                                ? "bg-indigo-600 text-white"
                                                : "text-slate-400 hover:text-slate-200"
                                                }`}
                                        >
                                            Manual
                                        </button>
                                        <button
                                            onClick={() => setMode("LLM")}
                                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "LLM"
                                                ? "bg-fuchsia-600 text-white"
                                                : "text-slate-400 hover:text-slate-200"
                                                }`}
                                        >
                                            AI Gen
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Select Course</label>
                                        <select
                                            value={selectedCourse}
                                            onChange={(e) => setSelectedCourse(e.target.value)}
                                            className="w-full p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="">-- Choose Course --</option>
                                            {courses.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} ({c.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Paper Title</label>
                                        <input
                                            type="text"
                                            value={paperTitle}
                                            onChange={(e) => setPaperTitle(e.target.value)}
                                            className="w-full p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. Mid-Term Exam 2024"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Total Marks</label>
                                        <input
                                            type="number"
                                            value={totalMarks}
                                            onChange={(e) => setTotalMarks(e.target.value)}
                                            className="w-full p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AI Configuration Panel */}
                            {mode === "LLM" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 shadow-sm space-y-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -z-10" />

                                    <div className="border-b border-slate-700 pb-4 mb-4">
                                        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                                            <Bot size={20} className="text-fuchsia-400" /> AI Configuration
                                        </h2>
                                        <p className="text-sm text-slate-400 mt-1">Provide context and structural rules for the AI model.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Topic / Syllabus</label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                className="w-full p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all"
                                                placeholder="e.g. React Hooks, State Management"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Difficulty Level</label>
                                            <select
                                                value={difficulty}
                                                onChange={(e) => setDifficulty(e.target.value)}
                                                className="w-full p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Question Pattern Structure</label>
                                        {schemaRows.map((row, index) => (
                                            <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center mb-2">
                                                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={row.count}
                                                        onChange={(e) => updateSchemaRow(index, 'count', e.target.value)}
                                                        className="w-16 p-1 bg-transparent border-none text-center text-white focus:ring-0"
                                                        placeholder="Qty"
                                                    />
                                                    <span className="text-slate-500 text-sm">questions of</span>
                                                </div>

                                                <select
                                                    value={row.type}
                                                    onChange={(e) => updateSchemaRow(index, 'type', e.target.value)}
                                                    className="w-40 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                                >
                                                    <option value="MCQ">MCQ</option>
                                                    <option value="SHORT">Short Answer</option>
                                                    <option value="LONG">Long Answer</option>
                                                    <option value="NUMERICAL">Numerical</option>
                                                </select>

                                                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                                                    <span className="text-slate-500 text-sm">worth</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={row.marks}
                                                        onChange={(e) => updateSchemaRow(index, 'marks', e.target.value)}
                                                        className="w-16 p-1 bg-transparent border-none text-center text-white focus:ring-0"
                                                        placeholder="Marks"
                                                    />
                                                    <span className="text-slate-500 text-sm">marks each</span>
                                                </div>

                                                <button
                                                    onClick={() => deleteSchemaRow(index)}
                                                    className="text-slate-600 hover:text-rose-500 p-2 transition-colors ml-auto md:ml-0"
                                                    disabled={schemaRows.length === 1}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={addSchemaRow}
                                            className="text-fuchsia-400 text-sm font-medium hover:text-fuchsia-300 flex items-center gap-1 mt-3"
                                        >
                                            <Plus size={16} /> Add another group
                                        </button>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={generateWithAI}
                                            disabled={loadingAI}
                                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-fuchsia-900/20 font-medium"
                                        >
                                            {loadingAI ? <Loader2 className="animate-spin" size={20} /> : <Bot size={20} />}
                                            Generate Draft Paper
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Editor / Questions List */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                                    <h2 className="text-xl font-bold text-slate-100">
                                        Paper Content <span className="text-slate-500 font-normal text-sm ml-2">({questions.length} questions)</span>
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full border ${questions.reduce((sum, q) => sum + Number(q.marks), 0) === Number(totalMarks)
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                            {questions.reduce((sum, q) => sum + Number(q.marks), 0) === Number(totalMarks)
                                                ? <CheckCircle size={14} />
                                                : <AlertCircle size={14} />
                                            }
                                            Total: {questions.reduce((sum, q) => sum + Number(q.marks), 0)} / {totalMarks} Marks
                                        </div>
                                        {mode === 'MANUAL' && (
                                            <button
                                                onClick={addManualQuestion}
                                                className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                                            >
                                                <Plus size={16} /> Add Question
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {questions.length === 0 && (
                                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                            <FileText size={32} />
                                        </div>
                                        <div className="text-slate-300 font-medium mb-2">No questions added yet</div>
                                        <p className="text-slate-500 text-sm max-w-md mx-auto">
                                            {mode === 'LLM'
                                                ? 'Configure the AI settings above and click Generate to create a draft.'
                                                : 'Click "Add Question" to start building your paper question by question.'}
                                        </p>
                                    </div>
                                )}

                                {questions.map((q, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={q.id}
                                        className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
                                    >
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border border-slate-600">
                                                        Q{index + 1}
                                                    </span>
                                                    <select
                                                        value={q.questionType}
                                                        onChange={(e) => updateQuestion(q.id, "questionType", e.target.value)}
                                                        className="text-xs font-semibold uppercase border-none bg-transparent text-indigo-400 focus:ring-0 cursor-pointer hover:text-indigo-300"
                                                    >
                                                        <option value="MCQ">MCQ</option>
                                                        <option value="SHORT">Short Answer</option>
                                                        <option value="LONG">Long Answer</option>
                                                        <option value="NUMERICAL">Numerical</option>
                                                    </select>
                                                </div>
                                                <textarea
                                                    value={q.questionText}
                                                    onChange={(e) => updateQuestion(q.id, "questionText", e.target.value)}
                                                    className="w-full text-base text-slate-200 border-none p-0 focus:ring-0 placeholder-slate-600 resize-none bg-transparent leading-relaxed"
                                                    placeholder="Enter question text here..."
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="flex flex-col items-end gap-3 border-l pl-4 border-slate-700">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Marks</span>
                                                    <input
                                                        type="number"
                                                        value={q.marks}
                                                        onChange={(e) => updateQuestion(q.id, "marks", e.target.value)}
                                                        className="w-12 p-1 text-center font-bold text-slate-200 bg-transparent border-b border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => deleteQuestion(q.id)}
                                                    className="text-slate-600 hover:text-rose-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {q.questionType === "MCQ" && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 ml-2">
                                                {(q.options || ["", "", "", ""]).map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-3 group/opt">
                                                        <span className="text-slate-600 text-xs font-mono w-4 group-hover/opt:text-slate-400 transition-colors">{String.fromCharCode(65 + i)}.</span>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                            className="flex-1 p-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-600"
                                                            placeholder={`Option ${i + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {questions.length > 0 && (
                                    <div className="sticky bottom-4 flex justify-end pt-4">
                                        <button
                                            onClick={handleSave}
                                            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/20 flex items-center gap-2 font-bold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Save size={20} /> Save Question Paper
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default QuestionPaperBuilderPage;
