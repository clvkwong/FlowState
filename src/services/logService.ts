import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type {
  CreateLogInput,
  HabitLog,
  LogWriteValues,
  UpsertLogInput,
} from "@/types/log";

function docToLog(id: string, data: Record<string, unknown>): HabitLog {
  const loggedAt = data.loggedAt as
    | { toDate?: () => Date }
    | string
    | undefined;
  return {
    id,
    habitId: data.habitId as string,
    userId: data.userId as string,
    date: data.date as string,
    completed: data.completed as boolean,
    count: data.count as number | undefined,
    completedTasks: data.completedTasks as HabitLog["completedTasks"],
    loggedAt:
      typeof loggedAt === "object" && loggedAt?.toDate
        ? loggedAt.toDate().toISOString()
        : ((loggedAt as string) ?? new Date().toISOString()),
  };
}

export async function fetchLogs(userId: string): Promise<HabitLog[]> {
  const q = query(collection(db, "habitLogs"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToLog(d.id, d.data()));
}

export async function upsertLog(input: UpsertLogInput): Promise<HabitLog> {
  const q = query(
    collection(db, "habitLogs"),
    where("userId", "==", input.userId),
    where("habitId", "==", input.habitId),
    where("date", "==", input.date),
  );
  const snapshot = await getDocs(q);

  const payload: Record<string, unknown> = {
    habitId: input.habitId,
    userId: input.userId,
    date: input.date,
    completed: input.completed,
    loggedAt: serverTimestamp(),
  };
  if (input.count !== undefined) payload.count = input.count;
  if (input.completedTasks !== undefined)
    payload.completedTasks = input.completedTasks;
  if (input.startedAt !== undefined) payload.startedAt = input.startedAt;

  if (!snapshot.empty) {
    const existing = snapshot.docs[0];
    await updateDoc(doc(db, "habitLogs", existing.id), payload);
    return docToLog(existing.id, {
      ...existing.data(),
      ...payload,
      loggedAt: new Date().toISOString(),
    });
  }

  const ref = await addDoc(collection(db, "habitLogs"), payload);
  return docToLog(ref.id, { ...payload, loggedAt: new Date().toISOString() });
}

export async function deleteLogsForHabit(
  userId: string,
  habitId: string,
): Promise<void> {
  const q = query(
    collection(db, "habitLogs"),
    where("userId", "==", userId),
    where("habitId", "==", habitId),
  );
  const snapshot = await getDocs(q);
  await Promise.all(
    snapshot.docs.map((d) => deleteDoc(doc(db, "habitLogs", d.id))),
  );
}

async function findLogForDay(
  userId: string,
  habitId: string,
  date: string,
) {
  const q = query(
    collection(db, "habitLogs"),
    where("userId", "==", userId),
    where("habitId", "==", habitId),
    where("date", "==", date),
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? undefined : snapshot.docs[0];
}

export class DuplicateLogError extends Error {
  constructor(public readonly existingLogId: string) {
    super("A log already exists for this habit on this date");
    this.name = "DuplicateLogError";
  }
}

/**
 * Creates a log for any date (e.g. a past day the user forgot to log).
 * There is at most one log per habit per day: throws DuplicateLogError
 * if one exists, so callers update it instead.
 */
export async function createLog(input: CreateLogInput): Promise<HabitLog> {
  const existing = await findLogForDay(input.userId, input.habitId, input.date);
  if (existing) throw new DuplicateLogError(existing.id);

  const payload: Record<string, unknown> = {
    habitId: input.habitId,
    userId: input.userId,
    date: input.date,
    completed: input.completed,
    loggedAt: serverTimestamp(),
  };
  if (input.count !== undefined) payload.count = input.count;
  if (input.completedTasks !== undefined)
    payload.completedTasks = input.completedTasks;

  const ref = await addDoc(collection(db, "habitLogs"), payload);
  return docToLog(ref.id, { ...payload, loggedAt: new Date().toISOString() });
}

/**
 * Overwrites the values of an existing log. `habitId`, `userId` and
 * `date` are never changed. Returns the log as it now stands.
 */
export async function updateLog(
  existing: HabitLog,
  values: LogWriteValues,
): Promise<HabitLog> {
  const payload: Record<string, unknown> = {
    completed: values.completed,
    loggedAt: serverTimestamp(),
  };
  if (values.count !== undefined) payload.count = values.count;
  if (values.completedTasks !== undefined)
    payload.completedTasks = values.completedTasks;

  await updateDoc(doc(db, "habitLogs", existing.id), payload);
  return { ...existing, ...values, loggedAt: new Date().toISOString() };
}

export async function deleteLog(logId: string): Promise<void> {
  await deleteDoc(doc(db, "habitLogs", logId));
}
