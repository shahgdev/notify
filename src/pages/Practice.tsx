import { useState, useEffect, useMemo } from "react";
import { getLectures } from "@/lib/api";
import { Loader2, Dumbbell, Tag, CheckCircle2, Play, RotateCcw } from "lucide-react";
import UnifiedPractice from "@/components/UnifiedPractice";
import { motion, AnimatePresence } from "framer-motion";

export default function Practice() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // pendingTopics  = what the user is selecting in UI (not yet applied to deck)
  // appliedTopics  = what actually drives the flashcard deck
  const [pendingTopics, setPendingTopics] = useState<Set<string>>(new Set(["__all__"]));
  const [appliedTopics, setAppliedTopics] = useState<Set<string>>(new Set(["__all__"]));

  useEffect(() => {
    (async () => {
      try {
        const data = await getLectures();
        setLectures(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Aggregate ALL flashcards and ALL quizzes from across the library
  const { allFlashcards, allQuiz } = useMemo(() => {
    let fc: any[] = [];
    let qz: any[] = [];
    for (const l of lectures) {
      if (l.flashcards) fc = fc.concat(l.flashcards);
      if (l.quiz) qz = qz.concat(l.quiz);
    }
    return { allFlashcards: fc, allQuiz: qz };
  }, [lectures]);

  // Extract unique topics from flashcards
  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const fc of allFlashcards) {
      if (fc.topic && typeof fc.topic === "string" && fc.topic.trim()) {
        set.add(fc.topic.trim());
      }
    }
    return Array.from(set).sort();
  }, [allFlashcards]);

  // Toggle a topic pill in PENDING selection only
  const toggleTopic = (t: string) => {
    if (t === "__all__") {
      setPendingTopics(new Set(["__all__"]));
      return;
    }
    setPendingTopics((prev) => {
      const next = new Set(prev);
      next.delete("__all__");
      if (next.has(t)) {
        next.delete(t);
        if (next.size === 0) next.add("__all__"); // fall back to All if nothing left
      } else {
        next.add(t);
      }
      return next;
    });
  };

  // Helper: filter cards by a topic set
  const getFilteredCards = (topicSet: Set<string>) => {
    if (topicSet.has("__all__")) return allFlashcards;
    return allFlashcards.filter((fc) => fc.topic && topicSet.has(fc.topic.trim()));
  };

  // Cards preview for PENDING selection (shown in Confirm button label)
  const pendingCards = useMemo(() => getFilteredCards(pendingTopics), [allFlashcards, pendingTopics]);

  // Cards actually used by the deck (driven by APPLIED selection)
  const appliedCards = useMemo(() => getFilteredCards(appliedTopics), [allFlashcards, appliedTopics]);

  // True when user has made changes that aren't confirmed yet
  const hasPendingChanges = useMemo(() => {
    if (pendingTopics.size !== appliedTopics.size) return true;
    for (const t of pendingTopics) if (!appliedTopics.has(t)) return true;
    return false;
  }, [pendingTopics, appliedTopics]);

  // Apply pending → applied (resets deck via key change)
  const handleConfirm = () => setAppliedTopics(new Set(pendingTopics));

  // Discard pending changes — revert pills to what's currently applied
  const handleReset = () => setPendingTopics(new Set(appliedTopics));

  // Key resets the flashcard deck whenever applied filter changes
  const practiceKey = Array.from(appliedTopics).sort().join("|");

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (allFlashcards.length === 0 && allQuiz.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-5">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
          <Dumbbell className="h-9 w-9 text-primary/40" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">No Practice Material</h3>
        <p className="text-sm text-muted-foreground font-medium">
          Record or process a lecture to generate material first!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Sticky Header */}
      <div className="border-b border-border/30 px-5 py-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight">Global Practice Session</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Master everything across your entire library.
        </p>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-8">

        {/* ── Topic Filter Panel ── */}
        {topics.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border backdrop-blur-xl p-5 space-y-5 transition-all duration-300 ${
              hasPendingChanges
                ? "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(58,223,250,0.08)]"
                : "border-outline-variant/20 bg-surface-container-low/60"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Filter by Topic
              </h2>
              {/* Live pending card count preview */}
              <span className="ml-auto text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
                {pendingCards.length} / {allFlashcards.length} cards selected
              </span>
            </div>

            {/* Topic Pills */}
            <div className="flex flex-wrap gap-2">
              {/* All Topics pill */}
              <button
                onClick={() => toggleTopic("__all__")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 border ${
                  pendingTopics.has("__all__")
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                    : "bg-surface-container text-on-surface-variant border-outline-variant/20 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {pendingTopics.has("__all__") && <CheckCircle2 className="h-3 w-3" />}
                All Topics
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${pendingTopics.has("__all__") ? "bg-white/20" : "bg-surface-container-high"}`}>
                  {allFlashcards.length}
                </span>
              </button>

              {/* Individual topic pills */}
              {topics.map((topic) => {
                const count = allFlashcards.filter((fc) => fc.topic?.trim() === topic).length;
                const active = pendingTopics.has(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 border ${
                      active
                        ? "bg-secondary text-secondary-foreground border-secondary shadow-md shadow-secondary/25"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/20 hover:border-secondary/40 hover:text-secondary"
                    }`}
                  >
                    {active && <CheckCircle2 className="h-3 w-3" />}
                    {topic}
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${active ? "bg-white/20" : "bg-surface-container-high"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Confirm / Reset row */}
            <div className="flex items-center gap-3 pt-1 border-t border-outline-variant/15 flex-wrap">
              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!hasPendingChanges}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  hasPendingChanges
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95"
                    : "bg-surface-container text-on-surface-variant/40 border border-outline-variant/15 cursor-not-allowed"
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                {hasPendingChanges
                  ? `Start with ${pendingCards.length} card${pendingCards.length !== 1 ? "s" : ""}`
                  : "Filter Applied"}
              </button>

              {/* Reset — shown only when there are pending changes */}
              <AnimatePresence>
                {hasPendingChanges && (
                  <motion.button
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Applied filter info (shown when a specific filter is active and no pending changes) */}
              {!appliedTopics.has("__all__") && !hasPendingChanges && (
                <span className="text-[10px] text-primary/70 font-semibold ml-auto">
                  {appliedCards.length} card{appliedCards.length !== 1 ? "s" : ""} · {appliedTopics.size} topic{appliedTopics.size > 1 ? "s" : ""} active
                  {" · "}
                  <button
                    onClick={() => {
                      setPendingTopics(new Set(["__all__"]));
                      setAppliedTopics(new Set(["__all__"]));
                    }}
                    className="underline underline-offset-2 hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                </span>
              )}
            </div>
          </motion.section>
        )}

        {/* ── Practice Deck — driven by appliedTopics only ── */}
        <UnifiedPractice
          key={practiceKey}
          lectureId={0}
          flashcards={appliedCards}
          quiz={allQuiz}
        />
      </div>
    </div>
  );
}
