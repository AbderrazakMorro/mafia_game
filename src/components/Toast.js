import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function Toast({ message, onClose, duration = 3000 }) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl px-6 py-3"
                >
                    <div className="bg-emerald-500/20 p-2 rounded-full">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-white font-medium text-sm tracking-wide">{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
