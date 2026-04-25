import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, RotateCcw, Brain, ChevronRight,
  LightbulbIcon, HelpCircle, AlignLeft, BarChart3, Zap
} from "lucide-react";
import { loadPerf, recordSession, sortAdaptive, QuizPerformance } from "@/hooks/useQuizPerformance";

interface Question {
  type?: "mcq" | "short" | "conceptual";
  question: string;
  options?: string[];
  correct_index?: number;
  sample_answer?: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
}

const diffConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  easy: { label: "Easy", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  hard: { label: "Hard", color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  mcq: { label: "MCQ", icon: <HelpCircle className="h-3 w-3" /> },
  short: { label: "Short Ans.", icon: <AlignLeft className="h-3 w-3" /> },
  conceptual: { label: "Conceptual", icon: <Brain className="h-3 w-3" /> },
};

interface SessionResult { topic: string; correct: boolean; }

export default function QuizMode({ questions, lectureId = 0 }: { questions: Question[]; lectureId?: number }) {
  const perf = useMemo(() => loadPerf(lectureId), [lectureId]);
  const adaptedQuestions = useMemo(() => sortAdaptive(questions, perf), [questions, perf]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [selfScore, setSelfScore] = useState<boolean | null>(null); // for short/conceptual
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [finalPerf, setFinalPerf] = useState<QuizPerformance | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
          <Brain className="h-9 w-9 text-primary/40" />
        </div>
        <p className="text-lg font-black mb-2">No Quiz Available</p>
        <p className="text-sm text-muted-foreground">Quiz will be generated when a lecture is processed.</p>
      </div>
    );
  }

  const q = adaptedQuestions[current];
  const total = adaptedQuestions.length;
  const isMCQ = !q.type || q.type === "mcq";
  const isOpen = q.type === "short" || q.type === "conceptual";
  const dc = diffConfig[q.difficulty || "medium"];
  const tc = typeConfig[q.type || "mcq"];
  const hasAnswered = isMCQ ? selected !== null : selfScore !== null;

  const advance = () => {
    setShowExplanation(false);
    setSelected(null);
    setSelfScore(null);
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      const fp = recordSession(lectureId, results);
      setFinalPerf(fp);
      setFinished(true);
    }
  };

  const handleMCQ = (idx: number) => {
    if (selected !== null) return;
    const correct = idx === q.correct_index;
    setSelected(idx);
    setResults((r) => [...r, { topic: q.topic || "General", correct }]);
    setShowExplanation(true);
  };

  const handleSelf = (correct: boolean) => {
    setSelfScore(correct);
    setResults((r) => [...r, { topic: q.topic || "General", correct }]);
    setShowExplanation(true);
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setSelfScore(null);
    setShowExplanation(false); setResults([]); setFinished(false); setFinalPerf(null);
  };

  // ─── Finished Screen ─────────────────────────────────────────────────────
  if (finished && finalPerf) {
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / total) * 100);
    const grade = pct >= 85 ? "Excellent" : pct >= 60 ? "Good" : "Keep Practising";
    const gradeColor = pct >= 85 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-rose-500";

    // Weak topics
    const weakTopics = Object.entries(finalPerf.topicPerf)
      .filter(([, v]) => v.lastScore < 60)
      .map(([k]) => k);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-8 text-center space-y-6">
        {/* Score ring */}
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
          <span className={`text-3xl font-black ${gradeColor}`}>{pct}%</span>
        </div>
        <div>
          <h3 className={`text-2xl font-black tracking-tight ${gradeColor}`}>{grade}!</h3>
          <p className="text-sm text-muted-foreground mt-1">{correct} / {total} correct</p>
        </div>

        {/* Adaptive feedback */}
        <div className="w-full max-w-xs rounded-2xl bg-card border border-border/40 p-5 text-left space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Adaptive Status</p>
          </div>
          <div className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border
            ${finalPerf.difficultyAdjust === "hard" ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
              : finalPerf.difficultyAdjust === "easy" ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
            Next quiz: {finalPerf.difficultyAdjust === "hard" ? "⬆ Harder" : finalPerf.difficultyAdjust === "easy" ? "⬇ Easier" : "Same Level"}
          </div>

          {weakTopics.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Focus on:</p>
              <div className="flex flex-wrap gap-1.5">
                {weakTopics.map((t) => (
                  <span key={t} className="rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Per-question results */}
        <div className="w-full space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border text-sm font-semibold text-left
              ${r.correct ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700" : "bg-rose-500/5 border-rose-500/20 text-rose-600"}`}>
              {r.correct ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              <span className="truncate text-[11px]">{adaptedQuestions[i]?.question}</span>
            </div>
          ))}
        </div>

        <button onClick={restart}
          className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
          <RotateCcw className="h-4 w-4" /> Retry Practice
        </button>
      </motion.div>
    );
  }

  // ─── Active Question ─────────────────────────────────────────────────────
  const progressPct = (current / total) * 100;

  return (
    <div className="flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{current + 1}/{total}</span>
        <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary"
            animate={{ width: `${progressPct}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
        </div>
        <span className="text-[10px] font-black text-primary">{results.filter(r => r.correct).length} ✓</span>
      </div>

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${dc.bg} ${dc.color} ${dc.border}`}>
          {dc.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border border-primary/15">
          {tc.icon} {tc.label}
        </span>
        {q.topic && (
          <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-accent/60 text-muted-foreground border border-border/30">
            {q.topic}
          </span>
        )}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
          className="rounded-[28px] bg-card border border-border/40 p-7 shadow-xl shadow-black/5">
          <p className="text-base md:text-lg font-bold text-foreground leading-relaxed mb-6">{q.question}</p>

          {/* MCQ options */}
          {isMCQ && q.options && (
            <div className="space-y-2.5">
              {q.options.map((opt, idx) => {
                let style = "bg-card border-border/40 hover:border-primary/30 hover:bg-accent/30";
                if (selected !== null) {
                  if (idx === q.correct_index) style = "bg-emerald-500/10 border-emerald-500/40 text-emerald-700";
                  else if (idx === selected && idx !== q.correct_index) style = "bg-rose-500/10 border-rose-500/40 text-rose-600";
                  else style = "bg-card border-border/20 opacity-50";
                }
                return (
                  <button key={idx} onClick={() => handleMCQ(idx)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 text-left text-sm font-semibold transition-all duration-200 active:scale-[0.99] ${style}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted text-[11px] font-black">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {selected !== null && idx === q.correct_index && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
                    {selected !== null && idx === selected && idx !== q.correct_index && <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Open-ended: sample answer reveal */}
          {isOpen && (
            <div className="space-y-3">
              {!showExplanation ? (
                <div className="rounded-2xl bg-muted/40 border border-border/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Think about your answer, then reveal...</p>
                  <button onClick={() => setShowExplanation(true)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground hover:opacity-90 active:scale-95 transition-all">
                    Reveal Sample Answer <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-sky-500/5 border border-sky-500/20 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-2">Sample Answer</p>
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed mb-4">{q.sample_answer}</p>
                  {selfScore === null && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">How did you do?</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleSelf(false)}
                          className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[10px] font-black uppercase text-rose-600 transition-all hover:bg-rose-500/15 active:scale-95">
                          <XCircle className="h-3.5 w-3.5" /> Missed it
                        </button>
                        <button onClick={() => handleSelf(true)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[10px] font-black uppercase text-emerald-600 transition-all hover:bg-emerald-500/15 active:scale-95">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Got it!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && q.explanation && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl bg-amber-500/5 border border-amber-500/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <LightbulbIcon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Explanation</p>
                <p className="text-sm font-medium text-foreground/80 leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {hasAnswered && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <button onClick={advance}
            className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
            {current < total - 1 ? "Next" : "Finish"} <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Adaptive hint */}
      {perf.totalAttempts > 0 && (
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
          <BarChart3 className="h-3 w-3" /> Adaptive mode: {perf.difficultyAdjust} · Avg {perf.totalScore}%
        </div>
      )}
    </div>
  );
}
