'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon } from 'lucide-react'

const NightOverlay = ({ playerRole, players, currentPhase, currentUserId, onAction, detectiveResult }) => {
    const [selectedTarget, setSelectedTarget] = useState(null)
    const [acted, setActed] = useState(false)

    const isMyTurn =
        (currentPhase === 'night_mafia' && playerRole === 'mafia') ||
        (currentPhase === 'night_doctor' && playerRole === 'doctor') ||
        (currentPhase === 'night_detective' && playerRole === 'detective')

    const instructions = {
        mafia: 'The town sleeps. Choose your target.',
        doctor: 'Who will you protect tonight?',
        detective: 'Who do you suspect?',
    }

    const validTargets = players.filter(p => {
        if (!p.is_alive) return false
        if (playerRole === 'mafia' && p.role === 'mafia') return false
        return true
    })

    const handleConfirm = async () => {
        if (!selectedTarget || acted) return
        setActed(true)
        await onAction(selectedTarget)
    }

    const phaseLabel = currentPhase === 'night_mafia' ? 'Mafia Phase'
        : currentPhase === 'night_doctor' ? 'Doctor Phase'
            : currentPhase === 'night_detective' ? 'Detective Phase'
                : 'Night'

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-on-surface p-4 font-sans relative overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-20%] w-[80%] h-[80%] bg-primary-container/20 blur-[150px] rounded-full" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-xl w-full flex flex-col items-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary-container/30 blur-2xl rounded-full" />
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-surface-container-highest backdrop-blur-md flex items-center justify-center mb-6 shadow-2xl">
                        <Moon className="w-12 h-12 sm:w-16 sm:h-16 text-primary drop-shadow-[0_0_15px_rgba(211,187,255,0.4)]" />
                    </div>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary-container uppercase tracking-widest mb-2 drop-shadow-md">Night</h2>
                <p className="text-primary/70 font-bold text-xs sm:text-sm uppercase tracking-[0.3em] mb-8 sm:mb-10">{phaseLabel}</p>

                {isMyTurn && !acted ? (
                    <motion.div className="w-full glass-panel border border-outline-variant/10 p-6 sm:p-8 rounded-3xl shadow-2xl" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <p className="text-center text-secondary mb-6 sm:mb-8 font-bold font-display text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em]">{instructions[playerRole]}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar p-1">
                            {validTargets.map(p => (
                                <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedTarget(p.id)}
                                    className={`p-3 sm:p-4 rounded-xl transition-all font-bold text-sm sm:text-base ${selectedTarget === p.id
                                        ? 'bg-secondary-container text-secondary shadow-[0_0_15px_rgba(255,180,172,0.2)] ring-2 ring-secondary/50'
                                        : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'}`}
                                >
                                    <span className="truncate block max-w-full">{p.username}</span>
                                    {p.user_id === currentUserId && <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">(you)</span>}
                                </motion.button>
                            ))}
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm} disabled={!selectedTarget}
                            className="w-full mt-6 sm:mt-8 py-3 sm:py-4 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold uppercase tracking-widest text-xs sm:text-sm disabled:opacity-50 disabled:grayscale transition-all shadow-md"
                        >
                            Confirm
                        </motion.button>
                    </motion.div>
                ) : acted ? (
                    <div className="flex flex-col items-center mt-8 gap-6 glass-panel border border-outline-variant/10 px-8 py-6 rounded-3xl w-full">
                        <p className="text-primary/70 font-medium tracking-wide">Action submitted. Waiting for others...</p>
                        <div className="flex gap-3">
                            {[0, 0.2, 0.4].map((d, i) => (
                                <div key={i} className="w-3 h-3 bg-primary/60 rounded-full animate-bounce shadow-md" style={{ animationDelay: `${d}s` }} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center mt-12 gap-8">
                        <p className="text-primary/40 font-medium tracking-widest uppercase">The shadows act in secret...</p>
                        <div className="flex gap-3">
                            {[0, 0.2, 0.4].map((d, i) => (
                                <div key={i} className="w-3 h-3 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default NightOverlay
