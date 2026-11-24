import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { compareHabits, nextHabitOrder } from "@/utils/habitLogic";
import { normalizeDays } from "@/utils/schedule";
import * as habitService from "@/services/habitService";
import { getHabitPersistKey } from "@/storage/persistKeys";
import { storage } from "@/storage/mmkv";
import type { CreateHabitInput, Habit, UpdateHabitInput } from "@/types/habit";

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
  /** Persists the given id sequence as the habits' display order. */
  reorderHabits: (orderedIds: string[]) => Promise<void>;
  setHasHydrated: (value: boolean) => void;
  hydrateFromDB: (habits: Habit[]) => void;
}

let isRehydrating = false;

const habitStorage = {
  getItem: (): string | null => {
    return storage.getString(getHabitPersistKey()) ?? null;
  },
  setItem: (_name: string, value: string): void => {
    if (isRehydrating) return;
    storage.set(getHabitPersistKey(), value);
  },
  removeItem: (): void => {
    if (isRehydrating) return;
    storage.remove(getHabitPersistKey());
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
          habits: get().habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h,
          ),
        }),
      removeHabit: (habitId) =>
        set({ habits: get().habits.filter((h) => h.id !== habitId) }),
      reset: () => set({ habits: [], _hasHydrated: false }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      createHabit: async (userId, input) => {
        const habit = await habitService.createHabit(userId, {
          ...input,
          order: nextHabitOrder(get().habits),
        });
        get().addHabit(habit);
        return habit;
      },
      updateHabit: async (habitId, input) => {
        await habitService.updateHabit(habitId, input);
        const { days, ...rest } = input;
        get().updateHabitLocal(habitId, {
          ...rest,
          ...(input.description !== undefined && {
            description: input.description || undefined,
          }),
          ...(days !== undefined && { days: normalizeDays(days) }),
        });
      },
      deleteHabit: async (_userId, habitId) => {
        await habitService.deleteHabit(habitId);
        get().removeHabit(habitId);
      },
      reorderHabits: async (orderedIds) => {
        const orders = orderedIds.map((habitId, order) => ({ habitId, order }));
        const changed = orders.filter(
          ({ habitId, order }) =>
            get().habits.find((h) => h.id === habitId)?.order !== order,
        );
        if (changed.length === 0) return;
        await habitService.reorderHabits(changed);
        const byId = new Map(orders.map((o) => [o.habitId, o.order]));
        set({
          habits: get()
            .habits.map((h) =>
              byId.has(h.id) ? { ...h, order: byId.get(h.id) } : h,
            )
            .sort(compareHabits),
        });
      },
      hydrateFromDB: (habits) => set({ habits, _hasHydrated: true }),
    }),
    {
      name: "habit-store",
      storage: createJSONStorage(() => habitStorage),
      skipHydration: true,
      partialize: (state) => ({ habits: state.habits }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export async function rehydrateHabitStore(): Promise<void> {
  isRehydrating = true;
  try {
    useHabitStore.setState({ _hasHydrated: false });
    await useHabitStore.persist.rehydrate();
  } finally {
    isRehydrating = false;
  }
}

export function clearHabitStorePersist(): void {
  storage.remove(getHabitPersistKey());
}
