'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const GlobalAudioContext = createContext({
    isMuted: false,
    toggleMute: () => { }
})

export const useGlobalAudio = () => useContext(GlobalAudioContext)

export default function GlobalAudioProvider({ children }) {
    const audioRef = useRef(null)
    const [isMuted, setIsMuted] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const pathname = usePathname()

    // The audio track for the global app (lobby/home)
    const LOBBY_AUDIO_URL = 'https://cdn.pixabay.com/download/audio/2024/05/28/audio_suspense_lobby.mp3'

    // 1. Initialize audio object
    useEffect(() => {
        if (typeof window === 'undefined') return

        const audio = new Audio(LOBBY_AUDIO_URL)
        audio.loop = true
        audio.volume = isMuted ? 0 : 0.25
        audioRef.current = audio

        return () => {
            audio.pause()
            audio.src = ''
            audioRef.current = null
        }
    }, []) // Run once on mount

    // 2. Listen for first interaction to unlock autoplay
    useEffect(() => {
        if (hasInteracted) return

        const unlock = () => {
            setHasInteracted(true)
            window.removeEventListener('click', unlock)
            window.removeEventListener('touchstart', unlock)
            window.removeEventListener('keydown', unlock)
        }

        window.addEventListener('click', unlock)
        window.addEventListener('touchstart', unlock)
        window.addEventListener('keydown', unlock)

        return () => {
            window.removeEventListener('click', unlock)
            window.removeEventListener('touchstart', unlock)
            window.removeEventListener('keydown', unlock)
        }
    }, [hasInteracted])

    // 3. Play or pause depending on route and interaction
    useEffect(() => {
        if (!audioRef.current || !hasInteracted) return

        // If user is inside a game room, stop global audio
        // The GameRoom component uses useGameAudio hook which manages its own audio
        const isGameRoom = pathname?.startsWith('/room/')

        if (isGameRoom) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(err => {
                console.warn("Global audio playback blocked:", err)
            })
        }
    }, [pathname, hasInteracted])

    // 4. Handle mute toggle
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : 0.25
        }
    }, [isMuted])

    const toggleMute = () => {
        setIsMuted(prev => !prev)
    }

    return (
        <GlobalAudioContext.Provider value={{ isMuted, toggleMute }}>
            {children}
        </GlobalAudioContext.Provider>
    )
}
