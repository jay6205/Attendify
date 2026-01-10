import React, { useState } from 'react';
import api from '../api/axios';
import { PlusCircle, Loader } from 'lucide-react';

const AddSubjectForm = ({ onSubjectAdded, onClose }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Theory');
    const [attended, setAttended] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (parseInt(attended) > parseInt(total)) {
            setError('Attended classes cannot exceed total classes');
            return;
        }

        setLoading(true);
        try {
            await api.post('/subjects', {
                name,
                type,
                attended: parseInt(attended),
                total: parseInt(total)
            });
            onSubjectAdded(); // Refresh list
            onClose(); // Close modal
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add subject');
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

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subject Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Data Structures"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                        <option value="Tutorial">Tutorial</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Attended</label>
                    <input
                        type="number"
                        min="0"
                        value={attended}
                        onChange={(e) => setAttended(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Total</label>
                    <input
                        type="number"
                        min="0"
                        value={total}
                        onChange={(e) => setTotal(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                Add Subject
            </button>
        </form>
    );
};

export default AddSubjectForm;
