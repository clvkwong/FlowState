import { fetchHabits } from '@/services/habitService';
import { fetchLogs } from '@/services/logService';
import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';

export async function hydrateUserData(userId: string): Promise<{ habits: Habit[]; logs: HabitLog[] }> {
  const [habits, logs] = await Promise.all([fetchHabits(userId), fetchLogs(userId)]);
  return { habits, logs };
}
