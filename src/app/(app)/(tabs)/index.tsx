import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";

import { useAuthStore } from "@/stores/authStore";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import { useRoutineSessionStore } from "@/stores/routineSessionStore";
import { formatDisplayDate, todayString } from "@/utils/date";
import { getLogForHabit, getTodayCompletionSummary } from "@/utils/habitLogic";

import { AccountSheet } from "@/components/AccountSheet";
import { CompletionSummary } from "@/components/CompletionSummary";
import { HabitActionSheet } from "@/components/HabitActionSheet";
import { HabitCard } from "@/components/HabitCard";
import { SwipeableHabitRow } from "@/components/SwipeableHabitRow";
import { useDeleteHabit } from "@/hooks/useDeleteHabit";
import type { Habit } from "@/types/habit";

// Let the sheet's dismiss animation finish before navigating or showing an
// Alert; iOS drops Alerts presented while a Modal is still closing.
const SHEET_DISMISS_MS = 250;

export default function HomeScreen() {
  const router = useRouter();
  const pathSegments = useSegments() as string[];
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const habits = useHabitStore((s) => s.habits);
  const logs = useLogStore((s) => s.logs);
  const activeRoutineSession = useRoutineSessionStore((s) => s.activeSession);

  const logCheck = useLogStore((s) => s.logCheck);
  const incrementCount = useLogStore((s) => s.incrementCount);
  const decrementCount = useLogStore((s) => s.decrementCount);
  const startRoutineSession = useRoutineSessionStore((s) => s.startSession);

  const [accountOpen, setAccountOpen] = useState(false);
  const [actionHabitId, setActionHabitId] = useState<string | null>(null);
  const actionHabit = habits.find((h) => h.id === actionHabitId) ?? null;
  const { confirmDelete } = useDeleteHabit();
  // Only one swiped-open row at a time.
  const openRow = useRef<SwipeableMethods | null>(null);
  const handleRowOpen = (row: SwipeableMethods) => {
    if (openRow.current && openRow.current !== row) openRow.current.close();
    openRow.current = row;
  };
  const closeOpenRow = () => {
    openRow.current?.close();
    openRow.current = null;
  };

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

  const handleCountDecrement = async (habitId: string, target: number) => {
    if (!user) return;
    await decrementCount(user.uid, habitId, target);
  };

  const handleRoutinePress = useCallback(
    (habitId: string) => {
      startRoutineSession(habitId);
    },
    [startRoutineSession],
  );

  const handleSignOut = () => {
    setAccountOpen(false);
    signOut().catch(console.error);
  };

  const openNewHabit = () => router.push("/(app)/habit/new");

  const afterSheetCloses = (fn: () => void) => {
    setActionHabitId(null);
    setTimeout(fn, SHEET_DISMISS_MS);
  };
  const handleEdit = (habit: Habit) =>
    afterSheetCloses(() => router.push(`/(app)/habit/${habit.id}/edit`));
  const handleView = (habit: Habit) =>
    afterSheetCloses(() => router.push(`/(app)/habit/${habit.id}`));
  const handleDelete = (habit: Habit) =>
    afterSheetCloses(() => confirmDelete(habit));

  // Swipe actions: no sheet to wait for.
  const swipeView = (habit: Habit) => router.push(`/(app)/habit/${habit.id}`);
  const swipeEdit = (habit: Habit) =>
    router.push(`/(app)/habit/${habit.id}/edit`);

  useEffect(() => {
    const onRoutineScreen = pathSegments[1] === "routine";
    const onFocusTimerScreen = pathSegments[1] === "focus";
    if (
      !onRoutineScreen &&
      !onFocusTimerScreen &&
      activeRoutineSession?.habitId
    ) {
      router.push(`/(app)/routine/${activeRoutineSession.habitId}`);
    }
  }, [pathSegments, activeRoutineSession, router]);

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.date}>{formatDisplayDate(today)}</Text>
          <Text style={styles.title} accessibilityRole="header">
            Today
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setAccountOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Account"
            style={({ pressed }) => [
              styles.iconButton,
              styles.accountButton,
              accountOpen && styles.accountButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={openNewHabit}
            accessibilityRole="button"
            accessibilityLabel="New habit"
            style={({ pressed }) => [
              styles.iconButton,
              styles.newButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={28} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
      {habits.length > 0 ? (
        <CompletionSummary
          completed={summary.completed}
          total={summary.total}
          segments={summary.segments}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {habits.length === 0 ? (
        <View style={styles.flex}>
          {header}
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚡</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyBody}>
              Create your first habit and start building momentum.
            </Text>
            <Pressable style={styles.emptyCta} onPress={openNewHabit}>
              <Text style={styles.emptyCtaText}>Create Habit</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          onScrollBeginDrag={closeOpenRow}
          renderItem={({ item }) => (
            <SwipeableHabitRow
              habit={item}
              onView={swipeView}
              onEdit={swipeEdit}
              onDelete={(habit) => confirmDelete(habit)}
              onOpen={handleRowOpen}
            >
              <HabitCard
                habit={item}
                logs={logs}
                log={getLogForHabit(logs, item.id, today)}
                onCheckToggle={handleCheckToggle}
                onCountIncrement={handleCountIncrement}
                onCountDecrement={handleCountDecrement}
                onRoutinePress={handleRoutinePress}
                onLongPress={setActionHabitId}
              />
            </SwipeableHabitRow>
          )}
        />
      )}

      <HabitActionSheet
        habit={actionHabit}
        onClose={() => setActionHabitId(null)}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      <AccountSheet
        visible={accountOpen}
        email={user?.email}
        onClose={() => setAccountOpen(false)}
        onSignOut={handleSignOut}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerBlock: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  date: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  accountButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "#34344f",
  },
  accountButtonActive: {
    borderColor: colors.primary,
  },
  newButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120, // clear the floating tab bar
    gap: 14,
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
});
