import React, { useState } from 'react';
import Card from './Card';
import { Check, X, CheckCircle, XCircle, Trash2, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import AttendanceHistoryModal from './AttendanceHistoryModal';
import { motion } from 'framer-motion';
import ScaleButton from './ScaleButton';

const SubjectCard = ({ _id, name, type, attended, total, target = 75, onUpdate, onDelete }) => {
    // ... state ...
    const [localAttended, setLocalAttended] = useState(attended);
    const [localTotal, setLocalTotal] = useState(total);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // ... calculations ...
    const percentage = localTotal === 0 ? 0 : Math.round((localAttended / localTotal) * 100);
    const isSafe = percentage >= target;

    // Derived logic for message (Safe/Risk)
    let message = "";
    let badgeText = "";
    let badgeColor = "";

    if (isSafe) {
        // Safe calculation
        const possibleTotal = localAttended / (target / 100);
        const safeBunks = Math.floor(possibleTotal - localTotal);
        
        if (safeBunks > 0) {
            badgeText = "Safe to Bunk";
            badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            message = `+${safeBunks} classes buffer`;
        } else {
             badgeText = "On the Edge";
             badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
             message = "Don't miss any";
        }
    } else {
        // Required calculation
        const req = target / 100;
        const required = Math.ceil((req * localTotal - localAttended) / (1 - req));
        
        badgeText = "Must Attend";
        badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
        message = `Need ${required} more`;
    }

    // SVG parameters
    const size = 68;
    const strokeWidth = 7;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Color Logic
    const progressColor = isSafe ? 'text-emerald-500' : 'text-rose-500';

    const handleQuickUpdate = async (type) => {
        if (updating) return;
        setUpdating(true);

        // Snapshot for revert
        const prevAttended = localAttended;
        const prevTotal = localTotal;

        // Calculate potential new state
        let newAttended = localAttended;
        let newTotal = localTotal;

        if (type === 'inc') { // Present
            newAttended += 1;
            newTotal += 1;
            setLocalAttended(prev => prev + 1);
            setLocalTotal(prev => prev + 1);
        } else { // Absent
            newTotal += 1;
            setLocalTotal(prev => prev + 1);
        }

        // Confetti Logic
        const newPct = newTotal === 0 ? 0 : Math.round((newAttended / newTotal) * 100);
        const newIsSafe = newPct >= target;

        if (!isSafe && newIsSafe) {
             import('canvas-confetti').then((confetti) => {
                confetti.default({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999
                });
             });
        }

        try {
            const status = type === 'inc' ? 'Present' : 'Absent';
            // Use log endpoint to ensure atomic update and history tracking
            await api.post(`/attendance/logs/${_id}`, {
                status,
                date: new Date()
            });

            if (onUpdate) onUpdate(); 
        } catch (error) {
            console.error("Failed to update attendance", error);
            // Revert
            setLocalAttended(prevAttended);
            setLocalTotal(prevTotal);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm(`Are you sure you want to delete ${name}? This will remove all attendance history and schedule entries.`)) {
            setDeleting(true);
            try {
                await onDelete(_id); 
            } catch (error) {
                console.error("Delete failed", error);
                setDeleting(false);
            }
        }
    };

    return (
        <>
            <Card className={`hover:scale-[1.02] transition-transform duration-200 group/card relative ${deleting ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                            {name}
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <ScaleButton 
                                    onClick={() => setShowHistory(true)}
                                    className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="View History"
                                >
                                    <Clock size={16} />
                                </ScaleButton>
                                <ScaleButton 
                                    onClick={handleDelete}
                                    className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors p-1"
                                    title="Delete Subject"
                                >
                                    <Trash2 size={16} />
                                </ScaleButton>
                            </div>
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded border ${badgeColor}`}>
                                {badgeText}
                            </span>
                            <span className="text-xs text-slate-400">{message}</span>
                        </div>
                    </div>
                    
                    {/* Progress Circle */}
                    <div className="relative w-[68px] h-[68px]">
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
                            <span>{localAttended} Present</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <XCircle size={14} className="text-rose-500/50" />
                            <span>{localTotal - localAttended} Absent</span>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2">
                        <ScaleButton 
                            onClick={() => handleQuickUpdate('inc')}
                            disabled={updating}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 transition-colors border border-slate-700 hover:border-emerald-500/30"
                            title="Mark Present"
                        >
                            <Check size={16} />
                        </ScaleButton>
                        <ScaleButton 
                            onClick={() => handleQuickUpdate('dec')}
                            disabled={updating}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-colors border border-slate-700 hover:border-rose-500/30"
                            title="Mark Absent"
                        >
                            <X size={16} />
                        </ScaleButton>
                    </div>
                </div>
            </Card>

            {/* History Modal */}
            {showHistory && (
                <AttendanceHistoryModal 
                    subject={{ _id, name }} 
                    onClose={() => setShowHistory(false)} 
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
};
export default SubjectCard;
