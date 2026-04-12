'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, HeartPulse, Search, Users } from 'lucide-react'

const ROLE_META = {
    mafia: { label: 'Mafia', color: 'text-secondary', bg: 'from-secondary-container', icon: <Target className="w-full h-full" />, border: 'border-secondary-container' },
    doctor: { label: 'Doctor', color: 'text-emerald-400', bg: 'from-emerald-900', icon: <HeartPulse className="w-full h-full" />, border: 'border-emerald-900/50' },
    detective: { label: 'Detective', color: 'text-blue-400', bg: 'from-blue-900', icon: <Search className="w-full h-full" />, border: 'border-blue-900/50' },
    villager: { label: 'Villager', color: 'text-on-surface', bg: 'from-surface-container-highest', icon: <Users className="w-full h-full" />, border: 'border-surface-container-high' },
}

const RoleReveal = ({ role, mafiaTeam, onAcknowledge }) => {
    const [flipped, setFlipped] = useState(false)
    const r = ROLE_META[role] || ROLE_META.villager

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4 font-sans relative overflow-hidden" style={{ perspective: 1200 }}>
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary-container blur-[120px] rounded-full" />
            </div>

            <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-on-surface-variant uppercase tracking-[0.2em] sm:tracking-[0.4em] font-bold font-display text-xs sm:text-sm mb-8 sm:mb-12 relative z-10 text-center">
                Your Secret Identity
            </motion.p>
            <div className="relative w-64 h-[380px] sm:w-72 sm:h-[420px] max-w-[90vw] cursor-pointer select-none z-10 group" onClick={() => setFlipped(true)}>
                <motion.div
                    animate={{ opacity: flipped ? 1 : 0.2, scale: flipped ? 1.05 : 1 }}
                    className={`absolute inset-0 blur-3xl transition-colors duration-700 rounded-3xl ${flipped ? r.color.replace('text', 'bg') + '/30' : 'bg-primary-container/20 group-hover:bg-primary-container/40'}`}
                />

                <motion.div className="w-full h-full absolute" initial={false}
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.9, type: 'spring', stiffness: 200, damping: 25 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Back of Card */}
                    <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl flex flex-col items-center justify-center gap-6 shadow-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-highest to-transparent opacity-80" />
                        <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center text-5xl shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-500 text-primary">
                            <Search className="w-12 h-12" />
                        </div>
                        <p className="text-on-surface-variant text-sm font-medium tracking-widest uppercase relative z-10">Tap to reveal</p>
                    </div>

                    {/* Front of Card */}
                    <div className="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-2xl overflow-hidden"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-b ${r.bg} to-transparent opacity-30`} />
                        <div className="text-7xl mb-6 relative z-10 drop-shadow-xl filter">{r.icon}</div>
                        <h3 className={`text-4xl font-black font-display uppercase tracking-tighter mb-4 relative z-10 ${r.color}`}>{r.label}</h3>
                        <div className="w-16 h-1 rounded-full bg-outline-variant/50 mb-6 relative z-10" />
                        <p className="text-on-surface font-medium text-sm leading-relaxed relative z-10 px-2">
                            {role === 'mafia' && 'Eliminate villagers at night. Lie convincingly during the day.'}
                            {role === 'doctor' && 'Save one life each night. Use your power wisely.'}
                            {role === 'detective' && 'Find the guilty ones by investigating a suspect each night.'}
                            {role === 'villager' && 'Stay alert. Unmask the Mafia before it\'s too late.'}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Mafia Team Info */}
            <AnimatePresence>
                {flipped && role === 'mafia' && mafiaTeam && mafiaTeam.length > 1 && (
                    <motion.div initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
                        className="mt-8 bg-surface-container-lowest/50 backdrop-blur-md shadow-lg rounded-2xl px-8 py-4 text-center z-10 relative"
                    >
                        <p className="text-secondary font-bold font-display text-[10px] uppercase tracking-[0.3em] mb-2">Your Shadow Partners</p>
                        <p className="text-on-surface font-medium text-base">{mafiaTeam.join(', ')}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ready Button */}
            <AnimatePresence>
                {flipped && (
                    <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }}
                        onClick={onAcknowledge}
                        className="mt-12 group relative rounded-2xl z-10"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary-container rounded-2xl blur-md opacity-20 group-hover:opacity-60 transition-opacity"></span>
                        <div className="relative bg-surface-container-highest hover:bg-surface-container-lowest backdrop-blur-xl px-12 py-4 rounded-2xl transition-all">
                            <span className="text-primary font-bold text-sm uppercase tracking-widest">
                                I understand my role
                            </span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}

export default RoleReveal
