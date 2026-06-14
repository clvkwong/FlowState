import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, getHabitAccent, spacing, typography, withOpacity } from '@/constants/theme';
import type { Habit } from '@/types/habit';
import type { HabitLog } from '@/types/log';
import { isCheckCompleted } from '@/utils/habitLogic';

interface CheckHabitCardProps {
  habit: Habit;
  log?: HabitLog;
logs: HabitLog[];
  onToggle: () => void;
  onLongPress?: () => void;
}

export function CheckHabitCard({ habit, log, logs, onToggle, onLongPress }: CheckHabitCardProps) {
  const completed = isCheckCompleted(log);
  const accent = getHabitAccent('check');
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress}>
      <Animated.View
        style={[
          styles.card,
          completed
            ? { backgroundColor: withOpacity(accent, 0.15), borderColor: accent }
            : { borderColor: accent },
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={[styles.type, { color: accent }]}>CHECK</Text>
        </View>
        <View style={[styles.check, completed && { backgroundColor: accent }]}>
          {completed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Animated.View>
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
  check: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.check,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.background,
  },
});
