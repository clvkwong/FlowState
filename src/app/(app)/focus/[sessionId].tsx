import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing } from "@/constants/theme";
import { Button } from "@/components/Button";
import { FocusCompleteView } from "@/components/FocusCompleteView";
import { FocusTimerRing } from "@/components/FocusTimerRing";
import { useAuthStore } from "@/stores/authStore";
import { useFocusStore } from "@/stores/focusStore";
import type { FocusSession, FocusSessionStatus } from "@/types/focus";
import { todayString } from "@/utils/date";
import {
  canExtendFocusSession,
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
  const { pauseSession, resumeSession, extendSession, endSession } =
    useFocusStore.getState();

  const session = activeSession?.id === sessionId ? activeSession : null;
  const paused = session?.pausedAt != null;

  const [now, setNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<FocusSessionStatus | null>(null);
  const [finished, setFinished] = useState<FocusSession | null>(null);
  const autoEnded = useRef(false);

  // Tick while running. Time is derived from timestamps, so it stays right
  // across backgrounding and app restarts.
  useEffect(() => {
    if (!session || paused) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session, paused]);

  const remaining = session ? getFocusRemainingSeconds(session, now) : 0;

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(tabs)/focus");
  }, [router]);

  const finish = useCallback(
    async (status: FocusSessionStatus) => {
      if (!user || saving) return;
      setSaving(true);
      setSaveError(null);
      try {
        const logged = await endSession(user.uid, status);
        // Every logged session gets the celebration, ended early or not.
        if (logged) setFinished(logged);
        else close(); // under a minute: nothing was logged
      } catch {
        setSaveError(status);
      } finally {
        setSaving(false);
      }
    },
    [user, saving, endSession, close],
  );

  // Time's up: log it as completed (once).
  useEffect(() => {
    if (session && !paused && remaining === 0 && !autoEnded.current) {
      autoEnded.current = true;
      void finish("completed");
    }
  }, [session, paused, remaining, finish]);

  const confirmEndEarly = useCallback(() => {
    if (!session) {
      close();
      return true;
    }
    Alert.alert(
      "Finish early?",
      "Done with this task? The time you've focused counts toward your streak and 7-day total.",
      [
        { text: "Keep going", style: "cancel" },
        {
          text: "Finish early",
          onPress: () => void finish("ended_early"),
        },
      ],
    );
    return true;
  }, [session, close, finish]);

  useEffect(() => {
    if (finished) return;
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      confirmEndEarly,
    );
    return () => sub.remove();
  }, [confirmEndEarly, finished]);

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
        <Pressable
          onPress={confirmEndEarly}
          accessibilityRole="button"
          accessibilityLabel="Finish early"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.status}>
          <View style={[styles.statusDot, paused && styles.statusDotPaused]} />
          <Text style={[styles.statusText, paused && styles.statusTextPaused]}>
            {paused ? "PAUSED" : "FOCUSING"}
          </Text>
        </View>
        <View style={styles.close} />
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
            onPress={extendSession}
            disabled={!canExtendFocusSession(session) || saving}
            accessibilityRole="button"
            accessibilityLabel="Add 5 minutes"
            style={({ pressed }) => [
              styles.sideButton,
              pressed && styles.pressed,
              !canExtendFocusSession(session) && styles.disabled,
            ]}
          >
            <Text style={styles.plusFive}>+5</Text>
          </Pressable>

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

          <Pressable
            onPress={() => void finish("completed")}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Finish now"
            style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color={colors.check} />
            ) : (
              <Ionicons name="checkmark" size={26} color={colors.check} />
            )}
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
              onPress={() => void finish(saveError)}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Ionicons name="flame" size={22} color={colors.focus} />
        <Text style={styles.footerText}>
          {stats.streak > 0 ? (
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
  sideButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  plusFive: {
    fontSize: 17,
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
