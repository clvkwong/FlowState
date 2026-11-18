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
import type { CreateHabitInput, Habit, HabitType } from "@/types/habit";

interface HabitFormProps {
  initial?: Habit;
  lockType?: boolean;
  onSubmit: (input: CreateHabitInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /**
   * Opens the routine steps screen. Steps are never edited in this form and it
   * never submits `tasks`; the parent screen owns them. Receives the name as
   * currently typed so the steps screen can show it.
   */
  onManageSteps?: (draft: { name: string }) => void;
  /** Steps shown on the Manage steps link. Defaults to `initial.tasks`. */
  stepCount?: number;
  submitLabel?: string;
}

export function HabitForm({
  initial,
  lockType = false,
  onSubmit,
  onDelete,
  onManageSteps,
  stepCount = initial?.tasks?.length ?? 0,
  submitLabel = "Save Habit",
}: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(
    initial?.description ?? "",
  );
  const [type, setType] = useState<HabitType>(initial?.type ?? "check");
  const [target, setTarget] = useState(String(initial?.target ?? 8));
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

    setLoading(true);
    try {
      const input: CreateHabitInput = {
        name: name.trim(),
        description: description.trim(),
        type,
      };
      if (type === "count") input.target = Number(target);
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
            onPress={() => onManageSteps({ name })}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.manageSteps,
              pressed && styles.manageStepsPressed,
            ]}
          >
            <View style={styles.manageStepsText}>
              <Text style={styles.manageStepsTitle}>
                {stepCount === 0 ? "Add steps" : "Manage steps"}
              </Text>
              <Text style={styles.manageStepsMeta}>
                {stepCount === 0
                  ? "No steps yet · each one gets its own timer"
                  : `${stepCount} ${stepCount === 1 ? "step" : "steps"} · add, edit, reorder`}
              </Text>
            </View>
            <Text style={styles.manageStepsChevron}>›</Text>
          </Pressable>
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
