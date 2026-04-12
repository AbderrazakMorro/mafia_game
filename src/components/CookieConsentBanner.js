'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCookieConsent, setCookieConsent } from '../utils/cookieUtils'

export default function CookieConsentBanner({ onConsentChange }) {
    const [isVisible, setIsVisible] = useState(false)
    const [consentState, setConsentState] = useState(null)

    useEffect(() => {
        const currentConsent = getCookieConsent()
        setConsentState(currentConsent)
        if (currentConsent === null) {
            const timer = setTimeout(() => setIsVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAllow = () => {
        setCookieConsent('granted')
        setConsentState('granted')
        setIsVisible(false)
        if (onConsentChange) onConsentChange('granted')
    }

    const handleDecline = () => {
        setCookieConsent('denied')
        setConsentState('denied')
        setIsVisible(false)
        if (onConsentChange) onConsentChange('denied')
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-md z-[9999]"
                >
                    <div className="glass-panel bg-surface-container/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl overflow-hidden relative border border-outline-variant/10">
                        {/* Glow effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-primary/90 to-primary-container/90 rounded-full blur-[2px]" />

                        <div className="flex items-start gap-4">
                            <div className="text-3xl shrink-0 mt-1">🍪</div>
                            <div className="flex-1">
                                <h3 className="text-on-surface font-bold text-lg mb-1 tracking-wide font-display">
                                    Session Storage
                                </h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-4 font-medium">
                                    We use a cookie to remember your identity so you can refresh the page without losing your place in the room.
                                </p>

                                <div className="flex gap-3 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAllow}
                                        className="flex-1 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-[0_10px_20px_rgba(109,40,217,0.3)] uppercase tracking-wider"
                                    >
                                        Accept
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDecline}
                                        className="flex-1 bg-surface-container-high/60 hover:bg-surface-container-highest text-on-surface font-medium py-2.5 px-4 rounded-xl text-sm transition-all uppercase tracking-wider"
                                    >
                                        Decline
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
