import { StyleSheet, Text, View } from "react-native";

import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import { BottomSheet, SheetAction } from "@/components/BottomSheet";
import type { Habit } from "@/types/habit";

interface HabitActionSheetProps {
  /** The habit the menu is open for; null hides the sheet. */
  habit: Habit | null;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onView: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

function describe(habit: Habit): string {
  switch (habit.type) {
    case "check":
      return "Once a day";
    case "count":
      return `Target ${habit.target ?? 1}`;
    case "routine": {
      const steps = habit.tasks?.length ?? 0;
      return `${steps} ${steps === 1 ? "step" : "steps"}`;
    }
  }
}

export function HabitActionSheet({
  habit,
  onClose,
  onEdit,
  onView,
  onDelete,
}: HabitActionSheetProps) {
  const accent = habit ? getHabitAccent(habit.type) : colors.primary;
  const label =
    habit?.type === "routine" ? colors.routineLabel : accent;

  return (
    <BottomSheet
      visible={habit !== null}
      onClose={onClose}
      accessibilityLabel={habit ? `${habit.name} options` : "Habit options"}
    >
      {habit ? (
        <>
          <View style={styles.summary}>
            <View
              style={[styles.badge, { backgroundColor: withOpacity(accent, 0.15) }]}
            >
              <View style={[styles.dot, { backgroundColor: accent }]} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.name} numberOfLines={1}>
                {habit.name}
              </Text>
              <Text style={styles.meta}>
                <Text style={{ color: label }}>{habit.type.toUpperCase()}</Text>
                <Text style={styles.metaSub}> · {describe(habit)}</Text>
              </Text>
            </View>
          </View>
          <SheetAction
            label="Edit habit"
            icon="create-outline"
            variant="primary"
            onPress={() => onEdit(habit)}
          />
          <SheetAction
            label="View habit"
            icon="eye-outline"
            variant="secondary"
            onPress={() => onView(habit)}
          />
          <SheetAction
            label="Delete habit"
            icon="trash-outline"
            variant="dangerText"
            onPress={() => onDelete(habit)}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.pill,
  },
  summaryText: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  metaSub: {
    color: colors.textSecondary,
  },
});
