'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Target, Trophy, Skull } from 'lucide-react'

const ROLE_META = {
    mafia: { label: 'Mafia', color: 'text-secondary', border: 'border-secondary-container/50' },
    doctor: { label: 'Doctor', color: 'text-emerald-400', border: 'border-emerald-900/50' },
    detective: { label: 'Detective', color: 'text-blue-400', border: 'border-blue-900/50' },
    villager: { label: 'Villager', color: 'text-on-surface', border: 'border-surface-container-high' },
}

const WinScreen = ({ winner, players, currentUserId, onReplay }) => {
    const isMafia = winner === 'mafia'
    const mePlayer = players.find(p => p.user_id === currentUserId)
    const isReady = mePlayer?.ready_for_replay
    const readyCount = players.filter(p => p.ready_for_replay).length

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className={`absolute top-[10%] left-[20%] w-[60%] h-[60%] ${isMafia ? 'bg-secondary-container/40' : 'bg-emerald-900/40'} blur-[150px] rounded-full`} />
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, type: 'spring', damping: 20 }}
                className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full"
            >
                <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }} className="relative mb-8">
                    <div className={`absolute inset-0 ${isMafia ? 'bg-secondary/30' : 'bg-emerald-500/30'} blur-3xl rounded-full`} />
                    <div className={`relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] ${isMafia ? 'text-secondary' : 'text-emerald-400'}`}>
                        {isMafia ? <Target className="w-32 h-32 sm:w-40 sm:h-40" /> : <Trophy className="w-32 h-32 sm:w-40 sm:h-40" />}
                    </div>
                </motion.div>

                <h2 className={`text-5xl sm:text-7xl md:text-8xl font-black font-display uppercase tracking-tighter mb-4 text-transparent bg-clip-text ${isMafia ? 'bg-gradient-to-br from-secondary to-secondary-container drop-shadow-[0_0_20px_rgba(225,29,72,0.3)]' : 'bg-gradient-to-br from-emerald-300 to-emerald-600 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
                    {isMafia ? 'Mafia Wins' : 'Village Wins'}
                </h2>
                <p className="text-on-surface-variant font-medium text-base sm:text-lg mb-10 sm:mb-12 tracking-wide px-4">
                    {isMafia ? "Darkness has swallowed the town forever." : "Truth has triumphed in the light of day."}
                </p>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="w-full glass-panel border border-outline-variant/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-surface/10 to-transparent pointer-events-none" />
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.3em] mb-6 relative z-10 text-center">Secret Identity Reveal</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                        {players.map(p => {
                            const meta = ROLE_META[p.role] || ROLE_META.villager
                            return (
                                <div key={p.id} className={`flex items-center gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl ${!p.is_alive ? 'opacity-50 grayscale bg-surface-container-lowest' : `bg-surface-container text-on-surface shadow-sm`}`}>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-xl sm:text-3xl shadow-inner shrink-0">{meta.icon || <Target/>}</div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-on-surface font-bold text-sm sm:text-base truncate">{p.username}</p>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest ${meta.color}`}>{meta.label}</p>
                                    </div>
                                    {!p.is_alive && <Skull className="w-5 h-5 sm:w-6 sm:h-6 ml-auto text-on-surface-variant shrink-0" />}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 z-10 w-full sm:w-auto px-4">
                    {isReady ? (
                        <div className="px-6 sm:px-8 py-3 sm:py-4 bg-surface-container-highest rounded-xl flex flex-col items-center gap-1 backdrop-blur-xl w-full sm:w-auto">
                            <p className="text-on-surface/80 font-bold text-xs sm:text-sm">Waiting for others...</p>
                            <p className="text-on-surface-variant text-xs">{readyCount} / {players.length} ready</p>
                        </div>
                    ) : (
                        <motion.button onClick={onReplay} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 ${isMafia ? 'bg-secondary hover:bg-secondary/90 text-on-secondary shadow-md' : 'bg-emerald-600 hover:bg-emerald-500 text-on-surface shadow-md'} rounded-xl font-bold uppercase tracking-widest text-xs sm:text-sm transition-all`}>
                            Play Again in this Room
                        </motion.button>
                    )}
                    <a href="/" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-surface-container-low hover:bg-surface-container rounded-xl text-on-surface-variant hover:text-on-surface font-bold uppercase tracking-[0.1em] text-xs sm:text-sm transition-all text-center">
                        Leave
                    </a>
                </div>
            </motion.div>
        </div>
    )
}

export default WinScreen
