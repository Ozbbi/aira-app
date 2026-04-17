import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// A single stable identifier for the daily streak reminder, so we can
// replace it instead of piling up duplicates across reschedules.
const STREAK_REMINDER_ID = 'aira-streak-reminder';

// Default reminder time (7:00 PM local). Kept here so changing it is one edit.
export const DEFAULT_REMINDER_HOUR = 19;
export const DEFAULT_REMINDER_MINUTE = 0;

// Configure how notifications behave while the app is foregrounded.
// We set this at module load so the handler is in place before any schedule call.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Ask the user for notification permission. Returns true if granted.
 * Safe to call multiple times — the OS will remember the answer.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
  }

  // Android needs an explicit channel for scheduled notifications to show up.
  if (status === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streak', {
      name: 'Streak reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  return status === 'granted';
}

/**
 * Schedule (or replace) the daily streak reminder. Fires every day at the
 * given hour:minute local time. Safe to call repeatedly — it always replaces
 * the existing one using a stable identifier.
 *
 * Returns true on success, false if permissions are missing.
 */
export async function scheduleStreakReminder(
  hour: number = DEFAULT_REMINDER_HOUR,
  minute: number = DEFAULT_REMINDER_MINUTE
): Promise<boolean> {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  // Cancel any previous instance first to avoid duplicates on replatform.
  await cancelStreakReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: {
      title: 'Don\u2019t lose your streak \u2728',
      body: 'Two minutes now keeps your progress alive. Aira is waiting.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'streak' : undefined,
    },
  });

  return true;
}

/**
 * Cancel the daily streak reminder if it's scheduled. No-op if not.
 */
export async function cancelStreakReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID);
  } catch {
    // Identifier not found — nothing to cancel. Safe to swallow.
  }
}

/**
 * Called after a lesson is completed. Since the user already practiced today,
 * we suppress today's reminder by cancelling and rescheduling for tomorrow.
 * The DAILY trigger naturally rolls forward, so cancelling + rescheduling
 * gives us a fresh next-fire one day from now.
 *
 * If notifications are disabled, this is a no-op.
 */
export async function handleLessonCompletedForReminder(
  enabled: boolean,
  hour: number = DEFAULT_REMINDER_HOUR,
  minute: number = DEFAULT_REMINDER_MINUTE
): Promise<void> {
  if (!enabled) return;
  await cancelStreakReminder();
  await scheduleStreakReminder(hour, minute);
}

/**
 * Check whether the streak reminder is currently scheduled. Used by the
 * Profile screen to reflect the actual OS state, not just a local toggle.
 */
export async function isStreakReminderScheduled(): Promise<boolean> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.some((n) => n.identifier === STREAK_REMINDER_ID);
}
