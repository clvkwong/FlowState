import { CheckHabitCard } from '@/components/CheckHabitCard';
import { CountHabitCard } from '@/components/CountHabitCard';
import { RoutineHabitCard } from '@/components/RoutineHabitCard';
import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  logs: HabitLog[];
  onCheckToggle: (habitId: string, completed: boolean) => void;
  onCountIncrement: (habitId: string, target: number) => void;
  onCountDecrement: (habitId: string, target: number) => void;
  onRoutinePress: (habitId: string) => void;
  /** Tapping the card body (outside its action buttons) opens the habit's view screen. */
  onPress: (habitId: string) => void;
  /** Opens the habit's action menu (edit / view / delete). */
  onLongPress: (habitId: string) => void;
  /** View-only: another day is selected on the home screen. */
  readOnly?: boolean;
}

export function HabitCard({
  habit,
  log,
  logs,
  onCheckToggle,
  onCountIncrement,
  onCountDecrement,
  onRoutinePress,
  onPress: onHabitPress,
  onLongPress: onHabitLongPress,
  readOnly = false,
}: HabitCardProps) {
  const onPress = () => onHabitPress(habit.id);
  const onLongPress = () => onHabitLongPress(habit.id);

  switch (habit.type) {
    case 'check':
      return (
        <CheckHabitCard
          habit={habit}
          log={log}
          logs={logs}
          onToggle={() => onCheckToggle(habit.id, !(log?.completed ?? false))}
          onPress={onPress}
          onLongPress={onLongPress}
          readOnly={readOnly}
        />
      );
    case 'count':
      return (
        <CountHabitCard
          habit={habit}
          log={log}
          logs={logs}
          onIncrement={() => onCountIncrement(habit.id, habit.target ?? 1)}
          onDecrement={() => onCountDecrement(habit.id, habit.target ?? 1)}
          onPress={onPress}
          onLongPress={onLongPress}
          readOnly={readOnly}
        />
      );
    case 'routine':
      return (
        <RoutineHabitCard
          habit={habit}
          log={log}
          logs={logs}
          onStart={() => onRoutinePress(habit.id)}
          onPress={onPress}
          onLongPress={onLongPress}
          readOnly={readOnly}
        />
      );
  }
}
