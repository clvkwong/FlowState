import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';
import { getPastDateStrings, todayString } from '@/utils/date';

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
    case 'check':
      return isCheckCompleted(log);
    case 'count':
      return isCountCompleted(habit, log);
    case 'routine':
      return isRoutineCompleted(log);
  }
}

export function getCountProgress(habit: Habit, log?: HabitLog) {
  const current = log?.count ?? 0;
  const target = habit.target ?? 1;
  return { current, target, ratio: Math.min(current / target, 1) };
}

export function getRoutineProgress(habit: Habit, log?: HabitLog) {
  if (log?.completed) {
    const total = habit.tasks?.length ?? 0;
    return { completed: total, total };
  }
  const completed = log?.completedTasks?.length ?? 0;
  const total = habit.tasks?.length ?? 0;
  return { completed, total };
}

export function getTaskActualDuration(log: HabitLog | undefined, taskId: string): number | undefined {
  return log?.completedTasks?.find((t) => t.taskId === taskId)?.actualDurationSeconds;
}

export function getRoutineTotalActualDuration(log?: HabitLog): number {
  return log?.completedTasks?.reduce((sum, t) => sum + t.actualDurationSeconds, 0) ?? 0;
}

export function getLogForHabit(logs: HabitLog[], habitId: string, date: string = todayString()): HabitLog | undefined {
  return logs.find((l) => l.habitId === habitId && l.date === date);
}

export function getTodayLogs(logs: HabitLog[], date: string = todayString()): HabitLog[] {
  return logs.filter((l) => l.date === date);
}

export function getTodayCompletionSummary(habits: Habit[], logs: HabitLog[], date: string = todayString()) {
  const todayLogs = getTodayLogs(logs, date);
  const completed = habits.filter((h) => {
    const log = getLogForHabit(todayLogs, h.id, date);
    return isHabitCompleted(h, log);
  }).length;
  return { completed, total: habits.length };
}

export function getHabitHeatMapCells(
  habit: Habit,
  logs: HabitLog[],
  days: number = 21,
  endDate: string = todayString(),
): HabitHeatMapCell[] {
  return getPastDateStrings(days, new Date(`${endDate}T00:00:00`)).map((date) => {
    const log = getLogForHabit(logs, habit.id, date);
    const completion = (() => {
      switch (habit.type) {
        case 'check':
          return isCheckCompleted(log) ? 1 : 0;
        case 'count': {
          const target = habit.target ?? 1;
          return Math.min((log?.count ?? 0) / target, 1);
        }
        case 'routine': {
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
  });
}
