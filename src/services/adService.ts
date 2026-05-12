/**
 * Ad service — AdMob-shaped API with a mock backend.
 *
 * Flip USE_REAL_ADS to true once `react-native-google-mobile-ads` (or
 * `expo-ads-admob`) is installed. Every caller talks to this module,
 * so swap is a 1-flag change.
 *
 * The mock surfaces a fullscreen overlay through a small event bus
 * (no UI here — the App-level <RewardedAdModal> reads `pendingAdRequest`
 * and resolves the promise). This keeps `adService` ergonomic to test
 * without React.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const USE_REAL_ADS = false;

export const MAX_ADS_PER_DAY = 3;
export const AD_COUNTDOWN_SECONDS = 15;

export type AdReward = {
  type: 'heart' | 'xp' | 'streak_freeze';
  amount: number;
};

export interface AdResult {
  rewarded: boolean;
  reward?: AdReward;
  /** Reason set when rewarded === false. */
  reason?: 'limit_reached' | 'user_closed' | 'unavailable';
}

/* ───────────────────────── daily-limit bookkeeping ───────────────────────── */

const STORAGE_KEY = 'aira_ad_state_v1';
interface AdState {
  /** YYYY-MM-DD bucket so the count resets at local midnight. */
  date: string;
  watched: number;
}

function todayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadAdState(): Promise<AdState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayBucket(), watched: 0 };
    const parsed: AdState = JSON.parse(raw);
    // Reset on new day
    if (parsed.date !== todayBucket()) return { date: todayBucket(), watched: 0 };
    return parsed;
  } catch {
    return { date: todayBucket(), watched: 0 };
  }
}

async function saveAdState(state: AdState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getRemainingAdsToday(): Promise<number> {
  const s = await loadAdState();
  return Math.max(0, MAX_ADS_PER_DAY - s.watched);
}

/* ───────────────────────── event bus for the modal ───────────────────────── */

/**
 * The mock ad modal lives inside the React tree. We expose a tiny
 * subscription channel so the service can ask the UI to render a modal
 * and await its resolution.
 */
type AdRequest = {
  reward: AdReward;
  resolve: (result: AdResult) => void;
};

let listener: ((req: AdRequest) => void) | null = null;
export function registerAdRequestListener(fn: (req: AdRequest) => void): void {
  listener = fn;
}
export function unregisterAdRequestListener(): void {
  listener = null;
}

/* ───────────────────────────── public API ───────────────────────────── */

/**
 * Show a rewarded ad. Returns a promise that resolves with the result.
 *   - If daily limit reached: resolves immediately with rewarded=false.
 *   - If user closes early: rewarded=false, reason='user_closed'.
 *   - On reward: rewarded=true with the reward payload.
 */
export async function showRewardedAd(reward: AdReward = { type: 'heart', amount: 1 }): Promise<AdResult> {
  if (USE_REAL_ADS) {
    // TODO: real AdMob call here. Same return shape.
    return { rewarded: false, reason: 'unavailable' };
  }

  const state = await loadAdState();
  if (state.watched >= MAX_ADS_PER_DAY) {
    return { rewarded: false, reason: 'limit_reached' };
  }

  if (!listener) {
    // No modal mounted — caller is using ads before <RewardedAdModal> ever
    // renders. We refuse rather than silently grant the reward.
    return { rewarded: false, reason: 'unavailable' };
  }

  return new Promise<AdResult>((resolve) => {
    listener!({
      reward,
      resolve: async (result) => {
        if (result.rewarded) {
          const fresh = await loadAdState();
          await saveAdState({ date: todayBucket(), watched: fresh.watched + 1 });
        }
        resolve(result);
      },
    });
  });
}

/** Useful for "Reset Progress". */
export async function clearAdState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
