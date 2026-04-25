import { useState } from "react";
import FeynmanChallenge from "./FeynmanChallenge";
import ConceptExplainer from "./ConceptExplainer";
import LearningChunks from "./LearningChunks";
import { BookOpen, Zap, Layers, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UnifiedStudyViewProps {
    lecture: any;
}

export default function UnifiedStudyView({ lecture }: UnifiedStudyViewProps) {
    const [mode, setMode] = useState<"key_points" | "simplify" | "expand">("key_points");

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/40 w-fit shrink-0 backdrop-blur-sm self-center mx-auto mb-4">
                <button 
                    onClick={() => setMode("simplify")} 
                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        mode === "simplify" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                    }`}
                >
                    <Zap className="w-3.5 h-3.5" />
                    Simplify
                </button>
                <button 
                    onClick={() => setMode("expand")} 
                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        mode === "expand" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    Expand
                </button>
                <button 
                    onClick={() => setMode("key_points")} 
                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        mode === "key_points" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                    }`}
                >
                    <List className="w-3.5 h-3.5" />
                    Key Points
                </button>
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {mode === "key_points" && <LearningChunks chunks={lecture.learning_chunks || []} />}
                    {mode === "simplify" && <FeynmanChallenge lectureId={lecture.id} lectureTitle={lecture.title} />}
                    {mode === "expand" && <ConceptExplainer lectureId={lecture.id} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
