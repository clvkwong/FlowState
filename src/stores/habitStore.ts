import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as habitService from '@/services/habitService';
import { getHabitPersistKey } from '@/storage/persistKeys';
import { storage } from '@/storage/mmkv';
import type { CreateHabitInput, Habit, UpdateHabitInput } from '@/types/habit';

interface HabitState {
  habits: Habit[];
  _hasHydrated: boolean;
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabitLocal: (habitId: string, updates: Partial<Habit>) => void;
  removeHabit: (habitId: string) => void;
  reset: () => void;
  createHabit: (userId: string, input: CreateHabitInput) => Promise<Habit>;
  updateHabit: (habitId: string, input: UpdateHabitInput) => Promise<void>;
  deleteHabit: (userId: string, habitId: string) => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

let activeUserId: string | null = null;

const habitStorage = {
  getItem: (): string | null => {
    if (!activeUserId) return null;
    return storage.getString(getHabitPersistKey(activeUserId)) ?? null;
  },
  setItem: (_name: string, value: string): void => {
    if (!activeUserId) return;
    storage.set(getHabitPersistKey(activeUserId), value);
  },
  removeItem: (): void => {
    if (!activeUserId) return;
    storage.remove(getHabitPersistKey(activeUserId));
  },
};

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      _hasHydrated: false,
      setHabits: (habits) => set({ habits }),
      addHabit: (habit) => set({ habits: [...get().habits, habit] }),
      updateHabitLocal: (habitId, updates) =>
        set({
          habits: get().habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)),
        }),
      removeHabit: (habitId) =>
        set({ habits: get().habits.filter((h) => h.id !== habitId) }),
      reset: () => set({ habits: [], _hasHydrated: false }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      createHabit: async (userId, input) => {
        const habit = await habitService.createHabit(userId, input);
        get().addHabit(habit);
        return habit;
      },
      updateHabit: async (habitId, input) => {
        await habitService.updateHabit(habitId, input);
        get().updateHabitLocal(habitId, input);
      },
      deleteHabit: async (_userId, habitId) => {
        await habitService.deleteHabit(habitId);
        get().removeHabit(habitId);
      },
    }),
    {
      name: 'habit-store',
      storage: createJSONStorage(() => habitStorage),
      skipHydration: true,
      partialize: (state) => ({ habits: state.habits }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export async function rehydrateHabitStore(userId: string): Promise<void> {
  activeUserId = userId;
  useHabitStore.setState({ _hasHydrated: false });
  await useHabitStore.persist.rehydrate();
}

export function clearHabitStorePersist(userId: string): void {
  storage.remove(getHabitPersistKey(userId));
  activeUserId = null;
}
