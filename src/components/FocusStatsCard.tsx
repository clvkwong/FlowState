import Ionicons from "@react-native-vector-icons/ionicons";
import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, withOpacity } from "@/constants/theme";
import { FocusWeekChart } from "@/components/FocusWeekChart";
import {
  formatFocusTotal,
  type FocusStreak,
  type FocusWeekStats,
} from "@/utils/focus";

interface FocusStatsCardProps {
  streak: FocusStreak;
  week: FocusWeekStats;
  today: string;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Focus streak, last-7-days total and the per-day bar chart. */
export function FocusStatsCard({ streak, week, today }: FocusStatsCardProps) {
  const totalMinutes = Math.floor(week.totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View
          style={styles.stat}
          accessible
          accessibilityLabel={`Focus streak ${plural(streak.current, "day")}. Best ${plural(streak.best, "day")}.`}
        >
          <View style={styles.labelRow}>
            <Ionicons name="flame" size={16} color={colors.focus} />
            <Text style={[styles.label, { color: colors.focus }]}>
              FOCUS STREAK
            </Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.bigNumber, { color: colors.focus }]}>
              {streak.current}
            </Text>
            <Text style={styles.unit}>
              {streak.current === 1 ? "day" : "days"}
            </Text>
          </View>
          <Text style={styles.meta}>Best: {plural(streak.best, "day")}</Text>
        </View>

        <View style={styles.divider} />

        <View
          style={[styles.stat, styles.statRight]}
          accessible
          accessibilityLabel={`Last 7 days: ${formatFocusTotal(week.totalSeconds)} focused over ${plural(week.sessionCount, "session")}.`}
        >
          <View style={styles.labelRow}>
            <Ionicons name="timer-outline" size={16} color={colors.count} />
            <Text style={[styles.label, { color: colors.count }]}>
              LAST 7 DAYS
            </Text>
          </View>
          <View style={styles.valueRow}>
            {hours > 0 ? (
              <>
                <Text style={styles.midNumber}>{hours}</Text>
                <Text style={[styles.unit, styles.unitGap]}>h</Text>
              </>
            ) : null}
            <Text style={styles.midNumber}>
              {hours > 0 ? String(minutes).padStart(2, "0") : minutes}
            </Text>
            <Text style={styles.unit}>m</Text>
          </View>
          <Text style={styles.meta}>{plural(week.sessionCount, "session")}</Text>
        </View>
      </View>

      <FocusWeekChart days={week.days} today={today} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: withOpacity(colors.focus, 0.35),
    padding: 20,
    gap: 18,
  },
  top: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statRight: {
    paddingLeft: 4,
  },
  divider: {
    width: 1.5,
    borderRadius: 2,
    backgroundColor: colors.surfaceRaised,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    minHeight: 60,
  },
  bigNumber: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  midNumber: {
    fontSize: 40,
    lineHeight: 60,
    fontWeight: "900",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  unitGap: {
    marginRight: 6,
  },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
