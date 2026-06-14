import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

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
import { getHabitHeatMapCells, HabitHeatMapCell } from "@/utils/habitLogic";

interface HabitHeatMapProps {
  habit: Habit;
  logs: HabitLog[];
  days?: number;
  rows?: number;
}

export function HabitHeatMap({ habit, logs, days = 21 }: HabitHeatMapProps) {
  const accent = getHabitAccent(habit.type);
  const cells = getHabitHeatMapCells(habit, logs, days);
  const completedDays = cells.filter((cell) => cell.completed).length;

  const renderCell = useCallback((cell: HabitHeatMapCell) => {
    const opacity =
      cell.completion === 0 ? 0.12 : 0.18 + cell.completion * 0.72;
    const backgroundColor =
      cell.completion === 0
        ? withOpacity(colors.textSecondary, 0.14)
        : withOpacity(accent, opacity);

    return (
      <View
        key={cell.date}
        style={[
          styles.cell,
          {
            backgroundColor,
            borderColor:
              cell.completion === 0
                ? withOpacity(colors.textSecondary, 0.12)
                : withOpacity(accent, 0.18),
          },
        ]}
        accessibilityLabel={`${cell.date}: ${cell.completed ? "completed" : "not completed"}`}
      />
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Last {days} days</Text>
        <Text style={[styles.value, { color: accent }]}>
          {completedDays}/{days}
        </Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.row}>{cells.map(renderCell)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  value: {
    ...typography.caption,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "column",
    rowGap: spacing.xs,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cell: {
    width: "4%",
    aspectRatio: 1,
    borderRadius: borderRadius.sm / 3,
    borderWidth: 2,
  },
});
