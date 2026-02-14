import React from 'react';
import { User, AlertCircle } from 'lucide-react';

const MarksTable = ({ students, marksMap, onMarkChange, maxMarks, readOnly = false }) => {
    return (
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-800/50 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Marks (Max: {maxMarks})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {students.map((student) => {
                            const currentMark = marksMap[student._id] || '';
                            const isInvalid = currentMark !== '' && (Number(currentMark) < 0 || Number(currentMark) > maxMarks);

                            return (
                                <tr key={student._id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            {student.name}
                                            <div className="text-xs text-slate-500 font-normal">{student.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {student.details?.studentId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative max-w-[120px]">
                                            {readOnly ? (
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-300 font-medium text-center">
                                                    {currentMark !== '' ? currentMark : '-'}
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxMarks}
                                                        value={currentMark}
                                                        onChange={(e) => onMarkChange(student._id, e.target.value)}
                                                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 transition-all ${
                                                            isInvalid 
                                                            ? 'border-rose-500 focus:ring-rose-500/50' 
                                                            : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                        }`}
                                                        placeholder="0"
                                                    />
                                                    {isInvalid && (
                                                        <div className="absolute right-3 top-2.5 text-rose-500" title={`Marks must be between 0 and ${maxMarks}`}>
                                                            <AlertCircle size={16} />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                                    No students enrolled in this course.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarksTable;
