import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
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

/** Writes a finished session. */
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

/**
 * Saves an edit to a past session. Only the editable fields are written:
 * planned time, start/end and owner stay as logged.
 */
export async function updateFocusSession(session: FocusSession): Promise<void> {
  await updateDoc(doc(db, COLLECTION, session.id), {
    task: session.task,
    description: session.description || deleteField(),
    actualDurationSeconds: session.actualDurationSeconds,
    status: session.status,
  });
}

export async function deleteFocusSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, sessionId));
}
