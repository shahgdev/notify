import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Settings, Bell, HelpCircle } from "lucide-react";
import { getLectures } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Settings, label: "Settings" },
  { icon: Bell, label: "Notifications" },
  { icon: HelpCircle, label: "Help & Support" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getLectures()
      .then((data) => {
        setLectures(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard lectures", err);
        setLoading(false);
      });
  }, []);

  // Compute Total Study Hours dynamically
  const calculateTotalHours = () => {
    let totalMins = 0;
    lectures.forEach((lec) => {
      const dur = (lec.duration || "").toLowerCase();
      let h = 0;
      let m = 0;
      const hMatch = dur.match(/(\d+)\s*h/);
      if (hMatch) h = parseInt(hMatch[1], 10);
      const mMatch = dur.match(/(\d+)\s*min/);
      if (mMatch) m = parseInt(mMatch[1], 10);
      totalMins += (h * 60) + m;
    });
    return (totalMins / 60).toFixed(1);
  };

  // Compute Total Practice Cards dynamically
  const calculateTotalPracticeItems = () => {
    let total = 0;
    lectures.forEach((lec) => {
      if (lec.flashcards) total += lec.flashcards.length;
      if (lec.quiz) total += lec.quiz.length;
    });
    return total;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-5 pt-14 pb-4"
    >
      <motion.h1 variants={item} className="mb-8 text-2xl font-bold font-display">
        Profile
      </motion.h1>

      {/* Avatar */}
      <motion.div
        variants={item}
        className="mb-8 flex flex-col items-center"
      >
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
          <User className="h-8 w-8 text-accent-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Student</h2>
        <p className="text-sm text-muted-foreground">student@notify.app</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={item}
        className="mb-6 grid grid-cols-3 gap-3 rounded-[24px] bg-card p-4 card-shadow border border-border/40 hover:border-primary/20 transition-colors"
      >
        {loading ? (
          <div className="col-span-3 flex justify-center py-4">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          [
            { label: "Lectures", val: lectures.length.toString() },
            { label: "Hours", val: calculateTotalHours() },
            { label: "Practice Items", val: calculateTotalPracticeItems().toString() },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black font-display text-primary">{s.val}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-1">{s.label}</p>
            </div>
          ))
        )}
      </motion.div>

      {/* Menu */}
      <div className="space-y-1">
        {menuItems.map((m) => (
          <motion.button
            key={m.label}
            variants={item}
            onClick={() => toast({ title: m.label, description: "This feature is coming in a future update." })}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <m.icon className="h-5 w-5 text-muted-foreground" />
            {m.label}
          </motion.button>
        ))}
        <motion.button
          variants={item}
          onClick={() => {
             toast({ title: "Logged Out", description: "You have been logged out successfully." });
             navigate("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </motion.button>
      </div>
    </motion.div>
  );
}
