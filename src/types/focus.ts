export type FocusSessionStatus = 'completed' | 'ended_early';

/** A finished focus session, as stored in the `focusSessions` collection. */
export interface FocusSession {
  id: string;
  userId: string;
  task: string;
  /** Omitted when empty. Max 200 chars. */
  description?: string;
  /** Timer value chosen at start, including any +5 min extensions. */
  plannedDurationSeconds: number;
  /** Time actually focused, excluding paused time. Never above planned. */
  actualDurationSeconds: number;
  status: FocusSessionStatus;
  /** ISO string locally; a Firestore Timestamp in the database. */
  startedAt: string;
  endedAt: string;
}

export type CreateFocusSessionInput = Omit<FocusSession, 'id'>;

/** The one in-progress session. Local only (MMKV) until it ends. */
export interface ActiveFocusSession {
  /** Local id, used in the `focus/[sessionId]` route. */
  id: string;
  task: string;
  description?: string;
  plannedDurationSeconds: number;
  /** Epoch ms. */
  startedAt: number;
  /** Epoch ms when paused; null while running. */
  pausedAt: number | null;
  /** Total ms spent paused before the current pause. */
  pausedTotalMs: number;
}

/** What the user enters on the New focus session form. */
export interface FocusDraft {
  task: string;
  description?: string;
  plannedMinutes: number;
}
