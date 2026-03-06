'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import ProfileModal from '../components/ProfileModal'
import { useGlobalAudio } from '../components/GlobalAudioProvider'
import Link from 'next/link'
import {
    Sword, LogIn, UserPlus, UserCircle, LogOut,
    Play, Loader2, Smartphone, DoorOpen, Hash,
    Globe, Lock, Settings, Users, Sparkles, AlertCircle, Crown, Clock,
    BookOpen, Shield, Trash2, Volume2, VolumeX
} from 'lucide-react'

export default function Home() {
    const router = useRouter()
    const { user, isInitializing, openAuthModal, logout } = useAuth()
    const [isCreating, setIsCreating] = useState(false)
    const [joinCode, setJoinCode] = useState('')
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [publicRooms, setPublicRooms] = useState([])
    const [isFetchingRooms, setIsFetchingRooms] = useState(true)
    const [myRooms, setMyRooms] = useState([])
    const [isFetchingMyRooms, setIsFetchingMyRooms] = useState(true)
    const [myPendingRequests, setMyPendingRequests] = useState([])
    const [joinLoadingId, setJoinLoadingId] = useState(null)
    const { isMuted: globalMuted, toggleMute: toggleGlobalMute } = useGlobalAudio()
    const [createSettings, setCreateSettings] = useState({
        name: '',
        isPublic: true,
        maxPlayers: 8
    })

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setIsInstallable(false)
        }
        setDeferredPrompt(null)
    }

    useEffect(() => {
        // Run cleanup API every 60 seconds quietly in the background
        const triggerCleanup = () => {
            fetch('/api/cron/cleanup-rooms', { method: 'POST' }).catch(err => console.error("Cleanup ping failed:", err));
        }
        triggerCleanup();
        const cleanupInterval = setInterval(triggerCleanup, 60000); // 1 minute
        return () => clearInterval(cleanupInterval);
    }, []);

    useEffect(() => {
        const fetchPublicRooms = async () => {
            setIsFetchingRooms(true)
            const supa = getSupabase()

            // Get public rooms that are in lobby phase
            const { data, error } = await supa
                .from('rooms')
                .select('*, players(count)')
                .eq('is_public', true)
                .eq('status', 'lobby')
                .order('created_at', { ascending: false })

            if (data) setPublicRooms(data)
            setIsFetchingRooms(false)
        }
        fetchPublicRooms()

        const channel = getSupabase().channel('public_lobbies')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchPublicRooms)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchPublicRooms)
            .subscribe()

        return () => {
            getSupabase().removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        if (!user) {
            setMyRooms([])
            setIsFetchingMyRooms(false)
            return
        }

        const fetchMyRooms = async () => {
            setIsFetchingMyRooms(true)
            const supa = getSupabase()
            const { data, error } = await supa
                .from('rooms')
                .select('*, players(count)')
                .eq('host_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setMyRooms(data)
            setIsFetchingMyRooms(false)
        }

        const fetchMyPendingRequests = async () => {
            const supa = getSupabase()
            const { data } = await supa
                .from('join_requests')
                .select('*, rooms(name, code, host_id)')
                .eq('user_id', user.id)
                .eq('status', 'pending')

            if (data) setMyPendingRequests(data)
        }

        fetchMyRooms()
        fetchMyPendingRequests()

        const channel = getSupabase().channel(`my_rooms_${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `host_id=eq.${user.id}` }, fetchMyRooms)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchMyRooms)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.new.status === 'accepted') {
                    // Automatically route when accepted
                    router.push(`/room/${payload.new.room_id}`)
                } else if (payload.new.status === 'rejected') {
                    alert("Votre demande d'accès a été refusée par l'hôte.")
                    fetchMyPendingRequests()
                } else {
                    fetchMyPendingRequests()
                }
            })
            .subscribe()

        return () => {
            getSupabase().removeChannel(channel)
        }
    }, [user, router])

    const createRoom = async (e) => {
        e.preventDefault()
        if (!user) {
            openAuthModal()
            return
        }
        try {
            setIsCreating(true)
            const res = await fetch('/api/game/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: createSettings.name || `Partie de ${user.pseudo}`,
                    isPublic: createSettings.isPublic,
                    maxPlayers: createSettings.maxPlayers,
                    hostId: user.id
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            router.push(`/room/${data.room.id}`)
        } catch (err) {
            console.error("Exception lors de la création:", err)
            alert("Erreur lors de la création: " + err.message)
            setIsCreating(false)
        }
    }

    const joinPublicRoom = async (roomId) => {
        if (!user) {
            openAuthModal()
            return
        }
        setJoinLoadingId(roomId)
        try {
            const res = await fetch('/api/game/request-join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId,
                    userId: user.id,
                    username: user.pseudo,
                    avatarUrl: user.avatar_url || ''
                })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            // If user is already the host of this room, just jump in
            const isHost = publicRooms.find(r => r.id === roomId)?.host_id === user.id;
            if (isHost) {
                router.push(`/room/${roomId}`)
            } else {
                // Otherwise update requests list to show pending status
                // The useEffect realtime hook will catch this and update state, but let's visually signify it
                setJoinLoadingId(null)
            }
        } catch (err) {
            console.error(err)
            alert(err.message)
            setJoinLoadingId(null)
        }
    }

    const deleteRoom = async (roomId) => {
        if (!window.confirm('Supprimer ce salon définitivement ?')) return
        try {
            const res = await fetch('/api/game/delete-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, hostId: user.id })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setMyRooms(prev => prev.filter(r => r.id !== roomId))
        } catch (err) {
            alert('Erreur: ' + err.message)
        }
    }

    const joinRoom = async (e) => {
        e.preventDefault()
        if (!joinCode.trim()) return
        if (!user) {
            openAuthModal()
            return
        }
        try {
            const supa = getSupabase()
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                alert("Erreur de configuration: NEXT_PUBLIC_SUPABASE_URL ou KEY manquante dans Vercel.")
                return
            }
            const { data: room, error } = await supa
                .from('rooms')
                .select('id, host_id')
                .eq('code', joinCode.toUpperCase())
                .single()

            if (error || !room) {
                console.error("Erreur joinRoom:", error)
                alert("Code invalide ou salle introuvable. " + (error ? error.message : ""))
                return
            }

            if (room.host_id === user.id) {
                router.push(`/room/${room.id}`)
                return;
            }

            // Not the host, create a join request instead of directly navigating
            const res = await fetch('/api/game/request-join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: room.id,
                    userId: user.id,
                    username: user.pseudo,
                    avatarUrl: user.avatar_url || ''
                })
            })
            const reqData = await res.json()
            if (!res.ok) throw new Error(reqData.error)

            // Empty join code so user sees something happened
            setJoinCode('')
        } catch (err) {
            console.error("Exception lors de la connexion:", err)
            alert("Exception interne: " + (err.message || err.toString()))
        }
    }

    return (
        <>
            <main className="flex min-h-screen flex-col items-center bg-slate-950 relative overflow-hidden font-sans">
                {/* Animated Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/30 blur-[120px] rounded-full"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/20 blur-[100px] rounded-full"
                    />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                </div>

                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-20 relative"
                >
                    <div className="flex items-center gap-2.5">
                        <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                        <span className="text-white font-black text-sm sm:text-lg uppercase tracking-widest hidden sm:inline">Mafia Online</span>
                        <span className="text-white font-black text-sm sm:text-lg uppercase tracking-widest sm:hidden">Mafia</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isInitializing && (
                            <>
                                {user ? (
                                    <>
                                        <button
                                            onClick={() => setShowProfile(true)}
                                            className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-xl text-sm text-white font-medium transition-all"
                                        >
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.pseudo} className="w-7 h-7 rounded-full border border-red-600/50" loading="lazy" />
                                            ) : (
                                                <UserCircle className="w-5 h-5 text-red-400" />
                                            )}
                                            {user.pseudo}
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-2 bg-zinc-900/80 hover:bg-red-950/50 border border-zinc-800 hover:border-red-900/50 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-300 font-medium transition-all"
                                            title="Déconnexion"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={openAuthModal}
                                            className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-xl text-sm text-white font-medium transition-all"
                                        >
                                            <LogIn className="w-4 h-4" />
                                            Se connecter
                                        </button>
                                        <button
                                            onClick={openAuthModal}
                                            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 px-4 py-2 rounded-xl text-sm text-white font-bold transition-all shadow-lg shadow-red-900/30"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Créer un compte
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </motion.header>

                {/* ── HERO ── */}
                <div className="flex flex-1 flex-col items-center justify-center px-4 z-10 w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                        className="w-full flex flex-col items-center"
                    >
                        <header className="relative mb-2 w-full text-center">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 blur-2xl bg-gradient-to-r from-red-600 to-purple-600 opacity-50"
                            />
                            <h1 className="relative text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-rose-400 to-orange-500 uppercase drop-shadow-lg text-center" title="Play Mafia Online">
                                Mafia
                            </h1>
                            <h2 className="sr-only">Multiplayer Social Deduction Game</h2>
                        </header>

                        <p className="text-purple-200/70 font-medium mb-10 text-center tracking-[0.3em] text-sm uppercase">
                            {user ? `Prêt pour la prochaine traque, ${user.pseudo} ?` : 'La ville s\'endort...'}
                        </p>

                        <section className="w-full bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col gap-6 relative overflow-hidden" aria-labelledby="join-game">
                            <h3 id="join-game" className="sr-only">Join Real-Time Mafia Game</h3>
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                            {/* Create Room */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (!user) openAuthModal()
                                    else setShowCreateModal(true)
                                }}
                                className="relative w-full group rounded-2xl p-[2px] overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-red-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity blur-sm"></span>
                                <div className="relative bg-slate-900/90 group-hover:bg-slate-900/70 transition-colors backdrop-blur-sm rounded-2xl px-8 py-5 flex items-center justify-center border border-white/5">
                                    <span className="text-white font-bold text-lg uppercase tracking-widest drop-shadow-md flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> Héberger une Partie
                                    </span>
                                </div>
                            </motion.button>

                            {/* Divider */}
                            <div className="relative flex items-center py-2 opacity-50">
                                <div className="flex-grow border-t border-white/20"></div>
                                <span className="flex-shrink-0 mx-4 text-white/50 font-medium text-xs tracking-widest uppercase">code d'invitation privé</span>
                                <div className="flex-grow border-t border-white/20"></div>
                            </div>

                            {/* Join Room */}
                            <form onSubmit={joinRoom} className="flex flex-col gap-4 relative z-10">
                                <div className="relative group">
                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Code de la salle"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-center text-white text-xl font-bold tracking-[0.2em] uppercase focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-white/20 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-base backdrop-blur-md"
                                        maxLength={6}
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: joinCode.length >= 3 ? 1.02 : 1 }}
                                    whileTap={{ scale: joinCode.length >= 3 ? 0.98 : 1 }}
                                    type="submit"
                                    disabled={joinCode.length < 3}
                                    className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm backdrop-blur-md shadow-lg flex items-center justify-center gap-3"
                                >
                                    <DoorOpen className="w-5 h-5" />
                                    Rejoindre la salle
                                </motion.button>
                            </form>

                            {/* PWA Install */}
                            <AnimatePresence>
                                {isInstallable && (
                                    <motion.button
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleInstallClick}
                                        className="w-full bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500/90 hover:to-teal-500/90 border border-emerald-500/50 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 uppercase tracking-widest text-sm backdrop-blur-md overflow-hidden relative"
                                    >
                                        <Smartphone className="w-5 h-5" /> Installer l&apos;application
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Mes Salles (My Created Rooms) */}
                        {user && (
                            <section className="mt-8 w-full max-w-2xl bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-white font-black text-xl flex items-center gap-2 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                                    <Crown className="w-5 h-5 text-yellow-400" /> Mes Salles
                                    <span className="ml-auto text-xs font-medium bg-white/10 px-3 py-1 rounded-full text-white/60">
                                        {myRooms.length} serveur(s)
                                    </span>
                                </h3>

                                {isFetchingMyRooms ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                                    </div>
                                ) : myRooms.length === 0 ? (
                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                        <DoorOpen className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                        <p className="text-white/40 font-medium text-sm">Vous n'avez créé aucune salle.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        <AnimatePresence>
                                            {myRooms.map(room => {
                                                const playerCount = room.players[0]?.count || 0
                                                const isFull = playerCount >= room.max_players

                                                return (
                                                    <motion.div
                                                        key={room.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-white font-bold text-lg">{room.name || 'Partie Sans Nom'}</h4>
                                                                {!room.is_public && <Lock className="w-3.5 h-3.5 text-zinc-400" title="Privé" />}
                                                                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${room.status === 'lobby' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                                                                    {room.status === 'lobby' ? 'En attente' : 'En cours'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                                                                <span className="flex items-center gap-1">
                                                                    <Hash className="w-3.5 h-3.5" /> {room.code}
                                                                </span>
                                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isFull ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                                                    <Users className="w-3.5 h-3.5" /> {playerCount} / {room.max_players} Joueurs
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <button
                                                                onClick={() => router.push(`/room/${room.id}`)}
                                                                className="flex-1 sm:flex-initial bg-yellow-600/80 hover:bg-yellow-500 border border-yellow-500 text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest shrink-0 shadow-lg"
                                                            >
                                                                Gérer / Rejoindre
                                                            </button>
                                                            {room.status === 'lobby' && (
                                                                <button
                                                                    onClick={() => deleteRoom(room.id)}
                                                                    className="bg-red-950/60 hover:bg-red-600 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-white py-2 px-3 rounded-xl transition-all flex items-center justify-center shrink-0"
                                                                    title="Supprimer le salon"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Invitations en Attente (Pending Requests) */}
                        {user && myPendingRequests.length > 0 && (
                            <section className="mt-8 mx-4 sm:mx-0 w-full max-w-2xl bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-4 sm:p-6 shadow-2xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                                <h3 className="text-white font-black text-lg sm:text-xl flex items-center gap-2 uppercase tracking-widest mb-4 sm:mb-6 border-b border-white/10 pb-4 relative z-10 flex-wrap">
                                    <Clock className="w-5 h-5 text-purple-400 animate-pulse" /> Requêtes d'entrée
                                    <span className="ml-auto mt-2 sm:mt-0 text-[10px] sm:text-xs font-medium bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                        {myPendingRequests.length} en attente
                                    </span>
                                </h3>

                                <div className="space-y-3 relative z-10">
                                    <AnimatePresence>
                                        {myPendingRequests.map(req => (
                                            <motion.div
                                                key={req.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-white font-bold text-lg">{req.rooms?.name || 'Partie Sans Nom'}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                                                        <span className="flex items-center gap-1">
                                                            <Hash className="w-3.5 h-3.5" /> {req.rooms?.code}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-yellow-400/80">
                                                            En attente de l'hôte...
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}

                        {/* Public Lobbies Browser */}
                        <section className="mt-8 w-full max-w-2xl bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-2xl">
                            <h3 className="text-white font-black text-xl flex items-center gap-2 uppercase tracking-widest mb-6">
                                <Globe className="w-5 h-5 text-purple-400" /> Salons Publics
                                <span className="ml-auto text-xs font-medium bg-white/10 px-3 py-1 rounded-full text-white/60">
                                    {publicRooms.length} serveur(s)
                                </span>
                            </h3>

                            {isFetchingRooms ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                </div>
                            ) : publicRooms.length === 0 ? (
                                <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                    <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/40 font-medium text-sm">Aucune partie publique en attente.</p>
                                    <p className="text-white/30 text-xs italic mt-1 font-sans">Soyez le premier à en héberger une !</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    <AnimatePresence>
                                        {publicRooms.map(room => {
                                            const playerCount = room.players[0]?.count || 0
                                            const isFull = playerCount >= room.max_players

                                            return (
                                                <motion.div
                                                    key={room.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/10 transition-colors"
                                                >
                                                    <div>
                                                        <h4 className="text-white font-bold text-lg">{room.name || 'Partie Sans Nom'}</h4>
                                                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                                                            <span className="flex items-center gap-1">
                                                                <Hash className="w-3.5 h-3.5" /> {room.code}
                                                            </span>
                                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isFull ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                                                <Users className="w-3.5 h-3.5" /> {playerCount} / {room.max_players} Joueurs
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => joinPublicRoom(room.id)}
                                                        disabled={isFull || joinLoadingId === room.id}
                                                        className="w-full sm:w-auto bg-purple-600/80 hover:bg-purple-500 border border-purple-500 text-white font-bold py-2 px-6 rounded-xl transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 uppercase text-xs tracking-widest shrink-0 shadow-lg"
                                                    >
                                                        {joinLoadingId === room.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                                                    </button>
                                                </motion.div>
                                            )
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </section>

                        <footer className="mt-12 text-center pb-8">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6"
                            >
                                <Link href="/game-rules" className="text-white/40 hover:text-white/80 transition-colors text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Règles du jeu
                                </Link>
                                <span className="hidden sm:inline-block text-white/20">•</span>
                                <Link href="/privacy-policy" className="text-white/40 hover:text-white/80 transition-colors text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> Confidentialité (RGPD)
                                </Link>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 1.5 }}
                                className="text-white/30 text-xs tracking-widest uppercase font-medium hover:opacity-100 transition-opacity cursor-default"
                            >
                                By abderrazak Morro
                            </motion.p>
                        </footer>
                    </motion.div>
                </div>
            </main>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

                {/* Create Room Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-red-600" />

                            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-purple-400" /> Configuration
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full cursor-pointer">
                                    <DoorOpen className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar">
                                <form onSubmit={createRoom} className="p-4 sm:p-6 space-y-6">
                                    {/* Game Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-widest text-zinc-400">Nom du salon (Optionnel)</label>
                                        <input
                                            type="text"
                                            placeholder={`Partie de ${user?.pseudo}`}
                                            value={createSettings.name}
                                            onChange={e => setCreateSettings({ ...createSettings, name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
                                        />
                                    </div>

                                    {/* Visibility Toggle */}
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-widest text-zinc-400">Visibilité</label>
                                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => setCreateSettings({ ...createSettings, isPublic: true })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${createSettings.isPublic ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                <Globe className="w-4 h-4" /> Public
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCreateSettings({ ...createSettings, isPublic: false })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${!createSettings.isPublic ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                <Lock className="w-4 h-4" /> Privé
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mt-1 pl-1">
                                            {createSettings.isPublic ? "Visible par tous sur l'accueil. Les joueurs doivent demander à rejoindre." : "Caché. Joignable uniquement via un lien d'invitation direct."}
                                        </p>
                                    </div>

                                    {/* Max Players */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs uppercase font-bold tracking-widest text-zinc-400">Joueurs max</label>
                                            <span className="text-purple-400 font-black text-lg">{createSettings.maxPlayers}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="4"
                                            max="15"
                                            value={createSettings.maxPlayers}
                                            onChange={e => setCreateSettings({ ...createSettings, maxPlayers: parseInt(e.target.value) })}
                                            className="w-full accent-purple-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold px-1">
                                            <span>4</span>
                                            <span>15</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lancer le salon'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
