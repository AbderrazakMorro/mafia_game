'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, HeartPulse, Search, Users, ShieldAlert, Clock, Check, XCircle } from 'lucide-react'

// Optional: you can extract these to a central 'utils' or keep them here if only used in Lobby
import { getSupabase } from '../../lib/supabase'
import { getMafiaCount } from '../../utils/gameLogic'
import { getSessionCookie } from '../../utils/cookieUtils'

const QRCode = ({ url }) => {
    const src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=180x180&color=dc2626&bgcolor=0f172a&margin=10`
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-surface-container rounded-xl shadow-lg">
                <img src={src} alt="QR Code" width={180} height={180} className="rounded-lg block" loading="lazy" />
            </div>
            <p className="text-on-surface-variant/70 text-xs italic">Scan to join</p>
        </div>
    )
}

const InviteLinkActions = ({ url, code }) => {
    const [copied, setCopied] = useState(false)
    const [canShare, setCanShare] = useState(false)

    useEffect(() => {
        setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
    }, [])

    const handleCopy = () => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        try {
            await navigator.share({
                title: 'Mafia Game - Join the game!',
                text: `Join my Mafia game! Code: ${code}`,
                url: url,
            })
        } catch (err) {
            if (err.name !== 'AbortError') handleCopy()
        }
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-surface-container-lowest/40 rounded-xl px-4 py-3">
                <span className="font-mono text-on-surface text-sm truncate flex-1">{url}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-bold text-sm uppercase tracking-wider transition-all"
                >
                    {copied ? (
                        <><span className="text-emerald-400">✓</span> Copié !</>
                    ) : (
                        <><span>⎘</span> Copier</>
                    )}
                </button>
                {canShare && (
                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container hover:from-purple-500 hover:to-red-500 text-on-surface font-bold text-sm uppercase tracking-wider transition-all shadow-glow-primary"
                    >
                        <span>↗</span> Partager
                    </button>
                )}
            </div>
        </div>
    )
}

const Lobby = ({ room, players, isHost, onStart, onJoin, currentUserId, roomId, pendingRequests, onResolveRequest }) => {
    const [username, setUsername] = useState('')
    const [joining, setJoining] = useState(false)
    const [alreadyJoined, setAlreadyJoined] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [autoJoinAttempted, setAutoJoinAttempted] = useState(false)
    const [nicknameError, setNicknameError] = useState(null)
    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : ''

    useEffect(() => {
        const checkAutoJoin = async () => {
            if (typeof window !== 'undefined') {
                const cookie = getSessionCookie()
                if (cookie && cookie.roomId === roomId) {
                    setAlreadyJoined(true)
                } else {
                    try {
                        const stored = localStorage.getItem('mafia_user')
                        if (stored) {
                            const parsed = JSON.parse(stored)
                            if (parsed?.pseudo) {
                                handleJoin(parsed.pseudo, parsed.id, parsed.avatar_url, true)
                            }
                        }
                    } catch { }
                }
            }
            setAutoJoinAttempted(true)

            const { data } = await getSupabase().from('rooms').select('status').eq('id', roomId).single()
            if (data && data.status !== 'lobby') {
                setGameStarted(true)
            }
        }
        checkAutoJoin()
    }, [roomId])

    const handleJoin = async (autoPseudo = null, autoUserId = null, autoAvatarUrl = null, isAuto = false) => {
        const nameToUse = autoPseudo || username
        if (!nameToUse.trim()) return

        if (nameToUse.trim().length < 3 || nameToUse.trim().length > 20) {
            setNicknameError('Username must be between 3 and 20 characters.')
            return
        }

        setJoining(true)
        setNicknameError(null)
        const userId = autoUserId || `guest_${Math.random().toString(36).substr(2, 9)}`

        try {
            const { data: roomData } = await getSupabase().from('rooms').select('is_public, host_id, max_players').eq('id', roomId).single()
            const isUserHost = roomData?.host_id === userId
            const isPrivateRoom = !roomData?.is_public

            const nicknameTaken = players.some(p => p.username.toLowerCase() === nameToUse.trim().toLowerCase() && p.user_id !== userId)
            if (nicknameTaken) {
                setNicknameError('This username is already taken in this room. Please choose another.')
                setJoining(false)
                return
            }

            if (players.length >= (roomData?.max_players || 8)) {
                setNicknameError('The room is full.')
                setJoining(false)
                return
            }

            // Check if this user is already in the players list (accepted via join request)
            const alreadyPlayer = players.some(p => p.user_id === userId)

            if (isUserHost || isPrivateRoom || isAuto || alreadyPlayer) {
                await onJoin(nameToUse.trim(), userId, autoAvatarUrl)
                setAlreadyJoined(true)

                if (!autoPseudo) {
                    try {
                        localStorage.setItem('mafia_user', JSON.stringify({
                            id: userId,
                            pseudo: nameToUse.trim(),
                            is_guest: true
                        }))
                    } catch { }
                }
            } else {
                setNicknameError('Ce salon est public. Envoyez une demande depuis la page d\'accueil et attendez l\'approbation de l\'hôte.')
                setJoining(false)
                return
            }
        } catch (err) {
            console.error("Error joining:", err)
            setNicknameError('An error occurred. Please try again.')
        }
        setJoining(false)
    }

    if (!alreadyJoined && !gameStarted) {
        if (joining || !autoJoinAttempted) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4 relative overflow-hidden font-sans">
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-container/30 blur-[120px] rounded-full" />
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-10 h-10 border-3 border-outline-variant/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-primary/70 font-medium text-sm tracking-widest uppercase">Connecting...</p>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4 relative overflow-hidden font-sans">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-container/30 blur-[120px] rounded-full" />
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-sm bg-surface-container-highest/20 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl"
                >
                    <h1 className="text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-secondary to-primary uppercase tracking-tighter mb-1 drop-shadow-lg text-center">Mafia</h1>
                    <p className="text-center text-primary/70 font-medium text-sm mb-8 tracking-[0.2em] uppercase">Enter the shadows...</p>
                    <div className="space-y-4 relative z-10">
                        {nicknameError && (
                            <div className="bg-secondary-container/20 rounded-xl p-3 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                <p className="text-on-secondary-container text-sm">{nicknameError}</p>
                            </div>
                        )}
                        <input
                            type="text" value={username} onChange={e => { setUsername(e.target.value); setNicknameError(null) }}
                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                            maxLength={20} placeholder="Votre alias (3-20 caractères)..."
                            className="w-full bg-surface-container-lowest/60 focus:bg-surface-container-lowest px-6 py-4 rounded-xl text-on-surface text-center text-lg font-bold placeholder:text-on-surface-variant outline-none transition-all focus:ring-2 focus:ring-primary/50"
                        />
                        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                            onClick={() => handleJoin()} disabled={!username.trim() || joining}
                            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-surface font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(211,187,255,0.3)] hover:shadow-[0_0_25px_rgba(211,187,255,0.5)] disabled:opacity-50 uppercase tracking-widest mt-4"
                        >
                            {joining ? 'Joining...' : 'Join the Game'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (gameStarted && !alreadyJoined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm flex flex-col items-center">
                    <ShieldAlert className="w-20 h-20 text-on-surface-variant mb-6 drop-shadow-md" />
                    <h2 className="text-2xl font-display font-bold text-secondary uppercase tracking-widest mb-3">Room Locked</h2>
                    <p className="text-on-surface-variant italic">This game has already started.</p>
                    <a href="/" className="mt-8 inline-block px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all text-sm uppercase tracking-wider">← Back</a>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-container/20 blur-[120px] rounded-full" />
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[1200px]">
                <div className="text-center mb-10 mt-8">
                    <h1 className="text-5xl md:text-7xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container uppercase tracking-tighter drop-shadow-lg">
                        {room?.name || 'Mafia'}
                    </h1>
                    <p className="text-on-surface-variant font-medium text-sm mt-2 tracking-[0.3em] uppercase">
                        {room?.is_public ? 'Public Room' : 'Private Room'} • {players.length} / {room?.max_players || 8} Players
                    </p>
                    {players.length >= 3 && (() => {
                        const m = getMafiaCount(players.length)
                        const hasDetective = players.length >= 4
                        const v = players.length - m - (hasDetective ? 2 : 1)
                        return (
                            <div className="flex justify-center gap-3 mt-6 flex-wrap text-sm font-bold">
                                <span className="px-4 py-2 rounded-xl bg-surface-container-highest text-secondary shadow-[0_0_15px_rgba(255,180,172,0.1)] flex items-center gap-1.5"><Target className="w-4 h-4" /> {m} Mafia</span>
                                <span className="px-4 py-2 rounded-xl bg-surface-container-highest text-emerald-400 flex items-center gap-1.5"><HeartPulse className="w-4 h-4" /> 1 Doctor</span>
                                {hasDetective && <span className="px-4 py-2 rounded-xl bg-surface-container-highest text-blue-400 flex items-center gap-1.5"><Search className="w-4 h-4" /> 1 Detective</span>}
                                {v > 0 && <span className="px-4 py-2 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center gap-1.5"><Users className="w-4 h-4" /> {v} Villager{v > 1 ? 's' : ''}</span>}
                            </div>
                        )
                    })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Players list */}
                    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-2xl border border-outline-variant/10">
                        <h3 className="text-sm font-display text-primary/70 font-bold uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                            Players present ({players.length})
                        </h3>
                        <ul className="flex-1 space-y-2 overflow-y-auto max-h-[50vh] md:max-h-72 pr-2 custom-scrollbar relative z-10 w-full">
                            <AnimatePresence>
                                {players.map((p, i) => (
                                    <motion.li key={p.id}
                                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl ${p.user_id === currentUserId ? 'bg-surface-container-highest shadow-md' : 'bg-surface-container-low/50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${p.user_id === currentUserId ? 'bg-primary text-surface' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                            {p.avatar_url ? (
                                                <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover rounded-full" loading="lazy" />
                                            ) : (
                                                p.username[0].toUpperCase()
                                            )}
                                        </div>
                                        <span className={`flex-1 font-bold text-base tracking-wide truncate ${p.user_id === currentUserId ? 'text-primary' : 'text-on-surface'}`}>{p.username}</span>
                                        {p.user_id === currentUserId && <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 rounded-full px-3 py-1">You</span>}
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                            {players.length === 0 && <li className="text-on-surface-variant text-sm font-medium text-center py-8">The room is empty...</li>}
                        </ul>
                        
                        <div className="mt-8 relative z-10 w-full">
                            {isHost ? (
                                players.length >= 3 ? (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onStart}
                                        className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-base bg-gradient-to-r from-primary to-primary-container text-on-surface shadow-[0_0_20px_rgba(211,187,255,0.4)] hover:shadow-[0_0_30px_rgba(211,187,255,0.6)] transition-all flex items-center justify-center gap-2"
                                    ><Target className="w-5 h-5" /> Start the Game</motion.button>
                                ) : (
                                    <p className="text-secondary/80 text-xs font-bold uppercase tracking-widest text-center bg-secondary/10 py-3 rounded-xl">
                                        {3 - players.length} player{3 - players.length > 1 ? 's' : ''} missing (min. 3)
                                    </p>
                                )
                            ) : (
                                <div className="py-4 text-center rounded-xl bg-surface-container-highest shadow-inner">
                                    <p className="text-on-surface-variant font-medium text-sm tracking-widest uppercase animate-pulse">Waiting for the host to start...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Join Requests Panel (Host Only) - MOVED ABOVE INVITE PANEL */}
                        {isHost && pendingRequests && pendingRequests.length > 0 && (
                            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col relative overflow-hidden border border-outline-variant/10">
                                <h3 className="text-sm font-display text-primary/70 font-bold uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10 justify-between">
                                    <span className="flex items-center gap-2 text-tertiary">
                                        <Clock className="w-5 h-5 animate-pulse" /> Join Requests ({pendingRequests.length})
                                    </span>
                                </h3>

                                <ul className="flex-1 space-y-3 overflow-y-auto max-h-48 pr-2 custom-scrollbar relative z-10">
                                    <AnimatePresence>
                                        {pendingRequests.map(req => (
                                            <motion.li key={req.id}
                                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                                className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-surface-container-lowest text-on-surface shadow-sm"
                                            >
                                                <div className="flex items-center gap-4 truncate">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 bg-surface-container-highest text-on-surface-variant">
                                                        {req.avatar_url ? (
                                                            <img src={req.avatar_url} alt={req.username} className="w-full h-full object-cover rounded-full" loading="lazy" />
                                                        ) : (
                                                            req.username[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-sm tracking-wide truncate">{req.username}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => onResolveRequest(req.id, 'accepted')} disabled={players.length >= room.max_players} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-on-surface rounded-xl transition-colors disabled:opacity-30">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => onResolveRequest(req.id, 'rejected')} className="p-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-surface rounded-xl transition-colors">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            </div>
                        )}

                        {/* Invite panel */}
                        <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden border border-outline-variant/10">
                            <h3 className="text-sm font-display text-primary/70 font-bold uppercase tracking-widest self-start relative z-10 w-full flex items-center gap-2">
                                Invite Friends
                            </h3>
                            <div className="w-full flex flex-col items-center gap-2 relative z-10">
                                <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.3em]">Room Code</p>
                                <span className="font-mono text-4xl md:text-5xl font-black tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary drop-shadow-md">{room?.code}</span>
                            </div>
                            <div className="w-full flex items-center justify-center relative z-10">
                                <div className="p-1 bg-surface-container-highest rounded-2xl shadow-inner">
                                    <div className="bg-surface rounded-xl overflow-hidden p-2">
                                        <QRCode url={inviteUrl} />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full flex flex-col items-center gap-2 relative z-10 mt-2">
                                <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.3em]">Invite Link</p>
                                <InviteLinkActions url={inviteUrl} code={room?.code} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default Lobby
