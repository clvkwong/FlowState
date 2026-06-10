export interface RoutineSessionCompletedTask {
  taskId: string;
  actualDurationSeconds: number;
}

export interface RoutineSession {
  habitId: string;
  startedAt: number;
  completedTasks: RoutineSessionCompletedTask[];
}
