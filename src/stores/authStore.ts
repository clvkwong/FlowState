import { create } from 'zustand';
import type { User } from 'firebase/auth';
import * as authService from '@/services/authService';
import { hydrateUserData } from '@/services/hydrateService';
import { clearUserPersist } from '@/storage/persistKeys';
import { rehydrateHabitStore, useHabitStore, clearHabitStorePersist } from '@/stores/habitStore';
import { rehydrateLogStore, useLogStore, clearLogStorePersist } from '@/stores/logStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthReady: (ready: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hydrateFromFirestore: (userId: string) => Promise<void>;
  restoreFromMMKV: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  hydrateFromFirestore: async (userId) => {
    const { habits, logs } = await hydrateUserData(userId);
    useHabitStore.getState().setHabits(habits);
    useLogStore.getState().setLogs(logs);
  },
  restoreFromMMKV: async (userId) => {
    await Promise.all([rehydrateHabitStore(userId), rehydrateLogStore(userId)]);
  },
  signIn: async (email, password) => {
    const user = await authService.signIn(email, password);
    set({ user });
    await get().restoreFromMMKV(user.uid);
    await get().hydrateFromFirestore(user.uid);
  },
  signUp: async (email, password) => {
    const user = await authService.signUp(email, password);
    set({ user });
    useHabitStore.getState().reset();
    useLogStore.getState().reset();
    await get().restoreFromMMKV(user.uid);
    await get().hydrateFromFirestore(user.uid);
  },
  signOut: async () => {
    const userId = get().user?.uid;
    await authService.signOut();
    useHabitStore.getState().reset();
    useLogStore.getState().reset();
    if (userId) {
      clearUserPersist(userId);
      clearHabitStorePersist(userId);
      clearLogStorePersist(userId);
    }
    set({ user: null, isAuthReady: false });
  },
}));
