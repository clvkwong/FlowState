import { StyleSheet, Text, View } from "react-native";

import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import type { CompletionSegment } from "@/utils/habitLogic";

interface CompletionSummaryProps {
  completed: number;
  total: number;
  segments: CompletionSegment[];
}

function getMessage(completed: number, total: number): string {
  const left = total - completed;
  if (left === 0) return "Everything done. Take the win.";
  if (completed === 0) return "Fresh start — knock out the first one.";
  return `Nice momentum. ${left} more to clear the board.`;
}

export function CompletionSummary({
  completed,
  total,
  segments,
}: CompletionSummaryProps) {
  const allDone = total > 0 && completed === total;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${completed} of ${total} habits done today`}
    >
      <View style={styles.header}>
        <Text style={styles.count}>
          {completed}
          <Text style={styles.of}> / {total}</Text>
        </Text>
        <View style={[styles.badge, allDone && styles.badgeDone]}>
          <Text style={[styles.badgeText, allDone && styles.badgeTextDone]}>
            {allDone ? "PERFECT DAY" : `${total - completed} LEFT`}
          </Text>
        </View>
      </View>
      <View style={styles.segments}>
        {segments.map((s) => (
          <View
            key={s.habitId}
            style={[
              styles.segment,
              {
                backgroundColor: s.completed
                  ? getHabitAccent(s.type)
                  : withOpacity(colors.textSecondary, 0.18),
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.message}>{getMessage(completed, total)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  count: {
    fontSize: 64,
    lineHeight: 64,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  of: {
    fontSize: 28,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.primary, 0.22),
  },
  badgeDone: {
    backgroundColor: colors.check,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.routineLabel,
  },
  badgeTextDone: {
    color: colors.background,
  },
  segments: {
    flexDirection: "row",
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 12,
    borderRadius: borderRadius.pill,
  },
  message: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
