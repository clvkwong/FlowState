export type HabitType = 'check' | 'count' | 'routine';

export interface RoutineTask {
  id: string;
  label: string;
  durationSeconds: number;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  type: HabitType;
  target?: number;
  tasks?: RoutineTask[];
  createdAt: string;
}

export interface CreateHabitInput {
  name: string;
  type: HabitType;
  target?: number;
  tasks?: RoutineTask[];
}

export interface UpdateHabitInput {
  name?: string;
  target?: number;
  tasks?: RoutineTask[];
}
