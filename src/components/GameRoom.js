'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '../lib/supabase'
import { getMafiaCount } from '../utils/gameLogic'
import { getCookieConsent, getSessionCookie, setSessionCookie } from '../utils/cookieUtils'
import CookieConsentBanner from './CookieConsentBanner'
import useGameAudio from '../hooks/useGameAudio'
import { useGlobalAudio } from './GlobalAudioProvider'
import AudioSettingsModal from './AudioSettingsModal'
import {
    Target, HeartPulse, Search, Users, ShieldAlert, BookOpen, Crown,
    Moon, Sun, Scale, Skull, Trophy, Home, MessageSquare, Mic, AlertCircle, X,
    CheckCircle2, Clock, Check, XCircle, Volume2, VolumeX, Settings
} from 'lucide-react'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const api = async (path, body) => {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'API error')
    return json
}

const ROLE_META = {
    mafia: { label: 'Mafia', color: 'text-secondary', bg: 'from-secondary-container/40', icon: <Target className="w-full h-full" />, border: 'border-secondary-container/30' },
    doctor: { label: 'Doctor', color: 'text-emerald-400', bg: 'from-emerald-950/60', icon: <HeartPulse className="w-full h-full" />, border: 'border-emerald-900/50' },
    detective: { label: 'Detective', color: 'text-blue-400', bg: 'from-blue-950/60', icon: <Search className="w-full h-full" />, border: 'border-blue-900/50' },
    villager: { label: 'Villager', color: 'text-on-surface', bg: 'from-slate-800/60', icon: <Users className="w-full h-full" />, border: 'border-outline-variant/15' },
}

