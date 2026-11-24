import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  withOpacity,
} from "@/constants/theme";
import type { Habit, HabitType } from "@/types/habit";

const TYPE_LABELS: Record<HabitType, string> = {
  check: "Check",
  count: "Count",
  routine: "Routine",
};

const TYPE_ICONS: Record<HabitType, "checkmark" | "add" | "play"> = {
  check: "checkmark",
  count: "add",
  routine: "play",
};

interface ReorderHabitRowProps {
  habit: Habit;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ReorderHabitRow({
  habit,
  position,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: ReorderHabitRowProps) {
  const accent = getHabitAccent(habit.type);
  const tint = habit.type === "routine" ? colors.routineLabel : accent;

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[styles.row, { borderColor: withOpacity(accent, 0.4) }]}
    >
      <View style={[styles.icon, { backgroundColor: withOpacity(accent, 0.18) }]}>
        <Ionicons name={TYPE_ICONS[habit.type]} size={20} color={tint} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[styles.type, { color: tint }]}>
          {TYPE_LABELS[habit.type]}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Move ${habit.name} up, currently position ${position}`}
          style={({ pressed }) => [
            styles.move,
            pressed && styles.pressed,
            isFirst && styles.disabled,
          ]}
        >
          <Ionicons name="chevron-up" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Move ${habit.name} down, currently position ${position}`}
          style={({ pressed }) => [
            styles.move,
            pressed && styles.pressed,
            isLast && styles.disabled,
          ]}
        >
          <Ionicons name="chevron-down" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  type: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  buttons: {
    flexDirection: "row",
    gap: 6,
  },
  move: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.25,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
});
