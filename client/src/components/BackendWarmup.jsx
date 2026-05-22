import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useBackendStatus from '../hooks/useBackendStatus';
import { Loader2, ServerCrash, DatabaseZap, CheckCircle2 } from 'lucide-react';

const messages = [
    'Waking up the server...',
    'Almost there...',
    'Establishing connections...',
    'Warming up services...',
    'Preparing your experience...',
];

const BackendWarmup = ({ children }) => {
    const { status, dbStatus, retryCount, elapsed, STATUS } = useBackendStatus();

    // Already ready — render children immediately
    if (status === STATUS.READY) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        );
    }

    // Error state — allow user to proceed anyway (backend may partially work)
    if (status === STATUS.ERROR) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
                >
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <ServerCrash size={32} className="text-rose-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">
                            Server is taking longer than usual
                        </h2>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            The backend server is hosted on Render's free tier and may take up to 60 seconds to cold-start.
                            You can wait or proceed — some features may be temporarily unavailable.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors mr-3"
                        >
                            Retry
                        </button>
<button
    onClick={() => {
        window.location.reload();
    }}
    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
>
    Proceed Anyway
</button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Warming / Degraded — show loading overlay
    const messageIndex = Math.min(Math.floor(elapsed / 4), messages.length - 1);
    const currentMessage = status === STATUS.DEGRADED
        ? 'Reconnecting to database...'
        : messages[messageIndex];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="warmup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
            >
                <div className="text-center max-w-sm">
                    {/* Logo */}
                    <motion.div
                        className="mb-8"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    >
                        <img
                            src="/Gemini_Generated_Image_71kxcc71kxcc71kx.png"
                            alt="Attendify Logo"
                            className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-lg shadow-indigo-500/20"
                        />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
                        Attendify
                    </h1>

                    {/* Spinner */}
                    <div className="mb-6 flex justify-center">
                        {status === STATUS.DEGRADED ? (
                            <DatabaseZap size={28} className="text-amber-400 animate-pulse" />
                        ) : (
                            <Loader2 size={28} className="text-indigo-400 animate-spin" />
                        )}
                    </div>

                    {/* Status message */}
                    <motion.p
                        key={currentMessage}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-slate-400 text-sm mb-3"
                    >
                        {currentMessage}
                    </motion.p>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mb-4">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                                animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [0.8, 1.2, 0.8],
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>

                    {/* Subtle helper text */}
                    <p className="text-slate-600 text-xs">
                        Free-tier backend warming up • may take up to 60 seconds
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BackendWarmup;
