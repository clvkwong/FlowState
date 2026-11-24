import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Habit } from "@/types/habit";
import type { HabitLog, LogValuesInput } from "@/types/log";
import { RoutineSession } from "@/types/routineSession";
import { getLogPersistKey } from "@/storage/persistKeys";
import { storage } from "@/storage/mmkv";
import * as logService from "@/services/logService";
import { todayString } from "@/utils/date";
import {
  assertLoggableDate,
  buildLogValues,
  LogValidationError,
  stepCount,
} from "@/utils/habitLogic";

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
  /** Undo one count press. No-op (returns the current log) when already at 0. */
  decrementCount: (
    userId: string,
    habitId: string,
    target: number,
  ) => Promise<HabitLog | undefined>;
  completeRoutine: (
    userId: string,
    session: RoutineSession,
  ) => Promise<HabitLog>;
  deleteLogsForHabitRemote: (userId: string, habitId: string) => Promise<void>;
  /**
   * Log a habit for a given day — today or retroactively for a past day.
   * Throws LogValidationError for a future/invalid date or bad values, and
   * DuplicateLogError if that day already has a log (use updateLog).
   */
  createLog: (
    userId: string,
    habit: Habit,
    date: string,
    values: LogValuesInput,
  ) => Promise<HabitLog>;
  /** Edit an existing log (any date). Omitted values are kept. */
  updateLog: (
    habit: Habit,
    logId: string,
    values: LogValuesInput,
  ) => Promise<HabitLog>;
  /** Remove a single day's log. */
  deleteLog: (logId: string) => Promise<void>;
  removeLogLocal: (logId: string) => void;
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
        const { count, completed } = stepCount(
          existing?.count ?? 0,
          1,
          target,
        );
        const log = await logService.upsertLog({
          userId,
          habitId,
          date,
          completed,
          count,
        });
        get().upsertLogLocal(log);
        return log;
      },
      decrementCount: async (userId, habitId, target) => {
        const date = todayString();
        const existing = get().logs.find(
          (l) => l.habitId === habitId && l.date === date,
        );
        // Nothing to undo: no log yet today, or already at 0.
        if (!existing || (existing.count ?? 0) <= 0) return existing;
        const { count, completed } = stepCount(existing.count ?? 0, -1, target);
        // Same per-day log is updated in place; a count of 0 is kept (not
        // deleted) and already reads as "nothing done" in heat map + history.
        const log = await logService.upsertLog({
          userId,
          habitId,
          date,
          completed,
          count,
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
      createLog: async (userId, habit, date, values) => {
        assertLoggableDate(date);
        const log = await logService.createLog({
          userId,
          habitId: habit.id,
          date,
          ...buildLogValues(habit, values),
        });
        get().upsertLogLocal(log);
        return log;
      },
      updateLog: async (habit, logId, values) => {
        const existing = get().logs.find((l) => l.id === logId);
        if (!existing) throw new LogValidationError("Log not found");
        if (existing.habitId !== habit.id) {
          throw new LogValidationError("Log does not belong to this habit");
        }
        const log = await logService.updateLog(
          existing,
          buildLogValues(habit, values, existing),
        );
        get().upsertLogLocal(log);
        return log;
      },
      deleteLog: async (logId) => {
        await logService.deleteLog(logId);
        get().removeLogLocal(logId);
      },
      removeLogLocal: (logId) =>
        set({ logs: get().logs.filter((l) => l.id !== logId) }),
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
