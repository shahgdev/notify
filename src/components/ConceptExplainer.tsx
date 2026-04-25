import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { explainConcept } from "@/lib/api";
import {
    Sparkles, Lightbulb, Zap, BookOpen, Loader2,
    ChevronDown, RotateCcw, ArrowRight
} from "lucide-react";

type Level = "simple" | "medium" | "detailed";

interface ExplainResult {
    explanation: string;
    analogy: string;
    key_insight: string;
    level: string;
}

const levels: { id: Level; label: string; desc: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
    { id: "simple", label: "Simple", desc: "Like I'm 10", icon: <Zap className="h-4 w-4" />, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
    { id: "medium", label: "Medium", desc: "Student", icon: <BookOpen className="h-4 w-4" />, color: "text-sky-600", bg: "bg-sky-500/10", border: "border-sky-500/25" },
    { id: "detailed", label: "Detailed", desc: "Deep dive", icon: <Sparkles className="h-4 w-4" />, color: "text-violet-600", bg: "bg-violet-500/10", border: "border-violet-500/25" },
];

const EXAMPLE_CONCEPTS = [
    "Quantum entanglement",
    "Gradient descent",
    "The Krebs cycle",
    "Opportunity cost",
    "Entropy",
    "P vs NP problem",
];

interface Props { lectureId: number }

export default function ConceptExplainer({ lectureId }: Props) {
    const [input, setInput] = useState("");
    const [level, setLevel] = useState<Level>("medium");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ExplainResult | null>(null);
    const [error, setError] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const explain = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setLoading(true);
        setResult(null);
        setError("");
        try {
            const data = await explainConcept(lectureId, trimmed, level);
            setResult(data);
        } catch (e: any) {
            setError("Failed to get explanation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const useExample = (ex: string) => {
        setInput(ex);
        setResult(null);
        textareaRef.current?.focus();
    };

    const activeLvl = levels.find((l) => l.id === level)!;

    return (
        <div className="space-y-6">



            {/* Level Selector */}
            <div className="flex gap-2">
                {levels.map((l) => (
                    <button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${level === l.id
                                ? `${l.bg} ${l.border} ${l.color} shadow-lg`
                                : "bg-card border-border/40 text-muted-foreground/50 hover:border-primary/20"
                            }`}
                    >
                        <span className={level === l.id ? l.color : ""}>{l.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{l.label}</span>
                        <span className="text-[9px] font-medium opacity-60">{l.desc}</span>
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="rounded-[28px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5 focus-within:border-primary/30 transition-all duration-300">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) explain(); }}
                    placeholder="Paste a concept, sentence, or paragraph you want simplified..."
                    rows={4}
                    className="w-full bg-transparent px-6 pt-5 pb-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/30 outline-none resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between px-5 pb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                        Ctrl+Enter to submit
                    </p>
                    <button
                        onClick={explain}
                        disabled={loading || !input.trim()}
                        className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${loading || !input.trim()
                                ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                            }`}
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                        {loading ? "Thinking..." : "Explain"}
                    </button>
                </div>
            </div>

            {/* Example concepts */}
            {!result && !loading && (
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">Try an example</p>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_CONCEPTS.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => useExample(ex)}
                                className="flex items-center gap-1.5 rounded-xl bg-accent/40 border border-border/30 px-3 py-1.5 text-[10px] font-black text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-accent transition-all"
                            >
                                {ex} <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 px-5 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Level badge */}
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border ${activeLvl.bg} ${activeLvl.border} ${activeLvl.color}`}>
                                {activeLvl.icon} {activeLvl.label} explanation
                            </span>
                            <button
                                onClick={() => { setResult(null); setInput(""); }}
                                className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
                            >
                                <RotateCcw className="h-3 w-3" /> New
                            </button>
                        </div>

                        {/* Explanation */}
                        <div className="rounded-[24px] bg-card border border-border/40 p-6 shadow-xl shadow-black/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-3">Explanation</p>
                            <p className="text-base font-semibold text-foreground/90 leading-relaxed">{result.explanation}</p>
                        </div>

                        {/* Analogy */}
                        {result.analogy && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="rounded-[24px] bg-amber-500/5 border border-amber-500/20 p-6 shadow-xl shadow-black/5"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Real-world Analogy</p>
                                </div>
                                <p className="text-sm font-semibold text-foreground/80 leading-relaxed italic">"{result.analogy}"</p>
                            </motion.div>
                        )}

                        {/* Key insight */}
                        {result.key_insight && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="rounded-[24px] bg-primary/5 border border-primary/15 p-5 flex items-start gap-4 shadow-xl shadow-black/5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                    <Zap className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-1">Key Insight</p>
                                    <p className="text-sm font-bold text-foreground leading-snug">{result.key_insight}</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
