import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, Dumbbell, BarChart3, Library } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { getLectures } from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/learn", icon: BookOpen, label: "Learn" },
  { to: "/practice", icon: Dumbbell, label: "Practice" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/library", icon: Library, label: "Library" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { setGlobalProcessing } = useAppStore();
  const { toast } = useToast();
  const processingIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const lectures = await getLectures();
        const currentProcessing = new Set<number>();
        let hasProcessing = false;

        lectures.forEach((l: any) => {
          if (
            l.transcript === "Processing..." || 
            l.transcript === "Extracting text..." || 
            (l.transcript && l.transcript.startsWith("Downloading audio"))
          ) {
            currentProcessing.add(l.id);
            hasProcessing = true;
          }
        });

        // check if any of the previously processing ones have finished
        processingIds.current.forEach(id => {
          if (!currentProcessing.has(id)) {
            const finishedLecture = lectures.find((l: any) => l.id === id);
            // It could be missing if deleted, but if it's there, it means it completed
            if (finishedLecture) {
              toast({ 
                title: "Processing Complete", 
                description: `"${finishedLecture.title}" has successfully finished processing.` 
              });
            }
          }
        });

        processingIds.current = currentProcessing;
        setGlobalProcessing(hasProcessing);
      } catch (err) {
        // silently fail polling if network error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [setGlobalProcessing, toast]);

  return (
    <div className="min-h-[100dvh] bg-background transition-colors duration-300 pb-20">
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-5xl mx-auto">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-md border-t border-border/30 pb-safe">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-around py-3">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.to;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="relative flex flex-col items-center gap-0.5 px-4 py-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-2 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon
                  className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-300"
                    }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-300"
                    }`}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
