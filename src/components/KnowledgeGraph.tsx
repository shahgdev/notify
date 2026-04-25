import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getKnowledgeGraph } from "@/lib/api";
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Network } from "lucide-react";

interface KGNode { id: number; title: string; topic: string; group: number; x?: number; y?: number; vx?: number; vy?: number; }
interface KGEdge { source: number; target: number; label: string; strength: number; }

// Group colors (HSL palette)
const GROUP_COLORS = [
    { fill: "#6366f1", light: "#6366f120", stroke: "#6366f160" }, // indigo
    { fill: "#10b981", light: "#10b98120", stroke: "#10b98160" }, // emerald
    { fill: "#f59e0b", light: "#f59e0b20", stroke: "#f59e0b60" }, // amber
    { fill: "#f43f5e", light: "#f43f5e20", stroke: "#f43f5e60" }, // rose
    { fill: "#3b82f6", light: "#3b82f620", stroke: "#3b82f660" }, // blue
    { fill: "#a855f7", light: "#a855f720", stroke: "#a855f760" }, // purple
];

// Simple force-directed layout
function initPositions(nodes: KGNode[], w: number, h: number): KGNode[] {
    return nodes.map((n, i) => ({
        ...n,
        x: w / 2 + (Math.cos((i / nodes.length) * 2 * Math.PI) * w * 0.3),
        y: h / 2 + (Math.sin((i / nodes.length) * 2 * Math.PI) * h * 0.3),
        vx: 0, vy: 0,
    }));
}

function runForce(nodes: KGNode[], edges: KGEdge[], w: number, h: number, iterations = 120): KGNode[] {
    const ns = nodes.map((n) => ({ ...n }));
    const idMap = new Map(ns.map((n) => [n.id, n]));
    const k = Math.sqrt((w * h) / (ns.length || 1));

    for (let iter = 0; iter < iterations; iter++) {
        const temp = Math.max(0.5, 5 * (1 - iter / iterations));
        // Repulsion
        for (let i = 0; i < ns.length; i++) {
            ns[i].vx = 0; ns[i].vy = 0;
            for (let j = 0; j < ns.length; j++) {
                if (i === j) continue;
                const dx = (ns[i].x! - ns[j].x!) || 0.01;
                const dy = (ns[i].y! - ns[j].y!) || 0.01;
                const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const f = (k * k) / d;
                ns[i].vx! += (dx / d) * f;
                ns[i].vy! += (dy / d) * f;
            }
        }
        // Attraction along edges
        for (const e of edges) {
            const s = idMap.get(e.source), t = idMap.get(e.target);
            if (!s || !t) continue;
            const dx = (t.x! - s.x!); const dy = (t.y! - s.y!);
            const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
            const f = (d * d) / k * (e.strength || 0.5);
            s.vx! += (dx / d) * f; s.vy! += (dy / d) * f;
            t.vx! -= (dx / d) * f; t.vy! -= (dy / d) * f;
        }
        // Apply + clamp to bounds
        for (const n of ns) {
            const len = Math.sqrt(n.vx! * n.vx! + n.vy! * n.vy!) || 1;
            n.x = Math.max(60, Math.min(w - 60, n.x! + (n.vx! / len) * Math.min(temp, len)));
            n.y = Math.max(40, Math.min(h - 40, n.y! + (n.vy! / len) * Math.min(temp, len)));
        }
    }
    return ns;
}

interface Props { highlightId?: number }

