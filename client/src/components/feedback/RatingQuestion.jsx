import React from 'react';
import { Star } from 'lucide-react';

const RatingQuestion = ({ question, index, value, onChange, scaleMax = 5 }) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-200">
                {index + 1}. {question}
            </label>
            <div className="flex items-center gap-2">
                {Array.from({ length: scaleMax }, (_, i) => i + 1).map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="transition-all duration-200 transform hover:scale-125 focus:outline-none"
                    >
                        <Star
                            size={28}
                            className={`transition-colors duration-200 ${star <= value
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-600 hover:text-amber-300'
                                }`}
                        />
                    </button>
                ))}
                {value > 0 && (
                    <span className="ml-3 text-sm text-slate-400">
                        {value}/{scaleMax}
                    </span>
                )}
            </div>
        </div>
    );
};

export default RatingQuestion;
