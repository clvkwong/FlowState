import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import * as focusService from "@/services/focusService";
import { getFocusPersistKey } from "@/storage/persistKeys";
import { storage } from "@/storage/mmkv";
import type {
  ActiveFocusSession,
  FocusDraft,
  FocusSession,
  FocusSessionStatus,
} from "@/types/focus";
import {
  buildFocusSessionResult,
  createActiveFocusSession,
  extendFocusSession,
  pauseFocusSession,
  resumeFocusSession,
} from "@/utils/focus";

interface FocusState {
  /** Finished sessions (the user's focus log). */
  sessions: FocusSession[];
  /** At most one in-progress session; local only until it ends. */
  activeSession: ActiveFocusSession | null;
  _hasHydrated: boolean;
  hydrateFromDB: (sessions: FocusSession[]) => void;
  /** Starts a session from the form. Replaces any session in progress. */
  startSession: (draft: FocusDraft) => ActiveFocusSession;
  pauseSession: () => void;
  resumeSession: () => void;
  /** +5 minutes, capped at 180. */
  extendSession: () => void;
  /**
   * Ends the active session: writes the log to Firestore, then adds it
   * locally. Returns null (and writes nothing) for a session under 1 minute.
   * On a failed write the session stays active so the user can retry.
   */
  endSession: (
    userId: string,
    status: FocusSessionStatus,
  ) => Promise<FocusSession | null>;
  /** Drops the active session without logging it. */
  discardActiveSession: () => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
}

let isRehydrating = false;

const focusStorage = {
  getItem: (): string | null => {
    return storage.getString(getFocusPersistKey()) ?? null;
  },
  setItem: (_name: string, value: string): void => {
    if (isRehydrating) return;
    storage.set(getFocusPersistKey(), value);
  },
  removeItem: (): void => {
    if (isRehydrating) return;
    storage.remove(getFocusPersistKey());
  },
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      _hasHydrated: false,
      hydrateFromDB: (sessions) => set({ sessions, _hasHydrated: true }),
      startSession: (draft) => {
        const activeSession = createActiveFocusSession(draft);
        set({ activeSession });
        return activeSession;
      },
      pauseSession: () => {
        const { activeSession } = get();
        if (activeSession) set({ activeSession: pauseFocusSession(activeSession) });
      },
      resumeSession: () => {
        const { activeSession } = get();
        if (activeSession) set({ activeSession: resumeFocusSession(activeSession) });
      },
      extendSession: () => {
        const { activeSession } = get();
        if (activeSession) set({ activeSession: extendFocusSession(activeSession) });
      },
      endSession: async (userId, status) => {
        const { activeSession } = get();
        if (!activeSession) return null;
        const result = buildFocusSessionResult(activeSession, userId, status);
        if (!result) {
          set({ activeSession: null });
          return null;
        }
        const session = await focusService.createFocusSession(result);
        set({ sessions: [...get().sessions, session], activeSession: null });
        return session;
      },
      discardActiveSession: () => set({ activeSession: null }),
      reset: () =>
        set({ sessions: [], activeSession: null, _hasHydrated: false }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "focus-store",
      storage: createJSONStorage(() => focusStorage),
      skipHydration: true,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSession: state.activeSession,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export async function rehydrateFocusStore(): Promise<void> {
  isRehydrating = true;
  try {
    useFocusStore.setState({ _hasHydrated: false });
    await useFocusStore.persist.rehydrate();
  } finally {
    isRehydrating = false;
  }
}

export function clearFocusStorePersist(): void {
  storage.remove(getFocusPersistKey());
}