import Lobby from './GameRoom/Lobby'
import RoleReveal from './GameRoom/RoleReveal'
import NightOverlay from './GameRoom/NightOverlay'
import DayPhase from './GameRoom/DayPhase'
import WinScreen from './GameRoom/WinScreen'
import DeadScreen from './GameRoom/DeadScreen'
import ChatBox from './GameRoom/ChatBox'
// ─────────────────────────────────────────────
// MAIN GAME ROOM COMPONENT
// ─────────────────────────────────────────────
export default function GameRoom({ roomId }) {
    const [me, setMe] = useState(null)
    const [room, setRoom] = useState(null)
    const [players, setPlayers] = useState([])
    const [phase, setPhase] = useState('lobby')
    const [roleAcknowledged, setRoleAcknowledged] = useState(false)
    const [events, setEvents] = useState([])
    const [detectiveOwnResult, setDetectiveOwnResult] = useState(null)
    const [voteCounts, setVoteCounts] = useState({})
    const [consentGranted, setConsentGranted] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [pendingRequests, setPendingRequests] = useState([]) // [NEW] Keep track of join requests
    const [showAudioSettings, setShowAudioSettings] = useState(false)
    const { playSFX } = useGlobalAudio()

    // 🎵 Phase-based background audio
    const { isMuted, toggleMute } = useGameAudio(phase)

    // Keep me in sync with players list
    const meRef = useRef(null)
    meRef.current = me

    // Keep room and phase sync for unload event
    const roomRef = useRef(room)
    roomRef.current = room
    const phaseRef = useRef(phase)
    phaseRef.current = phase
    const isLeavingRef = useRef(isLeaving)
    isLeavingRef.current = isLeaving

    // ── Player Leaving / Unload Logic ──
    useEffect(() => {
        // This effect only acts when the window is actually closing or refreshing
        const handleBeforeUnload = (e) => {
            if (!meRef.current) return;
            const currentRoom = roomRef.current;
            const currentPhase = phaseRef.current;

            // If the game is actively running, and the player hasn't cleanly left via the button
            if (currentRoom && currentPhase !== 'lobby' && currentPhase !== 'game_over' && !isLeavingRef.current) {
                // To guarantee the request during unload, we use navigator.sendBeacon
                try {
                    const payload = JSON.stringify({ roomId, playerId: meRef.current.id });
                    navigator.sendBeacon('/api/leave-room', payload);
                } catch (err) {
                    console.error("Failed to send beacon", err);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [roomId]);

    // Also handle internal Next.js unmounting (e.g user clicks browser "Back" button)
    useEffect(() => {
        return () => {
            // If unmounting and we aren't explicitly leaving/booted, and game is active: 
            // we consider them disconnected/dead. (Checking window to avoid SSR issues)
            if (typeof window !== 'undefined' && !isLeavingRef.current && meRef.current && roomRef.current) {
                const currentPhase = phaseRef.current;
                if (currentPhase !== 'lobby' && currentPhase !== 'game_over') {
                    try {
                        const payload = JSON.stringify({ roomId, playerId: meRef.current.id });
                        navigator.sendBeacon('/api/leave-room', payload);
                    } catch (e) { }
                }
            }
        }
    }, [roomId]);

    // ── Initial fetch + realtime subscription ──
    useEffect(() => {
        if (!roomId) return

        const refreshPlayers = async () => {
            const { data: pData, error: pError } = await getSupabase()
                .from('public_players')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true })
            if (pError) {
                console.error('Error refreshing players:', pError)
            } else if (pData) {
                setPlayers(pData)
            }
        }

        const fetchInitialData = async () => {
            let fetchedMeData = null;
            if (typeof window !== 'undefined') {
                const consent = getCookieConsent()
                if (consent === 'granted') {
                    setConsentGranted(true)
                    const cookie = getSessionCookie()
                    if (cookie && cookie.roomId === roomId) {
                        try {
                            const res = await fetch(`/api/game/my-role?roomId=${roomId}`, {
                                headers: { 'x-user-id': cookie.userId }
                            })
                            const data = await res.json()
                            if (data.player) {
                                fetchedMeData = data.player
                                setMe(data.player)
                            }
                        } catch (err) {
                            console.error('Initial fetch me error:', err)
                        }
                    }
                }

                // Fallback: check if authenticated user (from localStorage) is already a player in this room
                if (!fetchedMeData) {
                    try {
                        const stored = localStorage.getItem('mafia_user')
                        if (stored) {
                            const parsed = JSON.parse(stored)
                            if (parsed?.id) {
                                const res = await fetch(`/api/game/my-role?roomId=${roomId}`, {
                                    headers: { 'x-user-id': parsed.id }
                                })
                                if (res.ok) {
                                    const data = await res.json()
                                    if (data.player) {
                                        fetchedMeData = data.player
                                        setMe(data.player)
                                        if (getCookieConsent() === 'granted') {
                                            setConsentGranted(true)
                                            setSessionCookie({ userId: parsed.id, roomId })
                                        }
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Fallback auth player check error:', err)
                    }
                }
            }

            const { data: roomData } = await getSupabase().from('rooms').select('*').eq('id', roomId).single()
            if (roomData) { setRoom(roomData); setPhase(roomData.status) }

            // Initial players fetch
            await refreshPlayers()

            const { data: eventsData } = await getSupabase().from('game_events').select('*').eq('room_id', roomId).order('created_at', { ascending: true })
            if (eventsData) setEvents(eventsData)

            // If we are the host, fetch pending join requests
            if (fetchedMeData?.user_id === roomData?.host_id) {
                const { data: reqData } = await getSupabase()
                    .from('join_requests')
                    .select('*')
                    .eq('room_id', roomId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true })
                if (reqData) setPendingRequests(reqData)
            }
        }
        fetchInitialData()
        
        // Expose refreshPlayers to handlers via window or a ref if needed, 
        // but since we define handlers inside the component too, let's just 
        // define refreshPlayers correctly.
        window._refreshPlayers = refreshPlayers // temporary bridge for handlers defined outside this effect


        const channel = getSupabase().channel(`game_room_${roomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    alert("⚠️ Sorry, this room was deleted after 5 minutes of inactivity before launch.");
                    router.push('/');
                    return;
                }
                if (payload.eventType === 'UPDATE') {
                    setRoom(payload.new)
                    setPhase(payload.new.status)
                }
            })
            // Realtime for the CURRENT player's row (they pass RLS)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, (payload) => {
                if (meRef.current && payload.new?.user_id === meRef.current.user_id) {
                    setMe(payload.new)
                }
                // Update local state if it's the current player
                setPlayers(prev => {
                    if (payload.eventType === 'INSERT') {
                        if (prev.some(p => p.id === payload.new.id || p.user_id === payload.new.user_id)) return prev
                        return [...prev, payload.new]
                    }
                    if (payload.eventType === 'UPDATE') return prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
                    if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== payload.old.id)
                    return prev
                })
            })
            // Realtime for everyone else via the view (if supported) or polling fallback
            .on('postgres_changes', { event: '*', schema: 'public', table: 'public_players', filter: `room_id=eq.${roomId}` }, (payload) => {
                setPlayers(prev => {
                    if (payload.eventType === 'INSERT') {
                        if (prev.some(p => p.id === payload.new.id || p.user_id === payload.new.user_id)) return prev
                        return [...prev, payload.new]
                    }
                    if (payload.eventType === 'UPDATE') return prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
                    if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== payload.old.id)
                    return prev
                })
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: `room_id=eq.${roomId}` }, (payload) => {
                setEvents(prev => [...prev, payload.new])
                
                // Update players state based on game events
                setPlayers(prev => {
                    let newPlayers = [...prev]
                    if (payload.new.event_type === 'night_result' || payload.new.event_type === 'day_result') {
                        const eliminatedId = payload.new.payload?.eliminated?.id
                        if (eliminatedId) {
                            newPlayers = newPlayers.map(p => p.id === eliminatedId ? { ...p, is_alive: false } : p)
                        }
                    } else if (payload.new.event_type === 'player_ready_replay') {
                        const readyId = payload.new.payload?.playerId
                        if (readyId) {
                            newPlayers = newPlayers.map(p => p.id === readyId ? { ...p, ready_for_replay: true } : p)
                        }
                    } else if (payload.new.event_type === 'game_reset') {
                        newPlayers = newPlayers.map(p => ({ ...p, role: null, is_alive: true, is_protected: false, is_ready: false, ready_for_replay: false }))
                    }
                    return newPlayers
                })

                // Extract detective result for the detective player
                if (payload.new.event_type === 'night_result' && meRef.current?.role === 'detective') {
                    setDetectiveOwnResult(payload.new.payload?.detectiveResult ?? null)
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actions', filter: `room_id=eq.${roomId}` }, (payload) => {
                // Live vote tallying
                if (payload.new.action_type === 'vote' && payload.new.phase_number === room?.phase_number && payload.new.revote_round === room?.revote_round) {
                    setVoteCounts(prev => ({
                        ...prev,
                        [payload.new.target_id]: (prev[payload.new.target_id] || 0) + 1
                    }))
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests', filter: `room_id=eq.${roomId}` }, (payload) => {
                setPendingRequests(prev => {
                    if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                        return [...prev, payload.new]
                    }
                    if (payload.eventType === 'UPDATE') {
                        if (payload.new.status !== 'pending') return prev.filter(r => r.id !== payload.new.id)
                        return prev.map(r => r.id === payload.new.id ? payload.new : r)
                    }
                    if (payload.eventType === 'DELETE') return prev.filter(r => r.id !== payload.old.id)
                    return prev
                })
            })
            .subscribe()

        return () => getSupabase().removeChannel(channel)
    }, [roomId, room?.phase_number, room?.revote_round])

    // ── Handlers ──
    const handleConsentChange = (status) => {
        if (status === 'granted') {
            setConsentGranted(true)
            if (meRef.current) {
                setSessionCookie({ userId: meRef.current.user_id, roomId })
            }
        } else {
            setConsentGranted(false)
        }
    }

    const joinInProgressRef = useRef(false)

    const handleJoinLobby = async (username, passedUserId, passedAvatarUrl) => {
        if (room && room.status !== 'lobby') return
        if (joinInProgressRef.current) return

        joinInProgressRef.current = true
        const finalUserId = passedUserId || ('user_' + Math.random().toString(36).substr(2, 9))

        try {
            let avatarUrl = passedAvatarUrl || null
            if (!avatarUrl) {
                try {
                    const stored = localStorage.getItem('mafia_user')
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        if (parsed?.avatar_url) avatarUrl = parsed.avatar_url
                    }
                } catch { }
            }

            const res = await fetch('/api/game/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId,
                    userId: finalUserId,
                    username,
                    avatarUrl,
                    isHost: players.length === 0 && room && !room.host_id,
                })
            })

            const joinData = await res.json()
            if (joinData.player) {
                setMe(joinData.player)
                if (consentGranted) {
                    setSessionCookie({ userId: finalUserId, roomId })
                }
                // Immediate refresh of all players
                if (window._refreshPlayers) await window._refreshPlayers()
            } else {
                console.error("Join error:", joinData.error)
            }
        } finally {
            joinInProgressRef.current = false
        }
    }

    const handleResolveRequest = async (requestId, action) => {
        try {
            const res = await fetch('/api/game/resolve-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action, hostId: me.user_id })
            })
            const data = await res.json()
            if (data.success && action === 'accepted') {
                // Immediate refresh of player list for host
                if (window._refreshPlayers) await window._refreshPlayers()
            }
        } catch (err) {
            console.error("Resolve req error:", err)
        }
    }

    const handleStartGame = async () => {
        try {
            await api('/api/game/start', { roomId })
        } catch (err) {
            console.error('Start game error:', err.message)
            alert('Erreur au démarrage: ' + err.message)
        }
    }

    const handleRoleAcknowledge = async () => {
        setRoleAcknowledged(true)
        try {
            await api('/api/game/ready', { roomId, playerId: me.id })
        } catch (err) {
            console.error('Ready error:', err.message)
        }
    }

    const handleNightAction = async (targetId) => {
        if (!me) return
        let actionType = 'kill'
        if (me.role === 'doctor') actionType = 'save'
        else if (me.role === 'detective') actionType = 'check'
        try {
            await api('/api/game/night-action', { roomId, actorId: me.id, targetId, actionType })
        } catch (err) {
            console.error('Night action error:', err.message)
        }
    }

    const handleVote = async (targetId) => {
        if (!me) return
        try {
            await api('/api/game/vote', { roomId, actorId: me.id, targetId })
        } catch (err) {
            console.error('Vote error:', err.message)
        }
    }

    const handleLeaveRoom = async () => {
        if (!me) {
            window.location.href = '/'
            return
        }

        const confirmLeave = window.confirm("Are you sure you want to leave the room? You won't be able to come back.")
        if (!confirmLeave) return

        setIsLeaving(true)
        try {
            await api('/api/leave-room', { roomId, playerId: me.id })
            window.location.href = '/'
        } catch (err) {
            console.error('Leave room error:', err.message)
            alert('Error: Unable to leave the room. ' + err.message)
            setIsLeaving(false)
        }
    }

    const handleReplay = async () => {
        try {
            await api('/api/game/replay-ready', { roomId })
        } catch (err) {
            console.error('Replay error:', err.message)
        }
    }

    // ── Computed values ──
    const isHost = room?.host_id === me?.user_id || (!room?.host_id && players[0]?.id === me?.id)

    // Mafia team list (names, excluding self)
    const mafiaTeam = players
        .filter(p => p.role === 'mafia' && p.user_id !== me?.user_id)
        .map(p => p.username)

    // ── State machine rendering ──
    const renderPhase = () => {
        // Game over
        if (phase === 'game_over' && room?.winner) {
            return <WinScreen winner={room.winner} players={players} currentUserId={me?.user_id} onReplay={handleReplay} />
        }

        // Lobby / join
        if (phase === 'lobby' || !me) {
            return (
                <Lobby
                    room={room}
                    players={players}
                    isHost={isHost}
                    onStart={handleStartGame}
                    onJoin={handleJoinLobby}
                    currentUserId={me?.user_id}
                    roomId={roomId}
                    pendingRequests={pendingRequests}
                    onResolveRequest={handleResolveRequest}
                />
            )
        }

        // Role reveal
        if (phase === 'roles') {
            if (!roleAcknowledged) {
                return (
                    <RoleReveal
                        role={me.role}
                        mafiaTeam={mafiaTeam}
                        onAcknowledge={handleRoleAcknowledge}
                    />
                )
            }
            return (
                <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 border-4 border-outline-variant/15 border-t-purple-500 rounded-full animate-spin mb-4" />
                    <p className="text-white/50 text-sm font-bold tracking-[0.2em] uppercase">Chargement du salon...</p>
                </div>
            )
        }

        const alivePlayers = players.filter(p => p.is_alive)
        const deadPlayers = players.filter(p => !p.is_alive)

        // Must be in game and alive to see main game info (or you see dead screen)
        if (!me?.is_alive && phase !== 'game_over') {
            return <DeadScreen phase={phase} events={events} />
        }

        // Night phases
        if (phase.startsWith('night')) {
            return (
                <NightOverlay
                    playerRole={me.role}
                    players={players}
                    currentPhase={phase}
                    currentUserId={me.user_id}
                    onAction={handleNightAction}
                    detectiveResult={detectiveOwnResult}
                />
            )
        }

        // Day phases
        if (phase === 'day_discussion' || phase === 'day_vote') {
            return (
                <DayPhase
                    players={players}
                    currentUserId={me.user_id}
                    onVote={handleVote}
                    phase={phase}
                    events={events}
                    playerRole={me.role}
                    detectiveOwnResult={detectiveOwnResult}
                    room={room}
                    voteCounts={voteCounts}
                />
            )
        }

        // Fallback
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-on-surface-variant/70 font-serif">
                <div className="w-8 h-8 border-4 border-slate-800 border-t-red-600 rounded-full animate-spin mr-4" />
                Syncing ({phase})...
            </div>
        )
    }

    return (
        <>
            {/* Top Bar Overlay */}
            <div className="fixed top-4 left-4 z-50 pointer-events-auto flex items-center gap-2">
                <button
                    onClick={handleLeaveRoom}
                    disabled={isLeaving}
                    className="flex items-center gap-2 px-4 py-2 glass-panel bg-secondary-container/20 hover:bg-secondary-container/60 rounded-full text-on-secondary-container text-xs font-bold uppercase tracking-widest backdrop-blur-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-sm">🚪</span> {isLeaving ? 'Leaving...' : 'Leave Room'}
                </button>
                <button
                    onClick={() => { playSFX('click'); setShowAudioSettings(true); }}
                    className="flex items-center justify-center w-9 h-9 glass-panel hover:bg-surface-container-high/60 rounded-full text-on-surface/60 hover:text-on-surface backdrop-blur-xl transition-all"
                    title="Paramètres Audio"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {renderPhase()}
            {me && phase !== 'roles' && <ChatBox roomId={roomId} players={players} currentPlayerId={me.id} phase={phase} />}
            <CookieConsentBanner onConsentChange={handleConsentChange} />
            
            <AudioSettingsModal 
                isOpen={showAudioSettings} 
                onClose={() => setShowAudioSettings(false)} 
            />
        </>
    )
}

