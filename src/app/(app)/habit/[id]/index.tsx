import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
  getHabitAccent,
  spacing,
  typography,
} from "@/constants/theme";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import type { Habit } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import { formatDuration, formatLongDate, todayString } from "@/utils/date";
import {
  getCountProgress,
  getHabitHistory,
  getLogForHabit,
  getRoutinePlannedDuration,
  isHabitCompleted,
} from "@/utils/habitLogic";

import { Button } from "@/components/Button";
import { HabitHistoryCard } from "@/components/HabitHistoryCard";
import { useDeleteHabit } from "@/hooks/useDeleteHabit";
import { ProgressRing } from "@/components/ProgressRing";

const HISTORY_NOUN: Record<Habit["type"], [string, string]> = {
  check: ["check-in", "check-ins"],
  count: ["day logged", "days logged"],
  routine: ["session", "sessions"],
};

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const logs = useLogStore((s) => s.logs);
  const { confirmDelete: confirmDeleteHabit, deletingId } = useDeleteHabit();

  const today = todayString();
  const history = useMemo(
    () => (habit ? getHabitHistory(habit, logs) : []),
    [habit, logs],
  );

  if (!habit) {
    return (
      <SafeAreaView style={[styles.safe, styles.missing]}>
        <Text style={styles.missingText}>Habit not found</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const accent = getHabitAccent(habit.type);
  const onAccent =
    habit.type === "routine" ? colors.textPrimary : colors.background;
  const createdDate = formatLongDate(habit.createdAt);
  const [singular, plural] = HISTORY_NOUN[habit.type];

  const deleting = deletingId === habit.id;
  const confirmDelete = () =>
    confirmDeleteHabit(habit, () => router.replace("/(app)"));

  const header = (
    <View>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.hero}>
        <View style={[styles.typePill, { backgroundColor: accent }]}>
          <Text style={[styles.typePillText, { color: onAccent }]}>
            {habit.type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{habit.name}</Text>
        {habit.description ? (
          <Text style={styles.description}>{habit.description}</Text>
        ) : null}
        {createdDate ? (
          <Text style={styles.created}>Created {createdDate}</Text>
        ) : null}
      </View>

      <HabitDetails
        habit={habit}
        todayLog={getLogForHabit(logs, habit.id, today)}
        accent={accent}
        onAccent={onAccent}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>History</Text>
        {history.length > 0 ? (
          <Text style={styles.sectionMeta}>
            {history.length} {history.length === 1 ? singular : plural}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={history}
        keyExtractor={(log) => log.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <HabitHistoryCard habit={habit} log={item} today={today} />
        )}
        ItemSeparatorComponent={HistoryGap}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: accent }]}>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyBody}>
              Complete this habit and your sessions will stack up here.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            onPress={confirmDelete}
            disabled={deleting}
            style={styles.delete}
            accessibilityRole="button"
          >
            {deleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.deleteText}>Delete habit</Text>
            )}
          </Pressable>
        }
      />

      <View style={styles.footer}>
        <Button
          title="Edit habit"
          onPress={() => router.push(`/(app)/habit/${habit.id}/edit`)}
          disabled={deleting}
        />
      </View>
    </SafeAreaView>
  );
}

function HistoryGap() {
  return <View style={styles.historyGap} />;
}

interface HabitDetailsProps {
  habit: Habit;
  todayLog?: HabitLog;
  accent: string;
  onAccent: string;
}

function HabitDetails({
  habit,
  todayLog,
  accent,
  onAccent,
}: HabitDetailsProps) {
  const router = useRouter();
  switch (habit.type) {
    case "check": {
      const done = isHabitCompleted(habit, todayLog);
      return (
        <View style={[styles.tile, styles.tileRow]}>
          <View style={styles.tileContent}>
            <Text style={styles.tileLabel}>Goal</Text>
            <Text style={styles.tileValueSmall}>Once a day</Text>
          </View>
          <View
            style={[
              styles.todayBadge,
              { borderColor: accent },
              done && { backgroundColor: accent },
            ]}
            accessibilityLabel={done ? "Done today" : "Not done today"}
          >
            {done ? (
              <Ionicons name="checkmark" size={30} color={onAccent} />
            ) : null}
          </View>
        </View>
      );
    }
    case "count": {
      const { current, target, ratio } = getCountProgress(habit, todayLog);
      return (
        <View style={[styles.tile, styles.tileRow]}>
          <View style={styles.tileContent}>
            <Text style={styles.tileLabel}>Daily target</Text>
            <Text style={styles.tileValue}>
              {target}
              <Text style={styles.tileUnit}> per day</Text>
            </Text>
          </View>
          <ProgressRing
            ratio={ratio}
            current={current}
            target={target}
            accent={accent}
            size={60}
          />
        </View>
      );
    }
    case "routine": {
      const tasks = habit.tasks ?? [];
      return (
        <View>
          <View style={styles.tiles}>
            <View style={[styles.tile, styles.tileContent]}>
              <Text style={styles.tileLabel}>Steps</Text>
              <Text style={styles.tileValue}>{tasks.length}</Text>
            </View>
            <View style={[styles.tile, styles.tileContent]}>
              <Text style={styles.tileLabel}>Total time</Text>
              <Text style={styles.tileValue}>
                {formatDuration(getRoutinePlannedDuration(habit))}
                <Text style={styles.tileUnit}> min</Text>
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Steps</Text>
          </View>
          <View style={styles.stepsCard}>
            {tasks.map((task, index) => (
              <View
                key={task.id}
                style={[styles.stepRow, index > 0 && styles.stepDivider]}
              >
                <View style={[styles.stepNumber, { backgroundColor: accent }]}>
                  <Text style={[styles.stepNumberText, { color: onAccent }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepLabel} numberOfLines={1}>
                    {task.label}
                  </Text>
                  {task.description ? (
                    <Text style={styles.stepDescription} numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.stepDuration}>
                  {formatDuration(task.durationSeconds)}
                </Text>
              </View>
            ))}
          </View>
          <Button
            title={tasks.length > 0 ? "Manage steps" : "Add steps"}
            variant="ghost"
            onPress={() => router.push(`/(app)/habit/${habit.id}/steps`)}
            style={styles.manageSteps}
          />
        </View>
      );
    }
  }
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
  list: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "flex-start",
    gap: 12,
    marginTop: 20,
    marginBottom: spacing.lg,
  },
  typePill: {
    borderRadius: borderRadius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  typePillText: {
    ...typography.caption,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  name: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    lineHeight: 23,
    color: colors.textPrimary,
    opacity: 0.85,
  },
  created: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tiles: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  tileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tileContent: {
    flex: 1,
    gap: spacing.sm,
  },
  tileLabel: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  tileValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  tileValueSmall: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  tileUnit: {
    ...typography.label,
    color: colors.textSecondary,
  },
  todayBadge: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  sectionMeta: {
    ...typography.label,
    color: colors.textSecondary,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingVertical: 10,
  },
  stepText: {
    flex: 1,
    gap: 2,
  },
  stepDescription: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  manageSteps: {
    marginTop: spacing.sm,
  },
  stepDivider: {
    borderTopWidth: 1,
    borderTopColor: "#34344E",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    ...typography.label,
    fontWeight: "800",
  },
  stepLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stepDuration: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  historyGap: {
    height: 10,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  delete: {
    alignSelf: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    ...typography.label,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
});
