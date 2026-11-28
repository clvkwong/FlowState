# FlowState

Habit tracker mobile app. Two platforms, one codebase.

## Goal

Help users build habits through three types:

- **check** — simple done/not-done daily habit
- **count** — numeric target (e.g. drink 8 glasses of water)
- **routine** — ordered list of timed tasks (e.g. morning routine with 5 steps)

Plus **Focus mode**: one-off timed sessions on a single task (not a habit, never scheduled), tracked in the Focus tab.

## Tech stack

- React Native (Expo) — iOS and Android
- Firebase — Firestore for data, Firebase Auth for authentication
- Zustand — global client state
- TypeScript — strict mode
- react-native-mmkv — synchronous local storage for auth + Zustand persist

## Architecture

### Auth

- Email + password only. No OAuth, no magic links, no social login.
- Firebase Auth handles sessions. Persist auth state across app restarts via MMKV.

### Data sync strategy

- **On explicit sign-in / sign-up**: fetch all user data from Firestore once. Overwrite local Zustand stores.
- **On auth session restore** (app relaunch): rehydrate Zustand stores from MMKV — no Firestore read.
- **No real-time listeners**. Do not use onSnapshot or subscribe to live updates.
- **Mutations**: write to Firestore first, then update local Zustand store on success (MMKV persist follows automatically).
- Offline writes are not required in v1.

### State

- All app state lives in Zustand. Firebase is the source of truth but is only read on explicit sign-in.
- Separate stores: `authStore`, `habitStore`, `logStore`, `focusStore`
- `habitStore`, `logStore` and `focusStore` use Zustand `persist` with MMKV, scoped per `userId`
- `focusStore` holds the user's completed `FocusSession` logs plus at most one in-progress session (local only until it ends)

## Project structure

src/
app/ # Expo Router screens
components/ # Shared UI components
stores/ # Zustand stores (authStore, habitStore, logStore)
services/ # Firebase read/write functions
hooks/ # Custom hooks
types/ # TypeScript interfaces
storage/ # MMKV + persistence adapters
utils/ # Habit logic, date helpers

## Data model

### Habit

```
{
  id: string
  userId: string
  name: string
  description?: string     // optional, free text
  type: 'check' | 'count' | 'routine'
  target?: number           // count habits only
  tasks?: RoutineTask[]     // routine habits only
  days?: number[]           // 0 = Sun … 6 = Sat; omitted = every day
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime' // omitted = anytime
  order?: number            // user-chosen position, ascending; omitted = never reordered (sorts first, by createdAt)
  createdAt: Timestamp
}
```

### RoutineTask

```
{
  id: string
  label: string
  description?: string      // optional, max 200 chars; omitted when empty
  durationSeconds: number
}
```

### HabitLog

```
{
  id: string
  habitId: string
  userId: string
  date: string              // YYYY-MM-DD
  completed: boolean        // check + routine habits (explicit flag)
  count?: number            // count habits
  completedTasks?: { taskId: string, actualDurationSeconds: number }[] // routine step history
  loggedAt: Timestamp
}
```

### FocusSession

One log per finished focus session (`focusSessions` collection). Written when the session ends; afterwards it can be edited or deleted from the Focus tab.

```
{
  id: string
  userId: string
  task: string                   // required, the one-off task name
  description?: string           // optional, max 200 chars; omitted when empty
  plannedDurationSeconds: number // timer value chosen at start, never changed mid-session; any whole-minute value 1 min–23 h 59 min
  actualDurationSeconds: number  // time actually focused (excludes paused time; includes overtime)
  status: 'completed' | 'ended_early'
  startedAt: Timestamp
  endedAt: Timestamp
}
```

- A session only ends when the user taps the Finish CTA. The timer never auto-ends: past the planned time it keeps counting into overtime.
- `completed` = finished at or after the planned time; `ended_early` = finished before it.
- Every finished session is logged, however short. There is no minimum duration.
- **Editing a past session** changes only `task`, `description` and `actualDurationSeconds`; `status` is re-derived from the new time (same rule as above). `actualDurationSeconds` can be set to any amount above 0 (no upper limit; it may exceed the span `endedAt − startedAt`). `userId`, `plannedDurationSeconds`, `startedAt` and `endedAt` never change — `firestore.rules` enforces this.
- **Deleting** removes the log; the focus streak and 7-day stats simply recompute.

### Focus stats (`utils/focus.ts`)

- **Focus streak**: consecutive days (local date of `startedAt`) with ≥1 logged session (`completed` or `ended_early` — ending early is never penalized), ending today — or yesterday if today has none yet. Also track best streak.
- **Last 7 days total**: sum of `actualDurationSeconds` over today and the previous 6 days. Sessions ended early add only the time actually focused.
- Session count and per-day minutes (bar chart) over the same 7 days.

## Conventions

- Use functional components and hooks throughout. No class components.
- Co-locate component styles using StyleSheet.create in the same file.
- Services layer handles all Firestore reads/writes. Screens and stores do not import Firebase directly.
- Habit logic (e.g. isCompleted, progress) lives in utility functions, not components.
- All Firestore collections: `habits`, `habitLogs`, `focusSessions` — scoped by `userId`.

## UI aesthetic

Bold, high-energy, gamified. Inspired by Streaks and Duolingo — reward completion, make progress feel satisfying.

### Visual style

- High contrast. Dark backgrounds with vivid accent colors, not muted pastels.
- Strong typography — large weights for habit names, progress numbers, and streak counts.
- Rounded corners throughout (borderRadius 16–24). Pill-shaped buttons and tags.
- Completion states should feel rewarding: use color fills, checkmarks, and animation on habit completion.
- Avoid flat gray UI. Even "empty" states should have personality.

