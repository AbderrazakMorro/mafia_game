'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, RefreshCw } from 'lucide-react';

const AVATAR_STYLES = ['avataaars', 'bottts', 'lorelei', 'notionists', 'personas'];

const STYLE_LABELS = {
    avataaars: 'Visages',
    bottts: 'Robots',
    lorelei: 'Élégant',
    notionists: 'Croquis',
    personas: 'Silhouettes',
};

function generateSeeds(count = 12) {
    return Array.from({ length: count }, (_, i) =>
        `mafia_${Math.random().toString(36).substring(2, 10)}_${i}`
    );
}

function getAvatarUrl(style, seed) {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=1a1a2e&scale=80`;
}

export default function AvatarPicker({ currentAvatar, onSelect }) {
    const [selectedStyle, setSelectedStyle] = useState('avataaars');
    const [seeds, setSeeds] = useState(() => generateSeeds());
    const [selected, setSelected] = useState(currentAvatar || '');

    const avatars = useMemo(() => {
        return seeds.map(seed => ({
            seed,
            url: getAvatarUrl(selectedStyle, seed),
        }));
    }, [selectedStyle, seeds]);

    const regenerate = () => {
        setSeeds(generateSeeds());
    };

    const handleSelect = (url) => {
        setSelected(url);
        onSelect(url);
    };

    return (
        <div className="space-y-4">
            {/* Style Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {AVATAR_STYLES.map(style => (
                    <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedStyle === style
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                    >
                        {STYLE_LABELS[style] || style}
                    </button>
                ))}
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-4 gap-3">
                {avatars.map(({ seed, url }) => {
                    const isSelected = selected === url;
                    return (
                        <motion.button
                            key={seed}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelect(url)}
                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${isSelected
                                    ? 'border-red-500 shadow-lg shadow-red-900/40'
                                    : 'border-zinc-800 hover:border-zinc-600'
                                }`}
                        >
                            <img
                                src={url}
                                alt={`Avatar ${seed}`}
                                className="w-full h-full object-cover bg-zinc-900"
                                loading="lazy"
                            />
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute inset-0 bg-red-600/30 flex items-center justify-center"
                                >
                                    <Check className="w-6 h-6 text-white drop-shadow-lg" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Regenerate */}
            <button
                onClick={regenerate}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white text-sm font-medium transition-all"
            >
                <RefreshCw className="w-4 h-4" />
                Générer d&apos;autres avatars
            </button>
        </div>
    );
}

export { getAvatarUrl };
