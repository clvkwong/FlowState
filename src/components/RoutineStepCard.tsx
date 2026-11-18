import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  borderRadius,
  colors,
  spacing,
  withOpacity,
} from "@/constants/theme";
import type { RoutineTask } from "@/types/habit";
import { formatDuration } from "@/utils/date";

const ROUTINE_TINT = "#C9BBFF";

interface RoutineStepCardProps {
  step: RoutineTask;
  index: number;
  total: number;
  onPress: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function RoutineStepCard({
  step,
  index,
  total,
  onPress,
  onMoveUp,
  onMoveDown,
  onDelete,
}: RoutineStepCardProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      entering={FadeInDown.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.card}
    >
      <View style={styles.reorder}>
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Move ${step.label} up`}
          style={({ pressed }) => [
            styles.reorderButton,
            pressed && styles.pressed,
            isFirst && styles.reorderDisabled,
          ]}
        >
          <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Move ${step.label} down`}
          style={({ pressed }) => [
            styles.reorderButton,
            pressed && styles.pressed,
            isLast && styles.reorderDisabled,
          ]}
        >
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.number}>
        <Text style={styles.numberText}>{index + 1}</Text>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Edit step ${index + 1}, ${step.label}, ${formatDuration(step.durationSeconds)}`}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.label} numberOfLines={1}>
            {step.label}
          </Text>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>
              {formatDuration(step.durationSeconds)}
            </Text>
          </View>
        </View>
        {step.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {step.description}
          </Text>
        ) : (
          <Text style={styles.descriptionEmpty} numberOfLines={1}>
            Tap to add a description
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${step.label}`}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: withOpacity(colors.routine, 0.35),
    paddingVertical: 8,
    paddingLeft: 4,
    paddingRight: 8,
  },
  reorder: {
    width: 32,
    alignItems: "center",
  },
  reorderButton: {
    width: 32,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderDisabled: {
    opacity: 0.25,
  },
  number: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.routine,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  timePill: {
    backgroundColor: withOpacity(colors.routine, 0.22),
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "800",
    color: ROUTINE_TINT,
    fontVariant: ["tabular-nums"],
  },
  description: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  descriptionEmpty: {
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    color: colors.textSecondary,
  },
  delete: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.danger, 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
