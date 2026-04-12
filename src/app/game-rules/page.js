'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Shield, Users, Crosshair, Search } from 'lucide-react'

export default function GameRules() {
    return (
        <main className="min-h-screen text-on-surface selection:bg-primary/30 font-sans p-4 sm:p-8 overflow-x-hidden">
            {/* Mist Overlay */}
            <div className="fixed inset-0 pointer-events-none mist-overlay opacity-40 z-0" />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-container/15 rounded-full filter blur-[100px] opacity-50 animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-container/15 rounded-full filter blur-[100px] opacity-50"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10 pt-8 pb-20">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-12 uppercase tracking-widest text-sm font-bold bg-surface-container/50 backdrop-blur-md px-4 py-2 rounded-xl hover:bg-surface-container-highest">
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l'accueil
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4 font-display">
                        <BookOpen className="w-10 h-10 sm:w-16 sm:h-16 text-primary" />
                        Règles du Jeu
                    </h1>
                    <p className="text-on-surface-variant text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
                        Apprenez comment survivre dans Mafia. Découvrez les rôles, les phases de jeu et les stratégies pour gagner.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {/* Concept */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-primary font-display">
                            <span className="w-8 h-1 bg-primary rounded-full"></span> Le Concept
                        </h2>
                        <div className="glass-panel border border-outline-variant/10 p-6 sm:p-8 rounded-3xl">
                            <p className="text-on-surface-variant leading-relaxed text-base sm:text-lg">
                                Mafia (ou Les Loups-Garous) est un jeu de déduction sociale. Les joueurs sont divisés secrètement en deux équipes : la <strong className="text-secondary">Mafia</strong> (minorité informée) et les <strong className="text-primary">Villageois</strong> (majorité non informée).
                                <br /><br />
                                Le jeu alterne entre deux phases : la <strong>Nuit</strong>, où certains rôles agissent secrètement, et le <strong>Jour</strong>, où tous les survivants débattent et votent pour éliminer un suspect.
                                <br /><br />
                                <strong>But du jeu :</strong> La Mafia gagne si elle élimine assez de villageois pour prendre le contrôle. Le Village gagne s'il démasque et élimine tous les membres de la Mafia.
                            </p>
                        </div>
                    </motion.section>

                    {/* Roles */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-secondary font-display">
                            <span className="w-8 h-1 bg-secondary rounded-full"></span> Les Rôles
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mafia */}
                            <div className="glass-panel bg-secondary-container/10 border border-outline-variant/10 p-6 sm:p-8 rounded-3xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary">
                                        <Crosshair className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-secondary uppercase tracking-widest font-display">La Mafia</h3>
                                </div>
                                <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                    Ils se connaissent entre eux. Chaque nuit, les membres de la mafia se concertent pour <strong>éliminer</strong> un joueur. Le jour, ils doivent se faire passer pour de paisibles villageois.
                                </p>
                            </div>

                            {/* Doctor */}
                            <div className="glass-panel bg-emerald-500/5 border border-outline-variant/10 p-6 sm:p-8 rounded-3xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest font-display">Le Docteur</h3>
                                </div>
                                <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                    Un membre innocent du village. Chaque nuit, le Docteur peut choisir de <strong>protéger</strong> un joueur (lui compris). Si ce joueur est ciblé par la mafia, il survit.
                                </p>
                            </div>

                            {/* Detective */}
                            <div className="glass-panel bg-primary/5 border border-outline-variant/10 p-6 sm:p-8 rounded-3xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary uppercase tracking-widest font-display">Le Détective</h3>
                                </div>
                                <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                    Le policier du village. Chaque nuit, le Détective peut <strong>enquêter</strong> sur un joueur pour découvrir sa véritable allégeance (Innocent ou Suspect).
                                </p>
                            </div>

                            {/* Villager */}
                            <div className="glass-panel border border-outline-variant/10 p-6 sm:p-8 rounded-3xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-on-surface-variant uppercase tracking-widest font-display">Villageois</h3>
                                </div>
                                <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                    Ils n'ont aucun pouvoir la nuit et dorment d'un œil. Leur seule arme est la parole le jour et leur vote pour débusquer la mafia.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Phases */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-tertiary font-display">
                            <span className="w-8 h-1 bg-tertiary rounded-full"></span> Les Phases
                        </h2>

                        <div className="space-y-4">
                            <div className="glass-panel border border-outline-variant/10 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(109,40,217,0.2)]">🌙</div>
                                <div>
                                    <h4 className="text-lg font-bold text-primary uppercase tracking-widest mb-2 font-display">La Nuit</h4>
                                    <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                        Tout le monde ferme les yeux (le jeu gère son interface secrète). La Mafia choisit une cible, le Docteur protège, le Détective enquête. Personne ne sait qui fait quoi.
                                    </p>
                                </div>
                            </div>

                            <div className="glass-panel border border-outline-variant/10 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(255,182,139,0.2)]">☀️</div>
                                <div>
                                    <h4 className="text-lg font-bold text-tertiary uppercase tracking-widest mb-2 font-display">Le Jour</h4>
                                    <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                        Les victimes de la nuit sont annoncées. Les survivants discutent via le Chat en direct pour trouver les coupables. Le mensonge et la manipulation sont la clé de la victoire !
                                    </p>
                                </div>
                            </div>

                            <div className="glass-panel border border-outline-variant/10 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(255,180,172,0.2)]">⚖️</div>
                                <div>
                                    <h4 className="text-lg font-bold text-secondary uppercase tracking-widest mb-2 font-display">Le Vote</h4>
                                    <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                                        À la fin du jour, le village vote. Celui qui amasse le plus de votes est éliminé de la partie. En cas d'égalité, un court second tour de vote a lieu pour départager.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </main>
    )
}
