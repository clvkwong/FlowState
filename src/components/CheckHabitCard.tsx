import { useRef } from "react";
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
import { HabitHeatMap } from "@/components/HabitHeatMap";
import type { Habit } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import { isCheckCompleted } from "@/utils/habitLogic";

interface CheckHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  logs: HabitLog[];
  onToggle: () => void;
  onLongPress?: () => void;
}

export function CheckHabitCard({
  habit,
  log,
  logs,
  onToggle,
  onLongPress,
}: CheckHabitCardProps) {
  const completed = isCheckCompleted(log);
  const accent = getHabitAccent("check");
  const pop = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pop, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={habit.name}
      accessibilityHint="Long press for more options"
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
          <Text style={[styles.type, { color: accent }]}>CHECK</Text>
        </View>
        <Animated.View
          style={[
            styles.check,
            { borderColor: accent },
            completed && { backgroundColor: accent },
            { transform: [{ scale: pop }] },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={32}
            color={completed ? colors.background : withOpacity(accent, 0.28)}
          />
        </Animated.View>
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
  check: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
