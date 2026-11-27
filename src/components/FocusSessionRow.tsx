import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, withOpacity } from "@/constants/theme";
import type { FocusSession } from "@/types/focus";
import { formatTime } from "@/utils/date";
import { formatFocusClock, formatFocusMinutes } from "@/utils/focus";

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
        // Every logged session gets the filled, rewarding style: finishing a
        // task before the timer runs out isn't a lesser outcome.
        { backgroundColor: withOpacity(colors.focus, 0.15) },
      ]}
    >
      <View
        style={[styles.icon, { backgroundColor: colors.focus }]}
      >
        <Ionicons
          name={done ? "checkmark" : "flash"}
          size={20}
          color={colors.background}
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
        accessibilityLabel={`${done ? "Done" : "Finished early"}, focused ${formatFocusMinutes(session.actualDurationSeconds)}`}
      >
        <Text style={styles.actual}>
          {formatFocusClock(session.actualDurationSeconds)}
        </Text>
        <Text style={styles.status}>{done ? "DONE" : "FINISHED EARLY"}</Text>
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
