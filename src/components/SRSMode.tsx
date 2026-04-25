import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSRS, SRSRating } from "@/hooks/useSRS";
import {
    Brain, CheckCircle2, Zap, Clock, BarChart3,
    RotateCcw, ChevronRight, Trophy, Flame
} from "lucide-react";

interface SRSModeProps {
    cards: any[];
    lectureId: number;
    onExit: () => void;
}

const RATINGS: { label: string; key: string; value: SRSRating; color: string; bg: string; border: string; icon: React.ReactNode }[] = [
    { label: "Again", key: "again", value: 0, color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/25", icon: <RotateCcw className="h-3.5 w-3.5" /> },
    { label: "Hard", key: "hard", value: 3, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/25", icon: <Clock className="h-3.5 w-3.5" /> },
    { label: "Good", key: "good", value: 4, color: "text-sky-600", bg: "bg-sky-500/10", border: "border-sky-500/25", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { label: "Easy", key: "easy", value: 5, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25", icon: <Zap className="h-3.5 w-3.5" /> },
];

export default function SRSMode({ cards, lectureId, onExit }: SRSModeProps) {
    const { queue, rate, resetAll, stats } = useSRS(cards, lectureId);
    const [queuePos, setQueuePos] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [sessionDone, setSessionDone] = useState(0);

    const currentEntry = queue[queuePos];

    const handleRate = (val: SRSRating) => {
        if (!currentEntry) return;
        rate(currentEntry._idx, val);
        setSessionDone((n) => n + 1);
        setFlipped(false);
        if (queuePos < queue.length - 1) {
            setQueuePos((p) => p + 1);
        } else {
            setQueuePos(queue.length); // finished
        }
    };

    const finished = queuePos >= queue.length;

    // ─── Stats Panel only (no due cards) ───────────────────────────────────────
    if (queue.length === 0 && !finished) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-emerald-500/10 border border-emerald-500/20">
                    <Trophy className="h-12 w-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">All caught up!</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8 max-w-[260px]">
                    No cards are due today. Come back tomorrow for your next session.
                </p>
                <StatsGrid stats={stats} />
                <button
                    onClick={onExit}
                    className="mt-8 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
                >
                    Browse All Cards
                </button>
            </div>
        );
    }

    // ─── Finished Session ─────────────────────────────────────────────────────
    if (finished) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10 border border-primary/20">
                    <Flame className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-1">Session Complete!</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8">
                    You reviewed <strong>{sessionDone}</strong> card{sessionDone !== 1 ? "s" : ""} today.
                </p>
                <StatsGrid stats={stats} />
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={() => { setQueuePos(0); setFlipped(false); setSessionDone(0); }}
                        className="rounded-2xl border border-border/50 bg-card px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
                    >
                        Study Again
                    </button>
                    <button
                        onClick={onExit}
                        className="rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
                    >
                        Browse Cards
                    </button>
                </div>
            </motion.div>
        );
    }

    // ─── Active Study Session ─────────────────────────────────────────────────
    const remaining = queue.length - queuePos;
    const progressPct = queue.length > 0 ? (queuePos / queue.length) * 100 : 0;

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="mb-5 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                        <Brain className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Targeted Review</p>
                        <p className="text-sm font-black leading-none">{remaining} card{remaining !== 1 ? "s" : ""} left</p>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-primary"
                            animate={{ width: `${progressPct}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>
                <button
                    onClick={onExit}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                    Exit
                </button>
            </div>

            {/* Pill badges */}
            <div className="mb-4 flex gap-2 flex-wrap">
                {currentEntry.difficulty && (
                    <span className={`inline-flex items-center rounded-xl px-2 py-1 text-[9px] font-black uppercase tracking-widest border
            ${currentEntry.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            currentEntry.difficulty === "hard" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                        {currentEntry.difficulty}
                    </span>
                )}
                {currentEntry.topic && (
                    <span className="inline-flex items-center rounded-xl px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-accent/60 text-muted-foreground border border-border/30">
                        {currentEntry.topic}
                    </span>
                )}

            </div>

            {/* Flashcard */}
            <div
                className="relative mb-5 w-full cursor-pointer"
                style={{ perspective: "1200px" }}
                onClick={() => setFlipped(!flipped)}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentEntry._idx}-${flipped}`}
                        initial={{ rotateY: 90, opacity: 0, scale: 0.97 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateY: -90, opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className={`flex min-h-[230px] flex-col rounded-[28px] border p-7 shadow-2xl shadow-black/8 transition-colors duration-300 ${flipped ? "bg-primary/5 border-primary/20" : "bg-card border-border/40"
                            }`}
                    >
                        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right">
                            {flipped ? "Answer" : "Question"}
                        </p>
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-center text-base md:text-lg font-semibold leading-relaxed text-foreground/90">
                                {flipped ? currentEntry.answer : currentEntry.question}
                            </p>
                        </div>
                        <p className="mt-4 text-center text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest">
                            {flipped ? "How well did you know this?" : "Tap to reveal answer"}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Rating buttons — only show after flip */}
            <AnimatePresence>
                {flipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="grid grid-cols-4 gap-2"
                    >
                        {RATINGS.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => handleRate(r.value)}
                                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-200 hover:scale-105 active:scale-95 ${r.bg} ${r.border}`}
                            >
                                <span className={r.color}>{r.icon}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${r.color}`}>
                                    {r.label}
                                </span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {!flipped && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setFlipped(true)}
                        className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                        Show Answer <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

function StatsGrid({ stats }: { stats: { total: number; due: number; mastered: number; learning: number; new: number } }) {
    return (
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {[
                { label: "New", val: stats.new, color: "text-sky-600", bg: "bg-sky-500/10" },
                { label: "Learning", val: stats.learning, color: "text-amber-600", bg: "bg-amber-500/10" },
                { label: "Mastered", val: stats.mastered, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            ].map((s) => (
                <div key={s.label} className={`flex flex-col items-center rounded-2xl ${s.bg} py-4 px-3 border border-transparent`}>
                    <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">{s.label}</span>
                </div>
            ))}
        </div>
    );
}
