'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, CheckCircle2, AlertCircle, Scale, Users, ShieldAlert, Target, HeartPulse, Search } from 'lucide-react'

const ROLE_META = {
    mafia: { label: 'Mafia', color: 'text-secondary' },
    doctor: { label: 'Doctor', color: 'text-emerald-400' },
    detective: { label: 'Detective', color: 'text-blue-400' },
    villager: { label: 'Villager', color: 'text-on-surface' },
}

const DayPhase = ({ players, currentUserId, onVote, phase, events, playerRole, detectiveOwnResult, room, voteCounts }) => {
    const [selectedTarget, setSelectedTarget] = useState(null)
    const [voted, setVoted] = useState(false)
    const living = players.filter(p => p.is_alive)

    const isRevote = room?.revote_candidates && room.revote_candidates.length > 0
    const eligibleCandidates = isRevote
        ? living.filter(p => room.revote_candidates.includes(p.id))
        : living

    useEffect(() => {
        setSelectedTarget(null)
        setVoted(false)
    }, [room?.revote_candidates])

    const nightResult = [...events].reverse().find(e => e.event_type === 'night_result')

    const handleVote = async () => {
        if (!selectedTarget || voted) return
        setVoted(true)
        await onVote(selectedTarget)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4 font-sans relative overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-tertiary-container/30 blur-[150px] rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] w-yellow-500/20 blur-[120px] rounded-full bg-tertiary-container/10" />
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-w-xl w-full flex flex-col gap-6">

                {nightResult && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-panel border border-outline-variant/10 rounded-3xl p-6 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-surface/10 to-transparent pointer-events-none" />
                        <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.3em] mb-4 text-center relative z-10">📰 Night Report</p>
                        {nightResult.payload.eliminated ? (
                            <div className="text-center relative z-10">
                                <p className="text-on-surface text-lg font-medium leading-relaxed">
                                    <span className="text-secondary font-bold text-xl px-2">{nightResult.payload.eliminated.username}</span> was eliminated last night.
                                </p>
                                <p className="mt-2 inline-block px-4 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-widest shadow-inner">
                                    {ROLE_META[nightResult.payload.eliminated.role]?.label}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 relative z-10">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow-md" />
                                <p className="text-center text-emerald-400 font-bold text-lg drop-shadow-md">Nobody was eliminated last night. A miracle occurred!</p>
                            </div>
                        )}

                        {playerRole === 'detective' && detectiveOwnResult !== null && detectiveOwnResult !== undefined && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                className={`mt-6 px-6 py-4 rounded-xl text-center relative z-10 ${detectiveOwnResult ? 'bg-secondary-container/20 shadow-sm' : 'bg-emerald-500/10 shadow-sm'}`}
                            >
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-2">Your Investigation Result</p>
                                <p className={`text-xl font-black flex items-center justify-center gap-2 ${detectiveOwnResult ? 'text-secondary' : 'text-emerald-400'} drop-shadow-md`}>
                                    {detectiveOwnResult ? <><ShieldAlert className="w-6 h-6" /> This person is Mafia!</> : <><CheckCircle2 className="w-6 h-6" /> This person is not Mafia.</>}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-outline-variant/10 shadow-2xl relative overflow-hidden flex flex-col items-center w-full">
                    <Sun className="w-20 h-20 sm:w-24 sm:h-24 text-tertiary mb-6 relative z-10 drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]" />
                    {isRevote && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-secondary-container/30 rounded-xl flex flex-col items-center text-center relative z-10 shadow-sm">
                            <Scale className="w-10 h-10 animate-pulse text-secondary drop-shadow-md" />
                            <h3 className="text-secondary font-bold uppercase tracking-widest mt-2">Revote — Tie!</h3>
                            <p className="text-on-surface-variant text-sm mt-1">You can only vote for the tied players.</p>
                        </motion.div>
                    )}
                    <h2 className="text-3xl sm:text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-tertiary to-orange-400 text-center uppercase tracking-tighter mb-2 relative z-10 drop-shadow-lg">
                        {phase === 'day_discussion' ? 'Public Debate' : 'The Judgement'}
                    </h2>
                    <p className="text-center text-on-surface-variant font-medium text-sm mb-8 sm:mb-10 relative z-10">Vote to eliminate a suspect.</p>

                    {voted ? (
                        <div className="text-center py-6 sm:py-10 relative z-10 bg-surface-container-highest/50 rounded-2xl w-full">
                            <p className="text-on-surface-variant font-medium tracking-wide mb-6 text-sm sm:text-base">Vote cast. The village deliberates...</p>
                            <div className="flex justify-center gap-3">
                                {[0, 0.2, 0.4].map((d, i) => (
                                    <div key={i} className="w-3 h-3 bg-tertiary/60 rounded-full animate-bounce shadow-sm" style={{ animationDelay: `${d}s` }} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar p-1">
                                {eligibleCandidates.map(p => {
                                    const count = voteCounts?.[p.id] || 0
                                    const isSelected = selectedTarget === p.id
                                    const isSelf = p.user_id === currentUserId

                                    return (
                                        <motion.button key={p.id} whileHover={!isSelf ? { scale: 1.02 } : {}} whileTap={!isSelf ? { scale: 0.98 } : {}}
                                            onClick={() => !isSelf && setSelectedTarget(p.id)}
                                            disabled={isSelf}
                                            className={`flex flex-col gap-2 px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all overflow-hidden relative ${isSelf ? 'opacity-50 cursor-not-allowed bg-surface-container-lowest text-on-surface-variant' : isSelected
                                                ? 'bg-tertiary-container/30 text-on-surface shadow-[0_0_15px_rgba(234,179,8,0.2)] ring-2 ring-tertiary/50'
                                                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'}`}
                                        >
                                            <div className="flex w-full items-center gap-3 sm:gap-4 relative z-10">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-black shrink-0 ${isSelected ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-highest text-tertiary/70'}`}>
                                                    {p.username[0].toUpperCase()}
                                                </div>
                                                <span className="font-bold text-sm sm:text-base truncate flex-1 text-left">{p.username}</span>
                                                {p.user_id === currentUserId && <span className="ml-auto text-[10px] uppercase font-bold text-on-surface-variant tracking-widest bg-surface/50 px-2 py-1 rounded-full shrink-0 hidden sm:inline-block">You</span>}
                                            </div>

                                            {phase === 'day_vote' && (
                                                <div className="flex items-center gap-3 w-full mt-2 relative z-10">
                                                    <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min((count / players.length) * 100, 100)}%` }}
                                                            className={`h-full rounded-full ${isSelected ? 'bg-tertiary' : 'bg-on-surface-variant/40'}`}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] sm:text-xs font-bold leading-none shrink-0 ${isSelected ? 'text-tertiary' : 'text-on-surface-variant'}`}>{count} vote{count > 1 ? 's' : ''}</span>
                                                </div>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleVote} disabled={!selectedTarget}
                                className="w-full py-3 sm:py-4 rounded-xl bg-tertiary hover:bg-tertiary/90 text-on-tertiary font-bold uppercase tracking-widest shadow-md disabled:opacity-50 disabled:grayscale transition-all text-sm sm:text-base"
                            >
                                {isRevote ? 'Confirm Revote' : 'Cast Vote'}
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default DayPhase
