export type HabitType = 'check' | 'count' | 'routine';

/** Part of the day a habit belongs to. 'anytime' habits show in every window. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

/** Day of week, matching Date#getDay(): 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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
  /** Days the habit is scheduled on. Omitted = every day. */
  days?: Weekday[];
  /** Omitted on habits created before scheduling existed = 'anytime'. */
  timeOfDay?: TimeOfDay;
  /** User-chosen position (ascending). Omitted on habits never reordered. */
  order?: number;
  createdAt: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  type: HabitType;
  target?: number;
  tasks?: RoutineTask[];
  days?: Weekday[];
  timeOfDay?: TimeOfDay;
  order?: number;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  target?: number;
  tasks?: RoutineTask[];
  /** null clears the schedule back to every day. */
  days?: Weekday[] | null;
  timeOfDay?: TimeOfDay;
}
