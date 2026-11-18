import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import {
  borderRadius,
  colors,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
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
import { RoutineStepProgress } from "@/components/RoutineStepProgress";
import { RoutineTimerRing } from "@/components/RoutineTimerRing";
import { getStepTimerState } from "@/utils/routineSteps";

const ROUTINE_TINT = "#C9BBFF";

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

  const isFinalStep = currTaskIndex === tasks.length - 1;
  const nextTask = isFinalStep ? null : tasks[currTaskIndex + 1];
  const plannedSeconds = currentTask?.durationSeconds ?? 0;
  const { elapsedRatio } = getStepTimerState(countdownTime, plannedSeconds);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onRouterBack}
          accessibilityRole="button"
          accessibilityLabel="Close routine"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.habitName} numberOfLines={1}>
          {habit.name}
        </Text>
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>
            {currTaskIndex + 1} / {tasks.length}
          </Text>
        </View>
      </View>

      <RoutineStepProgress
        total={tasks.length}
        currentIndex={currTaskIndex}
        currentRatio={elapsedRatio}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.taskLabel}>{currentTask?.label}</Text>

        <RoutineTimerRing
          countdownSeconds={countdownTime}
          plannedSeconds={plannedSeconds}
        />

        {currentTask?.description ? (
          <View style={styles.howTo}>
            <Text style={styles.howToText}>{currentTask.description}</Text>
          </View>
        ) : null}

        <View style={styles.upNext}>
          <Text style={styles.upNextLabel}>
            {nextTask ? "UP NEXT" : "LAST STEP"}
          </Text>
          <Text style={styles.upNextName} numberOfLines={1}>
            {nextTask ? nextTask.label : "Then you're done"}
          </Text>
          {nextTask ? (
            <Text style={styles.upNextTime}>
              {formatDuration(nextTask.durationSeconds)}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleCompleteStep}
        disabled={submitting}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.complete,
          pressed && styles.completePressed,
          submitting && styles.completeDisabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <>
            <Ionicons name="checkmark" size={24} color={colors.textPrimary} />
            <Text style={styles.completeText}>
              {isFinalStep ? "Finish routine" : "Complete step"}
            </Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 18,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  habitName: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  stepPill: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.routine, 0.22),
    alignItems: "center",
    justifyContent: "center",
  },
  stepPillText: {
    fontSize: 14,
    fontWeight: "900",
    color: ROUTINE_TINT,
    fontVariant: ["tabular-nums"],
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 18,
    paddingVertical: spacing.sm,
  },
  taskLabel: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.textPrimary,
    textAlign: "center",
  },
  howTo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    gap: spacing.sm,
  },
  howToText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
    color: "#E4E4F5",
  },
  upNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.xs,
  },
  upNextLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  upNextName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  upNextTime: {
    fontSize: 13,
    fontWeight: "800",
    color: ROUTINE_TINT,
    fontVariant: ["tabular-nums"],
  },
  complete: {
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
  completePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  completeDisabled: {
    opacity: 0.6,
  },
  completeText: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
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
