'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skull } from 'lucide-react'

const DeadScreen = ({ phase, events }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-surface/80 z-10" />
                <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-surface-container-highest/20 blur-[100px] rounded-full" />
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative z-20 flex flex-col items-center px-4 w-full max-w-sm sm:max-w-md">
                <div className="relative mb-6 sm:mb-8 text-on-surface-variant">
                    <div className="absolute inset-0 bg-surface-container-highest/30 blur-3xl rounded-full" />
                    <Skull className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-xl opacity-80" />
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-on-surface-variant to-on-surface uppercase tracking-tighter mb-4 drop-shadow-md">You are Dead</h2>
                <p className="text-on-surface-variant font-medium text-sm sm:text-base md:text-lg mb-10 sm:mb-12 tracking-wide text-balance">Watch the town's downfall in silence.</p>

                <div className="bg-surface-container-highest/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 w-full shadow-2xl">
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.4em] mb-3">Current Town Phase</p>
                    <p className="text-on-surface font-mono text-lg sm:text-xl font-bold uppercase tracking-widest">{phase?.replace(/_/g, ' ')}</p>
                </div>
            </motion.div>
        </div>
    )
}

export default DeadScreen
