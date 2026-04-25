import { useState, useEffect } from "react";
import { getLectures } from "@/lib/api";
import { Loader2, BookOpen } from "lucide-react";
import UnifiedStudyView from "@/components/UnifiedStudyView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Learn() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLectures();
        setLectures(data);
        if (data.length > 0) {
          setSelectedLectureId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-5">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
          <BookOpen className="h-9 w-9 text-primary/40" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">No Notes Yet</h3>
        <p className="text-sm text-muted-foreground font-medium">Record or process your first lecture to start studying!</p>
      </div>
    );
  }

  const selectedLecture = lectures.find(l => l.id === selectedLectureId) || lectures[0];

  return (
    <div className="min-h-[100dvh] pb-24">
      <div className="border-b border-border/30 px-5 pt-8 pb-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight mb-4">Learn</h1>
        
        {/* Lecture Selector Context */}
        <div className="w-full max-w-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">Context</p>
            <Select
              value={String(selectedLectureId ?? lectures[0]?.id ?? "")}
              onValueChange={(v) => setSelectedLectureId(Number(v))}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl border-border/40 bg-muted/30 px-4 text-sm font-semibold shadow-none focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Choose a lecture" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                {lectures.map((l) => (
                  <SelectItem
                    key={l.id}
                    value={String(l.id)}
                    className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                  >
                    {l.title || "Untitled Lecture"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>
      
      <div className="p-5 max-w-3xl mx-auto mt-2">
         <UnifiedStudyView key={selectedLecture.id} lecture={selectedLecture} />
      </div>
    </div>
  );
}
