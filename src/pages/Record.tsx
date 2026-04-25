import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Play, Square, Upload } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { processLecture, getSubjects, processDocument, processYoutubeLink } from "@/lib/api";
import { Loader2 } from "lucide-react";

type RecState = "idle" | "recording" | "paused" | "done";

export default function RecordPage() {
  const [state, setState] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [inputType, setInputType] = useState<"none"|"youtube">("none");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    if (location.state?.triggerUpload && fileInputRef.current) {
      // Clear the state so it doesn't re-trigger on remounts
      navigate("/record", { replace: true, state: {} });
      fileInputRef.current.click();
    }
  }, [location.state, navigate]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const title = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
        await processDocument(file, title, "English", "English", "English", selectedSubjectId || undefined);
        toast({
          title: "Document Uploaded",
          description: `Your document "${title}" is being processed.`,
        });
        navigate("/library");
      } catch (err) {
        toast({
          title: "Upload Failed",
          description: "There was an error uploading your document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleYoutubeProcess = async () => {
    if (!youtubeUrl) return;
    setIsProcessing(true);
    try {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      const prefix = subject ? `${subject.name} - ` : "";
      const dateStr = new Date().toLocaleDateString();
      const title = `${prefix}YouTube Video ${dateStr}`;
      
      await processYoutubeLink(youtubeUrl, title, "English", "English", "English", selectedSubjectId || undefined);
      toast({
        title: "YouTube Video Added",
        description: `Video requires background processing.`,
      });
      navigate("/library");
    } catch (err) {
      toast({
        title: "Process Failed",
        description: "There was an error importing the YouTube video. Check URL.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audioBlobRef.current = file;
      setFileSize(formatBytes(file.size));
      setState("done");
      setElapsed(0);
    }
  };

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => {
    stopTimer();
    // Clean up media stream on unmount
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, [stopTimer]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        audioBlobRef.current = blob;
        setFileSize(formatBytes(blob.size));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect data every second
      setState("recording");
      setElapsed(0);
      setFileSize(null);
      startTimer();
    } catch (err) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record lectures.",
        variant: "destructive",
      });
    }
  };

  const handlePause = () => {
    mediaRecorderRef.current?.pause();
    setState("paused");
    stopTimer();
  };

  const handleResume = () => {
    mediaRecorderRef.current?.resume();
    setState("recording");
    startTimer();
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    setState("done");
    stopTimer();
  };

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };
    fetchSubjects();
  }, []);

  const handleProcess = async () => {
    if (!audioBlobRef.current) return;

    setIsProcessing(true);
    try {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      const prefix = subject ? `${subject.name} - ` : "";
      const dateStr = new Date().toLocaleDateString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const title = `${prefix}Lecture ${dateStr} ${timeStr}`;

      await processLecture(audioBlobRef.current, title, "English", "English", "English", selectedSubjectId || undefined);
      toast({
        title: "Lecture Saved",
        description: `Your lecture "${title}" is being processed.`,
      });
      navigate("/library");
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your lecture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-5 pt-14">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 text-4xl font-black font-display tracking-tight text-gradient"
      >
        {state === "idle"
          ? "Record Lecture"
          : state === "done"
            ? "Recording Complete"
            : "Recording..."}
      </motion.h1>
      <p className="mb-14 text-sm font-semibold tracking-wide text-muted-foreground/80 uppercase">
        {state === "idle"
          ? "Tap the mic to start"
          : state === "done"
            ? `Duration: ${fmt(elapsed)}${fileSize ? ` • ${fileSize}` : ""}`
            : "Tap to pause or stop"}
      </p>

      {/* Timer */}
      <AnimatePresence mode="wait">
        {state !== "idle" && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-10 text-5xl font-bold font-display tabular-nums"
          >
            {fmt(elapsed)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      {state === "idle" && (
        <div className="relative mb-12 flex items-center justify-center group">
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl transition-transform duration-[2s] group-hover:scale-125 group-active:scale-95" />
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-110 animate-[pulse-ring_3s_ease-out_infinite]" />
          <div className="absolute inset-0 rounded-full border border-primary/10 scale-125 animate-[pulse-ring_3s_ease-out_infinite_1s]" />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleStart}
            className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(250,80%,60%)] text-white shadow-[0_20px_40px_-15px_rgba(var(--primary),0.6)] border border-white/20 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-full border border-white/40 mix-blend-overlay shadow-inner" />
            <Mic className="h-12 w-12 drop-shadow-lg" />
          </motion.button>
        </div>
      )}

      {(state === "recording" || state === "paused") && (
        <div className="mb-6 flex items-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={state === "recording" ? handlePause : handleResume}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            {state === "recording" ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleStop}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <Square className="h-8 w-8" />
          </motion.button>
        </div>
      )}

      {state === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-xs flex-col gap-4"
        >
          {/* Subject Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">
              Assign to Subject (Optional)
            </label>
            <select
              value={selectedSubjectId || ""}
              onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary outline-none transition-colors appearance-none"
            >
              <option value="">No Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isProcessing ? "Uploading..." : "Process Lecture"}
          </button>
          <button
            onClick={() => {
              setState("idle");
              setElapsed(0);
            }}
            className="rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold"
          >
            Discard & Restart
          </button>
        </motion.div>
      )}

    {state === "idle" && (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-6 text-center w-full max-w-md mx-auto"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
            — or import content —
          </p>
          
          <div className="flex flex-col gap-3">
            {inputType === "none" && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="neo-button px-6 py-3 text-sm font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 mx-auto text-on-surface w-full max-w-[280px] justify-center"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  Upload Audio/Video
                </button>

                <button
                  onClick={() => setInputType("youtube")}
                  className="neo-button px-6 py-3 text-sm font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 mx-auto text-on-surface w-full max-w-[280px] justify-center"
                >
                  <YoutubeIcon className="w-4 h-4 text-red-500" />
                  Import from YouTube
                </button>

                <button
                  onClick={() => documentInputRef.current?.click()}
                  className="neo-button px-6 py-3 text-sm font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 mx-auto text-on-surface w-full max-w-[280px] justify-center"
                >
                  <FileTextIcon className="w-4 h-4 text-blue-500" />
                  Upload Document (PDF/Doc/PPT)
                </button>
              </>
            )}

            {inputType === "youtube" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-3 items-center">
                <input 
                  type="text" 
                  value={youtubeUrl} 
                  onChange={e => setYoutubeUrl(e.target.value)} 
                  placeholder="Paste YouTube URL here..." 
                  className="w-full max-w-[300px] rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                />
                <div className="flex gap-2">
                  <button onClick={handleYoutubeProcess} disabled={isProcessing || !youtubeUrl} className="rounded-xl flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-70">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Process Video
                  </button>
                  <button onClick={() => setInputType("none")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <input
            type="file"
            accept="audio/*,video/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            ref={documentInputRef}
            onChange={handleDocumentUpload}
            className="hidden"
          />
        </motion.div>
      )}
    </div>
  );
}

// Quick icons
function YoutubeIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
}

function FileTextIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
}
