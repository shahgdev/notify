import KnowledgeGraph from "@/components/KnowledgeGraph";
import { motion } from "framer-motion";
import { Network } from "lucide-react";

export default function GraphPage() {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-14 pb-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <Network className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">AI-Generated</p>
                    <h1 className="text-2xl font-black tracking-tight leading-none">Knowledge Graph</h1>
                </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-8 max-w-[380px] leading-relaxed">
                Connections between your lectures detected by AI. Click a node to see related lectures. Double-click to open.
            </p>
            <KnowledgeGraph />
        </motion.div>
    );
}
