import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, BarChart3, BookOpen } from "lucide-react";
import { useLearnStore, type PracticeItem, type SessionResult } from "@/store/learnStore";

// Progress Bar Component
function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Flashcard Component with CSS flip
function FlashcardCard({
  item,
  onResult,
}: {
  item: PracticeItem & { type: "flashcard" };
  onResult: (correct: boolean, skipped: boolean, timeMs: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  const handleFlip = () => {
    if (!answered) {
      setFlipped(true);
    }
  };

  const handleResult = (correct: boolean, skipped: boolean) => {
    if (answered) return;
    const timeMs = Date.now() - startTime;
    setAnswered(true);
    onResult(correct, skipped, timeMs);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (answered) return;
      if (e.key === "Escape") {
        handleResult(false, true);
      } else if (e.key === "ArrowLeft" && flipped) {
        handleResult(false, false);
      } else if (e.key === "ArrowRight" && flipped) {
        handleResult(true, false);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flipped, answered]);

  // Swipe detection for skip
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 100 && !answered) {
        handleResult(false, true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [answered]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Card with CSS flip */}
      <div
        className="relative w-full aspect-[4/3] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-border/50 bg-card p-8 flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-lg font-medium text-center leading-relaxed">
              {item.data.question}
            </p>
            <span className="absolute bottom-4 text-xs text-muted-foreground/50">
              Tap to flip
            </span>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-primary/30 bg-primary/5 p-8 flex items-center justify-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-lg font-medium text-center leading-relaxed text-foreground">
              {item.data.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Buttons - only show when flipped */}
      {flipped && !answered && (
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => handleResult(false, false)}
            className="px-8 py-3 rounded-xl border-2 border-rose-500 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
          >
            Missed it
          </button>
          <button
            onClick={() => handleResult(true, false)}
            className="px-8 py-3 rounded-xl border-2 border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
          >
            Got it
          </button>
        </div>
      )}

      {answered && (
        <p className="mt-8 text-sm text-muted-foreground">
          Moving to next...
        </p>
      )}
    </div>
  );
}

// Quiz Component
function QuizCard({
  item,
  onResult,
}: {
  item: PracticeItem & { type: "quiz" };
  onResult: (correct: boolean, skipped: boolean, timeMs: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (selected !== null || answered) return;

    const isCorrect = index === item.data.correct_index;
    const timeMs = Date.now() - startTime;
    setSelected(index);
    setAnswered(true);

    // Auto-advance after 1.2 seconds
    setTimeout(() => {
      onResult(isCorrect, false, timeMs);
    }, 1200);
  };

  // Escape to skip
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !answered) {
        const timeMs = Date.now() - startTime;
        setAnswered(true);
        onResult(false, true, timeMs);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answered, startTime, onResult]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Question Card */}
      <div className="w-full rounded-2xl border border-border/50 bg-card p-8 mb-6">
        <p className="text-lg font-medium text-center leading-relaxed mb-6">
          {item.data.question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {item.data.options.map((option, index) => {
            let borderClass = "border-border/50";
            if (selected !== null) {
              if (index === item.data.correct_index) {
                borderClass = "border-emerald-500 border-2";
              } else if (index === selected && index !== item.data.correct_index) {
                borderClass = "border-rose-500 border-2";
              } else {
                borderClass = "border-border/30 opacity-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={selected !== null}
                className={`w-full rounded-xl border ${borderClass} bg-card p-4 text-left font-medium transition-all hover:border-primary/50 disabled:cursor-default`}
              >
                <span className="inline-block w-8 text-muted-foreground/50 font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Session End Screen
function SessionEnd({
  results,
  total,
  onAgain,
  onProgress,
}: {
  results: SessionResult[];
  total: number;
  onAgain: () => void;
  onProgress: () => void;
}) {
  const correct = results.filter((r) => r.correct && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const percentage = total > 0 ? (correct / total) * 100 : 0;

  let message = "Almost there";
  if (percentage >= 80) message = "Well done";
  else if (percentage >= 50) message = "Keep going";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
      <div className="text-center">
        <p className="text-7xl font-black tracking-tight text-foreground mb-2">
          {correct}/{total}
        </p>
        <p className="text-lg text-muted-foreground mb-8">{message}</p>

        {skipped > 0 && (
          <p className="text-sm text-muted-foreground/70 mb-8">
            {skipped} skipped
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onAgain}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-border font-semibold hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Practice again
        </button>
        <button
          onClick={onProgress}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          See Progress
        </button>
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h2 className="text-xl font-bold mb-2">Process some notes in Learn first</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Go to Learn mode to paste your notes and generate flashcards and quizzes.
      </p>
      <Link
        to="/learn"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
      >
        Go to Learn
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </Link>
    </div>
  );
}

// Main Practice Mode Component
export default function PracticeMode() {
  const navigate = useNavigate();
  const {
    processedContent,
    practiceSession,
    startPracticeSession,
    recordResult,
    advanceToNext,
    resetPractice,
  } = useLearnStore();

  const [currentItemStartTime, setCurrentItemStartTime] = useState(Date.now());

  // Start session if not started
  useEffect(() => {
    if (processedContent && !practiceSession) {
      startPracticeSession();
      setCurrentItemStartTime(Date.now());
    }
  }, [processedContent, practiceSession, startPracticeSession]);

  const handleResult = useCallback(
    (correct: boolean, skipped: boolean, timeMs: number) => {
      if (!practiceSession) return;

      const currentItem = practiceSession.items[practiceSession.currentIndex];
      const result: SessionResult = {
        itemId: currentItem.id,
        itemType: currentItem.type,
        correct,
        skipped,
        timeSpentMs: timeMs,
      };

      recordResult(result);

      // Small delay before advancing
      setTimeout(() => {
        advanceToNext();
        setCurrentItemStartTime(Date.now());
      }, skipped ? 300 : 800);
    },
    [practiceSession, recordResult, advanceToNext]
  );

  // Handle practice again
  const handlePracticeAgain = () => {
    resetPractice();
    startPracticeSession();
    setCurrentItemStartTime(Date.now());
  };

  // Handle go to progress
  const handleGoToProgress = () => {
    navigate("/progress");
  };

  // No content loaded
  if (!processedContent) {
    return <EmptyState />;
  }

  // No session yet (shouldn't happen but handle it)
  if (!practiceSession) {
    return <EmptyState />;
  }

  const { items, currentIndex, results, isComplete } = practiceSession;
  const total = items.length;

  // Session complete
  if (isComplete || currentIndex >= total) {
    return (
      <SessionEnd
        results={results}
        total={total}
        onAgain={handlePracticeAgain}
        onProgress={handleGoToProgress}
      />
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="min-h-[100dvh] px-5 pt-8 pb-24">
      <ProgressBar current={currentIndex} total={total} />

      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
            {currentItem.type === "flashcard" ? "Flashcard" : "Quiz"}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {total}
          </p>
        </div>
        <button
          onClick={() => handleResult(false, true, Date.now() - currentItemStartTime)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="mt-8">
        {currentItem.type === "flashcard" ? (
          <FlashcardCard item={currentItem} onResult={handleResult} />
        ) : (
          <QuizCard item={currentItem} onResult={handleResult} />
        )}
      </div>
    </div>
  );
}
