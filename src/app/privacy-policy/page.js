'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen text-on-surface selection:bg-primary/30 font-sans p-4 sm:p-8 overflow-x-hidden">
            {/* Mist Overlay */}
            <div className="fixed inset-0 pointer-events-none mist-overlay opacity-40 z-0" />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-container/10 rounded-full filter blur-[150px] opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-tertiary-container/10 rounded-full filter blur-[150px] opacity-60"></div>
            </div>

            <div className="max-w-3xl mx-auto relative z-10 pt-8 pb-20">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-12 uppercase tracking-widest text-sm font-bold bg-surface-container/50 backdrop-blur-md px-4 py-2 rounded-xl hover:bg-surface-container-highest">
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l'accueil
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 border-b border-outline-variant/10 pb-8">
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4 font-display">
                        <ShieldCheck className="w-10 h-10 sm:w-14 sm:h-14 text-tertiary" />
                        Politique de Confidentialité
                    </h1>
                    <p className="text-on-surface-variant text-lg font-medium">
                        Respect de vos données personnelles et conformité RGPD.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-10 text-on-surface-variant leading-loose"
                >
                    <section>
                        <h2 className="text-xl font-bold text-on-surface uppercase tracking-widest mb-4 font-display">1. Collecte des données</h2>
                        <p>
                            Dans le cadre de l'utilisation de notre jeu Mafia, nous collectons un minimum d'informations personnelles pour garantir le bon fonctionnement des parties multijoueurs.
                            Les seules informations stockées sont :
                        </p>
                        <ul className="list-disc pl-6 mt-3 space-y-2 text-on-surface-variant/80">
                            <li>Un pseudonyme de session (choisi par vous-même).</li>
                            <li>Un identifiant de session unique (stocké dans un cookie temporaire).</li>
                            <li>Les messages envoyés dans le chat en jeu (qui sont nettoyés périodiquement et ne sont accessibles qu'aux joueurs de votre partie).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-on-surface uppercase tracking-widest mb-4 font-display">2. Finalité du traitement</h2>
                        <p>
                            Ces données sont utilisées <strong>exclusivement</strong> pour :
                        </p>
                        <ul className="list-disc pl-6 mt-3 space-y-2 text-on-surface-variant/80">
                            <li>Vous identifier visuellement auprès des autres joueurs dans la salle.</li>
                            <li>Maintenir votre connexion à une partie en cours en cas de rafraîchissement de page.</li>
                            <li>Permettre l'échange de messages contextuels nécessaires au gameplay.</li>
                        </ul>
                        <p className="mt-3 text-tertiary font-medium">
                            Nous ne vendons, ne croisons, ni ne réutilisons vos données à des fins publicitaires.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-on-surface uppercase tracking-widest mb-4 font-display">3. Conservation des données</h2>
                        <p>
                            Le système est conçu pour être éphémère. Les salles de jeu inactives, les historiques de chat et les participations de joueurs sont supprimés de nos bases de données par des processus automatiques après un délai d'inactivité court (généralement 24 à 48 heures). Un bouton manuel vous permet également de quitter une salle à tout moment, révoquant immédiatement votre présence.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-on-surface uppercase tracking-widest mb-4 font-display">4. Cookies</h2>
                        <p>
                            Nous utilisons un (1) seul cookie fonctionnel strictement nécessaire : un identifiant crypté stocké localement sur votre navigateur (`game_session`) qui mémorise votre ID d'utilisateur temporaire. Aucun cookie de pistage, d'analytique web ou de tiers n'est déposé sur votre appareil.
                        </p>
                    </section>
                </motion.div>
            </div>
        </main>
    )
}
