'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, User, MessageSquare, AlertCircle, Loader2, ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import Link from 'next/link'

export default function Contact() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))
            setSuccess(true)
        } catch (err) {
            setError('Une erreur est survenue lors de l\'envoi.')
        } finally {
            setIsLoading(false)
        }
    }

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
                className="w-full max-w-lg glass-panel bg-surface-container/95 border border-outline-variant/10 rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-container" />

                <div className="p-6 sm:p-8 pt-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-4 border border-outline-variant/10 shadow-[0_0_20px_rgba(211,187,255,0.2)]">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-on-surface mb-2 font-display">Contactez-nous</h2>
                        <p className="text-on-surface-variant text-sm mb-6">Une suggestion, un bug ou une demande de partenariat ? Envoyez-nous un message ou contactez-moi directement.</p>

                        <div className="inline-flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-bold tracking-wider mb-2">
                            <Mail className="w-4 h-4" />
                            <a href="mailto:abderrazak.morro@gmail.com" className="hover:underline">abderrazak.morro@gmail.com</a>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4 py-8"
                            >
                                <div className="flex justify-center mb-4">
                                    <CheckCircle2 className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
                                </div>
                                <h3 className="text-xl text-emerald-400 font-bold uppercase tracking-widest font-display">Message envoyé !</h3>
                                <p className="text-on-surface-variant text-sm max-w-xs mx-auto">Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
                                <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-high rounded-xl text-on-surface hover:bg-surface-container-highest transition-colors mt-8 font-bold tracking-widest text-xs uppercase shadow-lg">
                                    <ArrowLeft className="w-4 h-4" /> Retour au lobby
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
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Votre Pseudonyme / Nom"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-surface-container-low/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                                    />
                                </div>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Adresse Email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-surface-container-low/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                                    />
                                </div>

                                <div className="relative group">
                                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant/70 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        required
                                        placeholder="Votre message..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        rows={4}
                                        className="w-full bg-surface-container-low/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm shadow-[0_10px_30px_rgba(109,40,217,0.3)] mt-6 hover:shadow-[0_15px_40px_rgba(109,40,217,0.5)] active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    <span>{isLoading ? 'Envoi en cours...' : 'Envoyer le message'}</span>
                                </button>

                                <div className="text-center mt-6 pt-4 border-t border-outline-variant/10">
                                    <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant/70 hover:text-on-surface transition-colors text-xs tracking-widest font-bold uppercase">
                                        <ArrowLeft className="w-4 h-4" /> Retour à la planque
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
