import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  borderRadius,
  colors,
  withOpacity,
} from "@/constants/theme";
import type { Habit } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import { addDays, formatDateString, parseDateString } from "@/utils/date";
import { getLogForHabit, isHabitCompleted } from "@/utils/habitLogic";
import { WEEKDAY_SHORT, getHabitsForDate } from "@/utils/schedule";

/** Days shown either side of today. */
const SPAN = 3;

interface WeekStripProps {
  today: string;
  selected: string;
  habits: Habit[];
  logs: HabitLog[];
  onSelect: (date: string) => void;
}

export function WeekStrip({
  today,
  selected,
  habits,
  logs,
  onSelect,
}: WeekStripProps) {
  const base = parseDateString(today);
  const dates = Array.from({ length: SPAN * 2 + 1 }, (_, i) =>
    formatDateString(addDays(base, i - SPAN)),
  );

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {dates.map((date) => {
        const d = parseDateString(date);
        const isSelected = date === selected;
        const isToday = date === today;
        const isFuture = date > today;

        const scheduled = getHabitsForDate(habits, date);
        const done = scheduled.filter((h) =>
          isHabitCompleted(h, getLogForHabit(logs, h.id, date)),
        ).length;
        const allDone = scheduled.length > 0 && done === scheduled.length;
        const dot = isFuture
          ? "transparent"
          : allDone
            ? colors.check
            : done > 0
              ? colors.textSecondary
              : withOpacity(colors.textSecondary, 0.3);

        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${d.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
            })}${isToday ? ", today" : ""}${
              isFuture ? "" : `, ${done} of ${scheduled.length} done`
            }`}
            style={({ pressed }) => [
              styles.day,
              isToday && styles.today,
              isSelected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.weekday,
                isToday && styles.weekdayToday,
                isSelected && styles.weekdaySelected,
              ]}
            >
              {WEEKDAY_SHORT[d.getDay()].toUpperCase()}
            </Text>
            <Text style={styles.num}>{d.getDate()}</Text>
            <View
              style={[
                styles.dot,
                { backgroundColor: isSelected && !allDone && !isFuture ? colors.textPrimary : dot },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  day: {
    flex: 1,
    height: 70,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  today: {
    borderColor: withOpacity(colors.primary, 0.9),
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  weekday: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  weekdayToday: {
    color: colors.routineLabel,
  },
  weekdaySelected: {
    color: colors.textPrimary,
  },
  num: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.pill,
  },
});
