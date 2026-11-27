import type {
  ActiveFocusSession,
  CreateFocusSessionInput,
  FocusDraft,
  FocusSession,
  FocusSessionStatus,
} from "@/types/focus";
import {
  addDays,
  formatDateString,
  getPastDateStrings,
  parseDateString,
  todayString,
} from "@/utils/date";

export const FOCUS_MIN_MINUTES = 5;
export const FOCUS_MAX_MINUTES = 180;
export const FOCUS_STEP_MINUTES = 5;
export const FOCUS_PRESET_MINUTES = [15, 25, 45, 60] as const;
export const FOCUS_DEFAULT_MINUTES = 25;
export const FOCUS_DESCRIPTION_MAX = 200;

// ---------------------------------------------------------------------------
// Draft / validation
// ---------------------------------------------------------------------------

export class FocusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FocusValidationError";
  }
}

export function clampFocusMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return FOCUS_DEFAULT_MINUTES;
  return Math.min(
    FOCUS_MAX_MINUTES,
    Math.max(FOCUS_MIN_MINUTES, Math.round(minutes)),
  );
}

export function stepFocusMinutes(minutes: number, direction: 1 | -1): number {
  return clampFocusMinutes(minutes + direction * FOCUS_STEP_MINUTES);
}

/** Returns an error message, or null when the draft is valid. */
export function getFocusDraftError(draft: FocusDraft): string | null {
  if (!draft.task.trim()) return "Add a task to focus on";
  if ((draft.description ?? "").trim().length > FOCUS_DESCRIPTION_MAX) {
    return `Description must be ${FOCUS_DESCRIPTION_MAX} characters or less`;
  }
  if (
    !Number.isFinite(draft.plannedMinutes) ||
    draft.plannedMinutes < FOCUS_MIN_MINUTES ||
    draft.plannedMinutes > FOCUS_MAX_MINUTES
  ) {
    return `Timer must be ${FOCUS_MIN_MINUTES}–${FOCUS_MAX_MINUTES} minutes`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Active session timing
// ---------------------------------------------------------------------------

export function createActiveFocusSession(
  draft: FocusDraft,
  now = Date.now(),
): ActiveFocusSession {
  const error = getFocusDraftError(draft);
  if (error) throw new FocusValidationError(error);
  const description = draft.description?.trim();
  return {
    id: `local-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    task: draft.task.trim(),
    ...(description ? { description } : {}),
    plannedDurationSeconds: draft.plannedMinutes * 60,
    startedAt: now,
    pausedAt: null,
    pausedTotalMs: 0,
  };
}

/** Focused seconds so far, excluding paused time. */
export function getFocusElapsedSeconds(
  session: ActiveFocusSession,
  now = Date.now(),
): number {
  const end = session.pausedAt ?? now;
  const ms = end - session.startedAt - session.pausedTotalMs;
  return Math.max(0, Math.floor(ms / 1000));
}

/**
 * Seconds left on the timer. Goes negative once the session runs past its
 * planned time: the timer keeps running into overtime until the user finishes.
 */
export function getFocusRemainingSeconds(
  session: ActiveFocusSession,
  now = Date.now(),
): number {
  return session.plannedDurationSeconds - getFocusElapsedSeconds(session, now);
}

export function isFocusOvertime(
  session: ActiveFocusSession,
  now = Date.now(),
): boolean {
  return getFocusRemainingSeconds(session, now) < 0;
}

/** Status a session would be logged with if finished now. */
export function getFocusResultStatus(
  session: ActiveFocusSession,
  now = Date.now(),
): FocusSessionStatus {
  return getFocusElapsedSeconds(session, now) >= session.plannedDurationSeconds
    ? "completed"
    : "ended_early";
}

export function pauseFocusSession(
  session: ActiveFocusSession,
  now = Date.now(),
): ActiveFocusSession {
  if (session.pausedAt !== null) return session;
  return { ...session, pausedAt: now };
}

export function resumeFocusSession(
  session: ActiveFocusSession,
  now = Date.now(),
): ActiveFocusSession {
  if (session.pausedAt === null) return session;
  return {
    ...session,
    pausedAt: null,
    pausedTotalMs: session.pausedTotalMs + Math.max(0, now - session.pausedAt),
  };
}

/**
 * The log to write when the user finishes. Every finished session is logged,
 * however short. Actual time includes any overtime. Status is `completed`
 * once the planned time was reached, `ended_early` before that.
 */
export function buildFocusSessionResult(
  session: ActiveFocusSession,
  userId: string,
  now = Date.now(),
): CreateFocusSessionInput {
  const actual = getFocusElapsedSeconds(session, now);
  const status = getFocusResultStatus(session, now);
  return {
    userId,
    task: session.task,
    ...(session.description ? { description: session.description } : {}),
    plannedDurationSeconds: session.plannedDurationSeconds,
    actualDurationSeconds: actual,
    status,
    startedAt: new Date(session.startedAt).toISOString(),
    endedAt: new Date(now).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** Local calendar day (YYYY-MM-DD) a session belongs to: the day it started. */
export function getFocusSessionDate(session: FocusSession): string {
  return formatDateString(new Date(session.startedAt));
}

export interface FocusStreak {
  current: number;
  best: number;
}

/**
 * Consecutive days with at least one logged session. Ended-early sessions
 * count too: finishing a task before the timer runs out isn't penalized.
 * The current streak runs back from today — or from yesterday when today has
 * none yet, so it doesn't read 0 every morning.
 */
export function getFocusStreak(
  sessions: FocusSession[],
  today: string = todayString(),
): FocusStreak {
  const days = new Set(sessions.map(getFocusSessionDate));
  if (days.size === 0) return { current: 0, best: 0 };

  const prev = (date: string) =>
    formatDateString(addDays(parseDateString(date), -1));

  let cursor = days.has(today) ? today : prev(today);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = prev(cursor);
  }

  let best = 0;
  for (const day of days) {
    if (days.has(prev(day))) continue; // not the start of a run
    let length = 0;
    let d = day;
    while (days.has(d)) {
      length += 1;
      d = formatDateString(addDays(parseDateString(d), 1));
    }
    best = Math.max(best, length);
  }

  return { current, best: Math.max(best, current) };
}

export interface FocusDayStat {
  date: string;
  seconds: number;
  sessionCount: number;
}

export interface FocusWeekStats {
  /** Oldest first, ending today. Always 7 entries. */
  days: FocusDayStat[];
  /** Sum of actual focused time. Ended-early sessions add only what was focused. */
  totalSeconds: number;
  sessionCount: number;
}

export function getFocusWeekStats(
  sessions: FocusSession[],
  now: Date = new Date(),
): FocusWeekStats {
  const days: FocusDayStat[] = getPastDateStrings(7, now).map((date) => ({
    date,
    seconds: 0,
    sessionCount: 0,
  }));
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const session of sessions) {
    const day = byDate.get(getFocusSessionDate(session));
    if (!day) continue;
    day.seconds += session.actualDurationSeconds;
    day.sessionCount += 1;
  }
  return {
    days,
    totalSeconds: days.reduce((sum, d) => sum + d.seconds, 0),
    sessionCount: days.reduce((sum, d) => sum + d.sessionCount, 0),
  };
}

export function countFocusSessionsOnDate(
  sessions: FocusSession[],
  date: string = todayString(),
): number {
  return sessions.filter((s) => getFocusSessionDate(s) === date).length;
}

export interface FocusSessionGroup {
  date: string;
  sessions: FocusSession[];
}

/** Newest day first; newest session first within a day. */
export function groupFocusSessionsByDay(
  sessions: FocusSession[],
): FocusSessionGroup[] {
  const sorted = [...sessions].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );
  const groups: FocusSessionGroup[] = [];
  for (const session of sorted) {
    const date = getFocusSessionDate(session);
    const last = groups[groups.length - 1];
    if (last?.date === date) last.sessions.push(session);
    else groups.push({ date, sessions: [session] });
  }
  return groups;
}

/** "6h 33m", "45m", "0m". */
export function formatFocusTotal(seconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, seconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/** Whole minutes for labels, e.g. "25 min". */
export function formatFocusMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}
