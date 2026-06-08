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
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { CreateHabitInput, Habit, UpdateHabitInput } from '@/types/habit';

function docToHabit(id: string, data: Record<string, unknown>): Habit {
  const createdAt = data.createdAt as { toDate?: () => Date } | string | undefined;
  return {
    id,
    userId: data.userId as string,
    name: data.name as string,
    type: data.type as Habit['type'],
    target: data.target as number | undefined,
    tasks: data.tasks as Habit['tasks'],
    createdAt:
      typeof createdAt === 'object' && createdAt?.toDate
        ? createdAt.toDate().toISOString()
        : (createdAt as string) ?? new Date().toISOString(),
  };
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const q = query(collection(db, 'habits'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToHabit(d.id, d.data()));
}

export async function createHabit(userId: string, input: CreateHabitInput): Promise<Habit> {
  const payload: Record<string, unknown> = {
    userId,
    name: input.name,
    type: input.type,
    createdAt: serverTimestamp(),
  };
  if (input.type === 'count') payload.target = input.target;
  if (input.type === 'routine') payload.tasks = input.tasks;

  const ref = await addDoc(collection(db, 'habits'), payload);
  return {
    id: ref.id,
    userId,
    name: input.name,
    type: input.type,
    target: input.target,
    tasks: input.tasks,
    createdAt: new Date().toISOString(),
  };
}

export async function updateHabit(habitId: string, input: UpdateHabitInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.target !== undefined) payload.target = input.target;
  if (input.tasks !== undefined) payload.tasks = input.tasks;
  await updateDoc(doc(db, 'habits', habitId), payload);
}

export async function deleteHabit(habitId: string): Promise<void> {
  await deleteDoc(doc(db, 'habits', habitId));
}
