import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { Button } from "@/components/Button";
import { KeyboardAwareScreen } from "@/components/KeyboardAwareScreen";
import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  typography,
} from "@/constants/theme";
import type {
  CreateHabitInput,
  Habit,
  HabitType,
  RoutineTask,
} from "@/types/habit";
import { generateHabitTaskId } from "@/services/habitService";

interface HabitFormProps {
  initial?: Habit;
  lockType?: boolean;
  onSubmit: (input: CreateHabitInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /**
   * When set, routine steps are managed on their own screen: the form shows a
   * link to it instead of the inline step editor and never submits `tasks`.
   */
  onManageSteps?: () => void;
  submitLabel?: string;
}

export function HabitForm({
  initial,
  lockType = false,
  onSubmit,
  onDelete,
  onManageSteps,
  submitLabel = "Save Habit",
}: HabitFormProps) {
  const managesStepsElsewhere = Boolean(onManageSteps);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(
    initial?.description ?? "",
  );
  const [type, setType] = useState<HabitType>(initial?.type ?? "check");
  const [target, setTarget] = useState(String(initial?.target ?? 8));
  const [tasks, setTasks] = useState<RoutineTask[]>(
    initial?.tasks ?? [
      { id: generateHabitTaskId(), label: "", durationSeconds: 60 },
    ],
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (
      type === "count" &&
      (Number(target) < 1 || !Number.isFinite(Number(target)))
    ) {
      setError("Target must be at least 1");
      return;
    }
    if (type === "routine" && !managesStepsElsewhere) {
      const validTasks = tasks.filter((t) => t.label.trim());
      if (validTasks.length === 0) {
        setError("Add at least one routine step");
        return;
      }
    }

    setLoading(true);
    try {
      const input: CreateHabitInput = {
        name: name.trim(),
        description: description.trim(),
        type,
      };
      if (type === "count") input.target = Number(target);
      if (type === "routine" && !managesStepsElsewhere) {
        input.tasks = tasks
          .filter((t) => t.label.trim())
          .map((t) => ({
            ...t,
            label: t.label.trim(),
            durationSeconds: Math.max(1, t.durationSeconds),
          }));
      }
      await onSubmit(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.container}>
      <AppTextInput
        label="Habit name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Drink water"
      />

      <AppTextInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Why does this habit matter to you?"
        multiline
        maxLength={280}
        textAlignVertical="top"
        style={styles.descriptionInput}
      />

      <Text style={styles.sectionLabel}>Type</Text>
      <View style={styles.typeRow}>
        {(["check", "count", "routine"] as HabitType[]).map((t) => {
          const accent = getHabitAccent(t);
          const selected = type === t;
          return (
            <Pressable
              key={t}
              disabled={lockType && initial?.type !== t}
              onPress={() => setType(t)}
              style={[
                styles.typeChip,
                selected && { backgroundColor: accent, borderColor: accent },
                lockType && initial?.type !== t && styles.typeChipDisabled,
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selected && styles.typeChipTextSelected,
                ]}
              >
                {t.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {type === "count" ? (
        <AppTextInput
          label="Daily target"
          value={target}
          onChangeText={setTarget}
          keyboardType="number-pad"
          placeholder="8"
        />
      ) : null}

      {type === "routine" && onManageSteps ? (
        <View style={styles.tasks}>
          <Text style={styles.sectionLabel}>Steps</Text>
          <Pressable
            onPress={onManageSteps}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.manageSteps,
              pressed && styles.manageStepsPressed,
            ]}
          >
            <View style={styles.manageStepsText}>
              <Text style={styles.manageStepsTitle}>Manage steps</Text>
              <Text style={styles.manageStepsMeta}>
                {(initial?.tasks ?? []).length} steps · add, edit, reorder
              </Text>
            </View>
            <Text style={styles.manageStepsChevron}>›</Text>
          </Pressable>
        </View>
      ) : null}

      {type === "routine" && !onManageSteps ? (
        <View style={styles.tasks}>
          <Text style={styles.sectionLabel}>Steps</Text>
          {tasks.map((task, index) => (
            <View key={task.id} style={styles.taskRow}>
              <AppTextInput
                label={`Step ${index + 1}`}
                value={task.label}
                onChangeText={(text) =>
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, label: text } : t,
                    ),
                  )
                }
                placeholder="e.g. Stretch"
                style={styles.taskInput}
              />
              <AppTextInput
                label="Seconds"
                value={String(task.durationSeconds)}
                onChangeText={(text) =>
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id
                        ? {
                            ...t,
                            durationSeconds: Math.max(1, Number(text) || 1),
                          }
                        : t,
                    ),
                  )
                }
                keyboardType="number-pad"
                style={styles.durationInput}
              />
              {tasks.length > 1 ? (
                <Pressable
                  onPress={() =>
                    setTasks((prev) => prev.filter((t) => t.id !== task.id))
                  }
                  style={styles.removeTask}
                >
                  <Text style={styles.removeTaskText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Button
            title="+ Add step"
            variant="ghost"
            onPress={() =>
              setTasks((prev) => [
                ...prev,
                { id: generateHabitTaskId(), label: "", durationSeconds: 60 },
              ])
            }
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={submitLabel} onPress={handleSubmit} loading={loading} />

      {onDelete ? (
        <Button
          title="Delete Habit"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
        />
      ) : null}
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  descriptionInput: {
    minHeight: 96,
    paddingTop: 14,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: "center",
  },
  typeChipDisabled: {
    opacity: 0.35,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  typeChipTextSelected: {
    color: colors.background,
  },
  tasks: {
    gap: spacing.sm,
  },
  taskRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end",
  },
  taskInput: {
    flex: 1,
  },
  durationInput: {
    width: 90,
  },
  removeTask: {
    width: 36,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTaskText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "700",
  },
  manageSteps: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.routine,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  manageStepsPressed: {
    opacity: 0.8,
  },
  manageStepsText: {
    flex: 1,
    gap: 2,
  },
  manageStepsTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  manageStepsMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  manageStepsChevron: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.routine,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
});
