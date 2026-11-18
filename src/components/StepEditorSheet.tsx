import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Button } from "@/components/Button";
import {
  borderRadius,
  colors,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import type { RoutineTask } from "@/types/habit";
import { formatDuration } from "@/utils/date";
import {
  MAX_STEP_DESCRIPTION_LENGTH,
  STEP_DURATION_INCREMENT_SECONDS,
  STEP_DURATION_PRESETS,
  normalizeStep,
  parseTypedDuration,
  splitDuration,
  stepDurationBy,
  validateStep,
} from "@/utils/routineSteps";

const ROUTINE_TINT = "#C9BBFF";
const FIELD_BORDER = "#34344E";

interface StepEditorSheetProps {
  /** The step being edited, or null when the sheet is closed. */
  step: RoutineTask | null;
  /** Zero-based position of the step; null for a step not yet in the list. */
  index: number | null;
  total: number;
  onSave: (step: RoutineTask) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClose: () => void;
}

type Mode = "details" | "duration";

export function StepEditorSheet({
  step,
  index,
  total,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  onClose,
}: StepEditorSheetProps) {
  const [draft, setDraft] = useState<RoutineTask | null>(step);
  const [mode, setMode] = useState<Mode>("details");
  const [error, setError] = useState("");
  const [minutesText, setMinutesText] = useState("");
  const [secondsText, setSecondsText] = useState("");
  const secondsRef = useRef<TextInput>(null);

  const stepId = step?.id;
  useEffect(() => {
    setDraft(step);
    setMode("details");
    setError("");
    // Reset only when a different step is opened, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  const isNew = index === null;
  const visible = step !== null && draft !== null;

  const update = (changes: Partial<RoutineTask>) =>
    setDraft((prev) => (prev ? { ...prev, ...changes } : prev));

  const openDurationEditor = () => {
    if (!draft) return;
    const { minutes, seconds } = splitDuration(draft.durationSeconds);
    setMinutesText(String(minutes));
    setSecondsText(String(seconds).padStart(2, "0"));
    setMode("duration");
  };

  const typedDuration = parseTypedDuration(minutesText, secondsText);

  const applyTypedDuration = () => {
    if (typedDuration === null) return;
    update({ durationSeconds: typedDuration });
    setMode("details");
  };

  const applyPresetWhileTyping = (seconds: number) => {
    const split = splitDuration(seconds);
    setMinutesText(String(split.minutes));
    setSecondsText(String(split.seconds).padStart(2, "0"));
  };

  const handleDone = () => {
    if (!draft) return;
    const normalized = normalizeStep(draft);
    const problem = validateStep(normalized);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(normalized);
  };

  const handleRequestClose = () => {
    if (mode === "duration") setMode("details");
    else onClose();
  };

  const descriptionLength = draft?.description?.length ?? 0;
  const stepNumber = isNew ? total + 1 : index + 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleRequestClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <KeyboardAvoidingView
          // keyboard-controller's version: RN's built-in one is a no-op on
          // Android under edge-to-edge (SDK 53+), where adjustResize no longer
          // resizes the window — and Modals never got it anyway.
          behavior="padding"
          style={styles.avoider}
          pointerEvents="box-none"
        >
          {draft ? (
            <View style={styles.sheet}>
              <View style={styles.grabber} />
              {mode === "details" ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.content}
                >
                  <View style={styles.header}>
                    <View style={styles.headerTitle}>
                      <View style={styles.number}>
                        <Text style={styles.numberText}>{stepNumber}</Text>
                      </View>
                      <Text style={styles.title}>
                        {isNew ? "New step" : "Edit step"}
                      </Text>
                    </View>
                    <IconButton icon="close" label="Close" onPress={onClose} />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>STEP NAME</Text>
                    <TextInput
                      value={draft.label}
                      onChangeText={(label) => {
                        update({ label });
                        if (error) setError("");
                      }}
                      placeholder="e.g. Stretch"
                      placeholderTextColor={colors.textSecondary}
                      autoFocus={isNew}
                      returnKeyType="next"
                      accessibilityLabel="Step name"
                      style={[
                        styles.input,
                        styles.nameInput,
                        error ? styles.inputError : styles.inputActive,
                      ]}
                    />
                  </View>

                  <View style={styles.field}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>
                        DESCRIPTION{" "}
                        <Text style={styles.optional}>· optional</Text>
                      </Text>
                      <Text style={styles.counter}>
                        {descriptionLength} / {MAX_STEP_DESCRIPTION_LENGTH}
                      </Text>
                    </View>
                    <TextInput
                      value={draft.description ?? ""}
                      onChangeText={(description) => update({ description })}
                      placeholder="Cues, form tips, what “done” looks like…"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={MAX_STEP_DESCRIPTION_LENGTH}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel="Step description"
                      style={[styles.input, styles.descriptionInput]}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>DURATION</Text>
                    <View style={styles.stepper}>
                      <IconButton
                        icon="remove"
                        label={`Decrease by ${STEP_DURATION_INCREMENT_SECONDS} seconds`}
                        size={52}
                        onPress={() =>
                          update({
                            durationSeconds: stepDurationBy(
                              draft.durationSeconds,
                              -STEP_DURATION_INCREMENT_SECONDS,
                            ),
                          })
                        }
                        background={colors.surface}
                      />
                      <Pressable
                        onPress={openDurationEditor}
                        accessibilityRole="button"
                        accessibilityLabel={`Duration ${formatDuration(draft.durationSeconds)}. Tap to type a time`}
                        style={({ pressed }) => [
                          styles.durationDisplay,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.durationValue}>
                          {formatDuration(draft.durationSeconds)}
                        </Text>
                      </Pressable>
                      <IconButton
                        icon="add"
                        label={`Increase by ${STEP_DURATION_INCREMENT_SECONDS} seconds`}
                        size={52}
                        onPress={() =>
                          update({
                            durationSeconds: stepDurationBy(
                              draft.durationSeconds,
                              STEP_DURATION_INCREMENT_SECONDS,
                            ),
                          })
                        }
                        background={colors.primary}
                      />
                    </View>
                    <PresetRow
                      selected={draft.durationSeconds}
                      onSelect={(durationSeconds) =>
                        update({ durationSeconds })
                      }
                    />
                  </View>

                  {!isNew && total > 1 ? (
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        POSITION · {index + 1} OF {total}
                      </Text>
                      <View style={styles.row}>
                        <PillButton
                          icon="arrow-up"
                          title="Move up"
                          onPress={onMoveUp}
                          disabled={index === 0}
                        />
                        <PillButton
                          icon="arrow-down"
                          title="Move down"
                          onPress={onMoveDown}
                          disabled={index === total - 1}
                        />
                      </View>
                    </View>
                  ) : null}

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <View style={styles.row}>
                    {!isNew ? (
                      <Pressable
                        onPress={onDelete}
                        accessibilityRole="button"
                        accessibilityLabel="Delete step"
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color={colors.danger}
                        />
                      </Pressable>
                    ) : null}
                    <Button
                      title={isNew ? "Add step" : "Done"}
                      onPress={handleDone}
                      style={styles.flex}
                    />
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.content}>
                  <View style={styles.header}>
                    <View>
                      <Text style={styles.fieldLabel} numberOfLines={1}>
                        STEP {stepNumber}
                        {draft.label.trim()
                          ? ` · ${draft.label.trim().toUpperCase()}`
                          : ""}
                      </Text>
                      <Text style={styles.title}>Set duration</Text>
                    </View>
                    <IconButton
                      icon="close"
                      label="Back to step"
                      onPress={() => setMode("details")}
                    />
                  </View>

                  <View style={styles.typedRow}>
                    <View style={styles.typedField}>
                      <TextInput
                        value={minutesText}
                        onChangeText={(text) => {
                          const digits = text.replace(/\D/g, "").slice(0, 2);
                          setMinutesText(digits);
                          if (digits.length === 2) secondsRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        autoFocus
                        selectTextOnFocus
                        maxLength={2}
                        accessibilityLabel="Minutes"
                        style={styles.typedInput}
                      />
                      <Text style={styles.typedLabel}>MIN</Text>
                    </View>
                    <Text style={styles.typedColon}>:</Text>
                    <View style={styles.typedField}>
                      <TextInput
                        ref={secondsRef}
                        value={secondsText}
                        onChangeText={(text) =>
                          setSecondsText(text.replace(/\D/g, "").slice(0, 2))
                        }
                        keyboardType="number-pad"
                        selectTextOnFocus
                        maxLength={2}
                        returnKeyType="done"
                        onSubmitEditing={applyTypedDuration}
                        accessibilityLabel="Seconds"
                        style={styles.typedInput}
                      />
                      <Text style={styles.typedLabel}>SEC</Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.typedHint,
                      typedDuration === null && styles.typedHintError,
                    ]}
                  >
                    {typedDuration === null
                      ? "Enter at least 1 second"
                      : "Any time from 0:01 to 59:59"}
                  </Text>

                  <PresetRow
                    selected={typedDuration}
                    onSelect={applyPresetWhileTyping}
                  />

                  <Button
                    title={
                      typedDuration === null
                        ? "Set duration"
                        : `Set ${formatDuration(typedDuration)}`
                    }
                    onPress={applyTypedDuration}
                    disabled={typedDuration === null}
                  />
                </View>
              )}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function PresetRow({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (seconds: number) => void;
}) {
  return (
    <View style={styles.presets}>
      {STEP_DURATION_PRESETS.map((seconds) => {
        const isSelected = selected === seconds;
        return (
          <Pressable
            key={seconds}
            onPress={() => onSelect(seconds)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.preset,
              isSelected && styles.presetSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.presetText}>{formatDuration(seconds)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  size = 44,
  background = colors.background,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  size?: number;
  background?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: background },
        pressed && styles.pressedScale,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

function PillButton({
  icon,
  title,
  onPress,
  disabled,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.textPrimary} />
      <Text style={styles.pillText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 24, 0.72)",
    justifyContent: "flex-end",
  },
  avoider: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    maxHeight: "92%",
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: borderRadius.pill,
    backgroundColor: "#3A3A58",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: 34,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  number: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.routine,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  optional: {
    fontWeight: "600",
    letterSpacing: 0,
  },
  counter: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: FIELD_BORDER,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  inputActive: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  nameInput: {
    height: 54,
    fontSize: 18,
    fontWeight: "700",
  },
  descriptionInput: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 21,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  durationDisplay: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  durationValue: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    borderStyle: "dotted",
  },
  presets: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  preset: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: FIELD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  presetSelected: {
    borderColor: colors.primary,
    backgroundColor: withOpacity(colors.primary, 0.22),
  },
  presetText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  pill: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  typedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 10,
  },
  typedField: {
    alignItems: "center",
    gap: spacing.sm,
  },
  typedInput: {
    width: 128,
    height: 96,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: withOpacity(colors.primary, 0.14),
    color: colors.textPrimary,
    fontSize: 56,
    fontWeight: "900",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    padding: 0,
  },
  typedLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: ROUTINE_TINT,
  },
  typedColon: {
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 92,
    color: colors.textSecondary,
  },
  typedHint: {
    marginTop: -4,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typedHintError: {
    color: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  pressedScale: {
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.35,
  },
});