export default function KnowledgeGraph({ highlightId }: Props) {
    const navigate = useNavigate();
    const [rawData, setRawData] = useState<{ nodes: KGNode[]; edges: KGEdge[] } | null>(null);
    const [nodes, setNodes] = useState<KGNode[]>([]);
    const [edges, setEdges] = useState<KGEdge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number | null>(highlightId ?? null);
    const [zoom, setZoom] = useState(1);
    const svgRef = useRef<SVGSVGElement>(null);
    const W = 600, H = 420;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getKnowledgeGraph();
            setRawData(data);
            const placed = initPositions(data.nodes, W, H);
            const settled = runForce(placed, data.edges, W, H);
            setNodes(settled);
            setEdges(data.edges);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const connectedIds = selected !== null
        ? new Set(edges
            .filter((e) => e.source === selected || e.target === selected)
            .flatMap((e) => [e.source, e.target]))
        : null;

    const getColor = (group: number) => GROUP_COLORS[group % GROUP_COLORS.length];

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-bold text-muted-foreground">Building knowledge graph...</p>
        </div>
    );

    if (nodes.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-20 w-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
                <Network className="h-9 w-9 text-primary/30" />
            </div>
            <p className="text-lg font-black mb-2">No Graph Yet</p>
            <p className="text-sm text-muted-foreground max-w-[240px]">Record at least 2 lectures to build a knowledge graph.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-2xl bg-muted/30 border border-border/40 p-1">
                    <button onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                        <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                        <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                </div>
                <button onClick={load}
                    className="flex items-center gap-1.5 rounded-2xl border border-border/40 bg-card px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95">
                    <RefreshCw className="h-3 w-3" /> Rebuild
                </button>
                {selected !== null && (
                    <button onClick={() => setSelected(null)}
                        className="ml-auto text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors">
                        Clear Selection
                    </button>
                )}
            </div>

            {/* SVG Graph */}
            <div className="rounded-[28px] bg-card border border-border/40 overflow-hidden shadow-2xl shadow-black/8">
                <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s ease" }}>
                    {/* Defs: arrowhead marker */}
                    <defs>
                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L8,3 z" fill="#6366f130" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    {edges.map((e, i) => {
                        const s = nodes.find((n) => n.id === e.source);
                        const t = nodes.find((n) => n.id === e.target);
                        if (!s || !t) return null;
                        const isHighlighted = selected !== null && (e.source === selected || e.target === selected);
                        return (
                            <g key={i}>
                                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                    stroke={isHighlighted ? "#6366f1" : "#6366f125"}
                                    strokeWidth={isHighlighted ? 2 : 1}
                                    strokeDasharray={isHighlighted ? "none" : "4 4"}
                                    markerEnd="url(#arrow)"
                                    style={{ transition: "all 0.3s ease" }}
                                />
                                {isHighlighted && (
                                    <text x={(s.x! + t.x!) / 2} y={(s.y! + t.y!) / 2 - 5}
                                        textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="700" letterSpacing="0.04em">
                                        {e.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((n) => {
                        const c = getColor(n.group);
                        const isSel = selected === n.id;
                        const isDimmed = connectedIds !== null && !connectedIds.has(n.id) && selected !== n.id;
                        const r = isSel ? 26 : 20;
                        return (
                            <motion.g key={n.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: isDimmed ? 0.2 : 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    setSelected(selected === n.id ? null : n.id);
                                }}
                                onDoubleClick={() => navigate(`/lecture/${n.id}`)}
                            >
                                {/* Glow ring when selected */}
                                {isSel && (
                                    <circle cx={n.x} cy={n.y} r={r + 8} fill={c.light} stroke={c.stroke} strokeWidth="1.5" />
                                )}
                                {/* Main circle */}
                                <circle cx={n.x} cy={n.y} r={r} fill={isSel ? c.fill : c.light} stroke={c.stroke}
                                    strokeWidth={isSel ? 2 : 1.5} style={{ transition: "all 0.2s ease" }} />
                                {/* Topic initial */}
                                <text x={n.x} y={(n.y ?? 0) + 4} textAnchor="middle" fontSize="10" fontWeight="900"
                                    fill={isSel ? "#fff" : c.fill}>
                                    {n.topic.charAt(0).toUpperCase()}
                                </text>
                                {/* Label below */}
                                <text x={n.x} y={(n.y ?? 0) + r + 14} textAnchor="middle" fontSize="8" fontWeight="700"
                                    fill={isSel ? c.fill : "#88889a"} style={{ userSelect: "none" }}>
                                    {n.title.length > 18 ? n.title.slice(0, 16) + "…" : n.title}
                                </text>
                            </motion.g>
                        );
                    })}
                </svg>
            </div>

            {/* Selected info panel */}
            {selected !== null && (() => {
                const node = nodes.find((n) => n.id === selected);
                const related = edges
                    .filter((e) => e.source === selected || e.target === selected)
                    .map((e) => {
                        const otherId = e.source === selected ? e.target : e.source;
                        const other = nodes.find((n) => n.id === otherId);
                        return { node: other, label: e.label, strength: e.strength };
                    }).filter((r) => r.node);
                if (!node) return null;
                const c = getColor(node.group);

                return (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[24px] bg-card border border-border/40 p-5 shadow-xl shadow-black/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-on-surface font-black text-sm"
                                style={{ background: c.fill }}>
                                {node.topic.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-sm">{node.title}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{node.topic}</p>
                            </div>
                            <button onClick={() => navigate(`/lecture/${node.id}`)}
                                className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">
                                Open →
                            </button>
                        </div>
                        {related.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Related Concepts</p>
                                {related.map(({ node: other, label }) => other && (
                                    <button key={other.id} onClick={() => navigate(`/lecture/${other.id}`)}
                                        className="flex w-full items-center gap-2.5 rounded-xl bg-accent/40 border border-border/30 px-3 py-2.5 text-left hover:border-primary/20 hover:bg-accent transition-all">
                                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: getColor(other.group).fill }} />
                                        <p className="text-xs font-semibold truncate flex-1">{other.title}</p>
                                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase">{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );
            })()}

            {/* Group legend */}
            <div className="flex flex-wrap gap-2">
                {Array.from(new Set(nodes.map((n) => n.group))).sort().map((g) => {
                    const c = getColor(g);
                    const sample = nodes.find((n) => n.group === g);
                    return (
                        <div key={g} className="flex items-center gap-1.5 rounded-xl bg-accent/30 border border-border/30 px-2.5 py-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ background: c.fill }} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{sample?.topic || `Group ${g}`}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
