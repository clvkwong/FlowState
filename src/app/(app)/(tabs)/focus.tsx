import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";
import { FocusSessionActionSheet } from "@/components/FocusSessionActionSheet";
import { FocusSessionRow } from "@/components/FocusSessionRow";
import { FocusStatsCard } from "@/components/FocusStatsCard";
import { SwipeActionsRow } from "@/components/SwipeActionsRow";
import { useDeleteFocusSession } from "@/hooks/useDeleteFocusSession";
import { useNow } from "@/hooks/useNow";
import { useFocusStore } from "@/stores/focusStore";
import type { FocusSession } from "@/types/focus";
import {
  formatDateString,
  formatRelativeDay,
  formatShortDate,
} from "@/utils/date";
import {
  getFocusStreak,
  getFocusWeekStats,
  groupFocusSessionsByDay,
} from "@/utils/focus";

// Recent sessions load a page at a time; Show more adds the next page.
const PAGE_SIZE = 10;

// Let the sheet's dismiss animation finish before navigating or opening the
// delete dialog; iOS drops a Modal presented while another is closing.
const SHEET_DISMISS_MS = 250;

export default function FocusScreen() {
  const router = useRouter();
  const now = useNow();
  const today = formatDateString(now);

  const sessions = useFocusStore((s) => s.sessions);
  const activeSession = useFocusStore((s) => s.activeSession);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const actionSession =
    sessions.find((s) => s.id === actionSessionId) ?? null;
  const { requestDelete, dialog: deleteDialog } = useDeleteFocusSession();

  // Only one swiped-open row at a time.
  const openRow = useRef<SwipeableMethods | null>(null);
  const handleRowOpen = (row: SwipeableMethods) => {
    if (openRow.current && openRow.current !== row) openRow.current.close();
    openRow.current = row;
  };

  const streak = useMemo(() => getFocusStreak(sessions, today), [sessions, today]);
  const week = useMemo(() => getFocusWeekStats(sessions, now), [sessions, now]);
  const groups = useMemo(
    () => groupFocusSessionsByDay(sessions),
    [sessions],
  );

  // Page through sessions (not days) so one busy day can't flood the list.
  const visibleGroups = useMemo(() => {
    let remaining = visibleCount;
    const result: typeof groups = [];
    for (const group of groups) {
      if (remaining <= 0) break;
      result.push({ ...group, sessions: group.sessions.slice(0, remaining) });
      remaining -= group.sessions.length;
    }
    return result;
  }, [groups, visibleCount]);

  const startNew = () => router.push("/(app)/focus/new");

  const runAgain = (session: FocusSession) =>
    router.push({
      pathname: "/(app)/focus/new",
      params: {
        task: session.task,
        description: session.description ?? "",
        minutes: String(Math.round(session.plannedDurationSeconds / 60)),
      },
    });

  const viewSession = (session: FocusSession) =>
    router.push({
      pathname: "/(app)/focus/log/[id]",
      params: { id: session.id },
    });

  const editSession = (session: FocusSession) =>
    router.push({
      pathname: "/(app)/focus/log/[id]/edit",
      params: { id: session.id },
    });

  const afterSheetCloses = (fn: () => void) => {
    setActionSessionId(null);
    setTimeout(fn, SHEET_DISMISS_MS);
  };

  const resume = () => {
    if (!activeSession) return;
    router.push({
      pathname: "/(app)/focus/[sessionId]",
      params: { sessionId: activeSession.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Focus</Text>
          <Text style={styles.subtitle}>One task. Full attention.</Text>
        </View>

        <FocusStatsCard streak={streak} week={week} today={today} />

        {activeSession ? (
          <Pressable
            onPress={resume}
            accessibilityRole="button"
            accessibilityLabel={`Resume focus session: ${activeSession.task}`}
            style={({ pressed }) => [styles.resume, pressed && styles.pressed]}
          >
            <View style={styles.resumeDot} />
            <View style={styles.resumeBody}>
              <Text style={styles.resumeLabel}>
                {activeSession.pausedAt ? "PAUSED" : "IN PROGRESS"}
              </Text>
              <Text style={styles.resumeTask} numberOfLines={1}>
                {activeSession.task}
              </Text>
            </View>
            <Text style={styles.resumeAction}>Resume</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.focus} />
          </Pressable>
        ) : (
          <Pressable
            onPress={startNew}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Ionicons name="play" size={22} color={colors.textPrimary} />
            <Text style={styles.ctaText}>Start a focus session</Text>
          </Pressable>
        )}

        <View style={styles.list}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent sessions</Text>
            {groups.length > 0 ? (
              <Text style={styles.sectionHint}>Hold or swipe to edit</Text>
            ) : null}
          </View>

          {groups.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="timer-outline" size={36} color={colors.focus} />
              </View>
              <Text style={styles.emptyTitle}>No focus sessions yet</Text>
              <Text style={styles.emptyBody}>
                Pick one task, set a timer and go. Your sessions and streak
                show up here.
              </Text>
            </View>
          ) : (
            visibleGroups.map((group) => (
              <View key={group.date} style={styles.group}>
                <Text style={styles.groupLabel}>
                  {(
                    formatRelativeDay(group.date, today) ??
                    formatShortDate(group.date)
                  ).toUpperCase()}
                </Text>
                {group.sessions.map((session) => (
                  <SwipeActionsRow
                    key={session.id}
                    itemLabel={session.task}
                    borderRadius={borderRadius.lg}
                    onView={() => viewSession(session)}
                    onEdit={() => editSession(session)}
                    onDelete={() => requestDelete(session)}
                    onOpen={handleRowOpen}
                  >
                    <FocusSessionRow
                      session={session}
                      onRunAgain={runAgain}
                      onPress={viewSession}
                      onLongPress={(s) => setActionSessionId(s.id)}
                    />
                  </SwipeActionsRow>
                ))}
              </View>
            ))
          )}

          {sessions.length > visibleCount ? (
            <Pressable
              onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${Math.min(PAGE_SIZE, sessions.length - visibleCount)} more sessions, ${sessions.length - visibleCount} older`}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-down" size={18} color={colors.textPrimary} />
              <Text style={styles.moreText}>
                Show {Math.min(PAGE_SIZE, sessions.length - visibleCount)} more
              </Text>
              <View style={styles.moreSpacer} />
              <Text style={styles.moreCount}>
                {sessions.length - visibleCount} older
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <FocusSessionActionSheet
        session={actionSession}
        today={today}
        onClose={() => setActionSessionId(null)}
        onView={(session) => afterSheetCloses(() => viewSession(session))}
        onEdit={(session) => afterSheetCloses(() => editSession(session))}
        onDelete={(session) => afterSheetCloses(() => requestDelete(session))}
      />
      {deleteDialog}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: 140, // clear the floating tab bar
    gap: 20,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  cta: {
    height: 64,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
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
  resume: {
    minHeight: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.focus,
    backgroundColor: withOpacity(colors.focus, 0.15),
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resumeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.focus,
  },
  resumeBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resumeLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.focus,
  },
  resumeTask: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  resumeAction: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.focus,
  },
  list: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  group: {
    gap: 10,
  },
  groupLabel: {
    paddingTop: spacing.xs,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withOpacity(colors.focus, 0.15),
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
  more: {
    marginTop: spacing.xs,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  moreSpacer: {
    flex: 1,
  },
  moreCount: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  moreText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
});
