import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";
import { Button } from "@/components/Button";
import { useDeleteFocusSession } from "@/hooks/useDeleteFocusSession";
import { useFocusStore } from "@/stores/focusStore";
import { formatShortDate, formatTime, todayString } from "@/utils/date";
import {
  focusDayLabel,
  formatFocusClock,
  formatFocusMinutes,
  getFocusSessionDate,
  getFocusSessionPausedSeconds,
} from "@/utils/focus";

/** One past focus session: outcome, time focused vs planned, timings. */
export default function FocusSessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useFocusStore((s) => s.sessions.find((x) => x.id === id));
  const { requestDelete, dialog } = useDeleteFocusSession();

  if (!session) {
    return (
      <SafeAreaView style={[styles.safe, styles.missing]}>
        <Text style={styles.missingText}>This focus session is gone.</Text>
        <Button title="Back to Focus" onPress={() => router.back()} />
        {dialog}
      </SafeAreaView>
    );
  }

  const done = session.status === "completed";
  const date = getFocusSessionDate(session);
  const today = todayString();
  const dayLabel = focusDayLabel(date, today);
  const planned = session.plannedDurationSeconds;
  const actual = session.actualDurationSeconds;
  const progress = planned > 0 ? Math.min(1, actual / planned) : 1;
  const overtime = actual - planned;
  const paused = getFocusSessionPausedSeconds(session);

  const plannedLabel = formatFocusMinutes(planned);
  const caption =
    overtime >= 60
      ? `Planned ${plannedLabel} · +${formatFocusMinutes(overtime)} overtime`
      : done
        ? `Planned ${plannedLabel} · hit it`
        : `Planned ${plannedLabel} · ${Math.round(progress * 100)}% of the plan`;

  const runAgain = () =>
    router.push({
      pathname: "/(app)/focus/new",
      params: {
        task: session.task,
        description: session.description ?? "",
        minutes: String(Math.round(planned / 60)),
      },
    });

  const edit = () =>
    router.push({
      pathname: "/(app)/focus/log/[id]/edit",
      params: { id: session.id },
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.round, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={edit}
          accessibilityRole="button"
          accessibilityLabel="Edit session"
          style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View style={styles.status}>
            <Ionicons
              name={done ? "checkmark" : "flash"}
              size={14}
              color={colors.background}
            />
            <Text style={styles.statusText}>
              {done ? "DONE" : "FINISHED EARLY"}
            </Text>
          </View>
          <Text style={styles.task} accessibilityRole="header">
            {session.task}
          </Text>
          {session.description ? (
            <Text style={styles.description}>{session.description}</Text>
          ) : null}
        </View>

        <View
          style={styles.focused}
          accessible
          accessibilityLabel={`Focused ${formatFocusMinutes(actual)}. ${caption}`}
        >
          <View style={styles.focusedRow}>
            <Text style={styles.focusedValue}>{formatFocusClock(actual)}</Text>
            <Text style={styles.focusedUnit}>focused</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.caption}>{caption}</Text>
        </View>

        <View style={styles.details}>
          <DetailRow
            label="Date"
            value={
              dayLabel === formatShortDate(date)
                ? dayLabel
                : `${dayLabel}, ${formatShortDate(date)}`
            }
          />
          <DetailRow label="Started" value={formatTime(session.startedAt)} />
          <DetailRow label="Finished" value={formatTime(session.endedAt)} />
          <DetailRow label="Paused" value={formatFocusMinutes(paused)} last />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={runAgain}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Ionicons name="refresh" size={20} color={colors.textPrimary} />
          <Text style={styles.ctaText}>Run again</Text>
        </Pressable>
        <Pressable
          onPress={() => requestDelete(session, () => router.back())}
          accessibilityRole="button"
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Delete session</Text>
        </Pressable>
      </View>

      {dialog}
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailDivider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  missing: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  missingText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  editPill: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  content: {
    gap: 20,
    paddingBottom: spacing.lg,
  },
  head: {
    gap: 10,
  },
  status: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.focus,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: colors.background,
  },
  task: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 23,
    color: colors.textPrimary,
    opacity: 0.85,
  },
  focused: {
    backgroundColor: withOpacity(colors.focus, 0.15),
    borderRadius: borderRadius.xl,
    padding: 20,
    gap: 12,
  },
  focusedRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  focusedValue: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "900",
    color: colors.focus,
    fontVariant: ["tabular-nums"],
  },
  focusedUnit: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  track: {
    height: 14,
    borderRadius: 7,
    backgroundColor: withOpacity(colors.focus, 0.2),
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 7,
    backgroundColor: colors.focus,
  },
  caption: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  details: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  detailRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailDivider: {
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(colors.textSecondary, 0.2),
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actions: {
    gap: 10,
  },
  cta: {
    height: 64,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  delete: {
    height: 52,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
