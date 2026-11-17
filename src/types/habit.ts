export type HabitType = 'check' | 'count' | 'routine';

export interface RoutineTask {
  id: string;
  label: string;
  description?: string;
  durationSeconds: number;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: HabitType;
  target?: number;
  tasks?: RoutineTask[];
  createdAt: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  type: HabitType;
  target?: number;
  tasks?: RoutineTask[];
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  target?: number;
  tasks?: RoutineTask[];
}
