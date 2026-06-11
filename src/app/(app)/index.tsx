import { useCallback, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";

import { useAuthStore } from "@/stores/authStore";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import { useRoutineSessionStore } from "@/stores/routineSessionStore";
import { formatDisplayDate, todayString } from "@/utils/date";
import { getLogForHabit, getTodayCompletionSummary } from "@/utils/habitLogic";

import { CompletionSummary } from "@/components/CompletionSummary";
import { HabitCard } from "@/components/HabitCard";

export default function HomeScreen() {
  const router = useRouter();
  const pathSegments = useSegments();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const habits = useHabitStore((s) => s.habits);
  const logs = useLogStore((s) => s.logs);
  const activeRoutineSession = useRoutineSessionStore((s) => s.activeSession);

  const logCheck = useLogStore((s) => s.logCheck);
  const incrementCount = useLogStore((s) => s.incrementCount);
  const startRoutineSession = useRoutineSessionStore((s) => s.startSession);

  const today = todayString();
  const summary = getTodayCompletionSummary(habits, logs, today);

  const handleCheckToggle = async (habitId: string, completed: boolean) => {
    if (!user) return;
    await logCheck(user.uid, habitId, completed);
  };

  const handleCountIncrement = async (habitId: string, target: number) => {
    if (!user) return;
    await incrementCount(user.uid, habitId, target);
  };

  const handleRoutinePress = useCallback(
    (habitId: string) => {
      startRoutineSession(habitId);
    },
    [startRoutineSession, router],
  );

  useEffect(() => {
    if (pathSegments[1] !== "routine" && activeRoutineSession?.habitId) {
      router.push(`/(app)/routine/${activeRoutineSession.habitId}`);
    }
  }, [pathSegments, activeRoutineSession]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>FlowState</Text>
          <Text style={styles.date}>{formatDisplayDate(today)}</Text>
        </View>
        <Pressable onPress={() => signOut()} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <CompletionSummary
          completed={summary.completed}
          total={summary.total}
        />
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⚡</Text>
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyBody}>
            Create your first habit and start building momentum.
          </Text>
          <Pressable
            style={styles.emptyCta}
            onPress={() => router.push("/(app)/habit/new")}
          >
            <Text style={styles.emptyCtaText}>Create Habit</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              log={getLogForHabit(logs, item.id, today)}
              onCheckToggle={handleCheckToggle}
              onCountIncrement={handleCountIncrement}
              onRoutinePress={handleRoutinePress}
              onEdit={(id) => router.push(`/(app)/habit/${id}/edit`)}
            />
          )}
        />
      )}

      {habits.length > 0 ? (
        <Pressable
          style={styles.fab}
          onPress={() => router.push("/(app)/habit/new")}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    ...typography.title,
    color: colors.textPrimary,
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  signOut: {
    padding: spacing.sm,
  },
  signOutText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  emptyCtaText: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: {
    fontSize: 32,
    color: colors.textPrimary,
    lineHeight: 34,
    fontWeight: "300",
  },
});
