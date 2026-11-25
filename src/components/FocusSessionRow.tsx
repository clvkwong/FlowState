import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, withOpacity } from "@/constants/theme";
import type { FocusSession } from "@/types/focus";
import { formatDuration, formatTime } from "@/utils/date";
import { formatFocusMinutes } from "@/utils/focus";

interface FocusSessionRowProps {
  session: FocusSession;
  onRunAgain: (session: FocusSession) => void;
}

/** One past focus session: task, planned vs actual time, status, Run again. */
export function FocusSessionRow({ session, onRunAgain }: FocusSessionRowProps) {
  const done = session.status === "completed";

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: done ? withOpacity(colors.focus, 0.15) : colors.surface },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: done ? colors.focus : withOpacity(colors.focus, 0.15),
          },
        ]}
      >
        <Ionicons
          name={done ? "checkmark" : "hourglass-outline"}
          size={20}
          color={done ? colors.background : colors.focus}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.task} numberOfLines={1}>
          {session.task}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatFocusMinutes(session.plannedDurationSeconds)} planned ·{" "}
          {formatTime(session.startedAt)}
        </Text>
      </View>

      <View
        style={styles.result}
        accessible
        accessibilityLabel={`${done ? "Done" : "Ended early"}, focused ${formatFocusMinutes(session.actualDurationSeconds)}`}
      >
        <Text style={styles.actual}>
          {formatDuration(session.actualDurationSeconds)}
        </Text>
        <Text style={styles.status}>{done ? "DONE" : "ENDED EARLY"}</Text>
      </View>

      <Pressable
        onPress={() => onRunAgain(session)}
        accessibilityRole="button"
        accessibilityLabel={`Run ${session.task} again`}
        hitSlop={4}
        style={({ pressed }) => [styles.again, pressed && styles.pressed]}
      >
        <Ionicons name="refresh" size={18} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  task: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  result: {
    alignItems: "flex-end",
    gap: 3,
  },
  actual: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  status: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: colors.focus,
  },
  again: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
