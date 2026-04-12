'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import ProfileModal from '../components/ProfileModal'
import { useGlobalAudio } from '../components/GlobalAudioProvider'
import AudioSettingsModal from '../components/AudioSettingsModal'
import Link from 'next/link'
import {
    Sword, LogIn, UserPlus, UserCircle, LogOut,
    Play, Loader2, Smartphone, DoorOpen, Hash,
    Globe, Lock, Settings, Users, Sparkles, AlertCircle, Crown, Clock,
    BookOpen, Shield, Trash2, Volume2, VolumeX,
    Bell, Filter, RefreshCw, MessageSquare, Search,
    Eye, History, Crosshair, UserCheck, UserX, ChevronRight, Mail
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
    const { playSFX, isMuted: globalMuted } = useGlobalAudio()
    const [showJoinCodeModal, setShowJoinCodeModal] = useState(false)
    const [showAudioSettings, setShowAudioSettings] = useState(false)
    const [createSettings, setCreateSettings] = useState({
        name: '',
        isPublic: true,
        maxPlayers: 8
    })
    const [showMobileTeaser, setShowMobileTeaser] = useState(false)

    // ─── PWA Install ───
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
        if (outcome === 'accepted') setIsInstallable(false)
        setDeferredPrompt(null)
    }

    // ─── Room cleanup ───
    useEffect(() => {
        const triggerCleanup = () => {
            fetch('/api/cron/cleanup-rooms', { method: 'POST' }).catch(err => console.error("Cleanup ping failed:", err));
        }
        triggerCleanup();
        const cleanupInterval = setInterval(triggerCleanup, 60000);
        return () => clearInterval(cleanupInterval);
    }, []);

    // ─── Public rooms fetch + realtime ───
    useEffect(() => {
        const fetchPublicRooms = async () => {
            setIsFetchingRooms(true)
            const supa = getSupabase()
            const { data } = await supa
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

        return () => { getSupabase().removeChannel(channel) }
    }, [])

    // ─── My rooms + pending requests ───
    useEffect(() => {
        if (!user) {
            setMyRooms([])
            setIsFetchingMyRooms(false)
            return
        }

        const fetchMyRooms = async () => {
            setIsFetchingMyRooms(true)
            const supa = getSupabase()
            const { data } = await supa
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
                    router.push(`/room/${payload.new.room_id}`)
                } else if (payload.new.status === 'rejected') {
                    alert("Votre demande d'accès a été refusée par l'hôte.")
                    fetchMyPendingRequests()
                } else {
                    fetchMyPendingRequests()
                }
            })
            .subscribe()

        return () => { getSupabase().removeChannel(channel) }
    }, [user, router])

    // ─── Handlers ───
    const createRoom = async (e) => {
        e.preventDefault()
        if (!user) { openAuthModal(); return }
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
        if (!user) { openAuthModal(); return }
        setJoinLoadingId(roomId)
        try {
            const res = await fetch('/api/game/request-join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId, userId: user.id,
                    username: user.pseudo,
                    avatarUrl: user.avatar_url || ''
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            const isHost = publicRooms.find(r => r.id === roomId)?.host_id === user.id;
            if (isHost) router.push(`/room/${roomId}`)
            else setJoinLoadingId(null)
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
        } catch (err) { alert('Erreur: ' + err.message) }
    }

    const joinRoom = async (e) => {
        e.preventDefault()
        if (!joinCode.trim()) return
        if (!user) { openAuthModal(); return }
        try {
            const supa = getSupabase()
            const { data: room, error } = await supa
                .from('rooms').select('id, host_id')
                .eq('code', joinCode.toUpperCase()).single()
            if (error || !room) {
                alert("Code invalide ou salle introuvable.")
                return
            }
            if (room.host_id === user.id) {
                router.push(`/room/${room.id}`)
                return;
            }
            const res = await fetch('/api/game/request-join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: room.id, userId: user.id,
                    username: user.pseudo,
                    avatarUrl: user.avatar_url || ''
                })
            })
            const reqData = await res.json()
            if (!res.ok) throw new Error(reqData.error)
            setJoinCode('')
            setShowJoinCodeModal(false)
        } catch (err) {
            alert("Erreur: " + (err.message || err.toString()))
        }
    }

    // ─── Helpers ───
    const allRooms = [...myRooms.filter(r => r.status === 'lobby'), ...publicRooms.filter(pr => !myRooms.some(mr => mr.id === pr.id))]

    return (
        <>
            {/* ── Mist Overlay (atmosphere) ── */}
            <div className="fixed inset-0 pointer-events-none mist-overlay opacity-40 z-0" />

            {/* ══════════════════════════════════════════════ */}
            {/* TOP APP BAR                                    */}
            {/* ══════════════════════════════════════════════ */}
            <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3">
                    <Sword className="w-5 h-5 text-primary drop-shadow-[0_0_10px_rgba(211,187,255,0.3)]" />
                    <span className="text-lg sm:text-xl font-black tracking-[0.05em] text-primary drop-shadow-[0_0_10px_rgba(211,187,255,0.3)] font-display uppercase">
                        MAFIA ONLINE
                    </span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <a className="font-display tracking-[0.05em] uppercase text-primary border-b-2 border-primary py-1 text-sm font-bold cursor-pointer">Lobby</a>
                    <Link href="/game-rules" className="font-display tracking-[0.05em] uppercase text-on-surface/60 hover:text-primary transition-all py-1 text-sm font-bold">Intel</Link>
                    <Link href="/privacy-policy" className="font-display tracking-[0.05em] uppercase text-on-surface/60 hover:text-primary transition-all py-1 text-sm font-bold">Archive</Link>
                </nav>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    <button onClick={() => { playSFX('click'); setShowAudioSettings(true); }} className="text-on-surface/60 hover:text-primary transition-all p-1" title="Paramètres Audio">
                        <Settings className="w-5 h-5" />
                    </button>

                    {!isInitializing && (
                        <>
                            {user ? (
                                <>
                                    <button
                                        onClick={() => setShowProfile(true)}
                                        className="relative flex items-center"
                                    >
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.pseudo} className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-black text-sm">
                                                {user.pseudo?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface shadow-[0_0_8px_#d3bbff]" />
                                    </button>
                                    <button onClick={logout} className="text-on-surface/60 hover:text-secondary transition-all p-1" title="Déconnexion">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={openAuthModal} className="flex items-center gap-2 bg-surface-container-highest/50 hover:bg-surface-container-highest px-4 py-2 rounded-xl text-sm text-on-surface font-bold transition-all">
                                        <LogIn className="w-4 h-4" /> Se connecter
                                    </button>
                                    <button onClick={openAuthModal} className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-primary-container to-primary px-4 py-2 rounded-xl text-sm text-on-primary font-bold transition-all shadow-[0_10px_30px_rgba(109,40,217,0.4)]">
                                        <UserPlus className="w-4 h-4" /> Créer un compte
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* ══════════════════════════════════════════════ */}
            {/* SIDE NAV BAR (Desktop)                         */}
            {/* ══════════════════════════════════════════════ */}
            <aside className="hidden md:flex flex-col py-20 items-center overflow-hidden h-screen sidebar-nav fixed left-0 z-40 bg-surface/95 backdrop-blur-2xl shadow-[40px_0_60px_rgba(0,0,0,0.8)]">
                {/* User profile section */}
                {user && (
                    <div className="mb-10 flex flex-col items-center sidebar-items w-full px-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center mb-2 shrink-0">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                <UserCircle className="w-6 h-6 text-primary" />
                            )}
                        </div>
                        <div className="sidebar-profile-info">
                            <p className="text-lg font-black text-primary font-display uppercase tracking-tighter">{user.pseudo}</p>
                            <p className="text-[10px] text-on-surface-variant font-display uppercase tracking-widest opacity-60">Opérateur</p>
                        </div>
                    </div>
                )}

                {/* Nav items */}
                <nav className="flex flex-col w-full gap-1">
                    <a className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-primary-container/20 to-transparent text-primary border-l-4 border-primary transition-all cursor-pointer">
                        <Crosshair className="w-5 h-5 shrink-0" />
                        <span className="sidebar-label font-display text-sm uppercase tracking-tighter font-bold">Lobby</span>
                    </a>
                    <button onClick={() => user ? setShowProfile(true) : openAuthModal()} className="flex items-center gap-4 px-6 py-4 text-on-surface/40 hover:bg-surface-container hover:text-on-surface transition-all text-left">
                        <UserCircle className="w-5 h-5 shrink-0" />
                        <span className="sidebar-label font-display text-sm uppercase tracking-tighter font-bold">Dossier</span>
                    </button>
                    <Link href="/game-rules" className="flex items-center gap-4 px-6 py-4 text-on-surface/40 hover:bg-surface-container hover:text-on-surface transition-all">
                        <Eye className="w-5 h-5 shrink-0" />
                        <span className="sidebar-label font-display text-sm uppercase tracking-tighter font-bold">Intel</span>
                    </Link>
                    <Link href="/privacy-policy" className="flex items-center gap-4 px-6 py-4 text-on-surface/40 hover:bg-surface-container hover:text-on-surface transition-all">
                        <History className="w-5 h-5 shrink-0" />
                        <span className="sidebar-label font-display text-sm uppercase tracking-tighter font-bold">Archive</span>
                    </Link>
                </nav>

                {/* Recruit button */}
                <div className="mt-auto px-4 w-full pb-4">
                    <button
                        onClick={() => { if (!user) openAuthModal(); else setShowCreateModal(true); }}
                        className="sidebar-recruit w-full bg-primary-container text-primary font-bold py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(109,40,217,0.4)] font-display tracking-widest text-xs uppercase"
                    >
                        Héberger
                    </button>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════ */}
            {/* RIGHT SIDEBAR (Ad Space Placeholder)               */}
            {/* ══════════════════════════════════════════════ */}
            <aside className="hidden lg:flex fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-surface/30 border-l border-outline-variant/10 backdrop-blur-sm z-30 flex-col items-center justify-center p-6 pb-20">
                <div className="w-full h-full border-2 border-dashed border-outline-variant/20 rounded-3xl flex flex-col justify-center items-center gap-4 text-on-surface-variant/40 bg-surface-container-lowest/30 overflow-hidden relative group transition-all hover:border-primary/30 hover:bg-surface-container-lowest/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="bg-surface-container-high/50 p-4 rounded-full">
                        <Sparkles className="w-6 h-6 opacity-60 text-primary" />
                    </div>
                    <div className="text-center font-display tracking-widest text-xs uppercase font-bold relative z-10 px-4">
                        <span className="text-on-surface-variant font-black tracking-[0.2em] opacity-80">Espace Ad</span><br/>
                        <span className="text-[9px] opacity-50 font-sans tracking-tight font-normal mt-2 block">Sera dédié à la publicité ultérieurement</span>
                    </div>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════ */}
            {/* MAIN CONTENT                                   */}
            {/* ══════════════════════════════════════════════ */}
            <main className="pt-24 pb-32 md:pb-8 px-4 sm:px-6 md:pl-28 lg:pr-80 max-w-[1600px] mx-auto min-h-screen relative z-10">

                {/* ── Hero Section ── */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-12 relative rounded-3xl overflow-hidden min-h-[360px] sm:min-h-[400px] flex items-center lg:items-end p-6 sm:p-8 md:p-12"
                >
                    {/* Hero background image */}
                    <img
                        alt="Cinematic noir city alley"
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOyrAu2nK7Pk3hM5nE51Px7-j4Y3XHfZiooqXmEPLSjV6-zqpEO0QgfYAhAym5LOY0rwIdda8S5i0QF_BU9LmvhxmP14h8XR7OV_76uxla5SG6ENEoZ5WcXrpIN7zg0vK7zGeOl2SAV2EGc7RTJCHXDUWl5gfYY_aOHNQHky1M9DgjcdxjNavC8Y030u1m2YXbJIBV4Fi9zASMT3FpkP61A1rJSEzDDgWvi8fuiss8Fhbj6sAB1fHgU7L2JkYz5-3aqih7o7gEswI"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-surface via-surface/80 to-transparent" />

                    <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between items-end lg:items-center gap-8 lg:gap-12 mt-auto lg:mt-0">
                        {/* Text Content */}
                        <div className="w-full lg:w-1/2 flex flex-col justify-end h-full">
                            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-on-surface mb-6 leading-tight tracking-tight drop-shadow-xl">
                                TRUST <span className="text-primary italic">NO ONE.</span><br />SURVIVE THE NIGHT.
                            </h1>
                            <p className="text-on-surface-variant text-sm sm:text-base mb-6 max-w-md drop-shadow-md font-medium">
                                {user ? `Prêt pour la prochaine traque, ${user.pseudo} ?` : "La ville s'endort... Rejoins la partie."}
                            </p>
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { 
                                        playSFX('click');
                                        if (!user) openAuthModal(); 
                                        else setShowCreateModal(true); 
                                    }}
                                    className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(109,40,217,0.4)] text-sm sm:text-base tracking-widest uppercase"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Héberger
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { playSFX('click'); setShowJoinCodeModal(true); }}
                                    className="bg-surface-container-highest/80 border border-outline-variant/30 text-on-surface font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center gap-2 transition-all backdrop-blur-md text-sm sm:text-base tracking-widest uppercase hover:bg-surface-container-highest"
                                >
                                    <Hash className="w-5 h-5" />
                                    Rejoindre
                                </motion.button>

                                {isInstallable && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleInstallClick}
                                        className="hidden xl:flex bg-white/5 backdrop-blur-md text-on-surface-variant font-bold tracking-widest uppercase px-6 py-4 rounded-xl items-center gap-2 hover:text-on-surface hover:bg-white/10 transition-all text-sm"
                                    >
                                        <Smartphone className="w-5 h-5" />
                                        Installer
                                    </motion.button>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { playSFX('click'); setShowMobileTeaser(true); }}
                                    className="md:hidden bg-surface-container-highest/80 border border-outline-variant/30 text-on-surface font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all backdrop-blur-md text-sm tracking-widest uppercase hover:bg-surface-container-highest shadow-xl"
                                >
                                    <Play className="w-5 h-5 text-primary" />
                                    Teaser
                                </motion.button>
                            </div>
                        </div>

                        {/* Video Teaser */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full md:w-1/3 lg:w-1/4 xl:w-[280px] hidden md:block ml-auto"
                        >
                            <div className="relative rounded-[2rem] overflow-hidden glass-panel border border-outline-variant/20 shadow-2xl group aspect-[9/16]">
                                <video 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 saturate-[0.8]"
                                    loop 
                                    controls
                                    muted={globalMuted} 

                                    playsInline
                                    preload="metadata"
                                >
                                    <source src="/teaser.mp4" type="video/mp4" />
                                    Votre navigateur ne supporte pas la balise vidéo.
                                </video>
                                
                                {/* Inner glow / border effect */}
                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem] pointer-events-none" />
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* ── My Rooms Section (Host) ── */}
                {user && myRooms.length > 0 && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-tertiary" /> MES SALONS
                                </h2>
                                <p className="text-on-surface-variant text-sm">{myRooms.length} serveur(s) actif(s)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <AnimatePresence>
                                {myRooms.map(room => {
                                    const playerCount = room.players[0]?.count || 0
                                    return (
                                        <motion.div
                                            key={room.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="glass-panel p-5 sm:p-6 rounded-2xl border border-outline-variant/10 hover:border-tertiary/30 transition-all group cursor-pointer relative overflow-hidden"
                                            onClick={() => router.push(`/room/${room.id}`)}
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-tertiary/10 transition-all" />
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-surface-container p-3 rounded-xl">
                                                    <Crown className="w-5 h-5 text-tertiary" />
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${room.status === 'lobby' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
                                                    {room.status === 'lobby' ? 'EN ATTENTE' : 'EN COURS'}
                                                </span>
                                            </div>
                                            <h3 className="font-display text-lg sm:text-xl font-bold mb-1 truncate">{room.name || 'Partie Sans Nom'}</h3>
                                            <p className="text-on-surface-variant text-xs mb-4 flex items-center gap-2">
                                                <Hash className="w-3.5 h-3.5" /> {room.code}
                                                {!room.is_public && <Lock className="w-3 h-3 ml-1" />}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-display font-bold text-tertiary">{playerCount}/{room.max_players}</span>
                                                <div className="flex gap-2">
                                                    {room.status === 'lobby' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                                                            className="p-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-surface rounded-lg transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.section>
                )}

                {/* ── Public Rooms Grid ── */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div>
                            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">SALONS PUBLICS</h2>
                            <p className="text-on-surface-variant text-sm">Investigations actives en cours...</p>
                        </div>
                    </div>

                    {isFetchingRooms ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : publicRooms.length === 0 ? (
                        <div className="glass-panel rounded-2xl p-10 sm:p-12 text-center border border-outline-variant/10">
                            <AlertCircle className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-4" />
                            <p className="text-on-surface-variant/50 font-medium text-sm mb-1">Aucune partie publique en attente.</p>
                            <p className="text-on-surface-variant/30 text-xs italic">Soyez le premier à en héberger une !</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <AnimatePresence>
                                {publicRooms.map(room => {
                                    const playerCount = room.players[0]?.count || 0
                                    const isFull = playerCount >= room.max_players
                                    const initials = (room.name || 'XX').substring(0, 2).toUpperCase()

                                    return (
                                        <motion.div
                                            key={room.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="glass-panel p-5 sm:p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-all" />
                                            <div className="flex justify-between items-start mb-4 sm:mb-6">
                                                <div className="bg-surface-container p-3 rounded-xl">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${isFull ? 'bg-error/10 text-error border border-error/20' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
                                                    {isFull ? 'COMPLET' : 'LIVE'}
                                                </span>
                                            </div>
                                            <h3 className="font-display text-lg sm:text-xl font-bold mb-2 truncate">{room.name || 'Partie Sans Nom'}</h3>
                                            <p className="text-on-surface-variant text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-1">
                                                <Hash className="w-3 h-3" /> {room.code}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                    {[...Array(Math.min(playerCount, 3))].map((_, i) => (
                                                        <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                                                            {String.fromCharCode(65 + i)}
                                                        </div>
                                                    ))}
                                                    {playerCount > 3 && (
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold">
                                                            +{playerCount - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-display font-bold text-primary">{playerCount}/{room.max_players}</span>
                                                    <button
                                                        onClick={() => joinPublicRoom(room.id)}
                                                        disabled={isFull || joinLoadingId === room.id}
                                                        className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        {joinLoadingId === room.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'REJOINDRE'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </section>

                {/* ══════════════════════════════════════════════ */}
                {/* BOTTOM AD BANNER PLACEHOLDER                   */}
                {/* ══════════════════════════════════════════════ */}
                <section className="mb-12 w-full">
                    <div className="w-full h-32 sm:h-40 border-2 border-dashed border-outline-variant/20 rounded-3xl flex flex-col justify-center items-center gap-2 text-on-surface-variant/40 bg-surface-container-lowest/30 overflow-hidden relative group transition-all hover:border-primary/30 hover:bg-surface-container-lowest/50">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Sparkles className="w-6 h-6 opacity-60 text-primary mb-1" />
                        <div className="text-center font-display tracking-widest text-xs uppercase font-bold relative z-10 px-4">
                            <span className="text-on-surface-variant font-black tracking-[0.2em] opacity-80">Espace Publicitaire</span>
                            <span className="text-[9px] opacity-50 font-sans tracking-tight font-normal mt-1 block">Emplacement bannière (728x90)</span>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center pb-8 border-t border-outline-variant/5 pt-8 mt-8">
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
                        <Link href="/game-rules" className="text-on-surface-variant/50 hover:text-primary transition-colors text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Règles du jeu
                        </Link>
                        <span className="hidden sm:inline-block text-on-surface-variant/20">•</span>
                        <Link href="/privacy-policy" className="text-on-surface-variant/50 hover:text-primary transition-colors text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Confidentialité
                        </Link>
                        <span className="hidden sm:inline-block text-on-surface-variant/20">•</span>
                        <Link href="/contact" className="text-on-surface-variant/50 hover:text-primary transition-colors text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Contact
                        </Link>
                    </div>
                    <p className="text-on-surface-variant/30 text-xs tracking-widest uppercase font-medium">By Abderrazak Morro</p>
                </footer>
            </main>

            {/* ══════════════════════════════════════════════ */}
            {/* FLOATING SIDEBAR: Pending Requests (Desktop)   */}
            {/* ══════════════════════════════════════════════ */}
            {user && myPendingRequests.length > 0 && (
                <aside className="hidden lg:block fixed right-6 top-24 bottom-24 w-72 z-30">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="h-full glass-panel rounded-3xl border border-outline-variant/10 flex flex-col p-6 shadow-2xl"
                    >
                        <h2 className="font-display text-lg font-bold mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary animate-pulse" />
                            REQUÊTES
                        </h2>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {myPendingRequests.map(req => (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant shrink-0">
                                                {req.rooms?.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold truncate">{req.rooms?.name || 'Partie'}</p>
                                                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                                    <Hash className="w-3 h-3" /> {req.rooms?.code}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-tertiary/80">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>En attente de l'hôte...</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="mt-6 pt-6 border-t border-outline-variant/10">
                            <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Status Serveur</span>
                                </div>
                                <span className="text-[10px] font-bold text-primary">OPTIMAL</span>
                            </div>
                        </div>
                    </motion.div>
                </aside>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* MOBILE BOTTOM NAV                              */}
            {/* ══════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-end pb-4 px-4 bg-gradient-to-t from-surface-container-lowest to-transparent">
                <button
                    onClick={() => { if (!user) openAuthModal(); else setShowCreateModal(true); }}
                    className="flex flex-col items-center justify-center bg-surface-variant/50 backdrop-blur-md text-primary rounded-xl p-2.5 shadow-[0_0_15px_rgba(109,40,217,0.3)] transition-all"
                >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">Héberger</span>
                </button>
                <button
                    onClick={() => setShowJoinCodeModal(true)}
                    className="flex flex-col items-center justify-center text-on-surface/30 p-2.5 hover:text-primary transition-all"
                >
                    <Hash className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">Rejoindre</span>
                </button>
                <Link href="/game-rules" className="flex flex-col items-center justify-center text-on-surface/30 p-2.5 hover:text-primary transition-all">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">Règles</span>
                </Link>
            </nav>

            {/* ══════════════════════════════════════════════ */}
            {/* MODALS                                         */}
            {/* ══════════════════════════════════════════════ */}

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
            </AnimatePresence>

            {/* Join Code Modal */}
            <AnimatePresence>
                {showJoinCodeModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm font-sans">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md glass-panel border border-outline-variant/15 rounded-3xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-container" />
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-on-surface uppercase tracking-wider flex items-center gap-2 font-display">
                                        <Hash className="w-5 h-5 text-primary" /> Code d'invitation
                                    </h2>
                                    <button onClick={() => setShowJoinCodeModal(false)} className="text-on-surface-variant/70 hover:text-on-surface transition-colors bg-surface-container/60 p-2 rounded-full">
                                        <DoorOpen className="w-4 h-4" />
                                    </button>
                                </div>
                                <form onSubmit={joinRoom} className="space-y-4">
                                    <input
                                        type="text" placeholder="Code de la salle" value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        className="w-full bg-surface-container-lowest/40 border border-outline-variant/20 rounded-xl px-6 py-4 text-center text-on-surface text-xl font-bold tracking-[0.2em] uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/20 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-base"
                                        maxLength={6}
                                    />
                                    <motion.button
                                        whileHover={{ scale: joinCode.length >= 3 ? 1.02 : 1 }}
                                        whileTap={{ scale: joinCode.length >= 3 ? 0.98 : 1 }}
                                        type="submit" disabled={joinCode.length < 3}
                                        className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(109,40,217,0.3)]"
                                    >
                                        Rejoindre la salle
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Room Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm font-sans">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md glass-panel border border-outline-variant/15 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container to-secondary-container" />
                            <div className="p-4 sm:p-6 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
                                <h2 className="text-lg sm:text-xl font-black text-on-surface uppercase tracking-wider flex items-center gap-2 font-display">
                                    <Settings className="w-5 h-5 text-primary" /> Configuration
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant/70 hover:text-on-surface transition-colors bg-surface-container/60 p-2 rounded-full cursor-pointer">
                                    <DoorOpen className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar">
                                <form onSubmit={createRoom} className="p-4 sm:p-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Nom du salon (Optionnel)</label>
                                        <input type="text" placeholder={`Partie de ${user?.pseudo}`}
                                            value={createSettings.name}
                                            onChange={e => setCreateSettings({ ...createSettings, name: e.target.value })}
                                            className="w-full bg-surface-container-lowest/40 border border-outline-variant/15 rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Visibilité</label>
                                        <div className="flex bg-surface-container-lowest/40 rounded-xl p-1 border border-outline-variant/15">
                                            <button type="button"
                                                onClick={() => setCreateSettings({ ...createSettings, isPublic: true })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${createSettings.isPublic ? 'bg-primary-container text-on-surface shadow-md' : 'text-on-surface-variant/70 hover:text-on-surface'}`}
                                            >
                                                <Globe className="w-4 h-4" /> Public
                                            </button>
                                            <button type="button"
                                                onClick={() => setCreateSettings({ ...createSettings, isPublic: false })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${!createSettings.isPublic ? 'bg-secondary-container text-on-surface shadow-md' : 'text-on-surface-variant/70 hover:text-on-surface'}`}
                                            >
                                                <Lock className="w-4 h-4" /> Privé
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-widest font-medium mt-1 pl-1">
                                            {createSettings.isPublic ? "Visible par tous. Les joueurs doivent demander à rejoindre." : "Caché. Joignable uniquement via code."}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Joueurs max</label>
                                            <span className="text-primary font-black text-lg">{createSettings.maxPlayers}</span>
                                        </div>
                                        <input type="range" min="4" max="15"
                                            value={createSettings.maxPlayers}
                                            onChange={e => setCreateSettings({ ...createSettings, maxPlayers: parseInt(e.target.value) })}
                                            className="w-full accent-primary-container h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-on-surface-variant/70 font-bold px-1">
                                            <span>4</span><span>15</span>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isCreating}
                                        className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_10px_30px_rgba(109,40,217,0.4)] transition-all flex items-center justify-center gap-2 mt-4 hover:shadow-[0_15px_40px_rgba(109,40,217,0.5)]"
                                    >
                                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lancer le salon'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mobile Video Teaser Modal */}
            <AnimatePresence>
                {showMobileTeaser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/95 backdrop-blur-xl font-sans md:hidden">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="w-full h-full p-4 relative flex items-center justify-center"
                        >
                            <button 
                                onClick={() => setShowMobileTeaser(false)} 
                                className="absolute top-6 right-6 z-50 bg-surface-container/60 hover:bg-surface-container-highest text-on-surface-variant/70 hover:text-on-surface transition-all p-3 rounded-full backdrop-blur-md shadow-lg"
                            >
                                <DoorOpen className="w-6 h-6 text-primary" />
                            </button>
                            
                            <div className="relative w-full max-w-sm rounded-[2.5rem] overflow-hidden glass-panel border border-outline-variant/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] aspect-[9/16] bg-surface-container-lowest">
                                <video 
                                    className="w-full h-full object-cover opacity-90 transition-opacity duration-500 saturate-[0.8]"
                                    loop 
                                    controls
                                    muted={globalMuted} 
                                    playsInline
                                    preload="auto"
                                >
                                    <source src="/teaser.mp4" type="video/mp4" />
                                </video>
                                
                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2.5rem] pointer-events-none" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Audio Settings Modal */}
            <AudioSettingsModal 
                isOpen={showAudioSettings} 
                onClose={() => setShowAudioSettings(false)} 
            />
        </>
    )
}
