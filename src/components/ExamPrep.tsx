import { motion } from "framer-motion";
import {
  Target, HelpCircle, AlertTriangle, GraduationCap
} from "lucide-react";

interface ExamPrepData {
  high_yield_points?: string[];
  likely_questions?: string[];
  common_mistakes?: string[];
}

export default function ExamPrep({ data }: { data: ExamPrepData }) {
  if (!data || (!data.high_yield_points?.length && !data.likely_questions?.length && !data.common_mistakes?.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
          <GraduationCap className="h-9 w-9 text-primary/30" />
        </div>
        <p className="text-lg font-black mb-2">No Exam Prep Available</p>
        <p className="text-sm text-muted-foreground font-medium max-w-[260px]">Re-process the lecture to generate exam insights.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* High Yield Points */}
      {data.high_yield_points && data.high_yield_points.length > 0 && (
        <div className="rounded-[24px] bg-emerald-500/5 border border-emerald-500/20 overflow-hidden shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-emerald-500/10">
            <Target className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">High Yield Points</p>
            <span className="ml-auto text-[9px] font-black text-emerald-600/50">{data.high_yield_points.length} items</span>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {data.high_yield_points.map((p, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-4 py-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-[9px] font-black text-on-surface mt-0.5">{i + 1}</span>
                <p className="text-sm font-semibold text-foreground/80">{p}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Likely Questions */}
      {data.likely_questions && data.likely_questions.length > 0 && (
        <div className="rounded-[24px] bg-sky-500/5 border border-sky-500/20 overflow-hidden shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-sky-500/10">
            <HelpCircle className="h-4 w-4 text-sky-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Likely Exam Questions</p>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {data.likely_questions.map((q, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl bg-sky-500/5 border border-sky-500/10 px-4 py-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-[9px] font-black text-on-surface mt-0.5">Q</span>
                <p className="text-sm font-semibold text-foreground/80">{q}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {data.common_mistakes && data.common_mistakes.length > 0 && (
        <div className="rounded-[24px] bg-rose-500/5 border border-rose-500/20 overflow-hidden shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-rose-500/10">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Common Mistakes to Avoid</p>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {data.common_mistakes.map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl bg-rose-500/5 border border-rose-500/10 px-4 py-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-[9px] font-black text-on-surface mt-0.5">!</span>
                <p className="text-sm font-semibold text-foreground/80">{m}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
