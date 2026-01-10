import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 relative animate-pulse h-[166px]">
            <div className="flex items-start justify-between mb-6">
                <div className="space-y-3 w-full">
                    {/* Title Skeleton */}
                    <div className="h-6 w-32 bg-slate-700/50 rounded-md"></div>
                    
                    {/* Badge Skeleton */}
                    <div className="flex items-center gap-2">
                         <div className="h-5 w-20 bg-slate-700/50 rounded-md"></div>
                         <div className="h-4 w-24 bg-slate-700/30 rounded-md"></div>
                    </div>
                </div>
                
                {/* Circle Skeleton */}
                <div className="w-[68px] h-[68px] rounded-full bg-slate-700/20 border-4 border-slate-700/30 flex-shrink-0"></div>
            </div>

            {/* Footer Skeleton */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="flex gap-4">
                    <div className="h-4 w-16 bg-slate-700/30 rounded-md"></div>
                    <div className="h-4 w-16 bg-slate-700/30 rounded-md"></div>
                </div>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
