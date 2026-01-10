import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { PlusCircle, Loader, Clock } from 'lucide-react';

const AddTimetableForm = ({ onEntryAdded, onClose }) => {
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [day, setDay] = useState('Monday');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [room, setRoom] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Fetch available subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/subjects');
                setSubjects(res.data);
                if (res.data.length > 0) {
                    setSubjectId(res.data[0]._id);
                }
            } catch (err) {
                console.error("Failed to load subjects", err);
                setError("Could not load subjects. Please create a subject first.");
            }
        };
        fetchSubjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/timetable/entries', {
                subjectId,
                day,
                startTime,
                endTime,
                room: room || 'Room 301' // Default if empty
            });
            onEntryAdded();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    {error}
                </div>
            )}

            {/* Subject Select */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                <select 
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                >
                    {subjects.length === 0 && <option value="">No subjects found</option>}
                    {subjects.map(sub => (
                        <option key={sub._id} value={sub._id}>{sub.name} ({sub.type})</option>
                    ))}
                </select>
                {subjects.length === 0 && (
                     <p className="text-xs text-amber-500 mt-1">You must create a subject in Dashboard first.</p>
                )}
            </div>

            {/* Day Select */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Day</label>
                <select 
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                    {days.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Start Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            type="time" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 bg-[length:0]" // Hides default picker icon in some browsers
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Room (Optional) */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Room / Hall (Optional)</label>
                <input 
                    type="text" 
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Hall B or 301"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
            </div>

            <button
                type="submit"
                disabled={loading || subjects.length === 0}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                Add to Schedule
            </button>
        </form>
    );
};

export default AddTimetableForm;
