import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { CreateFocusSessionInput, FocusSession } from "@/types/focus";

const COLLECTION = "focusSessions";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

function docToFocusSession(
  id: string,
  data: Record<string, unknown>,
): FocusSession {
  return {
    id,
    userId: data.userId as string,
    task: data.task as string,
    ...(typeof data.description === "string" && data.description
      ? { description: data.description }
      : {}),
    plannedDurationSeconds: data.plannedDurationSeconds as number,
    actualDurationSeconds: data.actualDurationSeconds as number,
    status: data.status as FocusSession["status"],
    startedAt: toIso(data.startedAt),
    endedAt: toIso(data.endedAt),
  };
}

export async function fetchFocusSessions(
  userId: string,
): Promise<FocusSession[]> {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToFocusSession(d.id, d.data()));
}

/** Writes a finished session. Sessions are never edited after this. */
export async function createFocusSession(
  input: CreateFocusSessionInput,
): Promise<FocusSession> {
  const payload: Record<string, unknown> = {
    userId: input.userId,
    task: input.task,
    plannedDurationSeconds: input.plannedDurationSeconds,
    actualDurationSeconds: input.actualDurationSeconds,
    status: input.status,
    startedAt: Timestamp.fromDate(new Date(input.startedAt)),
    endedAt: Timestamp.fromDate(new Date(input.endedAt)),
  };
  if (input.description) payload.description = input.description;

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, ...input };
}
