import type { Habit, TimeOfDay, Weekday } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import { parseDateString } from "@/utils/date";
import {
  compareHabits,
  getLogForHabit,
  isHabitCompleted,
} from "@/utils/habitLogic";

/** Morning ends at noon, afternoon at 5 PM; evening runs to midnight. */
export const AFTERNOON_START_HOUR = 12;
export const EVENING_START_HOUR = 17;

/** Timed windows in day order. 'anytime' is not a window. */
export const DAY_WINDOWS = ["morning", "afternoon", "evening"] as const;
export type DayWindow = (typeof DAY_WINDOWS)[number];

/** Section order on the home screen. */
export const TIME_OF_DAY_ORDER: TimeOfDay[] = [...DAY_WINDOWS, "anytime"];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

export const TIME_OF_DAY_RANGES: Record<TimeOfDay, string> = {
  morning: "until 12 PM",
  afternoon: "12 – 5 PM",
  evening: "after 5 PM",
  anytime: "whenever fits",
};

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
/** Week strip / day picker order: Monday first. */
export const WEEKDAYS_MONDAY_FIRST: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_PLURAL = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];
const WEEKDAYS_ONLY: Weekday[] = [1, 2, 3, 4, 5];
const WEEKENDS_ONLY: Weekday[] = [0, 6];

/** Home-screen filter: 'next' = the current window onward, today only. */
export type ScheduleFilter = "next" | "all" | DayWindow;

export function getTimeOfDay(habit: Habit): TimeOfDay {
  return habit.timeOfDay ?? "anytime";
}

export function getCurrentWindow(now: Date = new Date()): DayWindow {
  const hour = now.getHours();
  if (hour < AFTERNOON_START_HOUR) return "morning";
  if (hour < EVENING_START_HOUR) return "afternoon";
  return "evening";
}

function sameDays(a: readonly Weekday[], b: readonly Weekday[]): boolean {
  return a.length === b.length && a.every((d) => b.includes(d));
}

/**
 * Canonical stored form: sorted, de-duplicated, and undefined for "every day"
 * (or an empty pick) so the default schedule is never written to Firestore.
 */
export function normalizeDays(days?: Weekday[] | null): Weekday[] | undefined {
  if (!days) return undefined;
  const unique = ALL_WEEKDAYS.filter((d) => days.includes(d));
  if (unique.length === 0 || unique.length === 7) return undefined;
  return unique;
}

export function isScheduledOn(habit: Habit, dateStr: string): boolean {
  const days = normalizeDays(habit.days);
  if (!days) return true;
  return days.includes(parseDateString(dateStr).getDay() as Weekday);
}

export function getHabitsForDate(habits: Habit[], dateStr: string): Habit[] {
  return habits.filter((h) => isScheduledOn(h, dateStr));
}

/** "Every day", "Weekdays", "Weekends", "Sundays", "Mon · Wed · Fri". */
export function formatDays(days?: Weekday[] | null): string {
  const normalized = normalizeDays(days);
  if (!normalized) return "Every day";
  if (sameDays(normalized, WEEKDAYS_ONLY)) return "Weekdays";
  if (sameDays(normalized, WEEKENDS_ONLY)) return "Weekends";
  if (normalized.length === 1) return WEEKDAY_PLURAL[normalized[0]];
  return WEEKDAYS_MONDAY_FIRST.filter((d) => normalized.includes(d))
    .map((d) => WEEKDAY_SHORT[d])
    .join(" · ");
}

export interface ScheduleSection {
  timeOfDay: TimeOfDay;
  /** True for the window the clock is in, when viewing today. */
  isNow: boolean;
  completed: number;
  habits: Habit[];
}

export interface ScheduleView {
  sections: ScheduleSection[];
  /** Incomplete habits from windows that have already passed ('next' only). */
  openEarlier: number;
}

/**
 * Groups the day's scheduled habits into time-of-day sections for the home
 * list. Sections run morning → evening → anytime; within a section incomplete
 * habits come first, then in the user's chosen order (see `compareHabits`). 'anytime' habits are
 * included under every filter since they fit any window.
 */
export function buildScheduleView(
  habits: Habit[],
  logs: HabitLog[],
  dateStr: string,
  filter: ScheduleFilter,
  options: { isToday: boolean; now?: Date },
): ScheduleView {
  const current = getCurrentWindow(options.now);
  const currentIndex = DAY_WINDOWS.indexOf(current);
  const dayHabits = getHabitsForDate(habits, dateStr);
  const done = (h: Habit) =>
    isHabitCompleted(h, getLogForHabit(logs, h.id, dateStr));

  const effective: ScheduleFilter =
    filter === "next" && !options.isToday ? "all" : filter;

  const shown: TimeOfDay[] =
    effective === "all"
      ? TIME_OF_DAY_ORDER
      : effective === "next"
        ? [...DAY_WINDOWS.slice(currentIndex), "anytime"]
        : [effective, "anytime"];

  const sections = shown
    .map((timeOfDay): ScheduleSection => {
      const inSection = dayHabits.filter((h) => getTimeOfDay(h) === timeOfDay);
      const withDone = inSection.map((h) => ({ h, d: done(h) }));
      withDone.sort(
        (a, b) => Number(a.d) - Number(b.d) || compareHabits(a.h, b.h),
      );
      return {
        timeOfDay,
        isNow: options.isToday && timeOfDay === current,
        completed: withDone.filter((x) => x.d).length,
        habits: withDone.map((x) => x.h),
      };
    })
    .filter((s) => s.habits.length > 0);

  const openEarlier =
    effective === "next"
      ? dayHabits.filter((h) => {
          const index = DAY_WINDOWS.indexOf(getTimeOfDay(h) as DayWindow);
          return index !== -1 && index < currentIndex && !done(h);
        }).length
      : 0;

  return { sections, openEarlier };
}
