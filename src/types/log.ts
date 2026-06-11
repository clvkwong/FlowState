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
