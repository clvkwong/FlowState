import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getRoutineSessionPersistKey } from "@/storage/persistKeys";
import { storage } from "@/storage/mmkv";
import type {
  RoutineSession,
  RoutineSessionCompletedTask,
} from "@/types/routineSession";
import {
  appendTaskToActiveSession,
  createRoutineSession,
} from "@/utils/routineSession";

interface RoutineSessionState {
  activeSession: RoutineSession | null;
  _hasHydrated: boolean;
  startSession: (habitId: string, startedAt?: number) => void;
  appendCompletedTask: (task: RoutineSessionCompletedTask) => void;
  clearActiveSession: () => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
}

let isRehydrating = false;

const routineSessionStorage = {
  getItem: (): string | null => {
    return storage.getString(getRoutineSessionPersistKey()) ?? null;
  },
  setItem: (_name: string, value: string): void => {
    if (isRehydrating) return;
    storage.set(getRoutineSessionPersistKey(), value);
  },
  removeItem: (): void => {
    if (isRehydrating) return;
    storage.remove(getRoutineSessionPersistKey());
  },
};

export const useRoutineSessionStore = create<RoutineSessionState>()(
  persist(
    (set) => ({
      activeSession: null,
      _hasHydrated: false,
      startSession: (habitId, startedAt = Date.now()) =>
        set({
          activeSession: createRoutineSession(habitId, startedAt),
        }),
      appendCompletedTask: (task) =>
        set((state) => ({
          activeSession: state.activeSession
            ? appendTaskToActiveSession(state.activeSession, task)
            : null,
        })),
      clearActiveSession: () => set({ activeSession: null }),
      reset: () => set({ activeSession: null, _hasHydrated: false }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "routine-session-store",
      storage: createJSONStorage(() => routineSessionStorage),
      skipHydration: true,
      partialize: (state) => ({ activeSession: state.activeSession }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export async function rehydrateRoutineSessionStore(): Promise<void> {
  isRehydrating = true;
  try {
    useRoutineSessionStore.setState({ _hasHydrated: false });
    await useRoutineSessionStore.persist.rehydrate();
  } finally {
    isRehydrating = false;
  }
}

export function clearRoutineSessionStorePersist(): void {
  storage.remove(getRoutineSessionPersistKey());
}
