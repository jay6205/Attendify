import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Clock, MapPin, MoreVertical, FileText, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import AddTimetableForm from '../components/AddTimetableForm';

const Timetable = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Add error state
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Days of the week
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Fetch existing timetable
    const fetchTimetable = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/timetable');
            // Backend now returns { days: { Monday: [], ... } }
            setSchedule(res.data.days || {}); 
        } catch (error) {
            console.error("Failed to fetch timetable", error);
            setError("Could not load timetable. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable();
    }, []);

    const [selectedIndices, setSelectedIndices] = useState(new Set());

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/timetable/upload', formData);
            const data = res.data.parsedData || [];
            
            if (data.length === 0) {
                alert("No classes detected in this image. Please try a clearer image or add manually.");
            } else {
                setPreviewData(data);
                // Auto-select all by default
                const allIndices = new Set(data.map((_, i) => i));
                setSelectedIndices(allIndices);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload timetable");
        } finally {
            setUploading(false);
        }
    };

    const toggleSelection = (index) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const handleBulkSave = async () => {
        if (!previewData || selectedIndices.size === 0) return;
        
        const entriesToSave = previewData.filter((_, i) => selectedIndices.has(i));
        setLoading(true); // Re-use loading state or add a saving state
        try {
            await api.post('/timetable/bulk', { entries: entriesToSave });
            setPreviewData(null); // Clear preview on success
            fetchTimetable(); // Refresh grid
            alert(`Successfully added ${entriesToSave.length} classes!`);
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save classes");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get entries for a specific day
    const getEntriesForDay = (day) => {
        // Access grouped data directly (Single Source of Truth)
        const dayEntries = schedule[day] || [];
        
        const dbEntries = dayEntries.map(s => ({
            ...s,
            title: s.subjectId?.name || 'Unknown Subject',
            type: s.subjectId?.type || 'Theory',
            isPreview: false
        }));

        const previewEntries = previewData ? previewData.map((p, index) => ({
            ...p, originalIndex: index
        })).filter(d => d.day === day).map((p) => ({
             _id: `preview-${p.originalIndex}`,
            startTime: p.startTime,
            endTime: p.endTime,
            title: p.subject,
            type: 'Preview',
            room: 'TBD',
            isPreview: true,
            originalIndex: p.originalIndex // Crucial for selection
        })) : [];

        return [...dbEntries, ...previewEntries].sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading schedule...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error} <button onClick={fetchTimetable} className="underline ml-2">Retry</button></div>;

    return (
        <div className="space-y-8 h-full flex flex-col pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Timetable Manager</h1>
                    <p className="text-slate-400">Optimize your attendance targets with smart scheduling.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} />
                        Add Class
                    </button>
                    <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer shadow-lg shadow-indigo-500/20">
                        {uploading ? <span className="animate-pulse">Uploading...</span> : (
                            <>
                                <Upload size={16} />
                                Upload Image
                            </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
            </header>

            {/* Usage Tip if Empty */}
            {Object.keys(schedule).length === 0 && !previewData && (
                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl text-center">
                    <p className="text-slate-400 mb-2">Your schedule is empty.</p>
                    <p className="text-sm text-slate-500">
                        Click <span className="text-emerald-400 font-bold">Add Class</span> to manually add subjects, or Upload an image (OCR is currently disabled/empty).
                    </p>
                </div>
            )}

            {/* OCR Preview Banner */}
            {previewData && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-100">OCR Results</h3>
                            <p className="text-sm text-indigo-300">
                                {previewData.length > 0 
                                    ? `Found ${previewData.length} classes.` 
                                    : "No text detected (Mock data is disabled). Please add classes manually."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPreviewData(null)}
                            className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleBulkSave}
                            disabled={selectedIndices.size === 0}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold shadow-lg shadow-indigo-500/20"
                        >
                            Save {selectedIndices.size} Classes
                        </button>
                    </div>
                </div>
            )}

            {/* Timetable Grid */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="min-w-[800px] grid grid-cols-5 gap-4">
                    {days.map((day) => (
                        <div key={day} className="flex flex-col gap-3">
                            {/* Day Header */}
                            <div className="text-slate-400 font-medium text-sm uppercase tracking-wider pb-2 border-b border-slate-800">
                                {day}
                            </div>
                            
                            {/* Entries */}
                            <div className="space-y-3">
                                {getEntriesForDay(day).length > 0 ? (
                                    getEntriesForDay(day).map((entry) => (
                                        <div 
                                            key={entry._id} 
                                            onClick={() => {
                                                if (entry.isPreview) toggleSelection(entry.originalIndex);
                                            }}
                                            className={`p-3 rounded-xl border ${
                                                entry.isPreview 
                                                    ? (selectedIndices.has(entry.originalIndex) 
                                                        ? 'bg-indigo-500/20 border-indigo-500 cursor-pointer shadow-lg shadow-indigo-500/10' 
                                                        : 'bg-slate-800/50 border-slate-700/50 opacity-50 cursor-pointer hover:opacity-80')
                                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                            } transition-all group relative`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {entry.isPreview && (
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedIndices.has(entry.originalIndex)}
                                                            readOnly
                                                            className="w-4 h-4 rounded border-slate-500 text-indigo-600 focus:ring-0 cursor-pointer"
                                                        />
                                                    )}
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                                        entry.type === 'Lab' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        entry.type === 'Lecture' || entry.type === 'Theory' ? 'bg-indigo-500/10 text-indigo-400' :
                                                        'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                        {entry.type}
                                                    </span>
                                                </div>
                                                {!entry.isPreview && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const subjName = entry.title || 'this subject';
                                                            if(window.confirm(`DELETE '${subjName}'?\n\nWARNING: This will remove the ENTIRE SUBJECT from your Dashboard, Analytics, and ALL scheduled classes.`)) {
                                                                api.delete(`/timetable/entries/${entry._id}`)
                                                                    .then(() => {
                                                                        // Since we deleted the data, we must refresh the schedule
                                                                        fetchTimetable(); 
                                                                    })
                                                                    .catch(err => {
                                                                        console.error(err);
                                                                        alert("Failed to delete subject");
                                                                    });
                                                            }
                                                        }}
                                                        className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete Subject & All Data"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <h4 className="font-bold text-slate-200 text-sm mb-1">{entry.title}</h4>
                                            
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {entry.startTime} - {entry.endTime}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                <MapPin size={12} />
                                                {entry.room || 'Room 301'}
                                            </div>

                                            {/* Top accent line */}
                                            <div className={`absolute top-0 left-4 right-4 h-[1px] ${
                                                entry.isPreview ? 'bg-indigo-500/50' : 'bg-transparent'
                                            }`}></div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-24 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-700 text-xs hover:border-slate-600 hover:text-slate-500 transition-colors cursor-pointer" onClick={() => setIsAddModalOpen(true)}>
                                        Free Slot (+)
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Entry Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Class to Schedule">
                <AddTimetableForm 
                    onEntryAdded={fetchTimetable} 
                    onClose={() => setIsAddModalOpen(false)} 
                />
            </Modal>
        </div>
    );
};

export default Timetable;
