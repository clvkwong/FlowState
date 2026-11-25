import { fetchHabits } from '@/services/habitService';
import { fetchFocusSessions } from '@/services/focusService';
import { fetchLogs } from '@/services/logService';
import type { FocusSession } from '@/types/focus';
import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';

export async function hydrateUserData(
  userId: string,
): Promise<{ habits: Habit[]; logs: HabitLog[]; focusSessions: FocusSession[] }> {
  const [habits, logs, focusSessions] = await Promise.all([
    fetchHabits(userId),
    fetchLogs(userId),
    fetchFocusSessions(userId),
  ]);
  return { habits, logs, focusSessions };
}
