import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";
import { AppTextInput } from "@/components/AppTextInput";
import { KeyboardAwareScreen } from "@/components/KeyboardAwareScreen";
import { useAuthStore } from "@/stores/authStore";
import { useFocusStore } from "@/stores/focusStore";
import {
  clampFocusMinutes,
  FOCUS_DEFAULT_MINUTES,
  FOCUS_DESCRIPTION_MAX,
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
  FOCUS_PRESET_MINUTES,
  getFocusDraftError,
  stepFocusMinutes,
} from "@/utils/focus";

type Params = { task?: string; description?: string; minutes?: string };

export default function NewFocusSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const user = useAuthStore((s) => s.user);
  const activeSession = useFocusStore((s) => s.activeSession);
  const startSession = useFocusStore((s) => s.startSession);
  const endSession = useFocusStore((s) => s.endSession);

  // "Run again" prefills from a past session.
  const [task, setTask] = useState(params.task ?? "");
  const [description, setDescription] = useState(params.description ?? "");
  const [minutes, setMinutes] = useState(() =>
    params.minutes
      ? clampFocusMinutes(Number(params.minutes))
      : FOCUS_DEFAULT_MINUTES,
  );
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const begin = () => {
    const session = startSession({ task, description, plannedMinutes: minutes });
    router.replace({
      pathname: "/(app)/focus/[sessionId]",
      params: { sessionId: session.id },
    });
  };

  const handleStart = () => {
    const draftError = getFocusDraftError({
      task,
      description,
      plannedMinutes: minutes,
    });
    if (draftError) {
      setError(draftError);
      return;
    }
    setError("");

    if (!activeSession) {
      begin();
      return;
    }
    Alert.alert(
      "End current session?",
      `"${activeSession.task}" is still in progress. It will be logged as ended early.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "End and start",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            setStarting(true);
            try {
              await endSession(user.uid, "ended_early");
              begin();
            } catch {
              setError("Couldn't save the current session. Try again.");
            } finally {
              setStarting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.tag}>
          <Text style={styles.tagText}>ONE-OFF FOCUS</Text>
        </View>
        <View style={styles.close} />
      </View>

      <KeyboardAwareScreen
        contentContainerStyle={styles.content}
        keepVisibleBelow={80}
      >
        <Text style={styles.title}>What are you{"\n"}focusing on?</Text>

        <AppTextInput
          label="Task"
          value={task}
          onChangeText={(t) => {
            setTask(t);
            if (error) setError("");
          }}
          placeholder="e.g. Write the intro section"
          autoFocus={!params.task}
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
            placeholder="Anything to remember while you focus"
            multiline
            maxLength={FOCUS_DESCRIPTION_MAX}
            style={styles.descriptionInput}
            accessibilityLabel="Description, optional"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Timer</Text>
          <View style={styles.presets}>
            {FOCUS_PRESET_MINUTES.map((preset) => {
              const selected = preset === minutes;
              return (
                <Pressable
                  key={preset}
                  onPress={() => setMinutes(preset)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${preset} minutes`}
                  style={({ pressed }) => [
                    styles.preset,
                    selected && styles.presetSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selected && styles.presetTextSelected,
                    ]}
                  >
                    {preset}m
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.stepper}>
            <StepButton
              icon="remove"
              label="5 minutes less"
              disabled={minutes <= FOCUS_MIN_MINUTES}
              onPress={() => setMinutes((m) => stepFocusMinutes(m, -1))}
            />
            <View
              style={styles.stepperValue}
              accessible
              accessibilityLabel={`${minutes} minutes`}
            >
              <Text style={styles.minutes}>{minutes}:00</Text>
              <Text style={styles.range}>
                minutes · {FOCUS_MIN_MINUTES}–{FOCUS_MAX_MINUTES}
              </Text>
            </View>
            <StepButton
              icon="add"
              label="5 minutes more"
              disabled={minutes >= FOCUS_MAX_MINUTES}
              onPress={() => setMinutes((m) => stepFocusMinutes(m, 1))}
            />
          </View>
        </View>

        {error && task.trim() ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAwareScreen>

      <Pressable
        onPress={handleStart}
        disabled={starting}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.start,
          pressed && styles.startPressed,
          starting && styles.disabled,
        ]}
      >
        <Ionicons name="play" size={22} color={colors.textPrimary} />
        <Text style={styles.startText}>Start focus · {minutes} min</Text>
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
    lineHeight: 35,
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
  presets: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  preset: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  presetSelected: {
    backgroundColor: colors.focus,
    borderColor: colors.focus,
  },
  presetText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  presetTextSelected: {
    color: colors.background,
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
    alignItems: "center",
    gap: 2,
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
  },
  error: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
  start: {
    height: 64,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  startPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  startText: {
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
