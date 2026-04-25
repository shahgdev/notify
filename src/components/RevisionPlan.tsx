import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    buildDailyPlan, scheduleNotification, saveLectureMeta, RevisionItem
} from "@/hooks/useRevisionScheduler";
import {
    Calendar, Flame, Brain, AlertTriangle, Bell, BellOff,
    ChevronRight, Clock, CheckCircle2, Trophy
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MAX_SLIDER = { min: 5, max: 20, default: 15 };

const reasonConfig = {
    never_reviewed: { label: "New", color: "text-sky-600", bg: "bg-sky-500/10", border: "border-sky-500/25" },
    due_today: { label: "Due", color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/25" },
    weak_topic: { label: "Weak", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/25" },
};

const diffConfig: Record<string, { dot: string }> = {
    easy: { dot: "bg-emerald-500" },
    medium: { dot: "bg-amber-500" },
    hard: { dot: "bg-rose-500" },
};

interface Props {
    lectures: { id: number; title: string }[];
}

export default function RevisionPlan({ lectures }: Props) {
    const navigate = useNavigate();
    const [maxItems, setMaxItems] = useState(MAX_SLIDER.default);
    const [notifEnabled, setNotifEnabled] = useState(
        () => localStorage.getItem("revision_notif") === "1"
    );
    const [notifHour, setNotifHour] = useState(
        () => parseInt(localStorage.getItem("revision_notif_hour") || "19", 10)
    );
    const [done, setDone] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<string | null>(null);

    // Keep global metadata up to date so the scheduler can find all lectures
    useEffect(() => {
        if (lectures.length > 0) saveLectureMeta(lectures);
    }, [lectures]);

    const plan = useMemo(() => buildDailyPlan(maxItems, lectures), [maxItems, lectures]);

    const itemKey = (item: RevisionItem) => `${item.lectureId}-${item.cardIndex}`;

    const toggleNotif = async () => {
        if (!notifEnabled) {
            const ok = await scheduleNotification(notifHour);
            if (ok) {
                setNotifEnabled(true);
                localStorage.setItem("revision_notif", "1");
                localStorage.setItem("revision_notif_hour", String(notifHour));
            }
        } else {
            setNotifEnabled(false);
            localStorage.removeItem("revision_notif");
        }
    };

    const markDone = (key: string) => {
        setDone((d) => { const n = new Set(d); d.has(key) ? n.delete(key) : n.add(key); return n; });
    };

    const donePct = plan.items.length > 0
        ? Math.round((done.size / plan.items.length) * 100) : 0;

    const allDone = done.size >= plan.items.length && plan.items.length > 0;

    return (
        <div className="space-y-5 p-6 sm:p-8">

            {/* Header row */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Daily Revision</p>
                    <h2 className="text-lg font-black tracking-tight leading-none">Today's Study Plan</h2>
                </div>
                {/* Notification toggle */}
                <button onClick={toggleNotif}
                    title={notifEnabled ? "Disable reminder" : "Enable daily reminder"}
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all ${notifEnabled ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border-border/40 text-muted-foreground hover:text-foreground"}`}>
                    {notifEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: <Flame className="h-4 w-4 text-rose-500" />, label: "Due Today", val: plan.totalDue, color: "text-rose-600" },
                    { icon: <Brain className="h-4 w-4 text-amber-500" />, label: "In Plan", val: plan.items.length, color: "text-amber-600" },
                    { icon: <Clock className="h-4 w-4 text-sky-500" />, label: "Est. Mins", val: plan.estimatedMinutes, color: "text-sky-600" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex flex-col items-center gap-2 rounded-[20px] border border-border/40 bg-card p-4 text-center shadow-xl shadow-black/5"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5">{s.icon}</div>
                        <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Load slider */}
            <div className="rounded-[20px] bg-card border border-border/40 px-5 py-4 flex items-center gap-4 shadow-xl shadow-black/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 shrink-0">Daily Load</p>
                <input type="range" min={MAX_SLIDER.min} max={MAX_SLIDER.max} value={maxItems}
                    onChange={(e) => setMaxItems(Number(e.target.value))}
                    className="flex-1 accent-primary h-1.5" />
                <span className="text-sm font-black text-primary w-8 text-right">{maxItems}</span>
            </div>

            {/* Notification time picker — only when enabled */}
            {notifEnabled && (
                <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-primary/15 bg-card px-5 py-4 shadow-xl shadow-black/5 sm:flex-nowrap sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Bell className="h-4 w-4 shrink-0 text-primary/60" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Remind me at</p>
                    </div>
                    <Select
                        value={String(notifHour)}
                        onValueChange={(v) => {
                            const h = Number(v);
                            setNotifHour(h);
                            localStorage.setItem("revision_notif_hour", String(h));
                            scheduleNotification(h);
                        }}
                    >
                        <SelectTrigger className="ml-auto h-10 w-[min(100%,7.5rem)] shrink-0 rounded-xl border-primary/15 bg-primary/5 text-sm font-bold shadow-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                            {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={String(i)} className="cursor-pointer">
                                    {String(i).padStart(2, "0")}:00
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Weak topics */}
            {plan.weakTopics.length > 0 && (
                <div className="rounded-[20px] bg-amber-500/5 border border-amber-500/20 px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Focus on Weak Topics</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {plan.weakTopics.map((t) => (
                            <span key={t} className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1">{t}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress bar */}
            {plan.items.length > 0 && (
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-primary"
                            animate={{ width: `${donePct}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground/50">{done.size}/{plan.items.length}</span>
                </div>
            )}

            {/* All done state */}
            {allDone && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8 text-center rounded-[24px] bg-emerald-500/5 border border-emerald-500/20">
                    <Trophy className="h-12 w-12 text-emerald-500 mb-3" />
                    <p className="text-xl font-black text-emerald-600">Session Complete!</p>
                    <p className="text-sm text-muted-foreground mt-1">You've reviewed all cards for today. 🎉</p>
                </motion.div>
            )}

            {/* Review list */}
            {!allDone && plan.items.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                    <p className="text-lg font-black text-emerald-600">All caught up!</p>
                    <p className="text-sm text-muted-foreground">No cards are due today. Come back tomorrow.</p>
                </div>
            )}

            {!allDone && plan.items.length > 0 && (
                <div className="space-y-2.5">
                    {plan.items.map((item) => {
                        const key = itemKey(item);
                        const rc = reasonConfig[item.reason];
                        const dc = diffConfig[item.difficulty] ?? { dot: "bg-muted" };
                        const isDone = done.has(key);
                        const isOpen = expanded === key;

                        return (
                            <div key={key}
                                className={`rounded-2xl border overflow-hidden transition-all duration-200 ${isDone ? "opacity-50 bg-muted/20 border-border/20" : "bg-card border-border/40 hover:border-primary/20"}`}>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    {/* Done checkbox */}
                                    <button onClick={() => markDone(key)}
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isDone ? "bg-primary border-primary text-on-surface" : "border-border/50 hover:border-primary/50"}`}>
                                        {isDone && <CheckCircle2 className="h-3 w-3" />}
                                    </button>

                                    <button className="flex flex-1 items-center gap-2 text-left" onClick={() => setExpanded(isOpen ? null : key)}>
                                        <span className={`shrink-0 inline-flex items-center rounded-lg px-1.5 py-0.5 text-[8px] font-black uppercase border ${rc.bg} ${rc.color} ${rc.border}`}>
                                            {rc.label}
                                        </span>
                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dc.dot}`} />
                                        <p className={`flex-1 text-sm font-semibold truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                                            {item.question}
                                        </p>
                                    </button>

                                    <button onClick={() => navigate(`/lecture/${item.lectureId}`)}
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all">
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden">
                                            <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-border/20 pt-2.5">
                                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{item.lectureTitle}</span>
                                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">· Topic: {item.topic}</span>
                                                {item.interval > 0 && (
                                                    <span className="text-[9px] font-black text-primary/50 uppercase tracking-widest">· Interval: {item.interval}d</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
