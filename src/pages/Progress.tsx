import { useState, useEffect, useMemo } from "react";
import { getLectures } from "@/lib/api";
import { Loader2, BarChart3 } from "lucide-react";
import ProgressReport from "@/components/ProgressReport";

export default function Progress() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLectures();
        setLectures(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allFlashcards = useMemo(() => {
     let fc: any[] = [];
     for (const l of lectures) {
         if (l.flashcards) fc = fc.concat(l.flashcards);
     }
     return fc;
  }, [lectures]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (allFlashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-5">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
          <BarChart3 className="h-9 w-9 text-primary/40" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">No Tracking Data</h3>
        <p className="text-sm text-muted-foreground font-medium">Record or process a lecture to start building your memory profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-24">
      <div className="border-b border-border/30 px-5 py-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight">Global Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your memory across all subjects.
        </p>
      </div>
      
      <div className="p-5 max-w-3xl mx-auto">
         {/* lectureId=0 signifies the global unified session tracker! */}
         <ProgressReport lectureId={0} cards={allFlashcards} />
      </div>
    </div>
  );
}
