// Day-of-year deterministic rotation. Same content for the same day;
// fresh tomorrow. Use `dailyPick(items)` for "today's pick from this pool"
// or `dailyShuffle(items, key)` for a deterministic per-day shuffle so
// the order changes daily without going random.

function dayOfYear(d: Date = new Date()): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  // Use UTC so devices in different timezones at midnight don't disagree.
  return Math.floor((d.getTime() - start) / 86_400_000);
}

/** Pick exactly one item from the pool, deterministic for the current day. */
export function dailyPick<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('dailyPick: empty pool');
  return items[dayOfYear() % items.length];
}

/**
 * Mulberry32 PRNG seeded from a numeric seed. Tiny, fast, deterministic.
 * Returns numbers in [0, 1).
 */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  // 32-bit FNV-1a — good enough as a seed source.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Fisher-Yates shuffle seeded by `seed` (any string). Returns a new array.
 * Combine with `dayOfYear()` for a daily-rotating shuffle, or with the
 * userId for per-user shuffles that stay stable across launches.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rng = mulberry32(hashString(seed));
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick `n` distinct items from the pool, deterministic for today.
 * Useful for "today's 3 quick wins" / "today's 2 patterns".
 */
export function dailyTopN<T>(items: readonly T[], n: number, salt = ''): T[] {
  const seed = `${dayOfYear()}-${salt}`;
  return seededShuffle(items, seed).slice(0, Math.min(n, items.length));
}

/**
 * For a known user, return a per-user-stable shuffle.
 * Two users see different orders; the same user always sees the same.
 */
export function userShuffle<T>(items: readonly T[], userId: string): T[] {
  return seededShuffle(items, userId || 'guest');
}

/**
 * Per-user-AND-per-day shuffle — the order rotates daily AND is unique
 * per user. Use this for the lessons feed so each user's "today" feels
 * different from their yesterday AND from every other user.
 */
export function userDailyShuffle<T>(items: readonly T[], userId: string): T[] {
  return seededShuffle(items, `${userId || 'guest'}-${dayOfYear()}`);
}

/** Hours remaining until the next daily roll-over (UTC). */
export function hoursUntilTomorrow(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return Math.max(0, Math.round((tomorrow.getTime() - now.getTime()) / 3_600_000));
}
