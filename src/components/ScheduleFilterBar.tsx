import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors } from "@/constants/theme";
import type { ScheduleFilter } from "@/utils/schedule";

const TODAY_FILTERS: { key: ScheduleFilter; label: string }[] = [
  { key: "next", label: "Up next" },
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
  { key: "all", label: "All day" },
];
// "Up next" only means something for today.
const OTHER_DAY_FILTERS = [
  TODAY_FILTERS[4],
  ...TODAY_FILTERS.slice(1, 4),
];

interface ScheduleFilterBarProps {
  value: ScheduleFilter;
  isToday: boolean;
  onChange: (filter: ScheduleFilter) => void;
}

export function ScheduleFilterBar({
  value,
  isToday,
  onChange,
}: ScheduleFilterBarProps) {
  const filters = isToday ? TODAY_FILTERS : OTHER_DAY_FILTERS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {filters.map((f) => {
        const active = f.key === value;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.pill,
              active && styles.pillActive,
              pressed && styles.pressed,
            ]}
          >
            {f.key === "next" ? <View style={styles.liveDot} /> : null}
            <Text style={[styles.label, active && styles.labelActive]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -20,
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.check,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textOnRaised,
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
