import React from 'react';
import { motion } from 'framer-motion';

interface CanvasStickerPanelProps {
    onSelectSticker: (sticker: string) => void;
}

const STICKERS = [
    { emoji: '💡', label: 'Idea' },
    { emoji: '⭐', label: 'Important' },
    { emoji: '🔥', label: 'Hot Topic' },
    { emoji: '⚡', label: 'Quick' },
    { emoji: '✅', label: 'Done' },
    { emoji: '❌', label: 'Wrong' },
    { emoji: '❓', label: 'Question' },
    { emoji: '📌', label: 'Pin' },
    { emoji: '💯', label: 'Perfect' },
    { emoji: '🎯', label: 'Target' },
    { emoji: '🧠', label: 'Remember' },
    { emoji: '📚', label: 'Study' }
];

export default function CanvasStickerPanel({ onSelectSticker }: CanvasStickerPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-[#2c2b28] w-56 border border-outline-variant/20 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 relative before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-r-[#2c2b28]"
        >
            <div className="text-on-surface/50 text-xs font-bold uppercase tracking-wider mb-1 px-1">Study Stickers</div>
            <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((s, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectSticker(s.emoji);
                        }}
                        className="h-10 text-2xl flex items-center justify-center rounded-xl bg-surface-container-lowest hover:bg-surface-container transition-all hover:scale-110 active:scale-95 group/sticker relative"
                        title={s.label}
                    >
                        {s.emoji}
                    </button>
                ))}
            </div>
            <div className="text-on-surface/30 text-[10px] mt-2 italic text-center px-1">
                Click a sticker, then click anywhere on the canvas to stamp it.
            </div>
        </motion.div>
    );
}
