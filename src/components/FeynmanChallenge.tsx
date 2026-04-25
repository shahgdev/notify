import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { feynmanEvaluate } from "@/lib/api";
import {
    Mic, MicOff, CheckCircle2, XCircle, Lightbulb,
    RotateCcw, Loader2, Sparkles, ChevronDown, ChevronUp, Star
} from "lucide-react";

interface EvalResult {
    clarity_score: number;
    completeness_score: number;
    missing_points: string[];
    strong_points: string[];
    feedback: string;
    improved_version: string;
}

interface Props {
    lectureId: number;
    lectureTitle?: string;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
    const r = 32;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 10);
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                    <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" stroke="currentColor" className="text-muted/30" />
                    <motion.circle cx="40" cy="40" r={r} fill="none" strokeWidth="7"
                        strokeLinecap="round" strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                        stroke={color}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black" style={{ color }}>{score}</span>
                </div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</p>
        </div>
    );
}

export default function FeynmanChallenge({ lectureId, lectureTitle }: Props) {
    const [concept, setConcept] = useState(lectureTitle || "");
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EvalResult | null>(null);
    const [error, setError] = useState("");
    const [listening, setListening] = useState(false);
    const [showImproved, setShowImproved] = useState(false);
    const recognitionRef = useRef<any>(null);

    // ── Voice Input ──────────────────────────────────────────────────────────
    const toggleVoice = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported in this browser. Try Chrome.");
            return;
        }
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        let finalText = explanation;
        rec.onresult = (e: any) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalText += t + " ";
                else interim = t;
            }
            setExplanation(finalText + interim);
        };
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        recognitionRef.current = rec;
        rec.start();
        setListening(true);
    }, [listening, explanation]);

    // ── Submit ───────────────────────────────────────────────────────────────
    const submit = async () => {
        if (!explanation.trim()) return;
        setLoading(true);
        setResult(null);
        setError("");
        setShowImproved(false);
        try {
            const data = await feynmanEvaluate(lectureId, explanation.trim(), concept.trim() || undefined as any);
            setResult(data);
        } catch {
            setError("Failed to evaluate. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setExplanation("");
        setShowImproved(false);
        setError("");
    };

    const avgScore = result ? Math.round((result.clarity_score + result.completeness_score) / 2) : 0;
    const gradeColor =
        avgScore >= 8 ? "#10b981" : avgScore >= 6 ? "#f59e0b" : avgScore >= 4 ? "#3b82f6" : "#f43f5e";
    const gradeLabel =
        avgScore >= 8 ? "Excellent!" : avgScore >= 6 ? "Good job!" : avgScore >= 4 ? "Keep going!" : "Keep practising";

    return (
        <div className="space-y-6">



            {/* Concept field */}
            <div className="rounded-[24px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5 focus-within:border-primary/30 transition-all">
                <div className="px-5 pt-4 pb-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1.5">Concept / Topic</p>
                    <input
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g. Newton's Second Law, Photosynthesis..."
                        className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/25 outline-none pb-4"
                    />
                </div>
            </div>

            {/* Explanation textarea + voice */}
            <div className={`rounded-[24px] bg-card border overflow-hidden shadow-xl shadow-black/5 transition-all ${listening ? "border-rose-500/40 ring-2 ring-rose-500/10" : "border-border/40 focus-within:border-primary/30"}`}>
                <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Your Explanation</p>
                    <button
                        onClick={toggleVoice}
                        title={listening ? "Stop recording" : "Speak your explanation"}
                        className={`ml-auto flex h-7 w-7 items-center justify-center rounded-xl transition-all active:scale-90 ${listening ? "bg-rose-500 text-on-surface animate-pulse" : "bg-accent text-muted-foreground hover:text-foreground"}`}
                    >
                        {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                </div>
                <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={listening ? "🎤 Listening — speak now..." : "Explain the concept in your own words, as simply as possible. Pretend you are teaching someone who knows nothing about this topic..."}
                    rows={6}
                    className="w-full bg-transparent px-5 pb-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/20 outline-none resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between px-5 pb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">
                        {explanation.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                    <button
                        onClick={submit}
                        disabled={loading || !explanation.trim()}
                        className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${loading || !explanation.trim()
                                ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                            }`}
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {loading ? "Evaluating..." : "Evaluate"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 px-5 py-3 text-sm font-medium text-rose-600">{error}</div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                        {/* Score rings */}
                        <div className="rounded-[28px] bg-card border border-border/40 p-7 shadow-xl shadow-black/5">
                            <div className="flex justify-around mb-5">
                                <ScoreRing score={result.clarity_score} label="Clarity" color={gradeColor} />
                                <div className="flex flex-col items-center justify-center">
                                    <p className="text-3xl font-black" style={{ color: gradeColor }}>{avgScore}/10</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: gradeColor }}>{gradeLabel}</p>
                                </div>
                                <ScoreRing score={result.completeness_score} label="Completeness" color={gradeColor} />
                            </div>

                            {/* Feedback */}
                            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium text-foreground/80 leading-relaxed">{result.feedback}</p>
                                </div>
                            </div>
                        </div>

                        {/* Strong points */}
                        {result.strong_points.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="rounded-[24px] bg-emerald-500/5 border border-emerald-500/20 p-5 shadow-xl shadow-black/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">✓ What You Got Right</p>
                                <div className="space-y-2">
                                    {result.strong_points.map((pt, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <p className="text-sm font-medium text-foreground/80">{pt}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Missing points */}
                        {result.missing_points.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="rounded-[24px] bg-amber-500/5 border border-amber-500/20 p-5 shadow-xl shadow-black/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3">⚠ Missing Key Points</p>
                                <div className="space-y-2">
                                    {result.missing_points.map((pt, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                            <p className="text-sm font-medium text-foreground/80">{pt}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Improved version (collapsible) */}
                        {result.improved_version && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="rounded-[24px] bg-violet-500/5 border border-violet-500/20 overflow-hidden shadow-xl shadow-black/5">
                                <button
                                    onClick={() => setShowImproved((v) => !v)}
                                    className="flex w-full items-center justify-between px-5 py-4 hover:bg-violet-500/5 transition-colors"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">✨ Improved Version</p>
                                    {showImproved ? <ChevronUp className="h-4 w-4 text-violet-500" /> : <ChevronDown className="h-4 w-4 text-violet-500" />}
                                </button>
                                <AnimatePresence>
                                    {showImproved && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="px-5 pb-5 overflow-hidden">
                                            <p className="text-sm font-medium text-foreground/80 leading-relaxed italic border-l-2 border-violet-500/40 pl-4">
                                                "{result.improved_version}"
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Reset */}
                        <button onClick={reset}
                            className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all active:scale-95">
                            <RotateCcw className="h-3.5 w-3.5" /> Try Again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
