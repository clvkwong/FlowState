import { StyleSheet, Text, View } from "react-native";

import { TimeOfDayIcon } from "@/components/TimeOfDayIcon";
import {
  borderRadius,
  colors,
  getTimeOfDayAccent,
  withOpacity,
} from "@/constants/theme";
import type { TimeOfDay } from "@/types/habit";
import { TIME_OF_DAY_LABELS, TIME_OF_DAY_RANGES } from "@/utils/schedule";

interface ScheduleSectionHeaderProps {
  timeOfDay: TimeOfDay;
  isNow: boolean;
  completed: number;
  total: number;
}

export function ScheduleSectionHeader({
  timeOfDay,
  isNow,
  completed,
  total,
}: ScheduleSectionHeaderProps) {
  const accent = getTimeOfDayAccent(timeOfDay);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${TIME_OF_DAY_LABELS[timeOfDay]}${
        isNow ? ", now" : ""
      }, ${completed} of ${total} done`}
    >
      <View style={[styles.icon, { backgroundColor: withOpacity(accent, 0.18) }]}>
        <TimeOfDayIcon timeOfDay={timeOfDay} size={18} />
      </View>
      <Text style={styles.label}>{TIME_OF_DAY_LABELS[timeOfDay]}</Text>
      <Text style={styles.range}>{TIME_OF_DAY_RANGES[timeOfDay]}</Text>
      {isNow ? (
        <View style={styles.now}>
          <Text style={styles.nowText}>NOW</Text>
        </View>
      ) : null}
      <Text style={styles.count}>
        {completed}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  range: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  now: {
    backgroundColor: colors.check,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nowText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.background,
  },
  count: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "800",
    color: colors.textSecondary,
  },
});
