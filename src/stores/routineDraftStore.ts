import { create } from "zustand";
import type { RoutineTask } from "@/types/habit";

/**
 * Steps for a routine that hasn't been created yet. The New Habit screen owns
 * the draft (resets it on open/close); the draft steps screen edits it. Not
 * persisted: a half-made routine is discarded if the app is closed.
 */
interface RoutineDraftState {
  name: string;
  steps: RoutineTask[];
  setName: (name: string) => void;
  setSteps: (steps: RoutineTask[]) => void;
  reset: () => void;
}

export const useRoutineDraftStore = create<RoutineDraftState>()((set) => ({
  name: "",
  steps: [],
  setName: (name) => set({ name }),
  setSteps: (steps) => set({ steps }),
  reset: () => set({ name: "", steps: [] }),
}));
