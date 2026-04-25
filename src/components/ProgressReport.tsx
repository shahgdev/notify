import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { buildWeaknessProfile, TopicStrength } from "@/hooks/useWeaknessTracker";
import {
    TrendingUp, TrendingDown, Minus, Brain,
    BookOpen, Trophy, AlertTriangle, Play
} from "lucide-react";
import SRSMode from "@/components/SRSMode";

interface ProgressReportProps {
    lectureId: number;
    cards: any[];   // raw flashcard array from lecture
}

const trendIcon = {
    improving: <TrendingUp className="h-3 w-3 text-emerald-500" />,
    declining: <TrendingDown className="h-3 w-3 text-rose-500" />,
    stable: <Minus className="h-3 w-3 text-muted-foreground/40" />,
};

function ScoreBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="flex flex-1 items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 28, delay: 0.1 }}
                />
            </div>
            <span className="text-[10px] font-black text-muted-foreground/60 w-8 text-right">{value}%</span>
        </div>
    );
}

function TopicRow({ t }: { t: TopicStrength }) {
    const scoreColor =
        t.score >= 75 ? "text-emerald-600" : t.score >= 50 ? "text-amber-600" : "text-rose-600";
    const barColor =
        t.score >= 75 ? "bg-emerald-500" : t.score >= 50 ? "bg-amber-500" : "bg-rose-500";

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 rounded-2xl bg-card border border-border/40 px-4 py-3 hover:border-primary/20 transition-all"
        >
            <div className="shrink-0 flex items-center justify-center w-4 h-4">
                {trendIcon[t.trend]}
            </div>
            <p className="text-sm font-bold text-foreground w-[130px] truncate">{t.topic}</p>
            <ScoreBar value={t.score} color={barColor} />
            <span className={`text-lg font-black w-12 text-right ${scoreColor}`}>{t.score}</span>
        </motion.div>
    );
}

export default function ProgressReport({ lectureId, cards }: ProgressReportProps) {
    const [reviewing, setReviewing] = useState(false);
    const profile = useMemo(() => buildWeaknessProfile(lectureId, cards), [lectureId, cards]);

    const noData = profile.totalReviews === 0 && profile.allTopics.length === 0;

    if (reviewing) {
        return <SRSMode cards={cards} lectureId={lectureId} onExit={() => setReviewing(false)} />;
    }

    if (noData) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                    <Brain className="h-10 w-10 text-primary/30" />
                </div>
                <h3 className="text-xl font-black tracking-tight mb-4">No Memory Profile Yet</h3>
                <button
                    onClick={() => setReviewing(true)}
                    className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                    <Play className="h-4 w-4" /> Start Review
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 max-w-3xl mx-auto"
        >
            {/* Header & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 border border-border/40 rounded-[28px] p-6 shadow-sm">
                <div>
                   <h2 className="text-xl font-black tracking-tight mb-1">Memory Profile</h2>
                   <p className="text-sm text-foreground/60 font-medium">Review exactly what you’re forgetting.</p>
                </div>
                <button
                    onClick={() => setReviewing(true)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Play className="h-4 w-4" /> Review Now
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Weak Topics Panel */}
                <div className="rounded-[28px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                    <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border/40">
                        <div className="flex w-6 h-6 items-center justify-center rounded-lg bg-rose-500/10">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Needs Attention
                        </p>
                    </div>
                    {profile.weakTopics.length === 0 ? (
                        <div className="flex flex-col items-center py-10 text-center">
                            <Trophy className="h-8 w-8 text-emerald-500 mb-3" />
                            <p className="text-sm font-black text-emerald-600">Memory is strong!</p>
                            <p className="text-[11px] text-muted-foreground">No weak spots found right now.</p>
                        </div>
                    ) : (
                        <div className="px-4 py-4 space-y-2">
                            {profile.weakTopics.map((t) => <TopicRow key={t.topic} t={t} />)}
                        </div>
                    )}
                </div>

                {/* All Topics Breakdown */}
                {profile.allTopics.length > 0 && (
                    <div className="rounded-[28px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border/40">
                            <div className="flex w-6 h-6 items-center justify-center rounded-lg bg-primary/5">
                                <BookOpen className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Topic Memory Strength</p>
                        </div>
                        <div className="px-4 py-4 space-y-2">
                            {profile.allTopics.map((t) => <TopicRow key={t.topic} t={t} />)}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
