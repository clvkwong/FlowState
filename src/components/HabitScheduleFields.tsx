import { Pressable, StyleSheet, Text, View } from "react-native";

import { TimeOfDayIcon } from "@/components/TimeOfDayIcon";
import {
  borderRadius,
  colors,
  getTimeOfDayAccent,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import type { TimeOfDay, Weekday } from "@/types/habit";
import {
  ALL_WEEKDAYS,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  WEEKDAY_LETTER,
  WEEKDAY_SHORT,
  WEEKDAYS_MONDAY_FIRST,
  formatDays,
} from "@/utils/schedule";

const PRESETS: { label: string; days: Weekday[] }[] = [
  { label: "Every day", days: ALL_WEEKDAYS },
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [0, 6] },
];

const SLOT_HINTS: Record<TimeOfDay, string> = {
  morning: "until 12 PM",
  afternoon: "12 – 5 PM",
  evening: "after 5 PM",
  anytime: "shows all day",
};

interface HabitScheduleFieldsProps {
  days: Weekday[];
  onDaysChange: (days: Weekday[]) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (timeOfDay: TimeOfDay) => void;
}

function sameDays(a: Weekday[], b: Weekday[]) {
  return a.length === b.length && a.every((d) => b.includes(d));
}

export function HabitScheduleFields({
  days,
  onDaysChange,
  timeOfDay,
  onTimeOfDayChange,
}: HabitScheduleFieldsProps) {
  const activePreset = PRESETS.find((p) => sameDays(p.days, days));

  const toggleDay = (day: Weekday) =>
    onDaysChange(
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    );

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <View style={styles.labelRow}>
          <Text style={styles.sectionLabel}>Repeat on</Text>
          <Text style={styles.summary}>
            {days.length === 0 ? "No days picked" : formatDays(days)}
          </Text>
        </View>
        <View style={styles.presetRow}>
          {PRESETS.map((p) => {
            const active = activePreset === p;
            return (
              <Pressable
                key={p.label}
                onPress={() => onDaysChange([...p.days])}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.preset,
                  active && styles.presetActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.presetText, active && styles.presetTextActive]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.dayRow}>
          {WEEKDAYS_MONDAY_FIRST.map((d) => {
            const on = days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={WEEKDAY_SHORT[d]}
                style={({ pressed }) => [
                  styles.day,
                  on && styles.dayOn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.dayText, on && styles.dayTextOn]}>
                  {WEEKDAY_LETTER[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.sectionLabel}>Time of day</Text>
        <View style={styles.slotGrid} accessibilityRole="radiogroup">
          {TIME_OF_DAY_ORDER.map((t) => {
            const active = t === timeOfDay;
            const accent = getTimeOfDayAccent(t);
            return (
              <Pressable
                key={t}
                onPress={() => onTimeOfDayChange(t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${TIME_OF_DAY_LABELS[t]}, ${SLOT_HINTS[t]}`}
                style={({ pressed }) => [
                  styles.slot,
                  active && {
                    borderColor: accent,
                    backgroundColor: withOpacity(accent, 0.15),
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.slotIcon,
                    { backgroundColor: withOpacity(accent, 0.2) },
                  ]}
                >
                  <TimeOfDayIcon timeOfDay={t} size={20} />
                </View>
                <View style={styles.slotText}>
                  <Text style={styles.slotLabel}>{TIME_OF_DAY_LABELS[t]}</Text>
                  <Text style={styles.slotHint}>{SLOT_HINTS[t]}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm + 4,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summary: {
    ...typography.label,
    color: colors.routineLabel,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  preset: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    ...typography.label,
    fontWeight: "800",
    color: colors.textOnRaised,
  },
  presetTextActive: {
    color: colors.textPrimary,
  },
  dayRow: {
    flexDirection: "row",
    gap: 6,
  },
  day: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dayOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.textSecondary,
  },
  dayTextOn: {
    color: colors.textPrimary,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slot: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 104,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
    padding: 14,
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  slotText: {
    gap: 2,
  },
  slotLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  slotHint: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
