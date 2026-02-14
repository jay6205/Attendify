import React from 'react';
import Card from '../Card';
import { Calendar, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AssessmentCard = ({ assessment }) => {
    const { _id, title, course, maxMarks, date, isPublished, submissionCount } = assessment;

    const hasMarks = submissionCount > 0;

    return (
        <Card className="hover:scale-[1.02] transition-transform duration-200 group/card relative flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
                        <FileText size={24} />
                    </div>
                    {isPublished ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                            Published
                        </span>
                    ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                            Draft
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1">{title}</h3>
                <p className="text-sm text-slate-400 mb-4">{course?.name} ({course?.code})</p>

                <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{new Date(date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={14} />
                        <span>Max Marks: {maxMarks}</span>
                    </div>
                    {hasMarks && (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle size={14} />
                            <span>{submissionCount} Marks Entered</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
                <Link 
                    to={`/teacher/marks/${_id}/enter`}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2 ${
                        hasMarks 
                        ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 ring-1 ring-emerald-500/30' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {hasMarks ? (
                        <>
                            <CheckCircle size={16} />
                            Marks Entered
                        </>
                    ) : (
                        'Enter Marks'
                    )}
                </Link>
                {/* Future: View Analytics */}
                {/* <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <ChevronRight size={20} />
                </button> */}
            </div>
        </Card>
    );
};

export default AssessmentCard;
