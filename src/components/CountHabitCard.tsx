import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import type { Habit } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import { getCountProgress, isCountCompleted } from "@/utils/habitLogic";

import { HabitHeatMap } from "@/components/HabitHeatMap";

interface CountHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  logs: HabitLog[];
  onIncrement: () => void;
  onDecrement: () => void;
  /** Tapping the card body (outside the −/+ buttons) opens the view screen. */
  onPress?: () => void;
  onLongPress?: () => void;
  /** View-only (another day is selected): the primary action is off. */
  readOnly?: boolean;
}

export function CountHabitCard({
  habit,
  log,
  logs,
  onIncrement,
  onDecrement,
  onPress,
  onLongPress,
  readOnly = false,
}: CountHabitCardProps) {
  const completed = isCountCompleted(habit, log);
  const accent = getHabitAccent("count");
  const progress = getCountProgress(habit, log);
  const atZero = progress.current <= 0;
  const remaining = Math.max(0, progress.target - progress.current);

  const bump = useRef(new Animated.Value(1)).current;
  const fill = useRef(new Animated.Value(progress.ratio)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: progress.ratio,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [fill, progress.ratio]);

  const animateBump = () => {
    Animated.sequence([
      Animated.timing(bump, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bump, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleIncrement = () => {
    animateBump();
    onIncrement();
  };

  const handleDecrement = () => {
    if (atZero) return;
    animateBump();
    onDecrement();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={habit.name}
      accessibilityHint="Opens habit details. Long press for more options"
      style={[
        styles.card,
        completed
          ? { backgroundColor: withOpacity(accent, 0.15), borderColor: accent }
          : { borderColor: withOpacity(accent, 0.4) },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {habit.name}
          </Text>
          <Text style={styles.type}>
            <Text style={{ color: accent }}>COUNT</Text>
            <Text style={styles.sub}>
              {" "}
              · {completed ? "Goal hit!" : `${remaining} more to go`}
            </Text>
          </Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            onPress={handleDecrement}
            disabled={atZero || readOnly}
            accessibilityRole="button"
            accessibilityLabel={`Remove one from ${habit.name}`}
            hitSlop={4}
            style={({ pressed }) => [
              styles.stepButton,
              styles.minus,
              { borderColor: accent, backgroundColor: withOpacity(accent, 0.08) },
              (atZero || readOnly) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="remove" size={28} color={accent} />
          </Pressable>
          <Pressable
            onPress={handleIncrement}
            disabled={readOnly}
            accessibilityRole="button"
            accessibilityLabel={`Add one to ${habit.name}`}
            hitSlop={4}
            style={({ pressed }) => [
              styles.stepButton,
              styles.plus,
              { backgroundColor: accent, shadowColor: accent },
              readOnly && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={30} color={colors.background} />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View
          style={[styles.track, { backgroundColor: withOpacity(accent, 0.15) }]}
        >
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: accent,
                width: fill.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Animated.Text
          accessibilityLiveRegion="polite"
          style={[styles.value, { color: accent, transform: [{ scale: bump }] }]}
        >
          {progress.current}
          <Text style={styles.valueOf}> / {progress.target}</Text>
        </Animated.Text>
      </View>

      <HabitHeatMap habit={habit} logs={logs} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    padding: spacing.md,
    paddingLeft: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.heading,
    fontSize: 21,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  type: {
    ...typography.caption,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  sub: {
    color: colors.textSecondary,
  },
  stepper: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepButton: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  minus: {
    width: 56,
    borderWidth: 2,
  },
  plus: {
    width: 64,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: borderRadius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: borderRadius.pill,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
  },
  valueOf: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
