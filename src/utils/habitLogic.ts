import type { Habit } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import { getPastDateStrings, todayString } from "@/utils/date";

export interface HabitHeatMapCell {
  date: string;
  completion: number;
  completed: boolean;
  log?: HabitLog;
}

export function isCheckCompleted(log?: HabitLog): boolean {
  return log?.completed === true;
}

export function isCountCompleted(habit: Habit, log?: HabitLog): boolean {
  return (log?.count ?? 0) >= (habit.target ?? 0);
}

export function isRoutineCompleted(log?: HabitLog): boolean {
  return log?.completed === true;
}

export function isHabitCompleted(habit: Habit, log?: HabitLog): boolean {
  switch (habit.type) {
    case "check":
      return isCheckCompleted(log);
    case "count":
      return isCountCompleted(habit, log);
    case "routine":
      return isRoutineCompleted(log);
  }
}

export function getCountProgress(habit: Habit, log?: HabitLog) {
  const current = log?.count ?? 0;
  const target = habit.target ?? 1;
  return { current, target, ratio: Math.min(current / target, 1) };
}

/**
 * Next count + completion flag after a +1 / -1 step on a count habit.
 * Never goes below 0; `completed` is re-derived so undoing below the
 * target clears the done state.
 */
export function stepCount(
  current: number,
  delta: 1 | -1,
  target: number,
): { count: number; completed: boolean } {
  const count = Math.max(0, current + delta);
  return { count, completed: count >= target };
}

export function getTaskActualDuration(
  log: HabitLog | undefined,
  taskId: string,
): number | undefined {
  return log?.completedTasks?.find((t) => t.taskId === taskId)
    ?.actualDurationSeconds;
}

export function getRoutineTotalActualDuration(log?: HabitLog): number {
  return (
    log?.completedTasks?.reduce((sum, t) => sum + t.actualDurationSeconds, 0) ??
    0
  );
}

export function getLogForHabit(
  logs: HabitLog[],
  habitId: string,
  date: string = todayString(),
): HabitLog | undefined {
  return logs.find((l) => l.habitId === habitId && l.date === date);
}

export function getTodayLogs(
  logs: HabitLog[],
  date: string = todayString(),
): HabitLog[] {
  return logs.filter((l) => l.date === date);
}

export interface CompletionSegment {
  habitId: string;
  type: Habit["type"];
  completed: boolean;
}

export function getTodayCompletionSummary(
  habits: Habit[],
  logs: HabitLog[],
  date: string = todayString(),
) {
  const todayLogs = getTodayLogs(logs, date);
  const segments: CompletionSegment[] = habits.map((h) => ({
    habitId: h.id,
    type: h.type,
    completed: isHabitCompleted(h, getLogForHabit(todayLogs, h.id, date)),
  }));
  const completed = segments.filter((s) => s.completed).length;
  return { completed, total: habits.length, segments };
}

export function getHabitHeatMapCells(
  habit: Habit,
  logs: HabitLog[],
  days: number = 21,
  endDate: string = todayString(),
): HabitHeatMapCell[] {
  return getPastDateStrings(days, new Date(`${endDate}T00:00:00`)).map(
    (date) => {
      const log = getLogForHabit(logs, habit.id, date);
      const completion = (() => {
        switch (habit.type) {
          case "check":
            return isCheckCompleted(log) ? 1 : 0;
          case "count": {
            const target = habit.target ?? 1;
            return Math.min((log?.count ?? 0) / target, 1);
          }
          case "routine": {
            const total = habit.tasks?.length ?? 0;
            if (log?.completed) return 1;
            if (total === 0) return 0;
            return Math.min((log?.completedTasks?.length ?? 0) / total, 1);
          }
        }
      })();

      return {
        date,
        completion,
        completed: completion >= 1,
        log,
      };
    },
  );
}

export function getRoutinePlannedDuration(habit: Habit): number {
  return habit.tasks?.reduce((sum, t) => sum + t.durationSeconds, 0) ?? 0;
}

function hasLoggedActivity(habit: Habit, log: HabitLog): boolean {
  switch (habit.type) {
    case "check":
    case "routine":
      return log.completed === true;
    case "count":
      return (log.count ?? 0) > 0;
  }
}

/** Past sessions for a habit, newest first. Days with no activity are skipped. */
export function getHabitHistory(habit: Habit, logs: HabitLog[]): HabitLog[] {
  return logs
    .filter((l) => l.habitId === habit.id && hasLoggedActivity(habit, l))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Stable total order for habits: oldest created first, then name, then id.
 * Firestore returns habits in document-id order (effectively random) while
 * local creates append, so the stored array order is not meaningful.
 */
export function compareHabits(a: Habit, b: Habit): number {
  const ta = Date.parse(a.createdAt);
  const tb = Date.parse(b.createdAt);
  const byTime = (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
  if (byTime !== 0) return byTime;
  const byName = a.name.localeCompare(b.name);
  if (byName !== 0) return byName;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
