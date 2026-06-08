import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import { formatDuration, todayString } from "@/utils/date";
import { getLogForHabit } from "@/utils/habitLogic";

export default function RoutineTimerScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === habitId));
  const logs = useLogStore((s) => s.logs);
  const completeRoutineStep = useLogStore((s) => s.completeRoutineStep);

  const today = todayString();
  const existingLog = getLogForHabit(logs, habitId ?? "", today);
  const completedTaskIds = useMemo(
    () => new Set(existingLog?.completedTasks?.map((t) => t.taskId) ?? []),
    [existingLog],
  );

  const tasks = habit?.tasks ?? [];
  const startIndex = tasks.findIndex((t) => !completedTaskIds.has(t.id));
  const [stepIndex, setStepIndex] = useState(Math.max(0, startIndex));
  const [secondsLeft, setSecondsLeft] = useState(
    tasks[Math.max(0, startIndex)]?.durationSeconds ?? 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const stepStartedAt = useRef(Date.now());

  const currentTask = tasks[stepIndex];

  useEffect(() => {
    if (!currentTask) return;
    stepStartedAt.current = Date.now();
    setSecondsLeft(currentTask.durationSeconds);
  }, [currentTask?.id]);

  useEffect(() => {
    if (!currentTask) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTask, secondsLeft]);

  if (!habit || habit.type !== "routine" || tasks.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Routine not found</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (existingLog?.completed || startIndex === -1) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.done}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Routine complete!</Text>
          <Button title="Back to home" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleCompleteStep = async () => {
    if (!user || !currentTask) return;
    const actualDurationSeconds = Math.max(
      1,
      Math.round((Date.now() - stepStartedAt.current) / 1000),
    );
    const isFinalStep = stepIndex === tasks.length - 1;

    setSubmitting(true);
    try {
      await completeRoutineStep(
        user.uid,
        habit.id,
        { taskId: currentTask.id, actualDurationSeconds },
        isFinalStep,
      );
      if (isFinalStep) {
        router.back();
      } else {
        setStepIndex((i) => i + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.stepLabel}>
          Step {stepIndex + 1} of {tasks.length}
        </Text>
        <Text style={styles.taskLabel}>{currentTask?.label}</Text>

        <View style={styles.timer}>
          <Text style={styles.timerText}>{formatDuration(secondsLeft)}</Text>
          <Text style={styles.planned}>
            planned {formatDuration(currentTask?.durationSeconds ?? 0)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={
            stepIndex === tasks.length - 1 ? "Finish Routine" : "Complete Step"
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
