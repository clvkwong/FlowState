export interface CompletedRoutineTask {
  taskId: string;
  actualDurationSeconds: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  count?: number;
  completedTasks?: CompletedRoutineTask[];
  loggedAt: string;
}

export interface UpsertLogInput {
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  count?: number;
  completedTasks?: CompletedRoutineTask[];
  startedAt?: number;
}

/**
 * Values a user can set on a log for any date (today or a past day).
 * Which fields apply depends on the habit type:
 * - check:   `completed`
 * - count:   `count` (`completed` is derived from the habit's target)
 * - routine: `completed` and/or `completedTasks`
 */
export interface LogValuesInput {
  completed?: boolean;
  count?: number;
  completedTasks?: CompletedRoutineTask[];
}

/** Firestore fields for a create/update, after validation + derivation. */
export interface LogWriteValues {
  completed: boolean;
  count?: number;
  completedTasks?: CompletedRoutineTask[];
}

export interface CreateLogInput extends LogWriteValues {
  habitId: string;
  userId: string;
  date: string;
}
