import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, CheckCircle2, XCircle, BookOpen } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

interface Card {
  question: string;
  answer: string;
  difficulty?: Difficulty;
  topic?: string;
}

const difficultyConfig: Record<Difficulty, { label: string; color: string; bg: string; border: string }> = {
  easy: { label: "Easy", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  hard: { label: "Hard", color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashCard({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterDiff, setFilterDiff] = useState<Difficulty | "all">("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [shuffled, setShuffled] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [cardOrder, setCardOrder] = useState<Card[]>(cards);

  const topics = useMemo(() => {
    const set = new Set(cards.map((c) => c.topic).filter(Boolean) as string[]);
    return ["all", ...Array.from(set)];
  }, [cards]);

  const filtered = useMemo(() => {
    return cardOrder.filter((c) => {
      const matchDiff = filterDiff === "all" || c.difficulty === filterDiff;
      const matchTopic = filterTopic === "all" || c.topic === filterTopic;
      return matchDiff && matchTopic;
    });
  }, [cardOrder, filterDiff, filterTopic]);

  const card = filtered[index];
  const total = filtered.length;

  const go = (dir: 1 | -1) => {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + dir, 0), total - 1));
  };

  const resetAll = () => {
    setFlipped(false);
    setIndex(0);
    setKnown(new Set());
    setUnknown(new Set());
    setShuffled(false);
    setCardOrder(cards);
  };

  const doShuffle = () => {
    setCardOrder(shuffle(cardOrder));
    setIndex(0);
    setFlipped(false);
    setShuffled(true);
  };

  const markKnown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setKnown((k) => new Set([...k, index]));
    setUnknown((u) => { const s = new Set(u); s.delete(index); return s; });
    if (index < total - 1) go(1);
  };

  const markUnknown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUnknown((u) => new Set([...u, index]));
    setKnown((k) => { const s = new Set(k); s.delete(index); return s; });
    if (index < total - 1) go(1);
  };

  if (!card || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
          <BookOpen className="h-9 w-9 text-primary/40" />
        </div>
        <p className="text-lg font-black tracking-tight mb-2">No Cards Found</p>
        <p className="text-sm text-muted-foreground font-medium">Try a different filter.</p>
      </div>
    );
  }

  const diff = (card.difficulty || "medium") as Difficulty;
  const dc = difficultyConfig[diff];
  const progressPct = total > 1 ? (index / (total - 1)) * 100 : 100;

  return (
    <div className="flex flex-col">
      {/* Filters Row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Difficulty */}
        <div className="flex gap-1.5 rounded-2xl bg-muted/30 p-1 border border-border/40">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setFilterDiff(d); setIndex(0); setFlipped(false); }}
              className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${filterDiff === d
                  ? d === "all" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : d === "easy" ? "bg-emerald-500 text-on-surface shadow-lg shadow-emerald-500/20"
                      : d === "medium" ? "bg-amber-500 text-on-surface shadow-lg shadow-amber-500/20"
                        : "bg-rose-500 text-on-surface shadow-lg shadow-rose-500/20"
                  : "text-muted-foreground hover:bg-accent"
                }`}
            >
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>

        {/* Topic filter (if topics exist) */}
        {topics.length > 1 && (
          <select
            value={filterTopic}
            onChange={(e) => { setFilterTopic(e.target.value); setIndex(0); setFlipped(false); }}
            className="rounded-xl bg-muted/30 border border-border/40 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 text-foreground/70 transition-all"
          >
            {topics.map((t) => (
              <option key={t} value={t}>{t === "all" ? "All Topics" : t}</option>
            ))}
          </select>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={doShuffle}
            title="Shuffle"
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${shuffled ? "bg-primary border-primary text-primary-foreground" : "bg-accent border-border/40 text-muted-foreground hover:text-foreground"
              }`}
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetAll} title="Reset" className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent border border-border/40 text-muted-foreground hover:text-foreground transition-all">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress + counter */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          {index + 1} / {total}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <span className="text-[10px] font-black text-emerald-600">{known.size}✓</span>
        <span className="text-[10px] font-black text-rose-500">{unknown.size}✗</span>
      </div>

      {/* Card */}
      <div
        className="relative mb-5 w-full cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped(!flipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0, scale: 0.97 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={{ rotateY: -90, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`relative flex min-h-[230px] flex-col rounded-[28px] border p-7 shadow-2xl shadow-black/8 transition-colors duration-300 ${flipped
                ? "bg-primary/5 border-primary/20"
                : "bg-card border-border/40"
              }`}
          >
            {/* Top row: difficulty + topic */}
            <div className="mb-5 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${dc.bg} ${dc.color} ${dc.border}`}>
                {dc.label}
              </span>
              {card.topic && (
                <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-accent/60 text-muted-foreground border border-border/30">
                  {card.topic}
                </span>
              )}
              <span className="ml-auto text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                {flipped ? "Answer" : "Question"}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center">
              <p className={`text-center text-base md:text-lg font-semibold leading-relaxed ${flipped ? "text-foreground" : "text-foreground/90"}`}>
                {flipped ? card.answer : card.question}
              </p>
            </div>

            {/* Tap hint */}
            <p className="mt-5 text-center text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
              Tap to {flipped ? "see question" : "reveal answer"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav + Know / Don't know */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          disabled={index === 0}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent border border-border/40 text-accent-foreground disabled:opacity-25 hover:bg-accent/80 transition-all active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Know / Don't Know */}
        <div className="flex gap-2 flex-1 justify-center">
          <button
            onClick={markUnknown}
            className="flex items-center gap-1.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95"
          >
            <XCircle className="h-3.5 w-3.5" /> Still Learning
          </button>
          <button
            onClick={markKnown}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10 transition-all active:scale-95"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Got it!
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); go(1); }}
          disabled={index === total - 1}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent border border-border/40 text-accent-foreground disabled:opacity-25 hover:bg-accent/80 transition-all active:scale-90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
