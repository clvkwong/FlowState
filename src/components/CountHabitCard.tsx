import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { ProgressRing } from "@/components/ProgressRing";
import { HabitHeatMap } from "@/components/HabitHeatMap";
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

interface CountHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  logs: HabitLog[];
  onIncrement: () => void;
  onLongPress?: () => void;
}

export function CountHabitCard({
  habit,
  log,
  logs,
  onIncrement,
  onLongPress,
}: CountHabitCardProps) {
  const completed = isCountCompleted(habit, log);
  const accent = getHabitAccent("count");
  const progress = getCountProgress(habit, log);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.04,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    onIncrement();
  };

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress}>
      <Animated.View
        style={[
          styles.card,
          completed
            ? {
                backgroundColor: withOpacity(accent, 0.15),
                borderColor: accent,
              }
          : { borderColor: accent },
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.content}>
            <Text style={styles.name}>{habit.name}</Text>
            <Text style={[styles.type, { color: accent }]}>COUNT</Text>
            <Text style={styles.sub}>
              {progress.current} / {progress.target}
            </Text>
          </View>
          <ProgressRing
            ratio={progress.ratio}
            current={progress.current}
            target={progress.target}
            accent={accent}
          />
        </View>
        <HabitHeatMap habit={habit} logs={logs} />
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
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
