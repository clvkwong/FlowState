import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import { useRoutineSessionStore } from "@/stores/routineSessionStore";
import { useAuthStore } from "@/stores/authStore";
import { formatDuration, todayString } from "@/utils/date";
import { getLogForHabit } from "@/utils/habitLogic";
import {
  appendTaskToActiveSession,
  getCompletedTask,
  getRoutineSessionProgress,
} from "@/utils/routineSession";

import { Button } from "@/components/Button";

export default function RoutineTimerScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === habitId));
  const logs = useLogStore((s) => s.logs);
  const activeSession = useRoutineSessionStore((s) => s.activeSession);

  const { appendCompletedTask, clearActiveSession } = useRoutineSessionStore();
  const completeRoutine = useLogStore((s) => s.completeRoutine);

  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(() => todayString(), []);
  const existingLog = useMemo(
    () => getLogForHabit(logs, habitId ?? "", today),
    [logs, habitId, today],
  );
  const tasks = useMemo(() => habit?.tasks ?? [], [habit?.tasks]);

  const [routineSessionProgress, setRoutineSessionProgress] = useState(
    getRoutineSessionProgress(activeSession, tasks),
  );
  const currTaskIndex = useMemo(
    () => routineSessionProgress?.currTaskIndex ?? -1,
    [routineSessionProgress?.currTaskIndex],
  );
  const currentTask = useMemo(
    () => (currTaskIndex >= 0 ? tasks[currTaskIndex] : null),
    [currTaskIndex, tasks],
  );
  const countdownTime = useMemo(
    () => routineSessionProgress?.currTaskCountdown ?? 0,
    [routineSessionProgress?.currTaskCountdown],
  );

  useEffect(() => {
    if (!routineSessionProgress) return;
    const timer = setInterval(() => {
      setRoutineSessionProgress(
        getRoutineSessionProgress(activeSession, tasks),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const onRouterBack = useCallback(() => {
    clearActiveSession();
    router.back();
    return true;
  }, [router]);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onRouterBack,
    );
    return () => backHandler.remove();
  });

  const handleCompleteStep = useCallback(async () => {
    if (!user || !activeSession || !currentTask) return;
    setSubmitting(true);
    const isFinalStep = currTaskIndex === tasks.length - 1;
    const completedTask = getCompletedTask(activeSession, currentTask.id);

    try {
      if (isFinalStep) {
        await completeRoutine(user.uid, activeSession);
        onRouterBack();
      } else {
        appendCompletedTask(completedTask);
        setRoutineSessionProgress(
          getRoutineSessionProgress(
            appendTaskToActiveSession(activeSession, completedTask),
            tasks,
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    user,
    activeSession,
    currentTask,
    currTaskIndex,
    tasks,
    completeRoutine,
    onRouterBack,
    appendCompletedTask,
    setRoutineSessionProgress,
  ]);

  if (!habit || habit.type !== "routine" || tasks.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Routine not found</Text>
        <Button title="Go back" onPress={onRouterBack} />
      </SafeAreaView>
    );
  }

  if (existingLog?.completed || currTaskIndex === -1) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.done}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Routine complete!</Text>
          <Button title="Back to home" onPress={onRouterBack} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.close} onPress={onRouterBack}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.stepLabel}>
          Step {currTaskIndex + 1} of {tasks.length}
        </Text>
        <Text style={styles.taskLabel}>{currentTask?.label}</Text>

        <View style={styles.timer}>
          <Text style={styles.timerText}>{formatDuration(countdownTime)}</Text>
          <Text style={styles.planned}>
            planned {formatDuration(currentTask?.durationSeconds ?? 0)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={
            currTaskIndex === tasks.length - 1
              ? "Finish Routine"
              : "Complete Step"
          }
          onPress={handleCompleteStep}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  close: {
    alignSelf: "flex-end",
    padding: spacing.sm,
  },
  closeText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  habitName: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  stepLabel: {
    ...typography.label,
    color: colors.primary,
  },
  taskLabel: {
    ...typography.title,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: "center",
  },
  timer: {
    alignItems: "center",
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl * 2,
  },
  timerText: {
    fontSize: 64,
    fontWeight: "800",
    color: colors.primary,
    fontVariant: ["tabular-nums"],
  },
  planned: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  footer: {
    paddingBottom: spacing.md,
  },
  error: {
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  done: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  doneEmoji: {
    fontSize: 56,
  },
  doneTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
});
