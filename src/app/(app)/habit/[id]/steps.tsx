import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import Ionicons from "@react-native-vector-icons/ionicons";

import { Button } from "@/components/Button";
import { RoutineStepCard } from "@/components/RoutineStepCard";
import { StepEditorSheet } from "@/components/StepEditorSheet";
import {
  borderRadius,
  colors,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import { generateHabitTaskId } from "@/services/habitService";
import { useHabitStore } from "@/stores/habitStore";
import type { RoutineTask } from "@/types/habit";
import { formatDuration } from "@/utils/date";
import {
  DEFAULT_STEP_DURATION_SECONDS,
  areStepsEqual,
  getStepsTotalDuration,
  insertStepAt,
  moveStep,
  normalizeStep,
  removeStep,
  upsertStep,
} from "@/utils/routineSteps";

const ROUTINE_TINT = "#C9BBFF";
const UNDO_TIMEOUT_MS = 4000;

interface RemovedStep {
  step: RoutineTask;
  index: number;
}

export default function RoutineStepsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const savedSteps = useMemo(() => habit?.tasks ?? [], [habit?.tasks]);
  const [steps, setSteps] = useState<RoutineTask[]>(savedSteps);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<RoutineTask | null>(null);
  const [removed, setRemoved] = useState<RemovedStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = !areStepsEqual(steps, savedSteps);
  const totalSeconds = getStepsTotalDuration(steps);
  const editingIndex = editingId
    ? steps.findIndex((s) => s.id === editingId)
    : -1;
  const sheetStep = newStep ?? (editingIndex >= 0 ? steps[editingIndex] : null);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const leave = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }
    Alert.alert("Discard changes?", "Your step changes haven't been saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  }, [isDirty, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isDirty) return false;
      leave();
      return true;
    });
    return () => sub.remove();
  }, [isDirty, leave]);

  if (!habit || habit.type !== "routine") {
    return (
      <SafeAreaView style={[styles.safe, styles.missing]}>
        <Text style={styles.missingText}>Routine not found</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const showUndo = (entry: RemovedStep) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setRemoved(entry);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_TIMEOUT_MS);
  };

  const handleDelete = (stepId: string) => {
    const result = removeStep(steps, stepId);
    setSteps(result.steps);
    if (result.removed) showUndo(result.removed);
    if (editingId === stepId) setEditingId(null);
  };

  const handleUndo = () => {
    if (!removed) return;
    setSteps((prev) => insertStepAt(prev, removed.step, removed.index));
    setRemoved(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const handleMove = (fromIndex: number, toIndex: number) =>
    setSteps((prev) => moveStep(prev, fromIndex, toIndex));

  const openNewStep = () => {
    setEditingId(null);
    setNewStep({
      id: generateHabitTaskId(),
      label: "",
      durationSeconds: DEFAULT_STEP_DURATION_SECONDS,
    });
  };

  const closeSheet = () => {
    setEditingId(null);
    setNewStep(null);
  };

  const handleSheetSave = (step: RoutineTask) => {
    setSteps((prev) => upsertStep(prev, step));
    closeSheet();
  };

  const handleSave = async () => {
    setError("");
    if (steps.length === 0) {
      setError("Add at least one step");
      return;
    }
    setSaving(true);
    try {
      await updateHabit(habit.id, { tasks: steps.map(normalizeStep) });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save steps");
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={leave}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.eyebrow}>ROUTINE STEPS</Text>
          <View style={styles.backSpacer} />
        </View>

        <Text style={styles.title}>{habit.name}</Text>

        {steps.length === 0 ? (
          <EmptyState onAdd={openNewStep} />
        ) : (
          <>
            <View style={styles.stats}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{steps.length}</Text>
                <Text style={styles.statLabel}>
                  {steps.length === 1 ? "STEP" : "STEPS"}
                </Text>
              </View>
              <View style={[styles.statTile, styles.statTileAccent]}>
                <Text style={styles.statValue}>{formatDuration(totalSeconds)}</Text>
                <Text style={[styles.statLabel, styles.statLabelAccent]}>
                  TOTAL TIME
                </Text>
              </View>
            </View>

            <View style={styles.list}>
              {steps.map((step, index) => (
                <RoutineStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  total={steps.length}
                  onPress={() => setEditingId(step.id)}
                  onMoveUp={() => handleMove(index, index - 1)}
                  onMoveDown={() => handleMove(index, index + 1)}
                  onDelete={() => handleDelete(step.id)}
                />
              ))}
              <Pressable
                onPress={openNewStep}
                accessibilityRole="button"
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={22} color={ROUTINE_TINT} />
                <Text style={styles.addText}>Add step</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {removed ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(150)}
          style={styles.toast}
        >
          <Text style={styles.toastText} numberOfLines={1}>
            Deleted “{removed.step.label}”
          </Text>
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.toastAction}>UNDO</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Save steps"
          onPress={handleSave}
          loading={saving}
          disabled={!isDirty || steps.length === 0}
        />
      </SafeAreaView>

      <StepEditorSheet
        step={sheetStep}
        index={newStep ? null : editingIndex >= 0 ? editingIndex : null}
        total={steps.length}
        onSave={handleSheetSave}
        onDelete={() => editingId && handleDelete(editingId)}
        onMoveUp={() => handleMove(editingIndex, editingIndex - 1)}
        onMoveDown={() => handleMove(editingIndex, editingIndex + 1)}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyRing}>
        <View style={styles.emptyIcon}>
          <Ionicons name="timer-outline" size={44} color={ROUTINE_TINT} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Your routine is a blank slate</Text>
      <Text style={styles.emptyBody}>
        Add steps in the order you'll do them. Each one gets its own timer when
        you run the routine.
      </Text>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={22} color={colors.textPrimary} />
        <Text style={styles.emptyButtonText}>Add first step</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  missing: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  missingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: 14,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  backSpacer: {
    width: 44,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },
  statTileAccent: {
    flex: 1.4,
    backgroundColor: withOpacity(colors.routine, 0.18),
    borderColor: colors.routine,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  statLabelAccent: {
    color: ROUTINE_TINT,
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  addButton: {
    height: 56,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.routine,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  addText: {
    fontSize: 16,
    fontWeight: "800",
    color: ROUTINE_TINT,
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: "#2E2A52",
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.routine,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  toastText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  toastAction: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    color: ROUTINE_TINT,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    backgroundColor: colors.background,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 12,
    paddingVertical: spacing.xl,
  },
  emptyRing: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 14,
    borderColor: colors.surface,
    borderTopColor: colors.routine,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: withOpacity(colors.routine, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    ...typography.body,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyButton: {
    height: 58,
    paddingHorizontal: 30,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.8,
  },
});
