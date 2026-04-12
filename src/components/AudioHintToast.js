'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Settings, X, Music } from 'lucide-react'
import { useGlobalAudio } from './GlobalAudioProvider'

const STORAGE_KEY = 'audio_hint_dismissed'
// Delay before showing the toast (ms) — wait for the first interaction unlock
const SHOW_DELAY = 2200

export default function AudioHintToast({ onOpenSettings }) {
    const [visible, setVisible] = useState(false)
    const { isMuted, toggleMute } = useGlobalAudio()

    useEffect(() => {
        // Only show once per browser
        if (typeof window === 'undefined') return
        if (localStorage.getItem(STORAGE_KEY)) return

        const timer = setTimeout(() => setVisible(true), SHOW_DELAY)
        return () => clearTimeout(timer)
    }, [])

    const dismiss = useCallback(() => {
        setVisible(false)
        try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    }, [])

    const handleMute = useCallback(() => {
        toggleMute()
        dismiss()
    }, [toggleMute, dismiss])

    const handleOpenSettings = useCallback(() => {
        onOpenSettings?.()
        dismiss()
    }, [onOpenSettings, dismiss])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="audio-hint"
                    initial={{ opacity: 0, y: 80, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4"
                    role="alert"
                    aria-live="polite"
                >
                    <div
                        className="relative flex flex-col gap-3 rounded-2xl px-5 py-4 shadow-2xl border border-outline-variant/20"
                        style={{
                            background: 'rgba(19, 19, 23, 0.82)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(211,187,255,0.06)',
                        }}
                    >
                        {/* Dismiss X */}
                        <button
                            onClick={dismiss}
                            aria-label="Fermer"
                            className="absolute top-3 right-3 p-1.5 rounded-full text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-highest/50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon + text */}
                        <div className="flex items-start gap-3 pr-6">
                            <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                                <Music className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-on-surface font-bold text-sm tracking-wide">
                                    🎵 Sound is on
                                </p>
                                <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">
                                    You can disable music and sound effects at any time via the audio settings.
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={handleMute}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-outline-variant/20 text-on-surface-variant hover:text-secondary hover:border-secondary/40 hover:bg-secondary/10"
                            >
                                <VolumeX className="w-4 h-4" />
                                Mute Sound
                            </button>
                            <button
                                onClick={handleOpenSettings}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 hover:shadow-[0_0_12px_rgba(211,187,255,0.25)]"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
