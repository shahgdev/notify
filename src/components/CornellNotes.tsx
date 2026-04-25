import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, HelpCircle, AlignLeft, Lightbulb } from "lucide-react";

interface CornellNotesData {
    main_notes?: string;
    key_questions?: string[];
    summary?: string;
}

interface CornellNotesProps {
    data: CornellNotesData | null | undefined;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

export default function CornellNotes({ data }: CornellNotesProps) {
    if (!data || (!data.main_notes && !data.key_questions?.length && !data.summary)) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                    <BookOpen className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-black tracking-tight mb-2">Cornell Notes Unavailable</h3>
                <p className="text-sm text-muted-foreground font-medium max-w-[280px]">
                    Cornell Notes are generated automatically during lecture processing. Re-record or re-process a lecture to generate them.
                </p>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

            {/* Header Badge */}
            <motion.div variants={item} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <BookOpen className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Study Method</p>
                    <h2 className="text-lg font-black tracking-tight leading-tight">Cornell Notes</h2>
                </div>
            </motion.div>

            {/* Two-Column Top Layout: Main Notes + Key Questions */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

                {/* Left: Main Notes */}
                {data.main_notes && (
                    <motion.div
                        variants={item}
                        className="rounded-[28px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5 hover:border-primary/20 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border/40">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5">
                                <AlignLeft className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">Key Concepts & Notes</p>
                        </div>
                        <div className="px-6 py-5 prose prose-sm max-w-none dark:prose-invert
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
              prose-p:text-foreground/80 prose-p:leading-relaxed
              prose-ul:text-foreground/80 prose-li:leading-relaxed
              prose-strong:text-foreground prose-strong:font-bold
              prose-code:text-primary prose-code:bg-primary/5 prose-code:rounded prose-code:px-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {data.main_notes}
                            </ReactMarkdown>
                        </div>
                    </motion.div>
                )}

                {/* Right: Key Questions */}
                {data.key_questions && data.key_questions.length > 0 && (
                    <motion.div
                        variants={item}
                        className="rounded-[28px] bg-card border border-border/40 overflow-hidden shadow-xl shadow-black/5 hover:border-primary/20 transition-all duration-300 flex flex-col"
                    >
                        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border/40">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
                                <HelpCircle className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">Critical Questions</p>
                        </div>
                        <div className="px-5 py-5 flex-1 space-y-3">
                            {data.key_questions.map((q, i) => (
                                <motion.div
                                    key={i}
                                    variants={item}
                                    className="group flex gap-3 items-start rounded-2xl bg-accent/30 border border-border/20 px-4 py-3 hover:bg-accent/60 hover:border-amber-500/20 transition-all duration-200"
                                >
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm font-semibold text-foreground/80 leading-snug group-hover:text-foreground transition-colors">
                                        {q}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom: Summary Bar */}
            {data.summary && (
                <motion.div
                    variants={item}
                    className="rounded-[28px] bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/15 p-6 shadow-xl shadow-black/5 hover:border-primary/30 transition-all duration-300"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                            <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">Bottom Line Summary</p>
                    </div>
                    <p className="text-sm md:text-base font-medium text-foreground/80 leading-relaxed">
                        {data.summary}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
