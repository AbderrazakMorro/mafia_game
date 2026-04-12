'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Music, Settings, X, Mic2 } from 'lucide-react'
import { useGlobalAudio } from './GlobalAudioProvider'

export default function AudioSettingsModal({ isOpen, onClose }) {
    const { 
        isMuted, 
        toggleMute, 
        musicVolume, 
        setMusicVolume, 
        sfxVolume, 
        setSfxVolume,
        playSFX
    } = useGlobalAudio();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface/90 backdrop-blur-xl font-sans p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-2xl bg-surface-container-lowest"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl text-primary border border-primary/30">
                            <Settings className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface tracking-wide">Audio Settings</h2>
                    </div>
                    <button 
                        onClick={() => { playSFX('click'); onClose(); }}
                        className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Master Mute Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                        <div className="flex items-center gap-3 text-on-surface">
                            {isMuted ? <VolumeX className="w-5 h-5 text-error" /> : <Volume2 className="w-5 h-5 text-primary" />}
                            <span className="font-medium">Mute all sound</span>
                        </div>
                        <button
                            onClick={() => { playSFX('click'); toggleMute(); }}
                            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isMuted ? 'bg-primary' : 'bg-surface-container-highest'}`}
                        >
                            <motion.div 
                                className="bg-on-primary w-6 h-6 rounded-full shadow-md"
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                animate={{ x: isMuted ? 24 : 0 }}
                            />
                        </button>
                    </div>

                    {/* Music Volume */}
                    <div className={`space-y-4 transition-opacity duration-300 ${isMuted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex justify-between items-center text-on-surface-variant mb-1">
                            <div className="flex items-center gap-2">
                                <Music className="w-4 h-4" />
                                <span className="text-sm font-medium">Music</span>
                            </div>
                            <span className="text-sm">{Math.round(musicVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={musicVolume}
                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* SFX Volume */}
                    <div className={`space-y-4 transition-opacity duration-300 ${isMuted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex justify-between items-center text-on-surface-variant mb-1">
                            <div className="flex items-center gap-2">
                                <Mic2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Sound Effects</span>
                            </div>
                            <span className="text-sm">{Math.round(sfxVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={sfxVolume}
                            onChange={(e) => {
                                setSfxVolume(parseFloat(e.target.value));
                            }}
                            onMouseUp={() => playSFX('click')} // Feedback sound
                            onTouchEnd={() => playSFX('click')}
                            className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                <div className="mt-10">
                    <button
                        onClick={() => { playSFX('click'); onClose(); }}
                        className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold shadow-[0_0_15px_rgba(109,40,217,0.4)] transition-all"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
