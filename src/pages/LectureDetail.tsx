import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLecture, renameLecture as apiRenameLecture, deleteLecture, generateLectureSummary, generateLectureNotes, generateLectureFlashcards, generateLectureQuiz } from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Download,
  Search,
  Pencil,
  ListVideo,
  BookMarked,
  Brain,
  ClipboardList,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NotesEditor from "@/components/NotesEditor";
import UnifiedPractice from "@/components/UnifiedPractice";
import QuizMode from "@/components/QuizMode";
import { useAppStore } from "@/store/appStore";

type LectureTab = "transcript" | "summary" | "notes" | "flashcards" | "quiz";

const TABS: { id: LectureTab; label: string }[] = [
  { id: "transcript", label: "Transcript" },
  { id: "summary", label: "Summary" },
  { id: "notes", label: "Notes" },
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Quiz" },
];

/** Safely parse summary — it may arrive as a parsed array OR a JSON string */
function parseSummary(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x: any) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x: any) => typeof x === "string");
    } catch {}
    // If it's a plain multiline string, split by newlines
    return raw.split("\n").map((l: string) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
  }
  return [];
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function TranscriptBody({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) {
    return <span className="whitespace-pre-wrap font-mono text-sm text-on-surface/80">{text}</span>;
  }
  if (!text.toLowerCase().includes(q.toLowerCase())) {
    return (
      <p className="text-sm text-on-surface-variant">
        No matches found for &quot;{query}&quot;.
      </p>
    );
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <span className="whitespace-pre-wrap font-mono text-sm text-on-surface/80">
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded bg-primary/30 px-0.5 text-on-surface">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function LectureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LectureTab>("transcript");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const { globalIsProcessing } = useAppStore();

  useEffect(() => {
    if (!id) return;
    const fetchLecture = async () => {
      try {
        const data = await getLecture(id);
        setLecture(data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load lecture details.",
          variant: "destructive",
        });
        navigate("/library");
      } finally {
        setLoading(false);
      }
    };
    fetchLecture();
    const interval = setInterval(() => {
      if (lecture?.transcript === "Processing...") {
        fetchLecture();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, lecture?.transcript]);

  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);

  const handleRegenerateSummary = async () => {
    if (!lecture) return;
    if (globalIsProcessing) {
      toast({ title: "Please Wait", description: "Another lecture is currently processing. Regenerations are queued globally.", variant: "destructive" });
      return;
    }
    setIsRegeneratingSummary(true);
    try {
      const updated = await generateLectureSummary(lecture.id);
      setLecture(updated);
      toast({ title: "Summary Regenerated", description: "Your summary has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to regenerate summary.", variant: "destructive" });
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const [isRegeneratingNotes, setIsRegeneratingNotes] = useState(false);

  const handleRegenerateNotes = async () => {
    if (!lecture) return;
    if (globalIsProcessing) {
      toast({ title: "Please Wait", description: "Another lecture is currently processing. Regenerations are queued globally.", variant: "destructive" });
      return;
    }
    setIsRegeneratingNotes(true);
    try {
      const updated = await generateLectureNotes(lecture.id);
      setLecture(updated);
      toast({ title: "Notes Regenerated", description: "Your AI notes have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to regenerate notes.", variant: "destructive" });
    } finally {
      setIsRegeneratingNotes(false);
    }
  };

  const [isRegeneratingFlashcards, setIsRegeneratingFlashcards] = useState(false);

  const handleRegenerateFlashcards = async () => {
    if (!lecture) return;
    if (globalIsProcessing) {
      toast({ title: "Please Wait", description: "Another lecture is currently processing. Regenerations are queued globally.", variant: "destructive" });
      return;
    }
    setIsRegeneratingFlashcards(true);
    try {
      const updated = await generateLectureFlashcards(lecture.id);
      setLecture(updated);
      toast({ title: "Flashcards Generated", description: "Your flashcards have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to generate flashcards.", variant: "destructive" });
    } finally {
      setIsRegeneratingFlashcards(false);
    }
  };

  const [isRegeneratingQuiz, setIsRegeneratingQuiz] = useState(false);

  const handleRegenerateQuiz = async () => {
    if (!lecture) return;
    if (globalIsProcessing) {
      toast({ title: "Please Wait", description: "Another lecture is currently processing. Regenerations are queued globally.", variant: "destructive" });
      return;
    }
    setIsRegeneratingQuiz(true);
    try {
      const updated = await generateLectureQuiz(lecture.id);
      setLecture(updated);
      toast({ title: "Quiz Generated", description: "Your quiz has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to generate quiz.", variant: "destructive" });
    } finally {
      setIsRegeneratingQuiz(false);
    }
  };
  const handleRenameClick = () => {
    if (!lecture) return;
    setNewTitle(lecture.title);
    setIsRenaming(true);
  };

  const handleRename = async () => {
    if (!lecture) return;
    const next = newTitle.trim();
    if (!next || next === lecture.title) {
       setIsRenaming(false);
       return;
    }
    try {
      await apiRenameLecture(lecture.id, next);
      setLecture({ ...lecture, title: next });
      toast({ title: "Updated", description: "Lecture title saved." });
    } catch {
      toast({
        title: "Error",
        description: "Could not rename lecture.",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!lecture) return;
    if (!confirm(`Permanently delete "${lecture.title}"? This cannot be undone.`)) return;
    try {
      await deleteLecture(String(lecture.id));
      toast({ title: "Deleted", description: `"${lecture.title}" has been removed.` });
      navigate("/library");
    } catch {
      toast({ title: "Error", description: "Failed to delete lecture.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    if (!lecture) return;
    const doc = new jsPDF();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const titleLines = doc.splitTextToSize(lecture.title, 170);
    doc.text(titleLines, 20, y);
    y += titleLines.length * 10 + 10;

    doc.setFontSize(16);
    doc.text("Key Insights", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    parseSummary(lecture.summary).forEach((point: string) => {
      const lines = doc.splitTextToSize(`• ${point}`, 170);
      if (y + lines.length * 7 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, 20, y);
      y += lines.length * 7 + 3;
    });

    if (lecture.multi_summary?.detailed) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Core Concepts", 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(lecture.multi_summary.detailed, 170);

      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });
    }

    if (lecture.transcript_segments && lecture.transcript_segments.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Minute-by-Minute Points", 20, y);
      y += 10;

      lecture.transcript_segments.forEach((seg: any) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`[${seg.start_time} - ${seg.end_time}] ${seg.title}`, 20, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const segLines = doc.splitTextToSize(seg.summary, 170);
        segLines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 4;
      });
    }

    doc.save(`${lecture.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_notes.pdf`);

    toast({
      title: "Export Successful",
      description: "Note has been exported as PDF.",
    });
  };

  const handleExportText = () => {
    if (!lecture) return;

    let content = `${lecture.title.toUpperCase()}\n\n`;
    content += `KEY INSIGHTS\n`;
    parseSummary(lecture.summary).forEach((point: string) => {
      content += `• ${point}\n`;
    });

    if (lecture.multi_summary?.detailed) {
      content += `\nCORE CONCEPTS\n`;
      content += `${lecture.multi_summary.detailed}\n`;
    }

    if (lecture.transcript_segments && lecture.transcript_segments.length > 0) {
      content += `\nMINUTE-BY-MINUTE POINTS\n`;
      lecture.transcript_segments.forEach((seg: any) => {
        content += `[${seg.start_time} - ${seg.end_time}] ${seg.title}\n`;
        content += `${seg.summary}\n\n`;
      });
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lecture.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_notes.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Note has been exported as a text document.",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lecture) return null;
  const isProcessing = lecture.transcript === "Processing...";
  const statusLabel = isProcessing ? "PROCESSING" : "READY";
  const dateStr = lecture.created_at
    ? new Date(lecture.created_at).toLocaleDateString()
    : "";
  const transcriptText = isProcessing
    ? "Transcript generation in progress..."
    : (lecture.transcript ?? "");
  const segments = Array.isArray(lecture.transcript_segments) ? lecture.transcript_segments : [];
  const summaryPoints = parseSummary(lecture.summary);
  const flashcards = Array.isArray(lecture.flashcards) ? lecture.flashcards : [];
  const flashCount = flashcards.length;
  const quizItems = Array.isArray(lecture.quiz) ? lecture.quiz : [];
  const quizCount = quizItems.length;
  // Unescape notes that may have double-escaped newlines from AI.
  // Guard: if notes is raw JSON (entire AI response stored by mistake), discard it.
  const safeNotes = (() => {
    const raw = typeof lecture.notes === "string" ? lecture.notes : (lecture.notes || "");
    const unescaped = raw.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    const trimmed = unescaped.trim();
    // If the notes field starts with { or [ it's a raw JSON dump — never show it
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "";
    return unescaped;
  })();

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
      {/* Lecture header */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/15 bg-surface/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-5 py-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container transition-colors hover:bg-surface-container-high"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </button>
            <div className="min-w-0">
              <h1 className="font-headline text-lg font-bold leading-tight tracking-tight text-on-surface md:text-xl">
                {lecture.title}
              </h1>
              <p className="mt-1 text-xs text-on-surface-variant md:text-sm">
                {dateStr}
                {dateStr ? " • " : ""}
                {statusLabel}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="max-w-[min(200px,40vw)] truncate rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              [{lecture.topic_tag || "General"}]
            </span>
            <button
              type="button"
              onClick={handleRenameClick}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
              title="Rename lecture"
              aria-label="Rename lecture"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 transition-colors hover:bg-red-500/15 hover:border-red-500/40"
              title="Delete lecture"
              aria-label="Delete lecture"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-5 pb-3 md:px-6">
          <div className="flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-w-[5.5rem] flex-1 rounded-xl px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest transition-all sm:min-w-0 sm:px-3 sm:text-[10px] ${
                  activeTab === t.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-12 pt-4 md:px-6">
        {activeTab === "transcript" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">Full transcript</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Verbatim text from this recording. Search to jump to phrases.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                placeholder="Search within transcript..."
                className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low py-3 pl-11 pr-4 text-sm text-on-surface outline-none ring-offset-background placeholder:text-on-surface-variant/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 shadow-inner transition-colors md:p-8">
              <TranscriptBody text={transcriptText} query={transcriptSearch} />
            </div>

            {!isProcessing && segments.length > 0 && (
              <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:p-8">
                <div className="mb-6 flex items-center gap-2">
                  <ListVideo className="h-5 w-5 text-primary" />
                  <h2 className="font-headline text-lg font-bold text-on-surface">By segment</h2>
                </div>
                <p className="mb-6 text-sm text-on-surface-variant">
                  Timestamped chunks with short titles and summaries.
                </p>
                <ul className="space-y-6">
                  {segments.map((seg: any, i: number) => (
                    <li
                      key={i}
                      className="border-b border-outline-variant/15 pb-6 last:border-0 last:pb-0"
                    >
                      <h3 className="font-headline text-base font-semibold text-on-surface">
                        {seg.title || `Segment ${i + 1}`}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-primary">
                        {seg.start_time != null && seg.end_time != null
                          ? `${seg.start_time} – ${seg.end_time}`
                          : "Timing TBD"}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-on-surface/85">{seg.summary}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-on-surface">Lecture summary</h2>
                <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
                  Key ideas, deeper explanation, vocabulary, and optional segment outline.
                </p>
              </div>
              {/* Regenerate button */}
              <button
                type="button"
                onClick={handleRegenerateSummary}
                disabled={isProcessing || isRegeneratingSummary}
                className="font-headline inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRegeneratingSummary
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                {isRegeneratingSummary ? "Regenerating…" : "Regenerate"}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="font-headline inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-xs font-black uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-container-high hover:text-primary"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-outline-variant/30 bg-surface-container-high"
                >
                  <DropdownMenuItem
                    onClick={handleExportPDF}
                    className="cursor-pointer font-medium focus:bg-primary/10 focus:text-primary"
                  >
                    Export as PDF Document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportText}
                    className="cursor-pointer font-medium focus:bg-primary/10 focus:text-primary"
                  >
                    Export as Text Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isProcessing ? (
              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-8">
                <div className="h-2 w-2 animate-ping rounded-full bg-primary" />
                <p className="font-headline text-base font-medium text-primary">
                  Synthesizing summary content…
                </p>
              </div>
            ) : (
              <>
                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <h2 className="font-headline text-lg font-bold text-on-surface">Key insights</h2>
                  </div>
                  {summaryPoints.length ? (
                    <ul className="space-y-5">
                      {summaryPoints.map((point: string, i: number) => (
                        <li key={i} className="flex gap-4">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(58,223,250,0.8)]" />
                          <p className="text-[15px] leading-relaxed text-on-surface/90">{point}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-on-surface-variant">No bullet summary available yet.</p>
                  )}
                </section>

                {lecture.multi_summary?.detailed != null &&
                  String(lecture.multi_summary.detailed).trim() !== "" && (
                  <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:p-8">
                    <div className="mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
                      <BookMarked className="h-5 w-5 shrink-0 text-secondary" />
                      <h2 className="font-headline text-lg font-bold text-on-surface">Core concepts</h2>
                    </div>
                    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed text-on-surface/90">
                      {String(lecture.multi_summary.detailed)
                        .split(/\n\n+/)
                        .filter(Boolean)
                        .map((para: string, i: number) => (
                          <p key={i} className="mb-4 last:mb-0">
                            {para}
                          </p>
                        ))}
                    </div>
                  </section>
                )}

                {lecture?.multi_summary?.definitions &&
                  Object.keys(lecture.multi_summary.definitions).length > 0 && (
                    <section className="rounded-2xl border border-secondary/25 bg-secondary/5 p-6 md:p-8">
                      <div className="mb-6 flex items-center gap-2 border-b border-secondary/20 pb-4">
                        <BookMarked className="h-5 w-5 shrink-0 text-secondary" />
                        <h2 className="font-headline text-lg font-bold text-secondary">Key terms &amp; definitions</h2>
                      </div>
                      <dl className="space-y-6">
                        {Object.entries(lecture.multi_summary.definitions).map(
                          ([term, definition]: [string, any], idx) => (
                            <div key={idx}>
                              <dt className="font-headline text-sm font-bold text-on-surface">{term}</dt>
                              <dd className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                                {definition}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </section>
                  )}

                {!isProcessing && segments.length > 0 && (
                  <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 md:p-8">
                    <div className="mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
                      <ListVideo className="h-5 w-5 shrink-0 text-primary" />
                      <h2 className="font-headline text-lg font-bold text-on-surface">Session outline</h2>
                    </div>
                    <p className="mb-6 text-sm text-on-surface-variant">
                      Minute-by-minute style breakdown from the same source as export.
                    </p>
                    <ol className="list-decimal space-y-5 pl-5 marker:font-bold marker:text-primary">
                      {segments.map((seg: any, i: number) => (
                        <li key={i} className="pl-2">
                          <h3 className="font-headline text-base font-semibold text-on-surface">
                            {seg.title || `Part ${i + 1}`}
                          </h3>
                          <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                            {seg.start_time != null && seg.end_time != null
                              ? `${seg.start_time} – ${seg.end_time}`
                              : ""}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-on-surface/85">{seg.summary}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-high/50 p-6 md:p-8">
                  <h2 className="font-headline mb-2 text-base font-bold text-on-surface">Study progress</h2>
                  <p className="mb-6 text-xs text-on-surface-variant">
                    Estimated retention indicators for this material.
                  </p>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-medium text-on-surface">Concept mastery</span>
                        <span className="font-bold text-primary">82%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full w-[82%] bg-gradient-to-r from-primary to-secondary" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-medium text-on-surface">Applied logic</span>
                        <span className="font-bold text-secondary">64%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full w-[64%] bg-gradient-to-r from-secondary to-purple-400" />
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-5">
            {/* Notes header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-xl font-bold text-on-surface">AI Notes</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Detailed study notes generated from this lecture.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRegenerateNotes}
                disabled={isProcessing || isRegeneratingNotes}
                className="font-headline inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRegeneratingNotes
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                {isRegeneratingNotes ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
            <NotesEditor
              key={`${lecture.id}-${lecture.notes?.length ?? 0}`}
              lectureId={Number(id)}
              initialNotes={safeNotes}
              initialWhiteboardData={lecture.whiteboard_data}
            />
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <h2 className="font-headline text-xl font-bold text-on-surface">Flashcards</h2>
              </div>
              {flashCount > 0 && (
                <button
                  type="button"
                  onClick={handleRegenerateFlashcards}
                  disabled={isProcessing || isRegeneratingFlashcards}
                  className="font-headline inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRegeneratingFlashcards ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isRegeneratingFlashcards ? "Generating…" : "Regenerate"}
                </button>
              )}
            </div>

            {flashCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 py-16 text-center">
                <Brain className="h-10 w-10 text-primary/30" />
                <div>
                  <p className="text-base font-semibold text-on-surface">No flashcards yet</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Generate flashcards from this lecture's transcript</p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateFlashcards}
                  disabled={isProcessing || isRegeneratingFlashcards}
                  className="font-headline inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRegeneratingFlashcards ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {isRegeneratingFlashcards ? "Generating…" : "Generate Flashcards"}
                </button>
              </div>
            ) : (
              <UnifiedPractice
                lectureId={Number(id)}
                flashcards={flashcards}
                quiz={[]}
              />
            )}
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-surface">Quiz</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {quizCount > 0
                      ? `${quizCount} question${quizCount === 1 ? "" : "s"} for this lecture.`
                      : "No quiz yet. Questions appear after the lecture is processed."}
                  </p>
                </div>
              </div>
              {quizCount > 0 && (
                <button
                  type="button"
                  onClick={handleRegenerateQuiz}
                  disabled={isProcessing || isRegeneratingQuiz}
                  className="font-headline inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRegeneratingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isRegeneratingQuiz ? "Regenerating…" : "Regenerate"}
                </button>
              )}
            </div>

            {quizCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 py-16 text-center">
                <ClipboardList className="h-10 w-10 text-primary/30" />
                <div>
                  <p className="text-base font-semibold text-on-surface">No quiz available</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Generate a custom quiz from this lecture's transcript</p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateQuiz}
                  disabled={isProcessing || isRegeneratingQuiz}
                  className="font-headline inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRegeneratingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                  {isRegeneratingQuiz ? "Generating…" : "Generate Quiz"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/30 p-4 md:p-6">
                <QuizMode questions={quizItems} lectureId={Number(id)} />
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="sm:max-w-[425px] border-outline-variant/30 bg-surface-container-high text-on-surface">
          <DialogHeader>
            <DialogTitle>Rename Lecture</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="bg-surface-container text-on-surface border-outline-variant/30"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenaming(false)}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
