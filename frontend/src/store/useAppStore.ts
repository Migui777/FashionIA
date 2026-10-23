import { create } from "zustand";
import type { Dress } from "../types/dress";

interface AppState {
  dresses: Dress[];
  detectedDressIds: string[];
  selectedDressId: string | null;

  setDresses: (dresses: Dress[]) => void;
  addDetectedDress: (dressId: string) => void;
  selectDress: (dressId: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  dresses: [],
  detectedDressIds: [],
  selectedDressId: null,

  setDresses: (dresses) => set({ dresses }),

  addDetectedDress: (dressId) => {
    if (get().detectedDressIds.includes(dressId)) return;
    set((state) => ({ detectedDressIds: [...state.detectedDressIds, dressId] }));
  },

  selectDress: (dressId) => set({ selectedDressId: dressId }),

  reset: () => set({ detectedDressIds: [], selectedDressId: null }),
}));
