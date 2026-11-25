import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import {
  borderRadius,
  colors,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";

import { useAuthStore } from "@/stores/authStore";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import { useRoutineSessionStore } from "@/stores/routineSessionStore";
import {
  addDays,
  formatDateString,
  formatDisplayDate,
  parseDateString,
} from "@/utils/date";
import { getLogForHabit, getTodayCompletionSummary } from "@/utils/habitLogic";
import {
  type ScheduleFilter,
  type ScheduleSection,
  buildScheduleView,
  getHabitsForDate,
} from "@/utils/schedule";

import { AccountSheet } from "@/components/AccountSheet";
import { CompletionSummary } from "@/components/CompletionSummary";
import { HabitActionSheet } from "@/components/HabitActionSheet";
import { HabitCard } from "@/components/HabitCard";
import { ScheduleFilterBar } from "@/components/ScheduleFilterBar";
import { ScheduleSectionHeader } from "@/components/ScheduleSectionHeader";
import { SwipeableHabitRow } from "@/components/SwipeableHabitRow";
import { WeekStrip } from "@/components/WeekStrip";
import { useDeleteHabit } from "@/hooks/useDeleteHabit";
import { useNow } from "@/hooks/useNow";
import type { Habit } from "@/types/habit";

// Let the sheet's dismiss animation finish before navigating or showing an
// Alert; iOS drops Alerts presented while a Modal is still closing.
const SHEET_DISMISS_MS = 250;

type ListRow =
  | { kind: "earlier"; key: string; count: number }
  | { kind: "section"; key: string; section: ScheduleSection }
  | { kind: "habit"; key: string; habit: Habit };

function dayTitle(date: string, today: string): string {
  if (date === today) return "Today";
  const base = parseDateString(today);
  if (date === formatDateString(addDays(base, 1))) return "Tomorrow";
  if (date === formatDateString(addDays(base, -1))) return "Yesterday";
  return parseDateString(date).toLocaleDateString(undefined, {
    weekday: "long",
  });
}

const EMPTY_TITLES: Record<ScheduleFilter, string> = {
  next: "All clear",
  all: "Rest day",
  morning: "Slow morning",
  afternoon: "Open afternoon",
  evening: "Free evening",
};

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

  const now = useNow();
  const today = formatDateString(now);
  // null follows today, so the view rolls over at midnight.
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const selectedDate = pickedDate ?? today;
  const isToday = selectedDate === today;
  const [filter, setFilter] = useState<ScheduleFilter>("next");
  const activeFilter: ScheduleFilter =
    !isToday && filter === "next" ? "all" : filter;

  const selectDate = (date: string) => {
    closeOpenRow();
    setPickedDate(date === today ? null : date);
    if (date === today) setFilter("next");
    else if (filter === "next") setFilter("all");
  };

  const dayHabits = getHabitsForDate(habits, selectedDate);
  const summary = getTodayCompletionSummary(dayHabits, logs, selectedDate);
  const isFuture = selectedDate > today;
  const summaryMessage =
    dayHabits.length === 0
      ? "Nothing scheduled. Enjoy the day off."
      : isFuture
        ? `${dayHabits.length} ${dayHabits.length === 1 ? "habit" : "habits"} planned`
        : !isToday && summary.completed < summary.total
          ? `${summary.total - summary.completed} missed that day`
          : undefined;

  const view = buildScheduleView(habits, logs, selectedDate, activeFilter, {
    isToday,
    now,
  });
  const rows: ListRow[] = [];
  if (view.openEarlier > 0) {
    rows.push({ kind: "earlier", key: "earlier", count: view.openEarlier });
  }
  for (const section of view.sections) {
    rows.push({ kind: "section", key: `s-${section.timeOfDay}`, section });
    for (const habit of section.habits) {
      rows.push({ kind: "habit", key: habit.id, habit });
    }
  }

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
          <Text style={styles.date}>{formatDisplayDate(selectedDate)}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {dayTitle(selectedDate, today)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {habits.length > 1 ? (
            <Pressable
              onPress={() => router.push("/(app)/habit/reorder")}
              accessibilityRole="button"
              accessibilityLabel="Reorder habits"
              style={({ pressed }) => [
                styles.iconButton,
                styles.accountButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="swap-vertical"
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
          ) : null}
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
        <>
          <WeekStrip
            today={today}
            selected={selectedDate}
            habits={habits}
            logs={logs}
            onSelect={selectDate}
          />
          <CompletionSummary
            completed={summary.completed}
            total={summary.total}
            segments={summary.segments}
            message={summaryMessage}
            dayLabel={isToday ? "today" : `on ${formatDisplayDate(selectedDate)}`}
          />
          <ScheduleFilterBar
            value={activeFilter}
            isToday={isToday}
            onChange={(f) => {
              closeOpenRow();
              setFilter(f);
            }}
          />
        </>
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
          data={rows}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.windowEmpty}>
              <Ionicons name="flash-outline" size={40} color={colors.check} />
              <Text style={styles.windowEmptyTitle}>
                {EMPTY_TITLES[activeFilter]}
              </Text>
              <Text style={styles.windowEmptyBody}>
                Nothing scheduled here. Try another time of day, or add a habit.
              </Text>
            </View>
          }
          onScrollBeginDrag={closeOpenRow}
          renderItem={({ item }) => {
            if (item.kind === "earlier") {
              return (
                <Pressable
                  onPress={() => setFilter("all")}
                  accessibilityRole="button"
                  accessibilityHint="Shows the whole day"
                  style={({ pressed }) => [
                    styles.earlier,
                    pressed && styles.pressedSoft,
                  ]}
                >
                  <Ionicons name="time-outline" size={20} color={colors.danger} />
                  <Text style={styles.earlierText}>
                    Earlier today · {item.count} still open
                  </Text>
                  <Text style={styles.earlierCta}>Catch up ›</Text>
                </Pressable>
              );
            }
            if (item.kind === "section") {
              return (
                <ScheduleSectionHeader
                  timeOfDay={item.section.timeOfDay}
                  isNow={item.section.isNow}
                  completed={item.section.completed}
                  total={item.section.habits.length}
                />
              );
            }
            return (
              <SwipeableHabitRow
                habit={item.habit}
                onView={swipeView}
                onEdit={swipeEdit}
                onDelete={(habit) => confirmDelete(habit)}
                onOpen={handleRowOpen}
              >
                <HabitCard
                  habit={item.habit}
                  logs={logs}
                  log={getLogForHabit(logs, item.habit.id, selectedDate)}
                  onCheckToggle={handleCheckToggle}
                  onCountIncrement={handleCountIncrement}
                  onCountDecrement={handleCountDecrement}
                  onRoutinePress={handleRoutinePress}
                  onPress={(habitId) =>
                    router.push(`/(app)/habit/${habitId}`)
                  }
                  onLongPress={setActionHabitId}
                  readOnly={!isToday}
                />
              </SwipeableHabitRow>
            );
          }}
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
  earlier: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: withOpacity(colors.danger, 0.45),
    backgroundColor: withOpacity(colors.danger, 0.1),
  },
  earlierText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  earlierCta: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF8FA3",
  },
  pressedSoft: {
    opacity: 0.8,
  },
  windowEmpty: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: withOpacity(colors.primary, 0.45),
    backgroundColor: colors.surface,
  },
  windowEmptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  windowEmptyBody: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
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
