'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useGlobalAudio } from '../components/GlobalAudioProvider'

// ─────────────────────────────────────────────
// Audio configuration per game phase
// ─────────────────────────────────────────────
const AUDIO_CONFIG = {
    lobby: {
        url: 'https://cdn.pixabay.com/download/audio/2024/05/28/audio_suspense_lobby.mp3',
        volume: 0.25,
        loop: true,
    },
    night: {
        url: 'https://cdn.pixabay.com/download/audio/2024/05/20/audio_night_phase.mp3',
        volume: 0.2,
        loop: true,
    },
    discussion: {
        url: 'https://cdn.pixabay.com/download/audio/2024/06/01/audio_discussion_phase.mp3',
        volume: 0.15,
        loop: true,
    },
    vote: {
        url: 'https://cdn.pixabay.com/download/audio/2024/05/30/audio_vote_phase.mp3',
        volume: 0.35,
        loop: true,
    },
    elimination: {
        url: 'https://cdn.pixabay.com/download/audio/2024/05/18/audio_elimination_phase.mp3',
        volume: 0.4,
        loop: false,
    },
}

// Maps the room phase string to an audio config key
function getAudioKey(phase) {
    if (!phase) return null
    if (phase === 'lobby') return 'lobby'
    if (phase.startsWith('night')) return 'night'
    if (phase === 'day_discussion') return 'discussion'
    if (phase === 'day_vote') return 'vote'
    if (phase === 'roles') return null // silence during role reveal
    if (phase === 'game_over') return null
    return null
}

export default function useGameAudio(phase) {
    const audioRef = useRef(null)
    const currentKeyRef = useRef(null)
    const [hasInteracted, setHasInteracted] = useState(false)
    
    // Consume global audio context
    const { isMuted, toggleMute, musicVolume } = useGlobalAudio();

    // Helper to calc relative volume based on base config (normalized against 0.25 base)
    const getCalculatedVolume = (baseVol) => {
        return Math.min(1, Math.max(0, baseVol * (musicVolume / 0.25)));
    }

    // Track user interaction to unlock autoplay
    useEffect(() => {
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
    }, [])

    // Phase change → switch track
    useEffect(() => {
        const key = getAudioKey(phase)

        // Same track already playing
        if (key === currentKeyRef.current) return

        // Stop current audio
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
            audioRef.current = null
        }

        currentKeyRef.current = key

        if (!key || !AUDIO_CONFIG[key] || !hasInteracted) return

        const config = AUDIO_CONFIG[key]
        const audio = new Audio(config.url)
        audio.loop = config.loop
        audio.volume = isMuted ? 0 : getCalculatedVolume(config.volume)
        audio.preload = 'auto'
        audioRef.current = audio

        audio.play().catch(() => {
            // Autoplay blocked — will retry on next interaction
        })

        return () => {
            audio.pause()
            audio.src = ''
        }
    }, [phase, hasInteracted])

    // Mute/unmute or volume change without restarting the track
    useEffect(() => {
        if (audioRef.current) {
            const key = currentKeyRef.current
            const baseVol = AUDIO_CONFIG[key]?.volume || 0.2
            audioRef.current.volume = isMuted ? 0 : getCalculatedVolume(baseVol)
        }
    }, [isMuted, musicVolume])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
                audioRef.current = null
            }
        }
    }, [])

    return { isMuted, toggleMute }
}
