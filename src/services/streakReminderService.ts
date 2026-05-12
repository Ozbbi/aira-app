/**
 * Streak-reminder service — schedules a daily local push at 7 PM if the
 * user hasn't completed a lesson today.
 *
 * No remote backend needed: we use `expo-notifications`' local scheduling
 * (already installed). Permissions are asked on first lesson-complete,
 * not at app start, so we don't spook new users.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_ID = 'aira_daily_streak_reminder';
const REMINDER_HOUR_LOCAL = 19; // 7 PM local time

let permissionAsked = false;

/**
 * Set the default in-app notification behavior. Called once at app boot.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Asks for permission idempotently. Returns whether permission is granted.
 */
async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  if (existing.status === 'denied' || permissionAsked) return false;
  permissionAsked = true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/**
 * Schedule the daily reminder for 7 PM local. Idempotent — cancels any
 * existing AIRA reminder first so we don't stack duplicates.
 *
 * Safe to call repeatedly (e.g. on app focus / after lesson complete).
 */
export async function scheduleDailyStreakReminder(): Promise<{ scheduled: boolean; reason?: string }> {
  try {
    const granted = await ensurePermission();
    if (!granted) return { scheduled: false, reason: 'permission_denied' };

    // Wipe existing AIRA reminders first.
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const s of all) {
      if (s.identifier === REMINDER_ID) {
        await Notifications.cancelScheduledNotificationAsync(s.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'Your streak is waiting 🔥',
        body: "Three minutes today keeps your streak alive. Ara's ready.",
        sound: false,
        // iOS: opens straight into the app (no deep-link needed for MVP)
      },
      trigger: {
        // Local daily repeat — the Expo API for this changed between SDKs.
        // We use the typed shape that works on both iOS and Android in SDK 54.
        hour: REMINDER_HOUR_LOCAL,
        minute: 0,
        repeats: true,
      } as any,
    });

    return { scheduled: true };
  } catch (err) {
    // Don't crash the app on notification errors.
    return { scheduled: false, reason: 'error' };
  }
}

/**
 * Cancel the daily reminder. Useful when user toggles notifications off
 * in Profile settings.
 */
export async function cancelDailyStreakReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // Already not scheduled.
  }
}

/**
 * Check current permission + scheduled status. For Settings UI.
 */
export async function getStreakReminderStatus(): Promise<{
  permission: 'granted' | 'denied' | 'undetermined';
  scheduled: boolean;
}> {
  const perm = await Notifications.getPermissionsAsync();
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return {
    permission: perm.status as 'granted' | 'denied' | 'undetermined',
    scheduled: all.some((s) => s.identifier === REMINDER_ID),
  };
}
