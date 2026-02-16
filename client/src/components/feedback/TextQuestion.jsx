import React from 'react';

const TextQuestion = ({ question, index, value, onChange }) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-200">
                {index + 1}. {question}
            </label>
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Share your thoughts... (optional)"
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all"
            />
        </div>
    );
};

export default TextQuestion;
