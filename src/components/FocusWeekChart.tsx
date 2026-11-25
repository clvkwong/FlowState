import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors, withOpacity } from "@/constants/theme";
import { parseDateString } from "@/utils/date";
import type { FocusDayStat } from "@/utils/focus";

const BAR_MAX_HEIGHT = 72;
const BAR_MIN_HEIGHT = 4;

interface FocusWeekChartProps {
  days: FocusDayStat[];
  today: string;
}

/** Minutes focused per day for the last 7 days; today is in focus amber. */
export function FocusWeekChart({ days, today }: FocusWeekChartProps) {
  const maxSeconds = Math.max(...days.map((d) => d.seconds), 1);
  const summary = days
    .map((d) => {
      const name = parseDateString(d.date).toLocaleDateString(undefined, {
        weekday: "long",
      });
      return `${name} ${Math.round(d.seconds / 60)} minutes`;
    })
    .join(", ");

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Minutes focused per day, last 7 days: ${summary}`}
    >
      {days.map((day) => (
        <Bar
          key={day.date}
          day={day}
          isToday={day.date === today}
          height={Math.max(
            BAR_MIN_HEIGHT,
            Math.round((day.seconds / maxSeconds) * BAR_MAX_HEIGHT),
          )}
        />
      ))}
    </View>
  );
}

function Bar({
  day,
  isToday,
  height,
}: {
  day: FocusDayStat;
  isToday: boolean;
  height: number;
}) {
  const grow = useRef(new Animated.Value(BAR_MIN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: height,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [grow, height]);

  const minutes = Math.round(day.seconds / 60);
  const fill = isToday
    ? colors.focus
    : day.seconds > 0
      ? withOpacity(colors.count, 0.75)
      : colors.surfaceRaised;
  const letter = parseDateString(day.date)
    .toLocaleDateString(undefined, { weekday: "narrow" })
    .toUpperCase();

  return (
    <View style={styles.column}>
      <Text style={[styles.value, isToday && styles.today]}>
        {minutes > 0 ? minutes : "–"}
      </Text>
      <Animated.View
        style={[styles.bar, { height: grow, backgroundColor: fill }]}
      />
      <Text style={[styles.day, isToday && styles.today]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  bar: {
    alignSelf: "stretch",
    borderRadius: 8,
  },
  day: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  today: {
    color: colors.focus,
  },
});
