'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

function UpdatePasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [sessionReady, setSessionReady] = useState(false)

    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            setSessionReady(true)
        }
    }, [searchParams])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.')
            return
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.')
            return
        }

        setIsLoading(true)
        setError(null)

        const token = searchParams.get('token')

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de la mise à jour du mot de passe.')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour du mot de passe.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6 pt-8">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-widest text-on-surface mb-2 font-display">Nouveau mot de passe</h2>
                <p className="text-on-surface-variant text-sm">Créez votre nouveau mot de passe sécurisé</p>
            </div>

            <AnimatePresence mode="wait">
                {success ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 font-medium text-lg tracking-wide">Mot de passe mis à jour !</p>
                        <p className="text-on-surface-variant text-sm">Vous allez être redirigé vers la connexion...</p>
                        <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mt-6 font-medium text-sm">
                            <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
                        </Link>
                    </motion.div>
                ) : !sessionReady ? (
                    <motion.div
                        key="no-session"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="bg-secondary-container/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                            <p className="text-on-secondary-container text-sm">Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.</p>
                        </div>
                        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mt-6 font-medium text-sm">
                            <ArrowLeft className="w-4 h-4" /> Demander un nouveau lien
                        </Link>
                    </motion.div>
                ) : (
                    <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-secondary-container/20 rounded-xl p-3 flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                    <p className="text-on-secondary-container text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                required
                                placeholder="Nouveau mot de passe"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-surface-container-low/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                required
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-surface-container-low/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-wider text-sm shadow-[0_10px_30px_rgba(109,40,217,0.3)] mt-6"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                            <span>{isLoading ? 'Modification...' : 'Valider le changement'}</span>
                        </button>

                        <div className="text-center mt-6">
                            <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant/70 hover:text-on-surface transition-colors text-sm font-medium">
                                <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
                            </Link>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function UpdatePassword() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden font-sans p-4">
            {/* Mist Overlay */}
            <div className="fixed inset-0 pointer-events-none mist-overlay opacity-40 z-0" />

            {/* Background Glow */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-container/30 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-container/20 blur-[100px] rounded-full"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md glass-panel bg-surface-container/95 border border-outline-variant/10 rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-container" />
                <Suspense fallback={
                    <div className="p-6 pt-8 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }>
                    <UpdatePasswordForm />
                </Suspense>
            </motion.div>
        </main>
    )
}
