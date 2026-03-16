# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native 0.84.1 app (MyAppRN) using New Architecture (Fabric + TurboModules), React 19, TypeScript 5.8, and Hermes JS engine. Bootstrapped with `@react-native-community/cli`.

## Common Commands

```bash
# Start Metro bundler
npm start

# Run on iOS/Android
npm run ios
npm run android

# Run tests
npm test                    # all tests
npx jest --testPathPattern=App  # single test file

# Linting
npm run lint

# iOS pod install (after adding native dependencies)
cd ios && bundle exec pod install && cd ..
```

## Architecture

- **Entry point:** `index.js` → `App.tsx` (SafeAreaProvider wrapper with dark/light mode support)
- **Test location:** `__tests__/` directory, using Jest with `react-native` preset and `react-test-renderer`
- **Native code:** iOS in Swift (`ios/MyAppRN/AppDelegate.swift`), Android in Kotlin (`android/app/src/main/java/com/myapprn/`)
- **Bundle ID / Package name:** `com.myapprn`

## Code Style

- Prettier: single quotes, trailing commas (all), no parens on single arrow params
- ESLint: `@react-native` shared config
- Functional components with hooks

## Platform Configuration

- **iOS:** New Architecture enabled, portrait-only on iPhone, all orientations on iPad
- **Android:** minSdk 24, targetSdk 36, Hermes enabled, New Architecture enabled
- **Node:** requires >= 22.11.0
- **Ruby:** >= 2.6.10, CocoaPods >= 1.13 (avoid 1.15.0, 1.15.1)
