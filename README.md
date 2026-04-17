# AIRA Mobile

AI-powered learning platform — Expo (React Native) mobile app.

## Quick Start

```bash
npm install
npx expo start
```

## Running

- **Phone**: Install [Expo Go](https://expo.dev/go), scan the QR code
- **Web**: Press `w` in the terminal after `npx expo start`
- **iOS Simulator**: Press `i` (macOS only)
- **Android Emulator**: Press `a`

## Current State

All screens work as navigation skeletons with mock data (zustand store). Not connected to backend yet.

### Screens
- **Onboarding** — 3-slide intro with gradient backgrounds
- **Dashboard** — XP bar, streak badge, continue learning card, topic grid
- **Lesson** — Question UI shell with progress bar and answer cards
- **Profile** — Avatar, stats row, upgrade to Pro card
- **Paywall** — AIRA Pro features, pricing, upgrade button

### Stack
- Expo SDK 54 + TypeScript
- React Navigation (native stack + bottom tabs)
- Reanimated for animations
- expo-linear-gradient, expo-haptics
- Inter + Space Grotesk fonts
- Zustand for state management

## Next Step

Step 3 will build the real lesson-taking flow with question types and backend integration.
