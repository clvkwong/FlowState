import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";
import { AppTextInput } from "@/components/AppTextInput";
import { Button } from "@/components/Button";
import { KeyboardAwareScreen } from "@/components/KeyboardAwareScreen";
import { useFocusStore } from "@/stores/focusStore";
import type { FocusSession } from "@/types/focus";
import { formatTime, todayString } from "@/utils/date";
import {
  applyFocusSessionEdit,
  FOCUS_DESCRIPTION_MAX,
  focusDayLabel,
  formatFocusClock,
  formatFocusMinutes,
  getFocusEditBounds,
  getFocusEditError,
  getFocusSessionDate,
  getFocusStatusForDuration,
  stepFocusSeconds,
} from "@/utils/focus";

export default function EditFocusSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useFocusStore((s) => s.sessions.find((x) => x.id === id));

  if (!session) {
    return (
      <SafeAreaView style={[styles.safe, styles.missing]}>
        <Text style={styles.missingText}>This focus session is gone.</Text>
        <Button title="Back to Focus" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  // Keyed so the form resets if a different session is opened in place.
  return <EditForm key={session.id} session={session} />;
}

function EditForm({ session }: { session: FocusSession }) {
  const router = useRouter();
  const updateSession = useFocusStore((s) => s.updateSession);

  const [task, setTask] = useState(session.task);
  const [description, setDescription] = useState(session.description ?? "");
  const [seconds, setSeconds] = useState(session.actualDurationSeconds);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const bounds = getFocusEditBounds(session);
  const planned = session.plannedDurationSeconds;
  const status = getFocusStatusForDuration(seconds, planned);
  const done = status === "completed";

  // Tap the time to type hours + minutes, like the new-session timer.
  const [typing, setTyping] = useState(false);
  const [hoursText, setHoursText] = useState("");
  const [minutesText, setMinutesText] = useState("");
  const minutesRef = useRef<TextInput>(null);
  const typedSeconds =
    (Number(hoursText || "0") * 60 + Number(minutesText || "0")) * 60;
  const typedValid =
    Number.isFinite(typedSeconds) &&
    typedSeconds >= bounds.min &&
    typedSeconds <= bounds.max;

  const openTimeEditor = () => {
    const minutes = Math.round(seconds / 60);
    setHoursText(String(Math.floor(minutes / 60)));
    setMinutesText(String(minutes % 60).padStart(2, "0"));
    setTyping(true);
  };

  const closeTimeEditor = () => {
    setTyping(false);
    Keyboard.dismiss();
  };

  const commitTypedTime = (): number => {
    const next = typedValid ? typedSeconds : seconds;
    setSeconds(next);
    closeTimeEditor();
    return next;
  };

  const step = (direction: 1 | -1) =>
    setSeconds((s) => stepFocusSeconds(s, direction, bounds));

  const save = async () => {
    const actualDurationSeconds = typing ? commitTypedTime() : seconds;
    const edit = { task, description, actualDurationSeconds };
    const editError = getFocusEditError(edit, session);
    if (editError) {
      setError(editError);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateSession(applyFocusSessionEdit(session, edit));
      router.back();
    } catch {
      setError("Couldn't save your changes. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = focusDayLabel(getFocusSessionDate(session), todayString());
  const plannedLabel = formatFocusMinutes(planned);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close without saving"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {`${dayLabel} · ${formatTime(session.startedAt)}`.toUpperCase()}
          </Text>
        </View>
        <View style={styles.close} />
      </View>

      <KeyboardAwareScreen
        contentContainerStyle={styles.content}
        keepVisibleBelow={80}
      >
        <Text style={styles.title} accessibilityRole="header">
          Edit session
        </Text>

        <AppTextInput
          label="Task"
          value={task}
          onChangeText={(t) => {
            setTask(t);
            if (error) setError("");
          }}
          placeholder="e.g. Write the intro section"
          returnKeyType="next"
          maxLength={80}
          style={styles.taskInput}
          error={error && !task.trim() ? error : undefined}
        />

        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>
              Description <Text style={styles.optional}>(optional)</Text>
            </Text>
            <Text style={styles.counter}>
              {description.length}/{FOCUS_DESCRIPTION_MAX}
            </Text>
          </View>
          <AppTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Anything to remember about this session"
            multiline
            maxLength={FOCUS_DESCRIPTION_MAX}
            style={styles.descriptionInput}
            accessibilityLabel="Description, optional"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Time focused</Text>

          {typing ? (
            <View style={[styles.stepper, styles.stepperTyping]}>
              <View style={styles.typedRow}>
                <View style={styles.typedField}>
                  <TextInput
                    value={hoursText}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, "").slice(0, 2);
                      setHoursText(digits);
                      if (digits.length === 2) minutesRef.current?.focus();
                    }}
                    keyboardType="number-pad"
                    autoFocus
                    selectTextOnFocus
                    maxLength={2}
                    accessibilityLabel="Hours"
                    style={styles.typedInput}
                  />
                  <Text style={styles.typedLabel}>HR</Text>
                </View>
                <Text style={styles.typedColon}>:</Text>
                <View style={styles.typedField}>
                  <TextInput
                    ref={minutesRef}
                    value={minutesText}
                    onChangeText={(text) =>
                      setMinutesText(text.replace(/\D/g, "").slice(0, 2))
                    }
                    keyboardType="number-pad"
                    selectTextOnFocus
                    maxLength={2}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (typedValid) commitTypedTime();
                    }}
                    accessibilityLabel="Minutes"
                    style={styles.typedInput}
                  />
                  <Text style={styles.typedLabel}>MIN</Text>
                </View>
              </View>
              <Text style={[styles.range, !typedValid && styles.rangeError]}>
                Between {formatFocusClock(bounds.min)} and{" "}
                {formatFocusClock(bounds.max)}
              </Text>
              <View style={styles.typedActions}>
                <Pressable
                  onPress={closeTimeEditor}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.typedButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.typedButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={commitTypedTime}
                  disabled={!typedValid}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !typedValid }}
                  style={({ pressed }) => [
                    styles.typedButton,
                    styles.typedButtonPrimary,
                    pressed && styles.pressed,
                    !typedValid && styles.disabled,
                  ]}
                >
                  <Text
                    style={[styles.typedButtonText, styles.typedButtonTextPrimary]}
                  >
                    Set time
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.stepper}>
              <StepButton
                icon="remove"
                label="1 minute less"
                disabled={seconds <= bounds.min}
                onPress={() => step(-1)}
              />
              <Pressable
                onPress={openTimeEditor}
                accessibilityRole="button"
                accessibilityLabel={`Focused ${formatFocusMinutes(seconds)}. Tap to type a time`}
                style={({ pressed }) => [
                  styles.stepperValue,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={styles.minutes}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatFocusClock(seconds)}
                </Text>
                <View style={styles.editHint}>
                  <Ionicons name="pencil" size={12} color={colors.textSecondary} />
                  <Text style={styles.range}>Tap to type a time</Text>
                </View>
              </Pressable>
              <StepButton
                icon="add"
                label="1 minute more"
                disabled={seconds >= bounds.max}
                onPress={() => step(1)}
              />
            </View>
          )}

          <View style={styles.outcome} accessible accessibilityLiveRegion="polite">
            <View style={styles.outcomeBadge}>
              <Text style={styles.outcomeBadgeText}>
                {done ? "DONE" : "FINISHED EARLY"}
              </Text>
            </View>
            <Text style={styles.outcomeText}>
              {done
                ? `Meets the ${plannedLabel} plan. Under it shows as Finished early.`
                : `Under the ${plannedLabel} plan. ${plannedLabel} or more shows as Done.`}
            </Text>
          </View>
          <Text style={styles.note}>
            Max {formatFocusClock(bounds.max)}, the time from start to finish.
            Planned time and date stay as logged.
          </Text>
        </View>

        {error && task.trim() ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAwareScreen>

      <Pressable
        onPress={() => void save()}
        disabled={saving}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.save,
          pressed && styles.savePressed,
          saving && styles.disabled,
        ]}
      >
        {saving ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.saveText}>Save changes</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons name={icon} size={24} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  missing: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  missingText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.focus, 0.15),
  },
  tagText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.focus,
  },
  content: {
    gap: 22,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  field: {
    gap: spacing.sm,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  optional: {
    fontWeight: "500",
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  taskInput: {
    fontSize: 18,
    fontWeight: "700",
    borderRadius: borderRadius.lg,
  },
  descriptionInput: {
    minHeight: 92,
    textAlignVertical: "top",
    borderRadius: borderRadius.lg,
    lineHeight: 22,
  },
  stepper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  minutes: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "900",
    color: colors.focus,
    fontVariant: ["tabular-nums"],
  },
  range: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  rangeError: {
    color: colors.danger,
  },
  stepperTyping: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  typedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.sm,
  },
  typedField: {
    alignItems: "center",
    gap: 4,
  },
  typedInput: {
    width: 96,
    height: 72,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.focus,
    backgroundColor: colors.surfaceRaised,
    color: colors.focus,
    fontSize: 44,
    fontWeight: "900",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    padding: 0,
  },
  typedLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  typedColon: {
    fontSize: 44,
    lineHeight: 72,
    fontWeight: "900",
    color: colors.focus,
  },
  typedActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typedButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  typedButtonPrimary: {
    flex: 2,
    backgroundColor: colors.focus,
  },
  typedButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  typedButtonTextPrimary: {
    color: colors.background,
  },
  outcome: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: withOpacity(colors.focus, 0.15),
  },
  outcomeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.focus,
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: colors.background,
  },
  outcomeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  note: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  error: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
  save: {
    height: 64,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  savePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  saveText: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
});
