'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Erreur lors de la demande')

            setSuccess(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 relative overflow-hidden font-sans p-4">
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

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-rose-900" />

                <div className="p-6 pt-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Mot de passe oublié</h2>
                        <p className="text-zinc-400 text-sm">Entrez votre email pour réinitialiser votre mot de passe</p>
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
                                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                                </div>
                                <p className="text-green-400 font-medium tracking-wide">Lien envoyé !</p>
                                <p className="text-zinc-400 text-sm">Si ce compte existe, un email contenant les instructions a été envoyé.</p>
                                <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mt-6 font-medium text-sm">
                                    <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
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
                                            className="bg-red-950/50 border border-red-900/50 rounded-xl p-3 flex items-start gap-3"
                                        >
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-red-200 text-sm">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-red-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Adresse email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-red-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-wider text-sm shadow-lg shadow-red-900/30 mt-6"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                                    <span>{isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}</span>
                                </button>

                                <div className="text-center mt-6">
                                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                                        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                                    </Link>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </main>
    )
}
