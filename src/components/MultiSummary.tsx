import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Zap, BookOpen, Layers } from "lucide-react";

interface MultiSummaryData {
  quick?: string;
  standard?: string;
  detailed?: string;
}

type Level = "quick" | "standard" | "detailed";

const levels: { id: Level; label: string; desc: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
  { id: "quick",    label: "Quick",    desc: "10 seconds",  icon: <Zap className="h-4 w-4" />,      color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  { id: "standard", label: "Standard", desc: "Full picture", icon: <BookOpen className="h-4 w-4" />, color: "text-sky-600",     bg: "bg-sky-500/10",     border: "border-sky-500/25" },
  { id: "detailed", label: "Detailed", desc: "Deep dive",   icon: <Layers className="h-4 w-4" />,   color: "text-violet-600",  bg: "bg-violet-500/10",  border: "border-violet-500/25" },
];

export default function MultiSummary({ data }: { data: MultiSummaryData }) {
  const [active, setActive] = useState<Level>("standard");

  if (!data || (!data.quick && !data.standard && !data.detailed)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
          <BookOpen className="h-9 w-9 text-primary/30" />
        </div>
        <p className="text-lg font-black mb-2">No Multi-Summary</p>
        <p className="text-sm text-muted-foreground font-medium max-w-[260px]">Re-process the lecture to generate multi-depth summaries.</p>
      </div>
    );
  }

  const al = levels.find((l) => l.id === active)!;
  const content = data[active] || "Not available at this depth.";

  return (
    <div className="space-y-5">
      {/* Level selector */}
      <div className="flex gap-2">
        {levels.map((l) => (
          <button key={l.id} onClick={() => setActive(l.id)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              active === l.id
                ? `${l.bg} ${l.border} ${l.color} shadow-lg`
                : "bg-card border-border/40 text-muted-foreground/50 hover:border-primary/20"
            }`}>
            <span className={active === l.id ? l.color : ""}>{l.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{l.label}</span>
            <span className="text-[9px] font-medium opacity-60">{l.desc}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] bg-card border border-border/40 p-7 shadow-xl shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border ${al.bg} ${al.border} ${al.color}`}>
            {al.icon} {al.label}
          </span>
        </div>
        {active === "detailed" ? (
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm font-medium text-foreground/85 leading-relaxed whitespace-pre-line">{content}</p>
        )}
      </motion.div>
    </div>
  );
}
