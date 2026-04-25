import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, RotateCcw, ArrowRight } from "lucide-react";
import { useLearnStore, type Section } from "@/store/learnStore";
import { processNotesWithClaude } from "@/lib/claude-api";

function SectionCard({
  section,
  isExpanded,
  onToggle,
}: {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-l-2 border-primary/30 bg-card/50 rounded-r-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/30 transition-colors"
      >
        <h3 className="font-semibold text-[18px] text-foreground leading-tight">
          {section.heading}
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground/50 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground/50 shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="px-5 pb-5">
          <p className="text-[15px] leading-relaxed text-foreground/80 whitespace-pre-line">
            {section.content}
          </p>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-l-2 border-primary/10 bg-card/30 rounded-r-xl p-5 animate-pulse">
      <div className="h-5 w-1/3 bg-muted rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-4/6 bg-muted rounded" />
      </div>
    </div>
  );
}

function KeyPointsView({ points }: { points: string[] }) {
  return (
    <div className="space-y-4">
      {points.map((point, index) => (
        <div key={index} className="flex gap-4 items-start">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {index + 1}
          </span>
          <p className="text-[17px] font-bold text-foreground leading-relaxed pt-0.5">
            {point}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function LearnMode() {
  const {
    rawNotes,
    processedContent,
    activeView,
    isLoading,
    error,
    expandedSections,
    setRawNotes,
    setProcessedContent,
    setActiveView,
    setLoading,
    setError,
    toggleSection,
    reset,
  } = useLearnStore();

  const [showPracticeLink, setShowPracticeLink] = useState(false);

  const handleProcess = async () => {
    if (!rawNotes.trim()) return;

    setLoading(true);
    setError(null);
    setShowPracticeLink(false);

    try {
      const result = await processNotesWithClaude(rawNotes);
      setProcessedContent(result);
      setShowPracticeLink(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process notes");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleProcess();
  };

  const currentSections = activeView === "simplified"
    ? processedContent?.simplified
    : processedContent?.full_notes;

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-24">
      {/* Input Area */}
      <div className="mb-8">
        <textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          placeholder="Paste your notes here..."
          disabled={isLoading}
          className="w-full min-h-[160px] rounded-2xl border border-border/50 bg-card/50 p-5 text-[15px] leading-relaxed placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none resize-y disabled:opacity-50"
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleProcess}
            disabled={isLoading || !rawNotes.trim()}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Process"}
          </button>
          {processedContent && (
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Start over
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-semibold text-destructive hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ready to Practice Indicator */}
      {showPracticeLink && processedContent && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Ready to practice
              </p>
              <p className="text-xs text-emerald-600/70 mt-0.5">
                {processedContent.flashcards.length} flashcards · {processedContent.quiz.length} quiz questions
              </p>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-emerald-700 transition-colors">
              Practice
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Output Area */}
      {(processedContent || isLoading) && (
        <div className="space-y-6">
          {/* Toggle Buttons */}
          <div className="flex gap-2 rounded-xl bg-muted/50 p-1.5">
            {(["full", "simplified", "keypoints"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors
                  ${
                    activeView === view
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {view === "full" && "Full Notes"}
                {view === "simplified" && "Simplified"}
                {view === "keypoints" && "Key Points"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : activeView === "keypoints" ? (
              processedContent?.key_points && (
                <KeyPointsView points={processedContent.key_points} />
              )
            ) : (
              <div className="space-y-3">
                {currentSections?.map((section) => (
                  <SectionCard
                    key={section.heading}
                    section={section}
                    isExpanded={expandedSections.has(section.heading)}
                    onToggle={() => toggleSection(section.heading)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Score */}
          {processedContent && (
            <div className="pt-4 border-t border-border/30">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Difficulty:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 w-6 rounded-full ${
                        level <= processedContent.difficulty_score
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {processedContent.difficulty_score}/5
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
