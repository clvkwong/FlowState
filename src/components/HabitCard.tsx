import { CheckHabitCard } from '@/components/CheckHabitCard';
import { CountHabitCard } from '@/components/CountHabitCard';
import { RoutineHabitCard } from '@/components/RoutineHabitCard';
import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onCheckToggle: (habitId: string, completed: boolean) => void;
  onCountIncrement: (habitId: string, target: number) => void;
  onRoutinePress: (habitId: string) => void;
  onEdit: (habitId: string) => void;
}

export function HabitCard({
  habit,
  log,
  onCheckToggle,
  onCountIncrement,
  onRoutinePress,
  onEdit,
}: HabitCardProps) {
  const onLongPress = () => onEdit(habit.id);

  switch (habit.type) {
    case 'check':
      return (
        <CheckHabitCard
          habit={habit}
          log={log}
          onToggle={() => onCheckToggle(habit.id, !(log?.completed ?? false))}
          onLongPress={onLongPress}
        />
      );
    case 'count':
      return (
        <CountHabitCard
          habit={habit}
          log={log}
          onIncrement={() => onCountIncrement(habit.id, habit.target ?? 1)}
          onLongPress={onLongPress}
        />
      );
    case 'routine':
      return (
        <RoutineHabitCard
          habit={habit}
          log={log}
          onPress={() => onRoutinePress(habit.id)}
          onLongPress={onLongPress}
        />
      );
  }
}
