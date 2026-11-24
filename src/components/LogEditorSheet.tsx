import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { BottomSheet, SheetAction } from "@/components/BottomSheet";
import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import { useLogStore } from "@/stores/logStore";
import type { Habit, Weekday } from "@/types/habit";
import type { CompletedRoutineTask, HabitLog } from "@/types/log";
import {
  formatDuration,
  formatRelativeDay,
  formatShortDate,
  getPastDateStrings,
  parseDateString,
  todayString,
} from "@/utils/date";
import { getLogForHabit } from "@/utils/habitLogic";

/** How far back the day picker reaches. */
const PICKER_DAYS = 60;
const DURATION_STEP_SECONDS = 60;
const FIELD_BORDER = "#34344f";

export type LogEditorTarget =
  | { mode: "create"; date?: string }
  | { mode: "edit"; logId: string };

interface LogEditorSheetProps {
  habit: Habit;
  userId: string;
  /** What to open; null closes the sheet. */
  target: LogEditorTarget | null;
  onClose: () => void;
}

/**
 * Create, edit or delete a single day's log, including days in the past.
 * Picking a day that already has a log switches to editing it, since each
 * habit keeps one log per day.
 */
export function LogEditorSheet({
  habit,
  userId,
  target,
  onClose,
}: LogEditorSheetProps) {
  const logs = useLogStore((s) => s.logs);
  const createLog = useLogStore((s) => s.createLog);
  const updateLog = useLogStore((s) => s.updateLog);
  const deleteLog = useLogStore((s) => s.deleteLog);

  const accent = getHabitAccent(habit.type);
  const onAccent =
    habit.type === "routine" ? colors.textPrimary : colors.background;
  const today = todayString();

  const [date, setDate] = useState(today);
  const [count, setCount] = useState(0);
  const [tasks, setTasks] = useState<CompletedRoutineTask[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = getLogForHabit(logs, habit.id, date);
  const isEdit = existing !== undefined;

  // Seed the form whenever the sheet opens or the chosen day changes.
  const seed = (forDate: string, log: HabitLog | undefined) => {
    setDate(forDate);
    setError(null);
    setCount(log?.count ?? (habit.type === "count" ? 1 : 0));
    setTasks(
      log?.completedTasks ??
        (habit.tasks ?? []).map((t) => ({
          taskId: t.id,
          actualDurationSeconds: t.durationSeconds,
        })),
    );
  };

  useEffect(() => {
    if (!target) return;
    if (target.mode === "edit") {
      const log = logs.find((l) => l.id === target.logId);
      if (log) seed(log.date, log);
    } else {
      const d = target.date ?? today;
      seed(d, getLogForHabit(logs, habit.id, d));
    }
    // Only re-seed on open; edits to `logs` while open shouldn't reset input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const pickDay = (d: string) => seed(d, getLogForHabit(logs, habit.id, d));

  const values = (() => {
    switch (habit.type) {
      case "check":
        return { completed: true };
      case "count":
        return { count };
      case "routine":
        return { completed: true, completedTasks: tasks };
    }
  })();

  // A count of 0 would hide the day from history; use Delete instead.
  const canSave = !saving && (habit.type !== "count" || count > 0);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (existing) await updateLog(habit, existing.id, values);
      else await createLog(userId, habit, date, values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(
      `Delete log for ${dayTitle(date, today)}?`,
      "This day will show as not done.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteLog(existing.id);
              onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Delete failed");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <BottomSheet
      visible={target !== null}
      onClose={onClose}
      accessibilityLabel={isEdit ? "Edit log" : "Log a day"}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{isEdit ? "EDIT LOG" : "LOG A DAY"}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {habit.name}
        </Text>
      </View>

      <DayPicker
        habit={habit}
        logs={logs}
        selected={date}
        today={today}
        accent={accent}
        onAccent={onAccent}
        onPick={pickDay}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        bounces={false}
      >
        {habit.type === "check" ? (
          <CheckValue accent={accent} onAccent={onAccent} />
        ) : null}
        {habit.type === "count" ? (
          <CountValue
            count={count}
            target={habit.target ?? 1}
            accent={accent}
            onChange={setCount}
          />
        ) : null}
        {habit.type === "routine" ? (
          <RoutineValue
            habit={habit}
            tasks={tasks}
            accent={accent}
            onChange={setTasks}
          />
        ) : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SheetAction
        label={saving ? "Saving…" : isEdit ? "Save changes" : "Log it"}
        icon={isEdit ? "checkmark" : "add"}
        variant="primary"
        onPress={save}
        disabled={!canSave}
      />
      {isEdit ? (
        <SheetAction
          label="Delete log"
          icon="trash-outline"
          variant="dangerText"
          onPress={confirmDelete}
          disabled={saving}
        />
      ) : (
        <SheetAction label="Cancel" variant="ghost" onPress={onClose} />
      )}
    </BottomSheet>
  );
}

function dayTitle(date: string, today: string): string {
  return formatRelativeDay(date, today) ?? formatShortDate(date);
}

// ─── Day picker ────────────────────────────────────────────────────────────

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

interface DayPickerProps {
  habit: Habit;
  logs: HabitLog[];
  selected: string;
  today: string;
  accent: string;
  onAccent: string;
  onPick: (date: string) => void;
}

/** Horizontal strip of past days, newest on the right. Dot = already logged. */
function DayPicker({
  habit,
  logs,
  selected,
  today,
  accent,
  onAccent,
  onPick,
}: DayPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const days = useMemo(
    () => getPastDateStrings(PICKER_DAYS, parseDateString(today)),
    [today],
  );

  return (
    <View style={styles.picker}>
      <Text style={styles.pickerLabel}>{dayTitle(selected, today)}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pickerRow}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {days.map((d) => {
          const active = d === selected;
          const logged = getLogForHabit(logs, habit.id, d) !== undefined;
          const day = parseDateString(d);
          const scheduled =
            !habit.days || habit.days.includes(day.getDay() as Weekday);
          return (
            <Pressable
              key={d}
              onPress={() => onPick(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${formatShortDate(d)}${logged ? ", logged" : ""}`}
              style={[
                styles.dayChip,
                active && { backgroundColor: accent, borderColor: accent },
                !scheduled && !active && styles.dayChipOff,
              ]}
            >
              <Text style={[styles.dayWeek, active && { color: onAccent }]}>
                {WEEKDAY_SHORT[day.getDay()]}
              </Text>
              <Text style={[styles.dayNum, active && { color: onAccent }]}>
                {day.getDate()}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  logged && { backgroundColor: active ? onAccent : accent },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Per-type value editors ────────────────────────────────────────────────

function CheckValue({ accent, onAccent }: { accent: string; onAccent: string }) {
  return (
    <View style={[styles.checkRow, { backgroundColor: withOpacity(accent, 0.15) }]}>
      <View style={[styles.checkBadge, { backgroundColor: accent }]}>
        <Ionicons name="checkmark" size={32} color={onAccent} />
      </View>
      <Text style={styles.checkText}>Done</Text>
    </View>
  );
}

interface CountValueProps {
  count: number;
  target: number;
  accent: string;
  onChange: (count: number) => void;
}

function CountValue({ count, target, accent, onChange }: CountValueProps) {
  const ratio = Math.min(count / target, 1);
  const done = count >= target;
  return (
    <View style={styles.countWrap}>
      <View style={styles.countRow}>
        <RoundButton
          icon="remove"
          accent={accent}
          onPress={() => onChange(Math.max(0, count - 1))}
          disabled={count <= 0}
          label="Decrease"
        />
        <Text style={styles.countValue}>
          {count}
          <Text style={styles.countTarget}> / {target}</Text>
        </Text>
        <RoundButton
          icon="add"
          accent={accent}
          filled
          onPress={() => onChange(count + 1)}
          label="Increase"
        />
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { backgroundColor: accent, width: `${ratio * 100}%` },
          ]}
        />
      </View>
      <Text style={[styles.countStatus, done && { color: accent }]}>
        {done ? "Target hit 🎯" : `${target - count} to go`}
      </Text>
    </View>
  );
}

interface RoutineValueProps {
  habit: Habit;
  tasks: CompletedRoutineTask[];
  accent: string;
  onChange: (tasks: CompletedRoutineTask[]) => void;
}

/** Toggle which steps were done and nudge how long each took. */
function RoutineValue({ habit, tasks, accent, onChange }: RoutineValueProps) {
  const steps = habit.tasks ?? [];
  if (steps.length === 0) {
    return (
      <Text style={styles.routineEmpty}>
        This routine has no steps — it will be logged as complete.
      </Text>
    );
  }

  const toggle = (taskId: string, planned: number) => {
    const has = tasks.some((t) => t.taskId === taskId);
    if (has) {
      onChange(tasks.filter((t) => t.taskId !== taskId));
      return;
    }
    // Keep steps in routine order.
    const next = [...tasks, { taskId, actualDurationSeconds: planned }];
    const order = steps.map((s) => s.id);
    next.sort((a, b) => order.indexOf(a.taskId) - order.indexOf(b.taskId));
    onChange(next);
  };

  const nudge = (taskId: string, delta: number) =>
    onChange(
      tasks.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              actualDurationSeconds: Math.max(
                0,
                t.actualDurationSeconds + delta,
              ),
            }
          : t,
      ),
    );

  return (
    <View style={styles.routineList}>
      {steps.map((step) => {
        const done = tasks.find((t) => t.taskId === step.id);
        return (
          <View
            key={step.id}
            style={[
              styles.routineRow,
              done && { backgroundColor: withOpacity(accent, 0.15) },
            ]}
          >
            <Pressable
              onPress={() => toggle(step.id, step.durationSeconds)}
              style={styles.routineToggle}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!done }}
              accessibilityLabel={step.label}
            >
              <View
                style={[
                  styles.routineCheck,
                  { borderColor: accent },
                  done && { backgroundColor: accent },
                ]}
              >
                {done ? (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.textPrimary}
                  />
                ) : null}
              </View>
              <Text style={styles.routineLabel} numberOfLines={1}>
                {step.label}
              </Text>
            </Pressable>
            {done ? (
              <View style={styles.durationRow}>
                <MiniButton
                  icon="remove"
                  onPress={() => nudge(step.id, -DURATION_STEP_SECONDS)}
                  label={`Less time on ${step.label}`}
                />
                <Text style={styles.duration}>
                  {formatDuration(done.actualDurationSeconds)}
                </Text>
                <MiniButton
                  icon="add"
                  onPress={() => nudge(step.id, DURATION_STEP_SECONDS)}
                  label={`More time on ${step.label}`}
                />
              </View>
            ) : (
              <Text style={styles.durationPlanned}>
                {formatDuration(step.durationSeconds)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Small buttons ─────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function RoundButton({
  icon,
  accent,
  filled = false,
  disabled = false,
  onPress,
  label,
}: {
  icon: IconName;
  accent: string;
  filled?: boolean;
  disabled?: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        { borderColor: accent },
        filled && { backgroundColor: accent },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        name={icon}
        size={28}
        color={filled ? colors.background : accent}
      />
    </Pressable>
  );
}

function MiniButton({
  icon,
  onPress,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.mini, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={16} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  title: {
    ...typography.heading,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  picker: {
    gap: spacing.sm,
  },
  pickerLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  pickerRow: {
    gap: 6,
    paddingRight: 2,
  },
  dayChip: {
    width: 44,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: FIELD_BORDER,
    alignItems: "center",
    gap: 2,
  },
  dayChipOff: {
    opacity: 0.45,
  },
  dayWeek: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  dayNum: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
  body: {
    maxHeight: 300,
  },
  bodyContent: {
    paddingVertical: spacing.xs,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  checkBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  countWrap: {
    gap: 12,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countValue: {
    fontSize: 44,
    fontWeight: "900",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  countTarget: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  countStatus: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: "center",
  },
  round: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  barTrack: {
    height: 10,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.textSecondary, 0.2),
    overflow: "hidden",
  },
  barFill: {
    height: 10,
    borderRadius: borderRadius.pill,
  },
  routineList: {
    gap: 6,
  },
  routineEmpty: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  routineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
  },
  routineToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  routineCheck: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  routineLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  duration: {
    ...typography.label,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    minWidth: 44,
    textAlign: "center",
  },
  durationPlanned: {
    ...typography.label,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  mini: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.pill,
    backgroundColor: FIELD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.35,
  },
  error: {
    ...typography.label,
    color: colors.danger,
    textAlign: "center",
  },
});
