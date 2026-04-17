import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// On web there is no Haptics engine — calls throw. No-op early so the
// browser console stays clean.
const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Semantic haptic helpers for AIRA.
 *
 * Use these instead of calling expo-haptics directly so we have one
 * place to tune feel, throttle, or no-op on web later.
 *
 * Mapping (intent → physical sensation):
 *   tap     → Light  (UI tap, secondary buttons)
 *   select  → Selection (picking an option in a list / segmented control)
 *   medium  → Medium (primary button press)
 *   heavy   → Heavy  (big commitment: submit lesson, level up)
 *   success → Success notification (correct answer, lesson complete)
 *   error   → Error notification (wrong answer, failed signup)
 *   warning → Warning notification (daily limit hit, paywall trigger)
 */
export const haptics = {
  tap: () => {
    if (!IS_NATIVE) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  select: () => {
    if (!IS_NATIVE) return;
    Haptics.selectionAsync().catch(() => {});
  },
  medium: () => {
    if (!IS_NATIVE) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy: () => {
    if (!IS_NATIVE) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  success: () => {
    if (!IS_NATIVE) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error: () => {
    if (!IS_NATIVE) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
  warning: () => {
    if (!IS_NATIVE) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
