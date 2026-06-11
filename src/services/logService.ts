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
import type { HabitLog, UpsertLogInput } from "@/types/log";

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
