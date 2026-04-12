'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import AvatarPicker from './AvatarPicker';
import {
    X, Mail, BarChart3, Gamepad2, Trophy, Save,
    Settings, Shield, LogOut, Fingerprint, Percent, Image as ImageIcon,
    BookOpen, Trash2, AlertTriangle, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ProfileModal({ onClose }) {
    const { user, updateUser, logout, deleteAccount } = useAuth();
    const [activeSection, setActiveSection] = useState('identity');
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [editData, setEditData] = useState({
        pseudo: user?.pseudo || '',
    });
    const [pendingAvatar, setPendingAvatar] = useState(user?.avatar_url || '');

    if (!user) return null;

    const isGuest = user.is_guest;
    const stats = user.game_stats || { games_played: 0, games_won: 0 };
    const score = user.score || 0;
    const winRate = stats.games_played > 0
        ? Math.round((stats.games_won / stats.games_played) * 100)
        : 0;

    const handleSave = () => {
        if (!editData.pseudo.trim()) return;
        updateUser({ ...user, pseudo: editData.pseudo, avatar_url: pendingAvatar });
        setIsEditing(false);
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        const result = await deleteAccount();
        if (result?.success) {
            onClose();
        } else {
            setDeleteError(result?.error || 'Erreur inconnue.');
            setIsDeleting(false);
        }
    };

    const sections = [
        { id: 'identity', label: 'Identité', icon: Fingerprint },
        { id: 'avatar', label: 'Apparence', icon: ImageIcon },
        ...(!isGuest ? [{ id: 'stats', label: 'Archives', icon: BarChart3 }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface/90 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md glass-panel bg-surface-container/95 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col border border-outline-variant/10"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-container" />

                <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
                    <Link href="/game-rules" className="text-on-surface-variant/70 hover:text-primary transition-colors" title="Règles du jeu">
                        <BookOpen className="w-5 h-5" />
                    </Link>
                    <Link href="/privacy-policy" className="text-on-surface-variant/70 hover:text-tertiary transition-colors" title="Confidentialité">
                        <Shield className="w-5 h-5" />
                    </Link>
                    <div className="w-[1px] h-5 bg-outline-variant/20" />
                    <button onClick={onClose} className="text-on-surface-variant/70 hover:text-on-surface transition-colors bg-surface-container/60 p-1.5 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Header with avatar */}
                <div className="p-6 pb-4 flex flex-col items-center shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-[0_0_20px_rgba(109,40,217,0.3)] mb-3 bg-surface-container-low">
                        {(pendingAvatar || user.avatar_url) ? (
                            <img
                                src={pendingAvatar || user.avatar_url}
                                alt={user.pseudo}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center">
                                <Fingerprint className="w-10 h-10 text-on-primary" />
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-on-surface uppercase tracking-wider font-display">{user.pseudo}</h2>
                    {isGuest && (
                        <span className="mt-1.5 text-xs bg-tertiary/20 text-tertiary px-3 py-1 rounded-full font-medium tracking-wide uppercase flex items-center gap-1.5">
                            <Shield className="w-3 h-3" /> Invité
                        </span>
                    )}
                    {user.email && (
                        <p className="text-on-surface-variant/70 text-sm mt-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                        </p>
                    )}
                </div>

                {/* Section Tabs */}
                <div className="flex mx-6 bg-surface-container-low rounded-xl p-1 mb-4 shrink-0">
                    {sections.map(sec => {
                        const Icon = sec.icon;
                        const isActive = activeSection === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all relative z-10 ${isActive ? 'text-on-surface' : 'text-on-surface-variant/70 hover:text-on-surface'}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {sec.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="profileTab"
                                        className="absolute inset-0 bg-surface-container-highest rounded-lg -z-10"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
                    <AnimatePresence mode="wait">
                        {activeSection === 'identity' && (
                            <motion.div key="identity" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.15 }} className="space-y-4">
                                <label className="block">
                                    <span className="text-on-surface-variant text-xs uppercase tracking-wider font-medium mb-2 block">Pseudo</span>
                                    {isEditing ? (
                                        <div className="relative group">
                                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                value={editData.pseudo}
                                                onChange={e => setEditData({ ...editData, pseudo: e.target.value })}
                                                className="w-full bg-surface-container-low/60 rounded-xl py-3 pl-12 pr-4 text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-surface-container-low/50 rounded-xl py-3 px-4 text-on-surface font-bold flex items-center gap-3">
                                            <Fingerprint className="w-5 h-5 text-primary" />
                                            {user.pseudo}
                                        </div>
                                    )}
                                </label>

                                {isEditing ? (
                                    <button onClick={handleSave} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-on-surface font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                                        <Save className="w-4 h-4" /> Sauvegarder
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="w-full bg-surface-container-low hover:bg-surface-container-highest text-on-surface font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                                        <Settings className="w-4 h-4" /> Modifier
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {activeSection === 'avatar' && (
                            <motion.div key="avatar" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.15 }}>
                                <p className="text-on-surface-variant text-xs uppercase tracking-wider font-medium mb-3">Choisir votre apparence</p>
                                <AvatarPicker
                                    currentAvatar={pendingAvatar}
                                    onSelect={(url) => {
                                        setPendingAvatar(url);
                                        updateUser({ ...user, avatar_url: url });
                                    }}
                                />
                            </motion.div>
                        )}

                        {activeSection === 'stats' && !isGuest && (
                            <motion.div key="stats" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.15 }}>
                                <p className="text-on-surface-variant text-xs uppercase tracking-wider font-medium mb-3">Archives criminelles</p>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <StatCard icon={BarChart3} label="Score" value={score} />
                                    <StatCard icon={Gamepad2} label="Jouées" value={stats.games_played} />
                                    <StatCard icon={Trophy} label="Gagnées" value={stats.games_won} />
                                </div>
                                <div className="bg-surface-container-low/80 rounded-xl p-4 flex items-center gap-4">
                                    <div className="bg-primary-container/30 p-3 rounded-xl">
                                        <Percent className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-on-surface font-black text-2xl">{winRate}%</p>
                                        <p className="text-on-surface-variant/70 text-xs uppercase tracking-wide">Taux de victoire</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer - Logout + Delete */}
                <div className="px-6 pb-6 shrink-0 space-y-2">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-secondary-container/20 hover:bg-secondary-container/40 text-secondary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Déconnexion
                    </button>

                    {!isGuest && (
                        <>
                            {showDeleteConfirm ? (
                                <div className="bg-secondary-container/30 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-secondary">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-bold">Supprimer votre compte définitivement ?</p>
                                    </div>
                                    <p className="text-on-surface-variant/70 text-xs">Cette action est irréversible. Toutes vos données seront supprimées.</p>
                                    {deleteError && <p className="text-secondary text-xs">{deleteError}</p>}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className="flex-1 bg-secondary hover:bg-secondary/80 text-on-secondary font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            {isDeleting ? 'Suppression...' : 'Confirmer'}
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                                            disabled={isDeleting}
                                            className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full bg-surface-container-low/50 hover:bg-secondary-container/20 text-on-surface-variant/70 hover:text-secondary font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Supprimer mon compte
                                </button>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="bg-surface-container-low/80 rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-on-surface font-black text-lg">{value}</p>
            <p className="text-on-surface-variant/70 text-xs uppercase tracking-wide">{label}</p>
        </div>
    );
}
