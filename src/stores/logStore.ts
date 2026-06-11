import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { HabitLog } from "@/types/log";
import { RoutineSession } from "@/types/routineSession";
import { getLogPersistKey } from "@/storage/persistKeys";
import { storage } from "@/storage/mmkv";
import * as logService from "@/services/logService";
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
  completeRoutine: (
    userId: string,
    session: RoutineSession,
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
        const nextCount = (existing?.count ?? 0) + 1;
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
      completeRoutine: async (userId, session) => {
        const date = todayString();
        const log = await logService.upsertLog({
          userId,
          habitId: session.habitId,
          date,
          completed: true,
          completedTasks: session.completedTasks,
          startedAt: session.startedAt,
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
