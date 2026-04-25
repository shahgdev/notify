import React, { useState, useEffect } from "react";
import {
  Edit3,
  Check,
  Sparkles,
  Loader2,
  PenTool,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  LayoutTemplate,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateLectureNotes, generateLectureNotes, updateWhiteboardData } from "@/lib/api";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import CanvasEditor from "./canvas/CanvasEditor";
import CanvasReadOnlyOverlay from "./canvas/CanvasReadOnlyOverlay";

const NOTES_TEMPLATE = `<h2>Overview</h2><p>Summarize this lecture in your own words.</p>
<h2>Key takeaways</h2><ul><li></li><li></li><li></li></ul>
<h2>Detailed notes</h2><p></p>
<h2>Questions &amp; follow-ups</h2><p></p>`;

class ErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) return (
      <div className="m-4 rounded-2xl border border-red-300 bg-red-50 p-6 font-mono text-xs text-red-700">
        <h2 className="mb-2 text-sm font-bold">Editor error</h2>
        <pre className="whitespace-pre-wrap">{String(this.state.error)}</pre>
      </div>
    );
    return this.props.children;
  }
}

type NotesEditorProps = {
  lectureId: number;
  initialNotes: string;
  initialWhiteboardData?: any;
};

function FormatToolbar({ editor }: { editor: import("@tiptap/core").Editor }) {
  const btn = "rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors";
  const active = "bg-[#c0392b]/15 text-[#c0392b]";
  const idle = "text-[#5c5b57]/60 hover:bg-[#2c2b28]/8 hover:text-[#2c2b28]";
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button type="button" className={`${btn} ${editor.isActive("bold") ? active : idle}`} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></button>
      <button type="button" className={`${btn} ${editor.isActive("italic") ? active : idle}`} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></button>
      <span className="mx-1 h-4 w-px bg-[#2c2b28]/15" />
      <button type="button" className={`${btn} ${editor.isActive("heading", { level: 2 }) ? active : idle}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></button>
      <button type="button" className={`${btn} ${editor.isActive("heading", { level: 3 }) ? active : idle}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></button>
      <span className="mx-1 h-4 w-px bg-[#2c2b28]/15" />
      <button type="button" className={`${btn} ${editor.isActive("bulletList") ? active : idle}`} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></button>
      <button type="button" className={`${btn} ${editor.isActive("orderedList") ? active : idle}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></button>
    </div>
  );
}

export function NotesEditor({ lectureId, initialNotes, initialWhiteboardData }: NotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [canvasMode, setCanvasMode] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [editedNotes, setEditedNotes] = useState(notes);
  const [currentCanvasJSON, setCurrentCanvasJSON] = useState(initialWhiteboardData?.canvasJSON || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setNotes(initialNotes || ""); setEditedNotes(initialNotes || ""); }, [initialNotes]);
  useEffect(() => { setCurrentCanvasJSON(initialWhiteboardData?.canvasJSON || null); }, [initialWhiteboardData]);

  const toHtml = (md: string): string => {
    if (!md) return "";
    const trimmed = md.trimStart();
    const looksLikeHtml = /^<(h[1-6]|p|ul|ol|li|div|table|blockquote|pre|code|strong|em|a)[\s>]/i.test(trimmed);
    return looksLikeHtml ? md : (marked.parse(md) as string);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    ],
    content: notes ? toHtml(notes) : "",
    editable: isEditing,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none w-full outline-none min-h-[60vh] " +
          "prose-headings:font-headline prose-headings:tracking-tight prose-headings:text-[#1a1a2e] prose-headings:font-black " +
          "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-8 prose-h1:pb-2 prose-h1:border-b prose-h1:border-[#c0392b]/20 " +
          "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-8 prose-h2:text-[#1a1a2e] " +
          "prose-h3:text-base prose-h3:mb-2 prose-h3:mt-6 prose-h3:text-[#2c3e50] " +
          "prose-p:text-[#2c2b28] prose-p:leading-[2rem] prose-p:text-[15.5px] prose-p:my-0 " +
          "prose-li:text-[#2c2b28] prose-li:leading-[2rem] prose-li:text-[15px] " +
          "prose-strong:text-[#1a1a2e] prose-strong:font-bold " +
          "prose-em:text-[#2c2b28] prose-em:italic " +
          "prose-table:text-sm prose-th:bg-[#f0ede6] prose-th:text-[#1a1a2e] prose-th:font-bold prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-[#2c2b28]/15 prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-[#2c2b28]/10 prose-td:text-[#2c2b28] " +
          "prose-blockquote:border-l-4 prose-blockquote:border-[#c0392b]/40 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[#5c5b57] " +
          "prose-ul:my-1 prose-ol:my-1 [&_img]:hidden",
      },
    },
    onUpdate: ({ editor: ed }) => setEditedNotes(ed.getHTML()),
  });

  useEffect(() => { if (editor) editor.setEditable(isEditing); }, [isEditing, editor]);
  useEffect(() => {
    if (!editor || !notes) return;
    const html = toHtml(notes);
    if (html !== editor.getHTML()) editor.commands.setContent(html);
  }, [notes, editor]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const resp = await generateLectureNotes(lectureId);
      setNotes(resp.notes); setEditedNotes(resp.notes);
      toast({ title: "Generated", description: "Notes generated successfully!" });
    } catch { toast({ title: "Error", description: "Failed to generate notes.", variant: "destructive" }); }
    finally { setIsGenerating(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLectureNotes(lectureId, editedNotes);
      setNotes(editedNotes); setIsEditing(false);
      toast({ title: "Saved", description: "Notes saved." });
    } catch { toast({ title: "Error", description: "Failed to save.", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const cancelEdit = () => {
    setEditedNotes(notes);
    if (editor) editor.commands.setContent(toHtml(notes) || "");
    setIsEditing(false);
  };

  const saveCanvas = async (json: any) => {
    setIsSaving(true);
    setCurrentCanvasJSON(json);
    try {
      await updateWhiteboardData(lectureId, { canvasJSON: json });
      toast({ title: "Canvas saved" });
    } catch { toast({ title: "Error", description: "Failed to save canvas.", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const hasCanvas = currentCanvasJSON && typeof currentCanvasJSON === "object" && Object.keys(currentCanvasJSON).length > 0;
  const hasWrittenNotes = Boolean(notes?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim());

  if (canvasMode) {
    return (
      <CanvasEditor
        noteContent={editor?.getHTML() || toHtml(notes) || ""}
        savedCanvas={currentCanvasJSON}
        onSave={(json) => { saveCanvas(json); setCanvasMode(false); }}
        onClose={() => setCanvasMode(false)}
      />
    );
  }

  return (
    <div className="space-y-0">

      {/* ── Notebook cover / spine ── */}
      <div
        className="flex items-center justify-between rounded-t-2xl px-6 py-3"
        style={{ background: "linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%)" }}
      >
        {/* Spine label */}
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-white/60" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
            Study Notes
          </span>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/70 hover:bg-white/20 hover:text-white transition-all"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setCanvasMode(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-blue-300 hover:bg-blue-400/20 transition-all"
              >
                <PenTool className="h-3.5 w-3.5" />
                {hasCanvas ? "Edit Canvas" : "Canvas"}
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button type="button" onClick={cancelEdit} disabled={isSaving} className="rounded-xl border border-white/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/50 hover:bg-white/10">Cancel</button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-green-500 transition-all">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Notebook page — isolated from dark mode CSS variables ── */}
      <div
        data-theme="light"
        className="relative overflow-hidden rounded-b-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
        style={{
          background: "#faf9f5",
          color: "#2c2b28",
          backgroundImage: [
            "repeating-linear-gradient(transparent, transparent 31px, #c8cdd8 31px, #c8cdd8 32px)",
            "linear-gradient(90deg, transparent 64px, #f5a9a9 64px, #f5a9a9 65px, transparent 65px)",
          ].join(", "),
        }}
      >
        {/* Spiral holes (decorative) */}
        <div className="pointer-events-none absolute left-5 top-6 flex flex-col gap-[32px] opacity-40">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="h-5 w-5 rounded-full border-2 border-[#2c2b28]/20 bg-[#e8e4dc] shadow-inner" />
          ))}
        </div>

        {/* Format toolbar — shown when editing */}
        {isEditing && editor && (
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#2c2b28]/10 bg-[#f5f4f0]/95 py-2 pl-[80px] pr-6 backdrop-blur-sm">
            <FormatToolbar editor={editor} />
            <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-[#c0392b]/60">Editing</span>
          </div>
        )}

        {/* Page content — indented past margin line */}
        <div className="pl-[80px] pr-8 pt-6 pb-16 md:pr-16">
          {hasWrittenNotes || isEditing ? (
            <div className="relative">
              {editor && <EditorContent editor={editor} />}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border-2 border-dashed border-[#2c2b28]/15">
                <BookOpen className="h-9 w-9 text-[#2c2b28]/20" />
              </div>
              <p className="mb-1 text-lg font-black text-[#2c2b28]/30 tracking-tight">This page is empty</p>
              <p className="mb-8 text-sm text-[#2c2b28]/25">Generate AI notes or write your own</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-opacity"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGenerating ? "Generating…" : "Generate AI Notes"}
                </button>
                <button
                  type="button"
                  onClick={() => { setNotes(NOTES_TEMPLATE); setEditedNotes(NOTES_TEMPLATE); setIsEditing(true); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#2c2b28]/20 px-5 py-3 text-xs font-black uppercase tracking-widest text-[#2c2b28]/60 hover:bg-[#2c2b28]/5 transition-colors"
                >
                  <LayoutTemplate className="h-4 w-4" /> Start from outline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas preview strip — shown below notes if canvas exists */}
        {hasCanvas && (
          <div className="border-t border-[#c8cdd8] pl-[80px] pr-8 md:pr-16 py-4 bg-[#f0ede6]/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5c5b57]/40 flex items-center gap-2">
                <PenTool className="h-3 w-3" /> Canvas drawings
              </span>
              <button
                type="button"
                onClick={() => setCanvasMode(true)}
                className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]/50 hover:text-[#2c3e50] underline underline-offset-2 transition-colors"
              >
                Edit canvas
              </button>
            </div>
            <div className="relative h-64 w-full rounded-xl overflow-hidden border border-[#2c2b28]/10 bg-white/50">
              <CanvasReadOnlyOverlay canvasJSON={currentCanvasJSON} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotesEditorWrapper(props: NotesEditorProps) {
  return (
    <ErrorBoundary>
      <NotesEditor {...props} />
    </ErrorBoundary>
  );
}
