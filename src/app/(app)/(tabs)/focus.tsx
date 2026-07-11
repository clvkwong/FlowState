import { useCallback, useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Href, useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { borderRadius, colors, spacing, typography, withOpacity } from "@/constants/theme";
import { useFocusSessionStore } from "@/stores/focusSessionStore";
import { useLogStore } from "@/stores/logStore";
import { formatDisplayDate } from "@/utils/date";
import { getFocusLogs } from "@/utils/habitLogic";

import { FocusTaskBuilder } from "@/components/FocusTaskBuilder";

export default function FocusScreen() {
  const router = useRouter();
  const pathSegments = useSegments() as string[];
  const logs = useLogStore((s) => s.logs);
  const activeSession = useFocusSessionStore((s) => s.activeSession);
  const startSession = useFocusSessionStore((s) => s.startSession);

  const focusLogs = useMemo(() => getFocusLogs(logs).slice(0, 20), [logs]);

  const handleStart = useCallback(
    (taskLabel: string, durationSeconds: number, focusName?: string) => {
      const sessionId = startSession(taskLabel, durationSeconds, focusName);
      router.push(`/(app)/focus/${sessionId}` as Href);
    },
    [startSession, router],
  );

  useEffect(() => {
    const onFocusTimerScreen = pathSegments[1] === "focus";
    if (!onFocusTimerScreen && activeSession?.sessionId) {
      router.push(`/(app)/focus/${activeSession.sessionId}` as Href);
    }
  }, [pathSegments, activeSession, router]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Focus</Text>
          <Text style={styles.subtitle}>One-off timed sessions</Text>
        </View>

        <View style={styles.builderCard}>
          <FocusTaskBuilder onStart={handleStart} />
        </View>

        <Text style={styles.sectionLabel}>Recent sessions</Text>
        {focusLogs.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyText}>
              Completed focus sessions will appear here.
            </Text>
          </View>
        ) : (
          focusLogs.map((log) => {
            return (
              <View key={log.id} style={styles.historyRow}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyName}>Focus session</Text>
                  <Text style={styles.historyMeta}>
                    {formatDisplayDate(log.date)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  builderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: withOpacity(colors.primary, 0.35),
    padding: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  emptyHistory: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: withOpacity(colors.primary, 0.2),
    padding: spacing.md,
    gap: spacing.md,
  },
  historyMain: {
    flex: 1,
    gap: 4,
  },
  historyName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },
  historyMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
