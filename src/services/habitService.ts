import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type {
  CreateHabitInput,
  Habit,
  TimeOfDay,
  UpdateHabitInput,
  Weekday,
} from "@/types/habit";
import { compareHabits } from "@/utils/habitLogic";
import { normalizeDays } from "@/utils/schedule";

const TIMES_OF_DAY: TimeOfDay[] = ["morning", "afternoon", "evening", "anytime"];

function readTimeOfDay(value: unknown): TimeOfDay | undefined {
  return TIMES_OF_DAY.includes(value as TimeOfDay)
    ? (value as TimeOfDay)
    : undefined;
}

function readDays(value: unknown): Weekday[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return normalizeDays(
    value.filter(
      (d): d is Weekday => Number.isInteger(d) && d >= 0 && d <= 6,
    ),
  );
}

export function generateHabitTaskId(): string {
  return doc(collection(db, "habits")).id;
}

function docToHabit(id: string, data: Record<string, unknown>): Habit {
  const createdAt = data.createdAt as
    | { toDate?: () => Date }
    | string
    | undefined;
  return {
    id,
    userId: data.userId as string,
    name: data.name as string,
    description: (data.description as string | undefined) || undefined,
    type: data.type as Habit["type"],
    target: data.target as number | undefined,
    tasks: data.tasks as Habit["tasks"],
    days: readDays(data.days),
    timeOfDay: readTimeOfDay(data.timeOfDay),
    createdAt:
      typeof createdAt === "object" && createdAt?.toDate
        ? createdAt.toDate().toISOString()
        : ((createdAt as string) ?? new Date().toISOString()),
  };
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const q = query(collection(db, "habits"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => docToHabit(d.id, d.data()))
    .sort(compareHabits);
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<Habit> {
  const payload: Record<string, unknown> = {
    userId,
    name: input.name,
    type: input.type,
    createdAt: serverTimestamp(),
  };
  if (input.description) payload.description = input.description;
  if (input.type === "count") payload.target = input.target;
  if (input.type === "routine") payload.tasks = input.tasks;
  const days = normalizeDays(input.days);
  if (days) payload.days = days;
  if (input.timeOfDay) payload.timeOfDay = input.timeOfDay;

  const ref = await addDoc(collection(db, "habits"), payload);
  return {
    id: ref.id,
    userId,
    name: input.name,
    description: input.description || undefined,
    type: input.type,
    target: input.target,
    tasks: input.tasks,
    days,
    timeOfDay: input.timeOfDay,
    createdAt: new Date().toISOString(),
  };
}

export async function updateHabit(
  habitId: string,
  input: UpdateHabitInput,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined)
    payload.description = input.description || deleteField();
  if (input.target !== undefined) payload.target = input.target;
  if (input.tasks !== undefined) payload.tasks = input.tasks;
  if (input.days !== undefined)
    payload.days = normalizeDays(input.days) ?? deleteField();
  if (input.timeOfDay !== undefined) payload.timeOfDay = input.timeOfDay;
  await updateDoc(doc(db, "habits", habitId), payload);
}

export async function deleteHabit(habitId: string): Promise<void> {
  await deleteDoc(doc(db, "habits", habitId));
}
