import { create } from 'zustand';

export interface Section {
  heading: string;
  content: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface ProcessedContent {
  full_notes: Section[];
  simplified: Section[];
  key_points: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  difficulty_score: number;
}

export type PracticeItem =
  | { type: 'flashcard'; data: Flashcard; id: string }
  | { type: 'quiz'; data: QuizQuestion; id: string };

export interface SessionResult {
  itemId: string;
  itemType: 'flashcard' | 'quiz';
  correct: boolean;
  skipped: boolean;
  timeSpentMs: number;
}

export interface PracticeSession {
  items: PracticeItem[];
  currentIndex: number;
  results: SessionResult[];
  startTime: number;
  isComplete: boolean;
}

interface LearnState {
  rawNotes: string;
  processedContent: ProcessedContent | null;
  activeView: 'simplified' | 'full' | 'keypoints';
  isLoading: boolean;
  error: string | null;
  expandedSections: Set<string>;
  practiceSession: PracticeSession | null;

  setRawNotes: (notes: string) => void;
  setProcessedContent: (content: ProcessedContent | null) => void;
  setActiveView: (view: 'simplified' | 'full' | 'keypoints') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSection: (heading: string) => void;
  startPracticeSession: () => void;
  recordResult: (result: SessionResult) => void;
  advanceToNext: () => void;
  completeSession: () => void;
  resetPractice: () => void;
  reset: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export const useLearnStore = create<LearnState>((set, get) => ({
  rawNotes: '',
  processedContent: null,
  activeView: 'full',
  isLoading: false,
  error: null,
  expandedSections: new Set(),
  practiceSession: null,

  setRawNotes: (notes) => set({ rawNotes: notes }),

  setProcessedContent: (content) => {
    set({ processedContent: content });
    if (content) {
      const allHeadings = new Set([
        ...content.full_notes.map(s => s.heading),
        ...content.simplified.map(s => s.heading),
      ]);
      set({ expandedSections: allHeadings });
    }
  },

  setActiveView: (view) => set({ activeView: view }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  toggleSection: (heading) => {
    const { expandedSections } = get();
    const newSet = new Set(expandedSections);
    if (newSet.has(heading)) {
      newSet.delete(heading);
    } else {
      newSet.add(heading);
    }
    set({ expandedSections: newSet });
  },

  startPracticeSession: () => {
    const { processedContent } = get();
    if (!processedContent) return;

    const flashcards: PracticeItem[] = processedContent.flashcards.map(f => ({
      type: 'flashcard' as const,
      data: f,
      id: generateId(),
    }));

    const quizzes: PracticeItem[] = processedContent.quiz.map(q => ({
      type: 'quiz' as const,
      data: q,
      id: generateId(),
    }));

    const combined = shuffle([...flashcards, ...quizzes]);
    const capped = combined.slice(0, 20);

    set({
      practiceSession: {
        items: capped,
        currentIndex: 0,
        results: [],
        startTime: Date.now(),
        isComplete: false,
      },
    });
  },

  recordResult: (result) => {
    const { practiceSession } = get();
    if (!practiceSession) return;

    set({
      practiceSession: {
        ...practiceSession,
        results: [...practiceSession.results, result],
      },
    });
  },

  advanceToNext: () => {
    const { practiceSession } = get();
    if (!practiceSession) return;

    const nextIndex = practiceSession.currentIndex + 1;
    if (nextIndex >= practiceSession.items.length) {
      set({
        practiceSession: {
          ...practiceSession,
          currentIndex: nextIndex,
          isComplete: true,
        },
      });
    } else {
      set({
        practiceSession: {
          ...practiceSession,
          currentIndex: nextIndex,
        },
      });
    }
  },

  completeSession: () => {
    const { practiceSession } = get();
    if (!practiceSession) return;

    set({
      practiceSession: {
        ...practiceSession,
        isComplete: true,
      },
    });
  },

  resetPractice: () => {
    set({ practiceSession: null });
  },

  reset: () => set({
    rawNotes: '',
    processedContent: null,
    activeView: 'full',
    isLoading: false,
    error: null,
    expandedSections: new Set(),
    practiceSession: null,
  }),
}));
