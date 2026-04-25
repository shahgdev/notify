import { create } from 'zustand';

interface AppState {
  globalIsProcessing: boolean;
  setGlobalProcessing: (processing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  globalIsProcessing: false,
  setGlobalProcessing: (p) => set({ globalIsProcessing: p }),
}));
