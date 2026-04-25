import { motion, AnimatePresence } from "framer-motion";
import { FileAudio, ChevronRight, Search, Plus, Hash, Folder, X, MoreVertical, Menu, Trash2, LayoutGrid, List, AlignJustify, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getLectures, getSubjects, createSubject, deleteSubject, updateLectureSubject, deleteLecture, renameLecture } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function LibraryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [lectures, setLectures] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">(() => {
    return (localStorage.getItem("library-view") as any) || "grid";
  });
  const [renamingLecture, setRenamingLecture] = useState<{ id: number; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const setView = (v: "grid" | "list" | "compact") => {
    setViewMode(v);
    localStorage.setItem("library-view", v);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const lPromise = getLectures().catch(e => []);
      const sPromise = getSubjects().catch(e => []);
      const [lData, sData] = await Promise.all([lPromise, sPromise]);
      setLectures(Array.isArray(lData) ? lData : []);
      setSubjects(Array.isArray(sData) ? sData : []);
    } catch (err) {
      setLectures([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      await createSubject(newSubjectName.trim());
      setNewSubjectName("");
      setIsAddingSubject(false);
      await fetchData();
      toast({ title: "Subject Added", description: `"${newSubjectName}" is now available.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create subject.", variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure? Lectures will remain but won't have a category.")) return;
    try {
      await deleteSubject(id);
      if (selectedSubjectId === id) setSelectedSubjectId(null);
      await fetchData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
    }
  };

  const handleMoveToSubject = async (lectureId: number, subjectId: number | null) => {
    try {
      await updateLectureSubject(lectureId, subjectId);
      await fetchData();
      toast({ title: "Updated", description: "Lecture categorization updated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update category.", variant: "destructive" });
    }
  };

  const handleDeleteLecture = async (e: React.MouseEvent, lectureId: number, title: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteLecture(String(lectureId));
      setLectures((prev) => prev.filter((l) => l.id !== lectureId));
      toast({ title: "Deleted", description: `"${title}" has been removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete lecture.", variant: "destructive" });
    }
  };

  const triggerRename = (e: React.MouseEvent, lectureId: number, currentTitle: string) => {
    e.stopPropagation();
    setRenamingLecture({ id: lectureId, title: currentTitle });
    setNewTitle(currentTitle);
  };

  const executeRename = async () => {
    if (!renamingLecture) return;
    const next = newTitle.trim();
    if (!next || next === renamingLecture.title) {
       setRenamingLecture(null);
       return;
    }
    try {
      await renameLecture(renamingLecture.id, next);
      setLectures((prev) =>
        prev.map((l) => (l.id === renamingLecture.id ? { ...l, title: next } : l))
      );
      toast({ title: "Updated", description: "Lecture title saved." });
    } catch {
      toast({ title: "Error", description: "Could not rename lecture.", variant: "destructive" });
    } finally {
      setRenamingLecture(null);
    }
  };

  const filtered = (lectures || []).filter((l) => {
    const matchesSearch = (l.title || "").toLowerCase().includes(query.toLowerCase());
    if (selectedSubjectId === null) return matchesSearch;
    if (selectedSubjectId === -1) return matchesSearch && !l.subject_id;
    return matchesSearch && l.subject_id === selectedSubjectId;
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface-container p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
          Library
        </h2>
        <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-1 rounded-full hover:bg-surface-container-low text-on-surface">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
        <button
          onClick={() => { setSelectedSubjectId(null); setShowMobileSidebar(false); }}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-headline tracking-wide transition-all duration-200 ${selectedSubjectId === null ? "bg-primary-container text-on-surface shadow-[0_0_15px_rgba(109,40,217,0.3)]" : "hover:bg-surface-container-lowest text-on-surface-variant"}`}
        >
          <Folder className="h-4 w-4" />
          All Lectures
        </button>

        <button
          onClick={() => { setSelectedSubjectId(-1); setShowMobileSidebar(false); }}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-headline tracking-wide transition-all duration-200 ${selectedSubjectId === -1 ? "bg-primary-container text-on-surface shadow-[0_0_15px_rgba(109,40,217,0.3)]" : "hover:bg-surface-container-lowest text-on-surface-variant"}`}
        >
          <Hash className="h-4 w-4" />
          Uncategorized
        </button>

        <div className="my-6 border-t border-outline-variant/10" />

        <h2 className="mb-3 font-headline text-[10px] uppercase font-bold tracking-widest text-on-surface-variant px-4">
          Folders
        </h2>

        <div className="space-y-1">
          {subjects.map((s) => (
            <div key={s.id} className="group relative">
              <button
                onClick={() => { setSelectedSubjectId(s.id); setShowMobileSidebar(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-headline tracking-wide transition-all duration-200 ${selectedSubjectId === s.id ? "bg-primary-container text-on-surface shadow-[0_0_15px_rgba(109,40,217,0.3)]" : "hover:bg-surface-container-lowest text-on-surface-variant"}`}
              >
                <Folder className="h-4 w-4 opacity-70" />
                <span className="truncate">{s.name}</span>
              </button>
              <button
                onClick={(e) => handleDeleteSubject(e, s.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:text-error hover:bg-error/10 text-on-surface-variant rounded-lg"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 mt-auto">
        {isAddingSubject ? (
          <div className="space-y-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
            <input
              autoFocus
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              placeholder="Folder name..."
              className="w-full bg-surface-container text-sm rounded-lg px-3 py-2 outline-none border border-outline-variant/15 text-on-surface focus:border-primary/50 transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={handleAddSubject} className="flex-1 rounded-lg bg-primary text-on-primary px-3 py-1.5 text-xs font-bold transition-all hover:brightness-110">Add</button>
              <button onClick={() => setIsAddingSubject(false)} className="flex-1 rounded-lg bg-surface-container-lowest text-on-surface-variant px-3 py-1.5 text-xs font-bold transition-all hover:bg-surface-container-low">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingSubject(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-4 py-3 text-xs font-bold text-primary hover:bg-surface-container-low transition-all uppercase tracking-widest font-headline"
          >
            <Plus className="h-4 w-4" />
            Create Folder
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-surface items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 z-10 border-r border-outline-variant/15">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-[280px] h-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        {/* Responsive Header */}
        <header className="flex-shrink-0 px-6 md:px-12 pt-12 pb-6 flex flex-col gap-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container-low transition-colors text-on-surface"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight text-on-surface truncate max-w-[200px] sm:max-w-md">
                  {selectedSubjectId === null ? "My Library" :
                    selectedSubjectId === -1 ? "Uncategorized" :
                      subjects.find(s => s.id === selectedSubjectId)?.name || "Library"}
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-2">
                  {filtered.length} total items
                </p>
              </div>
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-surface-container-lowest border border-outline-variant/15 rounded-xl">
              <button
                onClick={() => setView("grid")}
                title="Grid view"
                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                title="List view"
                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("compact")}
                title="Compact view"
                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                  viewMode === "compact"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <AlignJustify className="h-4 w-4" />
              </button>
            </div>
          </div>

          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-6 py-4 backdrop-blur-xl focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(109,40,217,0.2)] transition-all duration-300"
          >
            <Search className="h-5 w-5 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title..."
              className="flex-1 bg-transparent text-sm md:text-base outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface"
            />
          </motion.div>
        </header>

        {/* Dynamic List/Grid Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-32 scrollbar-hide">
          <AnimatePresence mode="wait">
            {/* ── GRID VIEW ── */}
            {viewMode === "grid" && (
              <motion.div
                key="grid"
                variants={container}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
              >
                {filtered.map((lec) => (
                  <motion.div
                    key={lec.id}
                    variants={item}
                    className="group relative flex flex-col neo-glass p-5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/lecture/${lec.id}`)}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest border border-outline-variant/10 group-hover:shadow-[0_0_15px_rgba(76,215,246,0.2)] transition-all duration-300">
                          <FileAudio className="h-6 w-6 text-secondary group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button onClick={(e) => e.stopPropagation()} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 bg-surface-container-high backdrop-blur-xl border border-outline-variant/20 shadow-2xl">
                              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Manage</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigate(`/lecture/${lec.id}`)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">Open Detail</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => triggerRename(e, lec.id, lec.title)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                                <Pencil className="mr-2 h-4 w-4 text-on-surface-variant" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 border-outline-variant/10" />
                              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Move to</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleMoveToSubject(lec.id, null)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                                <Folder className="mr-2 h-4 w-4 text-on-surface-variant" /> Uncategorized
                              </DropdownMenuItem>
                              {subjects.map((sub) => (
                                <DropdownMenuItem key={sub.id} onClick={() => handleMoveToSubject(lec.id, sub.id)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                                  <Hash className="mr-2 h-4 w-4 text-on-surface-variant" /> {sub.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator className="my-1 border-outline-variant/10" />
                              <DropdownMenuItem onClick={(e) => handleDeleteLecture(e, lec.id, lec.title)} className="rounded-xl px-3 py-2 font-body font-medium cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400 focus:bg-red-500/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Lecture
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-lg font-bold font-headline text-on-surface leading-tight tracking-tight mb-1 group-hover:text-primary transition-colors">{lec.title}</h3>
                        {lec.topic_tag ? <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">[{lec.topic_tag}]</p> : <div className="mb-2" />}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-container-lowest text-on-surface-variant border border-outline-variant/10">{new Date(lec.created_at).toLocaleDateString()}</span>
                          {lec.subject_id && subjects.find(s => s.id === lec.subject_id) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">{subjects.find(s => s.id === lec.subject_id)?.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between group/arrow">
                      <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface transition-colors tracking-wide uppercase">Open</span>
                      <div className="h-6 w-6 rounded-full bg-surface-container-lowest flex items-center justify-center group-hover/arrow:bg-primary group-hover/arrow:text-on-primary transition-all duration-300">
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── LIST VIEW ── */}
            {viewMode === "list" && (
              <motion.div
                key="list"
                variants={container}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                className="flex flex-col gap-3"
              >
                {filtered.map((lec) => (
                  <motion.div
                    key={lec.id}
                    variants={item}
                    className="group flex items-center gap-5 neo-glass px-6 py-4 hover:bg-surface-container-low/60 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/lecture/${lec.id}`)}
                  >
                    {/* Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest border border-outline-variant/10 group-hover:shadow-[0_0_12px_rgba(76,215,246,0.2)] transition-all">
                      <FileAudio className="h-5 w-5 text-secondary" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold font-headline text-on-surface text-base truncate group-hover:text-primary transition-colors">{lec.title}</h3>
                        {lec.topic_tag && <span className="text-[10px] font-bold text-secondary uppercase tracking-widest shrink-0">[{lec.topic_tag}]</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-on-surface-variant">{new Date(lec.created_at).toLocaleDateString()}</span>
                        {lec.subject_id && subjects.find(s => s.id === lec.subject_id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">{subjects.find(s => s.id === lec.subject_id)?.name}</span>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronRight className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button onClick={(e) => e.stopPropagation()} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 bg-surface-container-high backdrop-blur-xl border border-outline-variant/20 shadow-2xl">
                          <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Manage</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/lecture/${lec.id}`)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">Open Detail</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => triggerRename(e, lec.id, lec.title)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                            <Pencil className="mr-2 h-4 w-4 text-on-surface-variant" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 border-outline-variant/10" />
                          <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Move to</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleMoveToSubject(lec.id, null)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                            <Folder className="mr-2 h-4 w-4 text-on-surface-variant" /> Uncategorized
                          </DropdownMenuItem>
                          {subjects.map((sub) => (
                            <DropdownMenuItem key={sub.id} onClick={() => handleMoveToSubject(lec.id, sub.id)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                              <Hash className="mr-2 h-4 w-4 text-on-surface-variant" /> {sub.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator className="my-1 border-outline-variant/10" />
                          <DropdownMenuItem onClick={(e) => handleDeleteLecture(e, lec.id, lec.title)} className="rounded-xl px-3 py-2 font-body font-medium cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400 focus:bg-red-500/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Lecture
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── COMPACT VIEW ── */}
            {viewMode === "compact" && (
              <motion.div
                key="compact"
                variants={container}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                className="flex flex-col divide-y divide-outline-variant/10 rounded-2xl overflow-hidden border border-outline-variant/15 bg-surface-container-lowest"
              >
                {filtered.map((lec) => (
                  <motion.div
                    key={lec.id}
                    variants={item}
                    className="group flex items-center gap-4 px-5 py-3 hover:bg-surface-container-low/70 transition-all duration-150 cursor-pointer"
                    onClick={() => navigate(`/lecture/${lec.id}`)}
                  >
                    <FileAudio className="h-4 w-4 text-secondary shrink-0" />
                    <span className="flex-1 min-w-0 font-medium text-sm text-on-surface truncate group-hover:text-primary transition-colors font-headline">{lec.title}</span>
                    {lec.topic_tag && <span className="text-[10px] font-bold text-secondary uppercase tracking-widest shrink-0 hidden sm:block">[{lec.topic_tag}]</span>}
                    <span className="text-[11px] text-on-surface-variant shrink-0">{new Date(lec.created_at).toLocaleDateString()}</span>
                    {lec.subject_id && subjects.find(s => s.id === lec.subject_id) && (
                      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shrink-0">{subjects.find(s => s.id === lec.subject_id)?.name}</span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button onClick={(e) => e.stopPropagation()} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant opacity-0 group-hover:opacity-100 shrink-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 bg-surface-container-high backdrop-blur-xl border border-outline-variant/20 shadow-2xl">
                        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Manage</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/lecture/${lec.id}`)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">Open Detail</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => triggerRename(e, lec.id, lec.title)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                          <Pencil className="mr-2 h-4 w-4 text-on-surface-variant" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 border-outline-variant/10" />
                        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Move to</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleMoveToSubject(lec.id, null)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                          <Folder className="mr-2 h-4 w-4 text-on-surface-variant" /> Uncategorized
                        </DropdownMenuItem>
                        {subjects.map((sub) => (
                          <DropdownMenuItem key={sub.id} onClick={() => handleMoveToSubject(lec.id, sub.id)} className="rounded-xl px-3 py-2 font-body font-medium hover:bg-surface-container-lowest cursor-pointer text-on-surface">
                            <Hash className="mr-2 h-4 w-4 text-on-surface-variant" /> {sub.name}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-1 border-outline-variant/10" />
                        <DropdownMenuItem onClick={(e) => handleDeleteLecture(e, lec.id, lec.title)} className="rounded-xl px-3 py-2 font-body font-medium cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400 focus:bg-red-500/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Lecture
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="h-32 w-32 rounded-full bg-surface-container border border-outline-variant/10 flex items-center justify-center mb-8 shadow-inner relative">
                <div className="absolute inset-0 bg-primary/10 blur-[30px] rounded-full"></div>
                <Search className="h-12 w-12 text-primary opacity-50 relative z-10" />
              </div>
              <h3 className="text-2xl font-headline font-black text-on-surface mb-2 tracking-tight">Ethereal Silence</h3>
              <p className="text-sm font-medium text-on-surface-variant max-w-[300px] leading-relaxed mx-auto">
                {selectedSubjectId ? "This zone is currently empty." : "No nodes recorded yet. Initiate your first capture."}
              </p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={renamingLecture !== null} onOpenChange={(open) => !open && setRenamingLecture(null)}>
        <DialogContent className="sm:max-w-[425px] border-outline-variant/30 bg-surface-container-high text-on-surface">
          <DialogHeader>
            <DialogTitle>Rename Lecture</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeRename()}
              className="bg-surface-container text-on-surface border-outline-variant/30"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenamingLecture(null)}>Cancel</Button>
            <Button onClick={executeRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
