'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Shield, Users, Crosshair, Search } from 'lucide-react'

export default function GameRules() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans p-4 sm:p-8 overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10 pt-8 pb-20">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12 uppercase tracking-widest text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10">
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l'accueil
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
                        <BookOpen className="w-10 h-10 sm:w-16 sm:h-16 text-purple-500" />
                        Règles du Jeu
                    </h1>
                    <p className="text-zinc-400 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
                        Apprenez comment survivre dans Mafia. Découvrez les rôles, les phases de jeu et les stratégies pour gagner.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {/* Concept */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-purple-400">
                            <span className="w-8 h-1 bg-purple-500 rounded-full"></span> Le Concept
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-[2rem] backdrop-blur-md">
                            <p className="text-zinc-300 leading-relaxed text-base sm:text-lg">
                                Mafia (ou Les Loups-Garous) est un jeu de déduction sociale. Les joueurs sont divisés secrètement en deux équipes : la <strong className="text-red-400">Mafia</strong> (minorité informée) et les <strong className="text-blue-400">Villageois</strong> (majorité non informée).
                                <br /><br />
                                Le jeu alterne entre deux phases : la <strong>Nuit</strong>, où certains rôles agissent secrètement, et le <strong>Jour</strong>, où tous les survivants débattent et votent pour éliminer un suspect.
                                <br /><br />
                                <strong>But du jeu :</strong> La Mafia gagne si elle élimine assez de villageois pour prendre le contrôle. Le Village gagne s'il démasque et élimine tous les membres de la Mafia.
                            </p>
                        </div>
                    </motion.section>

                    {/* Roles */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-red-500">
                            <span className="w-8 h-1 bg-red-500 rounded-full"></span> Les Rôles
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mafia */}
                            <div className="bg-gradient-to-br from-red-950/50 to-black border border-red-500/20 p-6 sm:p-8 rounded-[2rem] backdrop-blur-md">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                                        <Crosshair className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-red-400 uppercase tracking-widest">La Mafia</h3>
                                </div>
                                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                    Ils se connaissent entre eux. Chaque nuit, les membres de la mafia se concertent pour <strong>éliminer</strong> un joueur. Le jour, ils doivent se faire passer pour de paisibles villageois.
                                </p>
                            </div>

                            {/* Doctor */}
                            <div className="bg-gradient-to-br from-emerald-950/50 to-black border border-emerald-500/20 p-6 sm:p-8 rounded-[2rem] backdrop-blur-md">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">Le Docteur</h3>
                                </div>
                                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                    Un membre innocent du village. Chaque nuit, le Docteur peut choisir de <strong>protéger</strong> un joueur (lui compris). Si ce joueur est ciblé par la mafia, il survit.
                                </p>
                            </div>

                            {/* Detective */}
                            <div className="bg-gradient-to-br from-blue-950/50 to-black border border-blue-500/20 p-6 sm:p-8 rounded-[2rem] backdrop-blur-md">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-blue-400 uppercase tracking-widest">Le Détective</h3>
                                </div>
                                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                    Le policier du village. Chaque nuit, le Détective peut <strong>enquêter</strong> sur un joueur pour découvrir sa véritable allégeance (Innocent ou Suspect).
                                </p>
                            </div>

                            {/* Villager */}
                            <div className="bg-gradient-to-br from-zinc-900/50 to-black border border-white/10 p-6 sm:p-8 rounded-[2rem] backdrop-blur-md">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-zinc-300">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-300 uppercase tracking-widest">Villageois</h3>
                                </div>
                                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                    Ils n'ont aucun pouvoir la nuit et dorment d'un œil. Leur seule arme est la parole le jour et leur vote pour débusquer la mafia.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Phases */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-blue-400">
                            <span className="w-8 h-1 bg-blue-500 rounded-full"></span> Les Phases
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-black/40 border border-blue-900/50 p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-blue-900/30 flex items-center justify-center text-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">🌙</div>
                                <div>
                                    <h4 className="text-lg font-bold text-blue-300 uppercase tracking-widest mb-2">La Nuit</h4>
                                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                        Tout le monde ferme les yeux (le jeu gère son interface secrète). La Mafia choisit une cible, le Docteur protège, le Détective enquête. Personne ne sait qui fait quoi.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-yellow-900/50 p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-yellow-900/30 flex items-center justify-center text-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">☀️</div>
                                <div>
                                    <h4 className="text-lg font-bold text-yellow-300 uppercase tracking-widest mb-2">Le Jour</h4>
                                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                        Les victimes de la nuit sont annoncées. Les survivants discutent via le Chat en direct pour trouver les coupables. Le mensonge et la manipulation sont la clé de la victoire !
                                    </p>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-red-900/50 p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-red-900/30 flex items-center justify-center text-2xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">⚖️</div>
                                <div>
                                    <h4 className="text-lg font-bold text-red-300 uppercase tracking-widest mb-2">Le Vote</h4>
                                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
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
