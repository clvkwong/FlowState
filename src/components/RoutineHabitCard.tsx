import { Pressable, StyleSheet, Text, View } from "react-native";

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
import { isRoutineCompleted } from "@/utils/habitLogic";

import { HabitHeatMap } from "@/components/HabitHeatMap";

interface RoutineHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  logs: HabitLog[];
  onPress: () => void;
  onLongPress?: () => void;
}

export function RoutineHabitCard({
  habit,
  log,
  logs,
  onPress,
  onLongPress,
}: RoutineHabitCardProps) {
  const completed = isRoutineCompleted(log);
  const accent = getHabitAccent("routine");

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <View
        style={[
          styles.card,
          completed
            ? {
                backgroundColor: withOpacity(accent, 0.15),
                borderColor: accent,
              }
            : { borderColor: accent },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.content}>
            <Text style={styles.name}>{habit.name}</Text>
            <Text style={styles.type}>
              <Text style={{ color: accent }}>ROUTINE</Text>
              <Text style={styles.sub}>
                {" "}
                • {`${habit.tasks?.length} steps`}
              </Text>
            </Text>
          </View>
          {completed ? (
            <View
              style={[
                styles.play,
                { borderColor: accent, backgroundColor: accent },
              ]}
            >
              <Text style={[styles.playIcon, styles.checkmark]}>✓</Text>
            </View>
          ) : (
            <View style={[styles.play, { borderColor: accent }]}>
              <Text style={[styles.playIcon, { color: accent }]}>▶</Text>
            </View>
          )}
        </View>
        <HabitHeatMap habit={habit} logs={logs} />
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
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 60,
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
    fontWeight: "700",
  },
  sub: {
    color: colors.textSecondary,
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 16,
    marginLeft: 2,
  },
  checkmark: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.background,
  },
});
