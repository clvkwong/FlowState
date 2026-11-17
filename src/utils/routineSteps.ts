import type { RoutineTask } from "@/types/habit";

export const MIN_STEP_DURATION_SECONDS = 1;
export const MAX_STEP_DURATION_SECONDS = 59 * 60 + 59;
export const DEFAULT_STEP_DURATION_SECONDS = 60;
export const STEP_DURATION_INCREMENT_SECONDS = 15;
export const MAX_STEP_DESCRIPTION_LENGTH = 200;
export const STEP_DURATION_PRESETS = [30, 60, 120, 300, 600] as const;

export function clampStepDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return MIN_STEP_DURATION_SECONDS;
  return Math.min(
    MAX_STEP_DURATION_SECONDS,
    Math.max(MIN_STEP_DURATION_SECONDS, Math.round(seconds)),
  );
}

/** Adjusts by `delta`, never dropping below the minimum or above the maximum. */
export function stepDurationBy(seconds: number, delta: number): number {
  return clampStepDuration(seconds + delta);
}

export function splitDuration(seconds: number): {
  minutes: number;
  seconds: number;
} {
  return { minutes: Math.floor(seconds / 60), seconds: seconds % 60 };
}

/**
 * Turns typed minute/second strings into a total. Seconds over 59 roll into
 * minutes (0:90 → 1:30). Returns null when the result is zero / not a number.
 */
export function parseTypedDuration(
  minutesText: string,
  secondsText: string,
): number | null {
  const minutes = minutesText.trim() === "" ? 0 : Number(minutesText);
  const seconds = secondsText.trim() === "" ? 0 : Number(secondsText);
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) return null;
  if (minutes < 0 || seconds < 0) return null;
  const total = minutes * 60 + seconds;
  if (total < MIN_STEP_DURATION_SECONDS) return null;
  return Math.min(total, MAX_STEP_DURATION_SECONDS);
}

export function getStepsTotalDuration(steps: RoutineTask[]): number {
  return steps.reduce((sum, step) => sum + step.durationSeconds, 0);
}

export function moveStep(
  steps: RoutineTask[],
  fromIndex: number,
  toIndex: number,
): RoutineTask[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= steps.length ||
    toIndex < 0 ||
    toIndex >= steps.length
  ) {
    return steps;
  }
  const next = [...steps];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function upsertStep(
  steps: RoutineTask[],
  step: RoutineTask,
): RoutineTask[] {
  const index = steps.findIndex((s) => s.id === step.id);
  if (index === -1) return [...steps, step];
  return steps.map((s) => (s.id === step.id ? step : s));
}

export function removeStep(
  steps: RoutineTask[],
  stepId: string,
): { steps: RoutineTask[]; removed?: { step: RoutineTask; index: number } } {
  const index = steps.findIndex((s) => s.id === stepId);
  if (index === -1) return { steps };
  return {
    steps: steps.filter((s) => s.id !== stepId),
    removed: { step: steps[index], index },
  };
}

export function insertStepAt(
  steps: RoutineTask[],
  step: RoutineTask,
  index: number,
): RoutineTask[] {
  const next = [...steps];
  next.splice(Math.min(Math.max(index, 0), next.length), 0, step);
  return next;
}

/**
 * Trims text and drops empty descriptions. Firestore rejects `undefined`
 * field values, so an empty description is omitted rather than set.
 */
export function normalizeStep(step: RoutineTask): RoutineTask {
  const description = step.description?.trim().slice(0, MAX_STEP_DESCRIPTION_LENGTH);
  const normalized: RoutineTask = {
    id: step.id,
    label: step.label.trim(),
    durationSeconds: clampStepDuration(step.durationSeconds),
  };
  if (description) normalized.description = description;
  return normalized;
}

export function validateStep(step: RoutineTask): string | null {
  if (!step.label.trim()) return "Give this step a name";
  if (
    step.durationSeconds < MIN_STEP_DURATION_SECONDS ||
    step.durationSeconds > MAX_STEP_DURATION_SECONDS
  ) {
    return "Duration must be between 0:01 and 59:59";
  }
  return null;
}

export function areStepsEqual(a: RoutineTask[], b: RoutineTask[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((step, i) => {
    const other = b[i];
    return (
      step.id === other.id &&
      step.label === other.label &&
      step.durationSeconds === other.durationSeconds &&
      (step.description ?? "") === (other.description ?? "")
    );
  });
}
