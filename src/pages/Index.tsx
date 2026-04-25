import { motion } from "framer-motion";
import { Mic, Upload, Play, MoreVertical, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getLectures } from "@/lib/api";
import RevisionPlan from "@/components/RevisionPlan";
import { saveLectureMeta } from "@/hooks/useRevisionScheduler";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLectures()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setLectures(arr);
        saveLectureMeta(arr.map((l: any) => ({ id: l.id, title: l.title })));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard lectures", err);
        setLoading(false);
      });
  }, []);

  // Compute Metrics dynamically from real data
  const calculateMetrics = () => {
    let totalMins = 0;
    let thisWeekMins = 0;
    let lastWeekMins = 0;
    let featuresUsedCount = 0;
    
    const now = new Date().getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    lectures.forEach((lec) => {
      // 1. Duration logic
      const dur = (lec.duration || "").toLowerCase();
      let h = 0;
      let m = 0;
      const hMatch = dur.match(/(\d+)\s*h/);
      if (hMatch) h = parseInt(hMatch[1], 10);
      const mMatch = dur.match(/(\d+)\s*min/);
      if (mMatch) m = parseInt(mMatch[1], 10);
      const mins = (h * 60) + m;
      totalMins += mins;

      // 2. Weekly comparison
      const createdTime = new Date(lec.created_at).getTime();
      if (now - createdTime <= oneWeek) {
        thisWeekMins += mins;
      } else if (now - createdTime <= oneWeek * 2) {
        lastWeekMins += mins;
      }

      // 3. Feature usage for retention estimation
      if (lec.flashcards?.length) featuresUsedCount++;
      if (lec.quiz?.length) featuresUsedCount++;
      if (lec.summary?.length) featuresUsedCount++;
      if (lec.notes) featuresUsedCount++;
    });

    const hours = (totalMins / 60).toFixed(1);
    
    // Weekly trend
    let trend = 0;
    if (lastWeekMins === 0) {
      trend = thisWeekMins > 0 ? 100 : 0;
    } else {
      trend = Math.round(((thisWeekMins - lastWeekMins) / lastWeekMins) * 100);
    }
    
    // Goal constraint (e.g. 10 hours)
    const hoursProgress = Math.min(100, Math.round((totalMins / 600) * 100));

    // Retention Score heuristic: Base 65 + up to 33 pts from features
    const baseScore = lectures.length > 0 ? 65 : 0;
    const maxFeatures = lectures.length > 0 ? lectures.length * 4 : 1; 
    const scoreAdd = lectures.length > 0 ? Math.min(33, Math.round((featuresUsedCount / maxFeatures) * 33)) : 0;
    const retention = baseScore + scoreAdd;

    return { hours, trend, hoursProgress, retention };
  };

  const metrics = calculateMetrics();

  // Dynamic tags extraction
  const defaultTags = ["AI", "ML", "DB"];
  const lecTags = Array.from(new Set(lectures.map(l => l.topic_tag).filter(Boolean)));
  const displayTags = lecTags.length >= 3 ? lecTags.slice(0, 3) : [...lecTags, ...defaultTags].slice(0, 3);

  const dynamicRecent = [...lectures]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pt-28 px-8 pb-12 w-full max-w-7xl mx-auto space-y-12"
    >
      {/* Hero Section */}
      <motion.section variants={item} className="relative overflow-hidden rounded-lg p-12 bg-surface-container-low card-shadow-lg">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
          <div className="w-full h-full object-cover bg-gradient-to-br from-primary/40 to-secondary/20 blur-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface-container-low"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display text-6xl md:text-7xl font-black tracking-tighter text-on-surface mb-6 leading-none drop-shadow-sm">
            Evolve Your <br/><span className="text-gradient drop-shadow-lg drop-shadow-primary/20">Knowledge.</span>
          </h1>
          <p className="font-display text-xl text-on-surface-variant max-w-lg mb-8 leading-relaxed">
            Notify uses AI to transcribe and transform your lectures into smart summaries, interactive flashcards, and interconnected knowledge graphs. Ready for your next session?
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate("/record")}
              className="font-display px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Mic className="w-5 h-5" />
              Start New Recording
            </button>
            <button 
              onClick={() => navigate("/record", { state: { triggerUpload: true } })}
              className="font-display px-8 py-4 neo-glass text-on-surface rounded-xl font-bold flex items-center gap-2 hover:bg-surface-container-low transition-all border border-outline-variant/20"
            >
              <Upload className="w-5 h-5"/>
              Upload Audio
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stats Bento Grid */}
      <motion.section variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-glass border-t border-l border-outline-variant/20 p-8 group transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Clock className="text-primary w-6 h-6" />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${metrics.trend >= 0 ? "text-primary bg-primary/5" : "text-destructive bg-destructive/5"}`}>
              {metrics.trend >= 0 ? "+" : ""}{metrics.trend}% this week
            </span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm uppercase tracking-widest mb-1">Study Hours</h3>
          <p className="text-5xl font-bold text-on-surface tracking-tighter">{loading ? "-" : metrics.hours}</p>
          <div className="mt-6 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${metrics.hoursProgress}%` }}></div>
          </div>
        </div>

        <div className="neo-glass border-t border-l border-outline-variant/20 p-8 group transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary w-6 h-6"><path d="M11 2a2 2 0 1 0 2 0"/><path d="M4.605 18a9.98 9.98 0 0 1-2.483-5.26 1 1 0 0 1 .806-1.127l1.7-.33c.483-.092.83-.51.83-1V8.58A3.42 3.42 0 0 1 8.877 5.16l1.37-.2A2.88 2.88 0 0 0 12.5 2.1c1.37-.2 2.89.8 3.05 2.22l.6 5.4c.06.56.56 1 1.13 1h1.56a1 1 0 0 1 .98 1.18c-.76 4.39-4.32 7.79-8.82 8.1"/></svg>
            </div>
            <span className="text-xs font-bold text-secondary px-2 py-1 bg-secondary/5 rounded-full">Calculated Performance</span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm uppercase tracking-widest mb-1">Retention Score</h3>
          <p className="text-5xl font-bold text-on-surface tracking-tighter">{loading ? "-" : `${metrics.retention}%`}</p>
          <div className="mt-6 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full transition-all duration-1000" style={{ width: `${metrics.retention}%` }}></div>
          </div>
        </div>

        <div className="neo-glass border-t border-l border-outline-variant/20 p-8 group transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-tertiary/10 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tertiary w-6 h-6"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            </div>
            <span className="text-xs font-bold text-on-surface-variant px-2 py-1 bg-surface-container-lowest rounded-full">AI Indexed</span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm uppercase tracking-widest mb-1">Total Records</h3>
          <p className="text-5xl font-bold text-on-surface tracking-tighter">{loading ? "-" : lectures.length}</p>
          <div className="mt-6 flex gap-2">
            {displayTags.map(tag => (
              <div key={tag} className="px-2.5 py-1 rounded-md border border-outline-variant/30 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate max-w-[80px]">
                {tag.substring(0, 10)}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Bottom Content: Revision & Recent */}
      <motion.section variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Recordings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Recent Recordings</h2>
            <button onClick={() => navigate("/library")} className="text-primary font-bold text-sm hover:underline">View Library</button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-6 text-sm text-on-surface-variant font-semibold">Loading recent lectures...</div>
            ) : dynamicRecent.length === 0 ? (
              <div className="text-center py-6 text-sm text-on-surface-variant font-semibold">No recordings found. Create one to get started!</div>
            ) : dynamicRecent.map((lec) => (
              <div 
                key={lec.id} 
                onClick={() => navigate(`/lecture/${lec.id}`)}
                className="flex items-center gap-6 p-6 neo-glass border border-outline-variant/20 hover:bg-surface-container-low transition-all group cursor-pointer"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-surface-container-highest">
                  <span className="text-2xl font-black text-primary opacity-50">{lec.title.substring(0,2).toUpperCase()}</span>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-bold text-on-surface truncate pr-4">{lec.title}</h4>
                    <span className="text-xs text-on-surface-variant whitespace-nowrap">{new Date(lec.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-3 items-center mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      Processed
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Mic className="w-3 h-3"/> {lec.duration || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-surface-container-low rounded-lg text-primary"><Play className="w-5 h-5"/></button>
                  <button className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant"><MoreVertical className="w-5 h-5"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revision Plan Module */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Revision Plan</h2>
          <div className="neo-glass border-t border-l border-outline-variant/20 overflow-hidden flex flex-col h-full min-h-[400px]">
            {!loading && lectures.length > 0 ? (
              <RevisionPlan lectures={lectures.map((l: any) => ({ id: l.id, title: l.title }))} />
            ) : (
                <div className="p-6 text-sm text-on-surface-variant flex items-center justify-center h-full">
                    No revision plans yet
                </div>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
