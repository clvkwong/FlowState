import { Pressable, StyleSheet, Text, View } from "react-native";
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
import {
  getRoutinePlannedDuration,
  isRoutineCompleted,
} from "@/utils/habitLogic";

import { HabitHeatMap } from "@/components/HabitHeatMap";

interface RoutineHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  logs: HabitLog[];
  /** The play button: starts the routine timer. */
  onStart: () => void;
  /** Tapping the card body (outside the play button) opens the view screen. */
  onPress?: () => void;
  onLongPress?: () => void;
  /** View-only (another day is selected): the primary action is off. */
  readOnly?: boolean;
}

export function RoutineHabitCard({
  habit,
  log,
  logs,
  onStart,
  onPress,
  onLongPress,
  readOnly = false,
}: RoutineHabitCardProps) {
  const completed = isRoutineCompleted(log);
  const accent = getHabitAccent("routine");
  const steps = habit.tasks?.length ?? 0;
  const minutes = Math.round(getRoutinePlannedDuration(habit) / 60);
  const meta = [
    `${steps} ${steps === 1 ? "step" : "steps"}`,
    minutes > 0 ? `${minutes} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={completed ? `${habit.name}, completed` : habit.name}
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
            <Text style={{ color: colors.routineLabel }}>ROUTINE</Text>
            <Text style={styles.sub}> · {meta}</Text>
          </Text>
        </View>
        <Pressable
          onPress={onStart}
          disabled={readOnly}
          accessibilityRole="button"
          accessibilityState={{ disabled: readOnly }}
          accessibilityLabel={
            completed ? `Run ${habit.name} again` : `Start ${habit.name}`
          }
          hitSlop={8}
          style={({ pressed }) => [
            styles.play,
            completed
              ? { borderColor: accent, backgroundColor: "transparent" }
              : {
                  borderColor: accent,
                  backgroundColor: accent,
                  shadowColor: accent,
                },
            readOnly && styles.readOnly,
            pressed && styles.pressed,
          ]}
        >
          {completed ? (
            <Ionicons name="checkmark" size={30} color={colors.routineLabel} />
          ) : (
            <Ionicons
              name="play"
              size={24}
              color={colors.textPrimary}
              style={styles.playIcon}
            />
          )}
        </Pressable>
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
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
  readOnly: {
    opacity: 0.45,
  },
  play: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  playIcon: {
    marginLeft: 3,
  },
});
