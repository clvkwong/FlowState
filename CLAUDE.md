# FlowState

Habit tracker mobile app. Two platforms, one codebase.

## Goal

Help users build habits through three types:

- **check** — simple done/not-done daily habit
- **count** — numeric target (e.g. drink 8 glasses of water)
- **routine** — ordered list of timed tasks (e.g. morning routine with 5 steps)

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
- Separate stores: `authStore`, `habitStore`, `logStore`
- `habitStore` and `logStore` use Zustand `persist` with MMKV, scoped per `userId`

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
  type: 'check' | 'count' | 'routine'
  target?: number           // count habits only
  tasks?: RoutineTask[]     // routine habits only
  createdAt: Timestamp
}
```

### RoutineTask

```
{
  id: string
  label: string
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

## Conventions

- Use functional components and hooks throughout. No class components.
- Co-locate component styles using StyleSheet.create in the same file.
- Services layer handles all Firestore reads/writes. Screens and stores do not import Firebase directly.
- Habit logic (e.g. isCompleted, progress) lives in utility functions, not components.
- All Firestore collections: `habits`, `habitLogs` — scoped by `userId`.

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
- Progress ring or bar for count habits.
- Step-through timer view for routine habits — fullscreen, one task at a time.
- Streak/completion counter on the home screen — make it prominent.

### What to avoid

- Material Design defaults or iOS system gray palettes.
- Small, timid typography.
- Completion states that look the same as incomplete states.

## Out of scope (v1)

- Social features
- Push notifications
- Habit streaks or analytics
- Offline/conflict resolution
- Any auth method other than email + password
