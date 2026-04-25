import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Link2, ChevronRight, ChevronLeft, LayoutGrid, List, Layers } from "lucide-react";

interface Chunk {
    title: string;
    content: string;
    difficulty: "easy" | "medium" | "hard";
    related?: string[];
}

const diffConfig = {
    easy: { label: "Easy", color: "text-emerald-600", bg: "bg-emerald-500/8", border: "border-emerald-500/20", dot: "bg-emerald-500" },
    medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-500/8", border: "border-amber-500/20", dot: "bg-amber-500" },
    hard: { label: "Hard", color: "text-rose-600", bg: "bg-rose-500/8", border: "border-rose-500/20", dot: "bg-rose-500" },
};

type ViewMode = "grid" | "focus" | "list";

export default function LearningChunks({ chunks }: { chunks: Chunk[] }) {
    const [filter, setFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
    const [view, setView] = useState<ViewMode>("grid");
    const [focusIdx, setFocusIdx] = useState(0);
    const [done, setDone] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState<number | null>(null);

    const filtered = useMemo(
        () => chunks.filter((c) => filter === "all" || c.difficulty === filter),
        [chunks, filter]
    );

    const focusChunk = filtered[focusIdx];
    const progressPct = filtered.length > 0 ? Math.round((done.size / filtered.length) * 100) : 0;

    if (!chunks || chunks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-24 w-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6">
                    <Layers className="h-10 w-10 text-primary/30" />
                </div>
                <h3 className="font-display text-xl font-black tracking-tight mb-2">No Learning Chunks Yet</h3>
                <p className="font-display text-sm text-muted-foreground font-medium max-w-[260px] leading-relaxed">
                    Learning chunks are generated during lecture processing. Re-record a lecture to generate them.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Difficulty filter */}
                <div className="flex gap-1.5 rounded-2xl bg-muted/30 border border-border/40 p-1">
                    {(["all", "easy", "medium", "hard"] as const).map((d) => (
                        <button key={d} onClick={() => { setFilter(d); setFocusIdx(0); }}
                            className={`rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${filter === d
                                    ? d === "all" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : d === "easy" ? "bg-emerald-500 text-on-surface shadow-sm"
                                            : d === "medium" ? "bg-amber-500 text-on-surface shadow-sm"
                                                : "bg-rose-500 text-on-surface shadow-sm"
                                    : "text-muted-foreground/50 hover:bg-accent"
                                }`}
                        >
                            {d === "all" ? "All" : d}
                        </button>
                    ))}
                </div>

                {/* View toggle */}
                <div className="ml-auto flex gap-1.5 rounded-2xl bg-muted/30 border border-border/40 p-1">
                    {([
                        { id: "grid", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                        { id: "list", icon: <List className="h-3.5 w-3.5" /> },
                        { id: "focus", icon: <BookOpen className="h-3.5 w-3.5" /> },
                    ] as const).map((v) => (
                        <button key={v.id} onClick={() => setView(v.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${view === v.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground/50 hover:bg-accent"}`}>
                            {v.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary"
                        animate={{ width: `${progressPct}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{done.size}/{filtered.length} done</span>
            </div>

            {/* ── FOCUS MODE ── */}
            {view === "focus" && focusChunk && (
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div key={focusIdx}
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.2 }}
                            className={`rounded-[28px] border p-8 shadow-2xl shadow-black/8 ${done.has(focusIdx) ? "bg-primary/3 border-primary/15" : "bg-card border-border/40"}`}
                        >
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                {(() => {
                                    const dc = diffConfig[focusChunk.difficulty || "medium"]; return (
                                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${dc.bg} ${dc.color} ${dc.border}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${dc.dot}`} />{dc.label}
                                        </span>
                                    );
                                })()}
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 ml-auto">
                                    {focusIdx + 1} / {filtered.length}
                                </span>
                            </div>
                            {/* Title */}
                            <h3 className="text-xl font-black tracking-tight mb-4">{focusChunk.title}</h3>
                            {/* Content */}
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-line">{focusChunk.content}</p>
                            {/* Related */}
                            {focusChunk.related && focusChunk.related.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Link2 className="h-3.5 w-3.5 text-primary/50 shrink-0 mt-0.5" />
                                    {focusChunk.related.map((r) => (
                                        <span key={r} className="text-[10px] font-black text-primary/60 bg-primary/5 border border-primary/10 rounded-xl px-2.5 py-1">{r}</span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Nav + Mark done */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setFocusIdx(i => Math.max(0, i - 1)); }}
                            disabled={focusIdx === 0}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent border border-border/40 disabled:opacity-25 hover:bg-accent/80 transition-all active:scale-90">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => {
                                setDone(s => { const n = new Set(s); done.has(focusIdx) ? n.delete(focusIdx) : n.add(focusIdx); return n; });
                                if (focusIdx < filtered.length - 1) setFocusIdx(i => i + 1);
                            }}
                            className={`flex-1 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${done.has(focusIdx) ? "bg-muted text-muted-foreground border border-border/40" : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                                }`}
                        >
                            {done.has(focusIdx) ? "✓ Done — Mark Undone" : "Got it — Mark Done"}
                        </button>
                        <button onClick={() => { setFocusIdx(i => Math.min(filtered.length - 1, i + 1)); }}
                            disabled={focusIdx === filtered.length - 1}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent border border-border/40 disabled:opacity-25 hover:bg-accent/80 transition-all active:scale-90">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── GRID MODE ── */}
            {view === "grid" && (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    initial="hidden" animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
                    {filtered.map((chunk, i) => {
                        const dc = diffConfig[chunk.difficulty || "medium"];
                        return (
                            <motion.div key={i}
                                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                className={`group relative rounded-[24px] border p-5 cursor-pointer transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:shadow-black/5 ${done.has(i) ? "bg-primary/3 border-primary/15 opacity-70" : "bg-card border-border/40"
                                    }`}
                                onClick={() => setDone(s => { const n = new Set(s); done.has(i) ? n.delete(i) : n.add(i); return n; })}
                            >
                                {done.has(i) && (
                                    <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-black">✓</div>
                                )}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${dc.bg} ${dc.color} ${dc.border}`}>
                                        <span className={`h-1 w-1 rounded-full ${dc.dot}`} />{dc.label}
                                    </span>
                                </div>
                                <h4 className="text-sm font-black tracking-tight mb-2">{chunk.title}</h4>
                                <p className="text-[11px] font-medium text-foreground/60 leading-relaxed line-clamp-3">{chunk.content}</p>
                                {chunk.related && chunk.related.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {chunk.related.map((r) => (
                                            <span key={r} className="text-[8px] font-black text-primary/50 bg-primary/5 rounded-lg px-1.5 py-0.5">{r}</span>
                                        ))}
                                    </div>
                                )}
                                <p className="mt-3 text-[8px] font-black uppercase tracking-widest text-muted-foreground/25">Tap to mark done</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── LIST MODE ── */}
            {view === "list" && (
                <div className="space-y-2.5">
                    {filtered.map((chunk, i) => {
                        const dc = diffConfig[chunk.difficulty || "medium"];
                        const open = expanded === i;
                        return (
                            <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${done.has(i) ? "bg-primary/3 border-primary/15" : "bg-card border-border/40"}`}>
                                <button className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-accent/30 transition-colors"
                                    onClick={() => setExpanded(open ? null : i)}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDone(s => { const n = new Set(s); done.has(i) ? n.delete(i) : n.add(i); return n; }); }}
                                        className={`flex h-5 w-5 shrink-0 rounded-full border-2 items-center justify-center transition-all ${done.has(i) ? "bg-primary border-primary text-[8px] text-on-surface font-black" : "border-border/50 hover:border-primary/40"}`}
                                    >{done.has(i) && "✓"}</button>
                                    <span className={`inline-flex shrink-0 rounded-lg px-1.5 py-0.5 text-[8px] font-black uppercase border ${dc.bg} ${dc.color} ${dc.border}`}>{dc.label}</span>
                                    <p className="flex-1 text-sm font-bold truncate">{chunk.title}</p>
                                    {open ? <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground/40" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
                                </button>
                                <AnimatePresence>
                                    {open && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="px-5 pb-4 space-y-2">
                                                <p className="text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-line">{chunk.content}</p>
                                                {chunk.related && chunk.related.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        <Link2 className="h-3 w-3 text-primary/40 shrink-0 mt-0.5" />
                                                        {chunk.related.map((r) => (
                                                            <span key={r} className="text-[9px] font-black text-primary/60 bg-primary/5 border border-primary/10 rounded-lg px-2 py-0.5">{r}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
