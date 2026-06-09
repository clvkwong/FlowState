import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as logService from "@/services/logService";
import { getLogPersistKey } from "@/storage/persistKeys";
import { storage } from "@/storage/mmkv";
import type { CompletedRoutineTask, HabitLog } from "@/types/log";
import { todayString } from "@/utils/date";

interface LogState {
  logs: HabitLog[];
  _hasHydrated: boolean;
  setLogs: (logs: HabitLog[]) => void;
  upsertLogLocal: (log: HabitLog) => void;
  removeLogsForHabit: (habitId: string) => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
  hydrateFromDB: (logs: HabitLog[]) => void;
  logCheck: (
    userId: string,
    habitId: string,
    completed: boolean,
  ) => Promise<HabitLog>;
  incrementCount: (
    userId: string,
    habitId: string,
    target: number,
  ) => Promise<HabitLog>;
  completeRoutineStep: (
    userId: string,
    habitId: string,
    step: CompletedRoutineTask,
    isFinalStep: boolean,
  ) => Promise<HabitLog>;
  deleteLogsForHabitRemote: (userId: string, habitId: string) => Promise<void>;
}

let isRehydrating = false;

const logStorage = {
  getItem: (): string | null => {
    return storage.getString(getLogPersistKey()) ?? null;
  },
  setItem: (_name: string, value: string): void => {
    if (isRehydrating) return;
    storage.set(getLogPersistKey(), value);
  },
  removeItem: (): void => {
    if (isRehydrating) return;
    storage.remove(getLogPersistKey());
  },
};

function upsertInArray(logs: HabitLog[], log: HabitLog): HabitLog[] {
  const index = logs.findIndex(
    (l) =>
      l.id === log.id || (l.habitId === log.habitId && l.date === log.date),
  );
  if (index >= 0) {
    const next = [...logs];
    next[index] = log;
    return next;
  }
  return [...logs, log];
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],
      _hasHydrated: false,
      setLogs: (logs) => set({ logs }),
      upsertLogLocal: (log) => set({ logs: upsertInArray(get().logs, log) }),
      removeLogsForHabit: (habitId) =>
        set({ logs: get().logs.filter((l) => l.habitId !== habitId) }),
      reset: () => set({ logs: [], _hasHydrated: false }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      hydrateFromDB: (logs) => set({ logs, _hasHydrated: true }),
      logCheck: async (userId, habitId, completed) => {
        const date = todayString();
        const log = await logService.upsertLog({
          userId,
          habitId,
          date,
          completed,
        });
        get().upsertLogLocal(log);
        return log;
      },
      incrementCount: async (userId, habitId, target) => {
        const date = todayString();
        const existing = get().logs.find(
          (l) => l.habitId === habitId && l.date === date,
        );
        const nextCount = Math.min((existing?.count ?? 0) + 1, target);
        const completed = nextCount >= target;
        const log = await logService.upsertLog({
          userId,
          habitId,
          date,
          completed,
          count: nextCount,
        });
        get().upsertLogLocal(log);
        return log;
      },
      completeRoutineStep: async (userId, habitId, step, isFinalStep) => {
        const date = todayString();
        const existing = get().logs.find(
          (l) => l.habitId === habitId && l.date === date,
        );
        const completedTasks = [...(existing?.completedTasks ?? []), step];
        const completed = isFinalStep;
        const log = await logService.upsertLog({
          userId,
          habitId,
          date,
          completed,
          completedTasks,
        });
        get().upsertLogLocal(log);
        return log;
      },
      deleteLogsForHabitRemote: async (userId, habitId) => {
        await logService.deleteLogsForHabit(userId, habitId);
        get().removeLogsForHabit(habitId);
      },
    }),
    {
      name: "log-store",
      storage: createJSONStorage(() => logStorage),
      skipHydration: true,
      partialize: (state) => ({ logs: state.logs }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export async function rehydrateLogStore(): Promise<void> {
  isRehydrating = true;
  try {
    useLogStore.setState({ _hasHydrated: false });
    await useLogStore.persist.rehydrate();
  } finally {
    isRehydrating = false;
  }
}

export function clearLogStorePersist(): void {
  storage.remove(getLogPersistKey());
}
