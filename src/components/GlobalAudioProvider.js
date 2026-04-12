'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const GlobalAudioContext = createContext({
    isMuted: false,
    musicVolume: 0.25,
    sfxVolume: 0.6,
    toggleMute: () => { },
    setMusicVolume: () => { },
    setSfxVolume: () => { },
    playSFX: () => { },
})

export const useGlobalAudio = () => useContext(GlobalAudioContext)

export default function GlobalAudioProvider({ children }) {
    const audioRef = useRef(null)
    const [isMuted, setIsMuted] = useState(false)
    const [musicVolume, setMusicVolume] = useState(0.25)
    const [sfxVolume, setSfxVolume] = useState(0.5)
    const [hasInteracted, setHasInteracted] = useState(false)
    const pathname = usePathname()

    // ── Load from localStorage on mount ──
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMuted = localStorage.getItem('isMuted')
            const savedMusic = localStorage.getItem('musicVolume')
            const savedSfx = localStorage.getItem('sfxVolume')
            
            if (savedMuted !== null) setIsMuted(savedMuted === 'true')
            if (savedMusic !== null) setMusicVolume(parseFloat(savedMusic))
            if (savedSfx !== null) setSfxVolume(parseFloat(savedSfx))
        }
    }, [])

    // ── Save to localStorage on change ──
    useEffect(() => {
        if (typeof window !== 'undefined' && hasInteracted) {
            localStorage.setItem('isMuted', isMuted)
            localStorage.setItem('musicVolume', musicVolume)
            localStorage.setItem('sfxVolume', sfxVolume)
        }
    }, [isMuted, musicVolume, sfxVolume, hasInteracted])

    const LOBBY_AUDIO_URL = 'https://cdn.pixabay.com/download/audio/2024/05/28/audio_suspense_lobby.mp3'

    // 1. Initialize audio object
    useEffect(() => {
        if (typeof window === 'undefined') return

        const audio = new Audio(LOBBY_AUDIO_URL)
        audio.loop = true
        audio.volume = isMuted ? 0 : musicVolume
        audioRef.current = audio

        return () => {
            audio.pause()
            audio.src = ''
            audioRef.current = null
        }
    }, []) 

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

        const isGameRoom = pathname?.startsWith('/room/')
        if (isGameRoom) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(err => {
                console.warn("Global audio playback blocked:", err)
            })
        }
    }, [pathname, hasInteracted])

    // 4. Handle mute toggle & volume updates
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : musicVolume
        }
    }, [isMuted, musicVolume])

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), [])

    // 5. Sound Effects (SFX) handler
    const playSFX = useCallback((soundName) => {
        if (isMuted || sfxVolume <= 0 || !hasInteracted) return;
        
        // We look up our generated wav files locally
        const path = `/audio/sfx/${soundName}.wav`;
        const audio = new Audio(path);
        audio.volume = sfxVolume;
        
        // If the browser blocks it, trap the error silently
        audio.play().catch(() => {});
    }, [isMuted, sfxVolume, hasInteracted])

    return (
        <GlobalAudioContext.Provider value={{ 
            isMuted, toggleMute, 
            musicVolume, setMusicVolume, 
            sfxVolume, setSfxVolume, 
            playSFX 
        }}>
            {children}
        </GlobalAudioContext.Provider>
    )
}