### Color

- One primary accent color used consistently for CTAs and active states.
- Each habit type can have a distinct accent: check → one color, count → another, routine → another.
- Dark surface as the default background (#111–#1a1a1a range), not pure black.
- White or near-white text on dark surfaces. No low-contrast gray-on-gray.

### Color palette

| Role           | Hex     | Usage                                  |
| -------------- | ------- | -------------------------------------- |
| Primary        | #6C47FF | CTAs, active states, nav, focus rings  |
| Check accent   | #A8E63D | Check habit cards, completion fills    |
| Count accent   | #00D4FF | Count habit cards, progress bars/rings |
| Routine accent | #6C47FF | Routine habit cards (shares primary)   |
| Focus accent   | #FFB547 | Focus mode stats, timer ring, sessions |
| Background     | #1a1a2e | App background                         |
| Surface        | #242438 | Cards, bottom sheets, modals           |
| Text primary   | #F5F5FF | Headings, habit names                  |
| Text secondary | #9090B0 | Labels, metadata, timestamps           |
| Danger         | #FF4D6D | Destructive actions only               |

- Never use pure black (#000) or pure white (#FFF).
- Completed habit cards get their accent color as a background fill (reduced opacity: 0.15).
- Incomplete habit cards use Surface (#242438) background with accent as border/icon color.

### Motion

- Animate habit completions (checkmark pop, count increment, progress bar fill).
- Keep animations short (150–250ms). Satisfying, not slow.
- Use React Native's Animated API or Reanimated 2 for interactions.

### Components to prioritize

- Habit card: the core UI unit — must feel chunky, tappable, and visually distinct per type.
  - Layout: name + type label on the left, the primary action on the right (check: 60px checkbox; count: −/+ buttons; routine: round play button). 21-day history strip along the bottom.
  - Count habits always offer − next to + so a mistaken press can be undone (never below 0).
  - Tapping the action control (checkbox, −/+, play) fires the habit action; tapping anywhere else on the card opens the View screen (`habit/[id]`), including on view-only days.
  - Edit / View / Delete live behind gestures, not buttons on the card: long-press opens an action sheet, swipe left reveals the same three actions.
- Progress bar for count habits (fill animates, value shown at its end).
- Account button in the home header opens a sheet with the signed-in email and Sign out.
- Bottom tabs: floating pill on a raised surface (`surfaceRaised`, light outline, deep shadow) with a fade behind it (`FloatingTabBar`); each tab is icon + label, the active one is a solid primary pill.
- Step-through timer view for routine habits — fullscreen, one task at a time.
- Streak/completion counter on the home screen — make it prominent.
- Focus tab (`(tabs)/focus`): stats card (focus streak + best, last-7-days total + session count, 7-day bar chart with today in focus amber), primary "Start a focus session" CTA, and Recent sessions grouped by day, paged 10 at a time with a "Show N more · M older" button (task, planned time, actual time, Done / Finished early — both get the filled reward style — "Run again" which prefills the new-session form). Tapping a session opens its detail screen; long-press opens a View / Edit / Delete sheet (`FocusSessionActionSheet`) and swipe left reveals the same three (`SwipeActionsRow`, shared with habit cards).
- Focus session detail (`focus/log/[id]`): Done / Finished early pill, task + description, time focused vs planned (fill bar, overtime noted), date / started / finished / paused, Edit, "Run again" and Delete.
- Edit focus session (`focus/log/[id]/edit`, modal): task, description, time focused (±1 min stepper or tap to type), with a live Done / Finished early badge showing the re-derived status.
- Delete focus session: branded `ConfirmDialog` ("Keep it" / "Delete") previewing how the 7-day total and focus streak change (`useDeleteFocusSession`).
- New focus session (`focus/new`, modal): task (required), description (optional, 200 chars), timer presets 15/25/45/60 min plus a ±5 min stepper (snaps to multiples of 5); tap the time to type any hours + minutes on the number pad (1 min–23 h 59 min), like routine step durations.
- Focus timer (`focus/[sessionId]`, full-screen modal): one task, countdown ring in focus amber, pause/resume (no +5 min: the timer runs into overtime instead). At the planned time it keeps going into overtime (ring refills in check green, counts `+m:ss`). Only the "Finish session" CTA saves a session; closing the screen leaves it running (Resume banner on the Focus tab). A Discard button (trash, top right, branded `ConfirmDialog`) throws the session away: nothing saved, stats untouched. Every logged session — completed or finished early — gets the celebration screen: streak, sessions today and the 7-day total, with Done / Another round.
- Home schedule: week strip (today ±3 days) and time-of-day pills. Today defaults to "Up next" (current window onward + Anytime); earlier windows collapse into one "still open" banner. Sections run Morning → Afternoon → Evening → Anytime, incomplete first, then the user's order (`compareHabits`: order → createdAt → name → id). Reorder screen (`habit/reorder`, header button) moves habits within each time-of-day section. Other days are view-only. Windows: morning < 12:00, afternoon 12–17, evening ≥ 17 (`utils/schedule.ts`).

### What to avoid

- Material Design defaults or iOS system gray palettes.
- Small, timid typography.
- Completion states that look the same as incomplete states.

## Out of scope (v1)

- Social features
- Push notifications
- Habit streaks or analytics (exception: Focus mode's focus streak and 7-day stats are in scope)
- Focus mode: background/lock-screen timer notifications, pomodoro break cycles, changing a past session's planned time or date
- Offline/conflict resolution
- Any auth method other than email + password
