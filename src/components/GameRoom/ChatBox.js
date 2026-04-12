'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Home, Target, Mic, Skull } from 'lucide-react'
import { getSupabase } from '../../lib/supabase'

const ChatBox = ({ roomId, players, currentPlayerId, phase }) => {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('village') // 'village' or 'mafia'
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }

    useEffect(() => {
        if (isOpen) scrollToBottom()
    }, [messages, isOpen])

    useEffect(() => {
        if (!roomId) return

        const fetchMessages = async () => {
            const { data } = await getSupabase()
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true })
                .limit(50)
            if (data) {
                setMessages(data)
                scrollToBottom()
            }
        }
        fetchMessages()

        const channel = getSupabase().channel(`chat_${roomId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
                setMessages(prev => [...prev, payload.new])
            })
            .subscribe()

        return () => getSupabase().removeChannel(channel)
    }, [roomId])

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentPlayerId) return
        const content = newMessage.trim()
        setNewMessage('')
        await getSupabase().from('chat_messages').insert([{
            room_id: roomId,
            player_id: currentPlayerId,
            content,
            is_mafia_chat: activeTab === 'mafia'
        }])
    }

    const currentPlayer = players.find(p => p.id === currentPlayerId)
    // Everybody can see chat, but only alive players (or players in lobby/game over) can send
    const canSend = currentPlayer && (currentPlayer.is_alive || phase === 'lobby' || phase === 'game_over')

    // Mafia logic
    const aliveMafias = players.filter(p => p.role === 'mafia' && p.is_alive).length
    const isNight = phase.startsWith('night')
    const isAliveMafia = currentPlayer && currentPlayer.role === 'mafia' && currentPlayer.is_alive
    const canSeeMafiaChat = isNight && isAliveMafia && aliveMafias >= 2

    useEffect(() => {
        if (!canSeeMafiaChat && activeTab === 'mafia') {
            setActiveTab('village')
        }
    }, [canSeeMafiaChat, activeTab])

    const visibleMessages = messages.filter(msg => activeTab === 'mafia' ? msg.is_mafia_chat : !msg.is_mafia_chat)

    return (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 flex flex-col items-end pointer-events-none font-sans">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 250, damping: 25 }}
                        className="glass-panel bg-surface-container/90 backdrop-blur-3xl border border-outline-variant/10 rounded-3xl shadow-2xl w-[calc(100vw-3rem)] sm:w-[380px] h-[50vh] sm:h-[60vh] min-h-[350px] sm:min-h-[400px] max-h-[600px] flex flex-col overflow-hidden pointer-events-auto origin-bottom-right absolute bottom-20 sm:bottom-24 right-0 mb-2"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-surface/20 to-transparent pointer-events-none" />

                        <div className="bg-surface-container-highest/50 backdrop-blur-md px-4 py-3 border-b border-outline-variant/10 flex flex-col gap-2 shrink-0 relative z-10">
                            <div className="flex justify-between items-center w-full">
                                <h3 className="text-on-surface font-bold font-display text-xs sm:text-sm flex items-center gap-2 uppercase tracking-widest">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    Discussion <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 inline" />
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-1.5 rounded-full transition-all text-sm">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {canSeeMafiaChat && (
                                <div className="flex bg-surface-container-low rounded-lg p-1 gap-1 mt-1">
                                    <button
                                        onClick={() => setActiveTab('village')}
                                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'village' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                    >
                                        <Home className="w-3.5 h-3.5" /> Village
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('mafia')}
                                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'mafia' ? 'bg-secondary-container/40 text-secondary' : 'text-secondary/40 hover:text-secondary'}`}
                                    >
                                        <Target className="w-3.5 h-3.5" /> Mafia
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar flex flex-col relative z-10 w-full">
                            {visibleMessages.length === 0 ? (
                                <p className="text-on-surface-variant/50 italic text-sm flex flex-col items-center justify-center gap-2 h-full font-medium">
                                    <Mic className="w-8 h-8 opacity-50" />
                                    The room is quiet... Say something!
                                </p>
                            ) : (
                                visibleMessages.map(msg => {
                                    const isMe = msg.player_id === currentPlayerId
                                    const author = players.find(p => p.id === msg.player_id)
                                    const authorName = author ? author.username : 'Unknown'
                                    
                                    const CHAT_NAME_COLORS = [
                                        'text-primary', 'text-tertiary', 'text-secondary',
                                        'text-emerald-400', 'text-pink-400', 'text-sky-400'
                                    ]
                                    const hashCode = (str) => { let h = 0; for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0 } return Math.abs(h) }
                                    const nameColor = CHAT_NAME_COLORS[hashCode(msg.player_id || '') % CHAT_NAME_COLORS.length]

                                    const mafiaStyles = isMe
                                        ? 'bg-secondary text-on-secondary border border-secondary-container/50 rounded-br-sm shadow-[0_4px_15px_rgba(255,180,172,0.1)]'
                                        : 'bg-secondary-container/30 text-on-surface border border-secondary-container/20 rounded-bl-sm backdrop-blur-md'

                                    const villageStyles = isMe
                                        ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-br-sm border border-outline-variant/20 shadow-[0_4px_15px_rgba(211,187,255,0.1)]'
                                        : 'bg-surface-container-highest text-on-surface border border-outline-variant/10 rounded-bl-sm backdrop-blur-md'

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 px-1 flex items-center gap-1 ${isMe ? 'text-on-surface-variant/60' : nameColor}`}>
                                                {authorName} {!author?.is_alive && <Skull className="w-3 h-3 text-on-surface-variant" />}
                                            </span>
                                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium max-w-[85%] break-words shadow-sm ${activeTab === 'mafia' ? mafiaStyles : villageStyles}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {canSend ? (
                            <form onSubmit={sendMessage} className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex gap-2 shrink-0 relative z-10">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={activeTab === 'mafia' ? "Whisper..." : "Say something..."}
                                    maxLength={120}
                                    className="flex-1 bg-surface-container-lowest/60 rounded-xl px-4 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                <button type="submit" disabled={!newMessage.trim()} className={`${activeTab === 'mafia' ? 'bg-secondary hover:bg-secondary/90 text-on-secondary shadow-md' : 'bg-primary hover:bg-primary/90 text-on-primary shadow-md'} disabled:opacity-50 disabled:grayscale px-4 rounded-xl transition-all flex items-center justify-center font-bold text-lg`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 text-center shrink-0 relative z-10 flex items-center justify-center gap-2">
                                <Skull className="w-4 h-4 text-secondary/80" />
                                <p className="text-secondary/80 italic text-xs font-bold uppercase tracking-widest">The dead don't speak...</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Toggle Button */}
            <motion.button
                drag
                dragMomentum={false}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="glass-panel bg-surface-container-highest/80 backdrop-blur-xl border border-outline-variant/10 hover:bg-surface-container-lowest text-on-surface p-4 w-14 h-14 sm:w-16 sm:h-16 rounded-[2rem] shadow-xl relative pointer-events-auto flex items-center justify-center group transition-colors cursor-move"
            >
                <span className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-primary-container/10 rounded-[2rem] blur-md opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 text-primary" />
                {!isOpen && messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-secondary text-on-secondary font-black text-[10px] w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shadow-md animate-bounce z-20">
                        !
                    </span>
                )}
            </motion.button>
        </div>
    )
}

export default ChatBox
