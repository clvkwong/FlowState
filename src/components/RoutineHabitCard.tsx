import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, getHabitAccent, spacing, typography, withOpacity } from '@/constants/theme';
import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';
import { getRoutineProgress, isRoutineCompleted } from '@/utils/habitLogic';

interface RoutineHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onPress: () => void;
  onLongPress?: () => void;
}

export function RoutineHabitCard({ habit, log, onPress, onLongPress }: RoutineHabitCardProps) {
  const completed = isRoutineCompleted(log);
  const accent = getHabitAccent('routine');
  const progress = getRoutineProgress(habit, log);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <View
        style={[
          styles.card,
          completed
            ? { backgroundColor: withOpacity(accent, 0.15), borderColor: accent }
            : { borderColor: accent },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={[styles.type, { color: accent }]}>ROUTINE</Text>
          <Text style={styles.sub}>
            {completed ? 'Done today' : `${progress.completed} / ${progress.total} steps`}
          </Text>
        </View>
        <View style={[styles.play, { borderColor: accent }]}>
          <Text style={[styles.playIcon, { color: accent }]}>▶</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 88,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  type: {
    ...typography.caption,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    marginLeft: 2,
  },
});
