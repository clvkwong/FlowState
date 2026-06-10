import type { RoutineTask } from "@/types/habit";
import type {
  RoutineSession,
  RoutineSessionCompletedTask,
} from "@/types/routineSession";

export interface RoutineSessionProgress {
  currTaskIndex: number;
  currTaskCountdown: number;
}

export function createRoutineSession(
  habitId: string,
  startedAt = Date.now(),
): RoutineSession {
  return {
    habitId,
    startedAt,
    completedTasks: [],
  };
}

function getElapsedTimeSeconds(startedAt: number, now = Date.now()) {
  return Math.floor((now - startedAt) / 1000);
}

function getElapsedTimeOnCurrTask(session: RoutineSession, now = Date.now()) {
  const timeElapsedSeconds = getElapsedTimeSeconds(session.startedAt, now);
  const timeOnCompletedTasks = session.completedTasks.reduce(
    (sum, task) => sum + task.actualDurationSeconds,
    0,
  );
  return timeElapsedSeconds - timeOnCompletedTasks;
}

export function getRoutineSessionProgress(
  session: RoutineSession | null,
  habitTasks: RoutineTask[],
): RoutineSessionProgress | null {
  if (!session || habitTasks.length === 0) {
    return null;
  }

  const currTaskIndex = session.completedTasks.length;
  if (currTaskIndex >= habitTasks.length) {
    return null;
  }

  const timeElapsedOnCurrTask = getElapsedTimeOnCurrTask(session);

  return {
    currTaskIndex,
    currTaskCountdown:
      habitTasks[currTaskIndex].durationSeconds - timeElapsedOnCurrTask,
  };
}

function getCompletedStepDuration(session: RoutineSession): number {
  return getElapsedTimeOnCurrTask(session);
}

export function getCompletedTask(
  session: RoutineSession,
  taskId: string,
): RoutineSessionCompletedTask {
  return {
    taskId,
    actualDurationSeconds: getCompletedStepDuration(session),
  };
}

export function appendTaskToActiveSession(
  session: RoutineSession,
  completedTask: RoutineSessionCompletedTask,
): RoutineSession {
  return {
    ...session,
    completedTasks: [...session.completedTasks, completedTask],
  };
}
