import React from 'react';
import Card from './Card';
import { CheckCircle, XCircle, AlertTriangle, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const CourseCard = ({ _id, name, code, teacher, semester, attended, total, target = 75 }) => {

    // Calculations
    const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);
    const isSafe = percentage >= target;

    // Badge Logic
    let badgeText = "";
    let badgeColor = "";
    let message = "";

    if (total === 0) {
        badgeText = "No Classes Yet";
        badgeColor = "bg-slate-500/20 text-slate-400 border-slate-500/30";
        message = "Waiting for lectures";
    } else if (isSafe) {
        const possibleTotal = attended / (target / 100);
        const safeBunks = Math.floor(possibleTotal - total);
        if (safeBunks > 0) {
            badgeText = "Safe to Bunk";
            badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            message = `+${safeBunks} safe bunks`;
        } else {
            badgeText = "On Track";
            badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            message = "Maintain attendance";
        }
    } else {
        const required = Math.ceil(((target / 100) * total - attended) / (1 - (target / 100)));
        badgeText = "Low Attendance";
        badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
        message = `Need ${required > 0 ? required : 0} more`;
    }

    // SVG parameters
    const size = 68;
    const strokeWidth = 7;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const progressColor = isSafe ? 'text-emerald-500' : 'text-rose-500';

    return (
        <Card className="hover:scale-[1.02] transition-transform duration-200 group/card relative">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                        {name}
                        <span className="text-xs font-normal text-slate-500">({code})</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${badgeColor}`}>
                            {badgeText}
                        </span>
                        <span className="text-xs text-slate-400">{message}</span>
                    </div>

                    <div className="mt-4 space-y-1.5">
                        {teacher && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <User size={14} className="text-indigo-400" />
                                <span className="font-medium text-slate-300">{teacher.name}</span>
                            </div>
                        )}
                        {semester && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Calendar size={14} className="text-emerald-400" />
                                <span>
                                    <span className="font-medium text-slate-300">{semester.name}</span>
                                    {semester.startDate && semester.endDate &&
                                        <span className="text-slate-500"> • {new Date(semester.startDate).toLocaleDateString()} — {new Date(semester.endDate).toLocaleDateString()}</span>
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Circle */}
                <div className="relative w-[68px] h-[68px] shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            className="text-slate-700"
                            strokeWidth={strokeWidth}
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx={center}
                            cy={center}
                        />
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`${progressColor}`}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx={center}
                            cy={center}
                        />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-bold text-white">
                        {percentage}%
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <CheckCircle size={14} className="text-emerald-500/50" />
                        <span>{attended} Present</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <XCircle size={14} className="text-rose-500/50" />
                        <span>{total - attended} Absent</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CourseCard;
