import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Layers, Zap, List, ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  heading: string;
  content: string;
  key_points: string[];
  simplified: string;
  expanded: string;
}

type Mode = "content" | "simplified" | "expanded" | "key_points";

const modeConfig: Record<Mode, { label: string; short: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  content:     { label: "Normal",     short: "Normal",   icon: <BookOpen className="h-3.5 w-3.5" />, color: "text-foreground",    bg: "bg-accent",          border: "border-border/50" },
  simplified:  { label: "Simplify",   short: "Simple",   icon: <Zap className="h-3.5 w-3.5" />,      color: "text-emerald-600",   bg: "bg-emerald-500/10",  border: "border-emerald-500/25" },
  expanded:    { label: "Expand",     short: "Deep",     icon: <Layers className="h-3.5 w-3.5" />,   color: "text-violet-600",    bg: "bg-violet-500/10",   border: "border-violet-500/25" },
  key_points:  { label: "Key Points", short: "Points",   icon: <List className="h-3.5 w-3.5" />,     color: "text-sky-600",       bg: "bg-sky-500/10",      border: "border-sky-500/25" },
};

const MODES: Mode[] = ["content", "simplified", "expanded", "key_points"];

function SectionCard({ section, index }: { section: Section; index: number }) {
  const [mode, setMode] = useState<Mode>("content");
  const [open, setOpen] = useState(index === 0);
  const mc = modeConfig[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-[24px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5"
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[10px] font-black text-primary">
          {index + 1}
        </div>
        <p className="flex-1 text-sm font-black tracking-tight">{section.heading}</p>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Mode tabs */}
            <div className="flex gap-1.5 px-5 pb-3 border-t border-border/20 pt-3 overflow-x-auto">
              {MODES.map((m) => {
                const c = modeConfig[m];
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                      mode === m ? `${c.bg} ${c.color} ${c.border} shadow-sm` : "bg-transparent border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                    }`}
                  >
                    <span className={mode === m ? c.color : ""}>{c.icon}</span>
                    {c.short}
                  </button>
                );
              })}
            </div>

            {/* Content area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-5 pb-5"
              >
                {mode === "key_points" ? (
                  <div className={`rounded-2xl border p-4 space-y-2 ${modeConfig.key_points.bg} ${modeConfig.key_points.border}`}>
                    {section.key_points && section.key_points.length > 0 ? (
                      section.key_points.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                          <p className="text-sm font-semibold text-foreground/85 leading-relaxed">{pt}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No key points available.</p>
                    )}
                  </div>
                ) : mode === "simplified" ? (
                  <div className={`rounded-2xl border p-4 ${modeConfig.simplified.bg} ${modeConfig.simplified.border}`}>
                    <p className="text-sm font-medium text-foreground/85 leading-relaxed">{section.simplified || section.content}</p>
                  </div>
                ) : mode === "expanded" ? (
                  <div className={`rounded-2xl border p-4 ${modeConfig.expanded.bg} ${modeConfig.expanded.border}`}>
                    <p className="text-sm font-medium text-foreground/85 leading-relaxed">{section.expanded || section.content}</p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">{section.content}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SmartLearnView({ sections }: { sections: Section[] }) {
  const [globalMode, setGlobalMode] = useState<Mode | null>(null);

  if (!sections || sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
          <BookOpen className="h-9 w-9 text-primary/30" />
        </div>
        <p className="text-lg font-black mb-2">No Smart Sections Yet</p>
        <p className="text-sm text-muted-foreground font-medium max-w-[260px]">
          Re-process the lecture to generate the smart learning view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Global mode bar */}
      <div className="flex flex-col gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Apply to all sections</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MODES.map((m) => {
            const c = modeConfig[m];
            return (
              <button
                key={m}
                onClick={() => setGlobalMode(globalMode === m ? null : m)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                  globalMode === m
                    ? `${c.bg} ${c.color} ${c.border} shadow-md`
                    : "bg-card border-border/40 text-muted-foreground/50 hover:border-primary/20 hover:text-muted-foreground"
                }`}
              >
                <span className={globalMode === m ? c.color : ""}>{c.icon}</span>
                {c.label} All
              </button>
            );
          })}
        </div>
      </div>

      {/* Section cards */}
      <div className="space-y-3">
        {sections.map((section, i) => (
          <GlobalModeSectionCard key={i} section={section} index={i} globalMode={globalMode} />
        ))}
      </div>
    </div>
  );
}

// Wrapper that respects global mode override
function GlobalModeSectionCard({ section, index, globalMode }: { section: Section; index: number; globalMode: Mode | null }) {
  const [localMode, setLocalMode] = useState<Mode>("content");
  const [open, setOpen] = useState(index === 0);
  const mode = globalMode ?? localMode;
  const mc = modeConfig[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-[24px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[10px] font-black text-primary">
          {index + 1}
        </div>
        <p className="flex-1 text-sm font-black tracking-tight">{section.heading}</p>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground/40" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/40" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Local mode tabs (only show when no global override) */}
            {!globalMode && (
              <div className="flex gap-1.5 px-5 pb-3 border-t border-border/20 pt-3 overflow-x-auto">
                {MODES.map((m) => {
                  const c = modeConfig[m];
                  return (
                    <button key={m} onClick={() => setLocalMode(m)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                        mode === m ? `${c.bg} ${c.color} ${c.border} shadow-sm` : "bg-transparent border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                      }`}>
                      <span className={mode === m ? c.color : ""}>{c.icon}</span>{c.short}
                    </button>
                  );
                })}
              </div>
            )}
            {globalMode && (
              <div className="flex items-center gap-2 px-5 pb-3 border-t border-border/20 pt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${mc.bg} ${mc.color} ${mc.border}`}>
                  {mc.icon} {mc.label}
                </span>
                <span className="text-[8px] text-muted-foreground/30 font-black uppercase">global</span>
              </div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-5 pb-5">
                {mode === "key_points" ? (
                  <div className={`rounded-2xl border p-4 space-y-2 ${modeConfig.key_points.bg} ${modeConfig.key_points.border}`}>
                    {(section.key_points || []).map((pt, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                        <p className="text-sm font-semibold text-foreground/85 leading-relaxed">{pt}</p>
                      </div>
                    ))}
                  </div>
                ) : mode === "simplified" ? (
                  <div className={`rounded-2xl border p-4 ${modeConfig.simplified.bg} ${modeConfig.simplified.border}`}>
                    <p className="text-sm font-medium text-foreground/85 leading-relaxed">{section.simplified || section.content}</p>
                  </div>
                ) : mode === "expanded" ? (
                  <div className={`rounded-2xl border p-4 ${modeConfig.expanded.bg} ${modeConfig.expanded.border}`}>
                    <p className="text-sm font-medium text-foreground/85 leading-relaxed">{section.expanded || section.content}</p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">{section.content}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
