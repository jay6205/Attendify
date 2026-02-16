import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const ParentPhoneCaptureModal = ({ isOpen, onSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validatePhone = (phone) => {
        const phoneRegex = /^\d{10,15}$/;
        return phoneRegex.test(phone);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePhone(phoneNumber)) {
            setError('Please enter a valid phone number (10-15 digits, numbers only).');
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/update-phone', { phoneNumber });
            setSuccess(true);
            // Brief success animation before closing
            setTimeout(() => {
                onSuccess();
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update phone number. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop — no onClick dismiss (mandatory modal) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header Accent Bar */}
                        <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-400" />

                        {/* Content */}
                        <div className="p-8">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                                    <Phone className="text-amber-400" size={28} />
                                </div>
                            </div>

                            {/* Title & Description */}
                            <h2 className="text-2xl font-bold text-white text-center mb-2">
                                Phone Number Required
                            </h2>
                            <p className="text-slate-400 text-center text-sm mb-8">
                                Please provide your phone number to continue. This will be used for important notifications about your child's attendance.
                            </p>

                            {/* Success State */}
                            {success ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-3 py-4"
                                >
                                    <CheckCircle className="text-emerald-400" size={48} />
                                    <p className="text-emerald-400 font-medium">Phone number saved successfully!</p>
                                    <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Error */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm flex items-center gap-2"
                                        >
                                            <AlertCircle size={16} className="shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}

                                    {/* Phone Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="tel"
                                                required
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                                                placeholder="Enter your phone number"
                                                value={phoneNumber}
                                                onChange={(e) => {
                                                    // Allow only digits
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setPhoneNumber(val);
                                                    setError('');
                                                }}
                                                maxLength={15}
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1.5">
                                            Enter 10-15 digit phone number (numbers only)
                                        </p>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading || phoneNumber.length < 10}
                                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-900 disabled:text-slate-400 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Phone size={18} />
                                                Save Phone Number
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Future note */}
                            {/* TODO: Add OTP verification step here */}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ParentPhoneCaptureModal;
