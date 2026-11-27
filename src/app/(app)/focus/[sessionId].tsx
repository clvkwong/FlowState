import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FocusCompleteView } from "@/components/FocusCompleteView";
import { FocusTimerRing } from "@/components/FocusTimerRing";
import { useAuthStore } from "@/stores/authStore";
import { useFocusStore } from "@/stores/focusStore";
import type { FocusSession } from "@/types/focus";
import { todayString } from "@/utils/date";
import {
  countFocusSessionsOnDate,
  getFocusRemainingSeconds,
  getFocusStreak,
  getFocusWeekStats,
} from "@/utils/focus";

export default function FocusTimerScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const activeSession = useFocusStore((s) => s.activeSession);
  const sessions = useFocusStore((s) => s.sessions);
  const {
    pauseSession,
    resumeSession,
    endSession,
    discardActiveSession,
  } = useFocusStore.getState();

  const session = activeSession?.id === sessionId ? activeSession : null;
  const paused = session?.pausedAt != null;

  const [now, setNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [finished, setFinished] = useState<FocusSession | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  // Tick while running. Time is derived from timestamps, so it stays right
  // across backgrounding and app restarts.
  useEffect(() => {
    if (!session || paused) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session, paused]);

  // Negative once past the planned time: the timer runs on into overtime
  // and only the Finish button ends the session.
  const remaining = session ? getFocusRemainingSeconds(session, now) : 0;
  const overtime = remaining < 0;

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(tabs)/focus");
  }, [router]);

  const save = useCallback(async () => {
    if (!user || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const logged = await endSession(user.uid);
      // Every finished session is logged and gets the celebration.
      if (logged) setFinished(logged);
      else close(); // no active session (already finished elsewhere)
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [user, saving, endSession, close]);

  // Throws the session away: nothing is saved and stats are untouched.
  const handleDiscard = useCallback(() => {
    setConfirmingDiscard(false);
    discardActiveSession();
    close();
  }, [discardActiveSession, close]);

  // The only way a session is saved. Status comes from elapsed vs planned time.
  const handleFinish = useCallback(() => {
    if (session) void save();
  }, [session, save]);

  const today = todayString();
  const stats = useMemo(
    () => ({
      streak: getFocusStreak(sessions, today).current,
      sessionsToday: countFocusSessionsOnDate(sessions, today),
      week: getFocusWeekStats(sessions).totalSeconds,
    }),
    [sessions, today],
  );

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <FocusCompleteView
          session={finished}
          streak={stats.streak}
          sessionsToday={stats.sessionsToday}
          weekTotalSeconds={stats.week}
          onDone={close}
          onAnotherRound={() =>
            router.replace({
              pathname: "/(app)/focus/new",
              params: {
                task: finished.task,
                description: finished.description ?? "",
                minutes: String(
                  Math.round(finished.plannedDurationSeconds / 60),
                ),
              },
            })
          }
        />
      </SafeAreaView>
    );
  }

  if (!session && saving) {
    // The session just ended and its log is being saved.
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.focus} size="large" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.missing}>This focus session has ended.</Text>
        <Button title="Back to Focus" onPress={close} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        {/* Closing only leaves the screen; the session keeps running and the
            Focus tab shows a Resume banner. */}
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close, session keeps running"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.status}>
          <View
            style={[
              styles.statusDot,
              overtime && styles.statusDotOvertime,
              paused && styles.statusDotPaused,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              overtime && styles.statusTextOvertime,
              paused && styles.statusTextPaused,
            ]}
          >
            {paused ? "PAUSED" : overtime ? "OVERTIME" : "FOCUSING"}
          </Text>
        </View>
        <Pressable
          onPress={() => setConfirmingDiscard(true)}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Discard session"
          hitSlop={4}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.task}>{session.task}</Text>
          {session.description ? (
            <Text style={styles.description}>{session.description}</Text>
          ) : null}
        </View>

        <FocusTimerRing
          remainingSeconds={remaining}
          plannedSeconds={session.plannedDurationSeconds}
          paused={paused}
        />

        <View style={styles.controls}>
          <Pressable
            onPress={paused ? resumeSession : pauseSession}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={paused ? "Resume" : "Pause"}
            style={({ pressed }) => [
              styles.mainButton,
              pressed && styles.mainPressed,
            ]}
          >
            <Ionicons
              name={paused ? "play" : "pause"}
              size={36}
              color={colors.background}
            />
          </Pressable>
        </View>

        {saveError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Couldn't save this session. Check your connection.
            </Text>
            <Button
              title="Try again"
              variant="ghost"
              onPress={() => void save()}
            />
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, overtime && styles.footerOvertime]}>
        <Ionicons
          name={overtime ? "checkmark" : "flame"}
          size={22}
          color={overtime ? colors.check : colors.focus}
        />
        <Text style={styles.footerText}>
          {overtime ? (
            <>
              Planned time done. Overtime counts too —{" "}
              <Text style={styles.footerStrongOvertime}>
                finish when you're ready.
              </Text>
            </>
          ) : stats.streak > 0 ? (
            <>
              <Text style={styles.footerStrong}>
                {stats.streak}-day streak
              </Text>{" "}
              and counting. Stay with it.
            </>
          ) : (
            "Finish this one to start a focus streak."
          )}
        </Text>
      </View>

      <Pressable
        onPress={handleFinish}
        disabled={saving}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.finish,
          pressed && styles.finishPressed,
          saving && styles.disabled,
        ]}
      >
        {saving ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <>
            <Ionicons name="checkmark" size={24} color={colors.textPrimary} />
            <Text style={styles.finishText}>Finish session</Text>
          </>
        )}
      </Pressable>

      <ConfirmDialog
        visible={confirmingDiscard}
        icon="trash-outline"
        tone="danger"
        title="Discard session?"
        message="It won't be saved and won't count toward your streak or 7-day total."
        cancelLabel="Keep going"
        confirmLabel="Discard"
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={handleDiscard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  center: {
    justifyContent: "center",
    gap: spacing.md,
  },
  missing: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.focus,
    shadowColor: colors.focus,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  statusDotOvertime: {
    backgroundColor: colors.check,
    shadowColor: colors.check,
  },
  statusTextOvertime: {
    color: colors.check,
  },
  statusDotPaused: {
    backgroundColor: colors.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.focus,
  },
  statusTextPaused: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 28,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  task: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 320,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  finish: {
    marginTop: spacing.md,
    height: 62,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  finishPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  finishText: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  mainButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.focus,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.focus,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  mainPressed: {
    transform: [{ scale: 0.95 }],
  },
  errorBox: {
    alignItems: "center",
    gap: spacing.xs,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
    textAlign: "center",
  },
  footer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    color: colors.textPrimary,
  },
  footerOvertime: {
    backgroundColor: withOpacity(colors.check, 0.15),
  },
  footerStrongOvertime: {
    fontWeight: "900",
    color: colors.check,
  },
  footerStrong: {
    fontWeight: "900",
    color: colors.focus,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
});
