'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, LogIn, Ghost, Fingerprint, Mail, Lock,
    AtSign, Key, AlertCircle, Loader2, X
} from 'lucide-react';

export default function AuthModal({ onAuthSuccess, onClose }) {
    const [activeTab, setActiveTab] = useState('sign_up');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [signupData, setSignupData] = useState({ pseudo: '', email: '', password: '' });
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [guestData, setGuestData] = useState({ pseudo_temp: '' });

    const tabs = [
        { id: 'sign_up', label: 'Sign Up', icon: UserPlus },
        { id: 'login', label: 'Login', icon: LogIn },
        { id: 'guest', label: 'Guest', icon: Ghost },
    ];

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration error');
            localStorage.setItem('mafia_user', JSON.stringify(data.user));
            onAuthSuccess(data.user, `Welcome, ${data.user.pseudo}!`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid credentials');
            localStorage.setItem('mafia_user', JSON.stringify(data.user));
            onAuthSuccess(data.user, `Welcome back ${data.user.pseudo}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = (e) => {
        e.preventDefault();
        if (!guestData.pseudo_temp.trim()) {
            setError('Username is required.');
            return;
        }
        const guestUser = {
            id: `guest_${Math.random().toString(36).substr(2, 9)}`,
            pseudo: guestData.pseudo_temp,
            is_guest: true,
        };
        localStorage.setItem('mafia_user', JSON.stringify(guestUser));
        onAuthSuccess(guestUser, `Welcome, guest ${guestUser.pseudo}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface/90 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md glass-panel bg-surface-container/95 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden relative border border-outline-variant/10"
            >
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container to-secondary-container" />

                {/* Close button */}
                {onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant/70 hover:text-on-surface transition-colors z-10 bg-surface-container/60 p-2 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                )}

                <div className="p-6 pt-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-on-surface mb-2 font-display">Enter the Circle</h2>
                        <p className="text-on-surface-variant text-sm">Identify yourself for the next game</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 bg-secondary-container/20 rounded-xl p-3 flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                <p className="text-on-secondary-container text-sm">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tabs */}
                    <div className="flex bg-surface-container-low rounded-xl p-1 mb-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setError(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all relative z-10 ${isActive ? 'text-on-surface' : 'text-on-surface-variant/70 hover:text-on-surface'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-surface-container-highest rounded-lg -z-10"
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Forms */}
                    <div className="relative min-h-[220px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'sign_up' && (
                                <motion.form key="signup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} onSubmit={handleSignup} className="space-y-4">
                                    <InputField icon={Fingerprint} type="text" placeholder="Username" value={signupData.pseudo} onChange={v => setSignupData({ ...signupData, pseudo: v })} />
                                    <InputField icon={Mail} type="email" placeholder="Email" value={signupData.email} onChange={v => setSignupData({ ...signupData, email: v })} />
                                    <InputField icon={Lock} type="password" placeholder="Password" value={signupData.password} onChange={v => setSignupData({ ...signupData, password: v })} />
                                    <SubmitButton isLoading={isLoading} label="Create Account" icon={<UserPlus className="w-5 h-5" />} />
                                </motion.form>
                            )}
                            {activeTab === 'login' && (
                                <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} onSubmit={handleLogin} className="space-y-4">
                                    <InputField icon={AtSign} type="email" placeholder="Email" value={loginData.email} onChange={v => setLoginData({ ...loginData, email: v })} />
                                    <div className="space-y-1">
                                        <InputField icon={Key} type="password" placeholder="Password" value={loginData.password} onChange={v => setLoginData({ ...loginData, password: v })} />
                                        <div className="text-right mt-1">
                                            <a href="/forgot-password" onClick={onClose} className="text-xs text-on-surface-variant/70 hover:text-primary transition-colors pr-1">Forgot password?</a>
                                        </div>
                                    </div>
                                    <SubmitButton isLoading={isLoading} label="Sign In" icon={<LogIn className="w-5 h-5" />} />
                                </motion.form>
                            )}
                            {activeTab === 'guest' && (
                                <motion.form key="guest" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} onSubmit={handleGuest} className="space-y-4">
                                    <div className="text-on-surface-variant text-sm mb-2 bg-surface-container-low/50 p-4 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                                        <span>Temporary session. Your stats will not be saved.</span>
                                    </div>
                                    <InputField icon={Ghost} type="text" placeholder="Temporary username" value={guestData.pseudo_temp} onChange={v => setGuestData({ ...guestData, pseudo_temp: v })} />
                                    <SubmitButton isLoading={isLoading} label="Join as Guest" icon={<Ghost className="w-5 h-5" />} />
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function InputField({ icon: Icon, type, placeholder, value, onChange }) {
    return (
        <div className="relative group">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
            <input
                type={type} required placeholder={placeholder} value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-surface-container-low/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
        </div>
    );
}

function SubmitButton({ isLoading, label, icon }) {
    return (
        <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-r from-primary to-primary-container hover:from-primary/90 hover:to-primary-container/90 text-on-primary font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-wider text-sm shadow-[0_10px_30px_rgba(109,40,217,0.3)]"
        >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
            <span>{isLoading ? 'Loading...' : label}</span>
        </button>
    );
}
