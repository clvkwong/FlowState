# FlowState

Habit tracker mobile app — check, count, and routine habits with Firebase sync and MMKV local cache.

## Prerequisites

- Node.js 18+
- Xcode (iOS) or Android Studio (Android)
- A Firebase project with Email/Password auth and Firestore enabled

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**

   Copy `.env.example` to `.env` and fill in your Firebase web app config:

   ```bash
   cp .env.example .env
   ```

3. **Deploy Firestore rules**

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```

4. **Native build (required for MMKV)**

   MMKV is a native module — Expo Go is not supported. Use a development build:

   ```bash
   npx expo prebuild
   npx expo run:ios
   # or
   npx expo run:android
   ```

## Architecture

- **Firebase Auth** — email/password sessions persisted via MMKV
- **Firestore** — source of truth for `habits` and `habitLogs` collections
- **Zustand + MMKV** — habits/logs cached locally; Firestore fetch only on explicit sign-in/sign-up
- **Session restore** — app relaunch rehydrates from MMKV without a Firestore read

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in browser (limited — MMKV/native auth differ on web) |

## Habit types

| Type | Behavior |
|------|----------|
| **check** | Tap to toggle done/not-done |
| **count** | Tap to increment toward daily target |
| **routine** | Fullscreen step-through timer; records actual duration per step |
