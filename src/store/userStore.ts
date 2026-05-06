import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  // Data
  userId: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  tier: 'free' | 'pro';
  totalLessonsCompleted: number;
  lastLessonTopic: string | null;
  lastSyncedAt: string | null;
  isOnline: boolean;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  authToken: string | null;

  /**
   * Lives / hearts. Players start with 5. They lose one on a wrong
   * lesson question. Hearts refill 1 every HEART_REFILL_MINUTES — we
   * persist the timestamp of the last empty so refill works across
   * cold starts without a server.
   */
  hearts: number;
  heartsLastEmptiedAt: string | null;

  /** Bookmarked Learn items (insight/pattern/mistake/quickwin ids). */
  bookmarks: string[];

  // Actions
  setUser: (data: Partial<UserState>) => void;
  addXp: (amount: number) => void;
  incrementStreak: () => void;
  upgradeTier: () => void;
  completeLesson: (xpEarned: number, topic: string) => void;
  syncFromBackend: (data: {
    xp: number;
    level: number;
    streak: number;
    tier: 'free' | 'pro';
    totalLessonsCompleted: number;
  }) => void;
  setOnline: (online: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundsEnabled: (enabled: boolean) => void;
  setAuthToken: (token: string | null) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  toggleBookmark: (id: string) => void;
  resetStore: () => void;
}

export const MAX_HEARTS = 5;
export const HEART_REFILL_MINUTES = 30;

const initialState = {
  userId: '',
  name: '',
  xp: 0,
  level: 1,
  streak: 0,
  // AIRA shipped as a single product with everything unlocked. The 'tier'
  // field is kept for backend compatibility but is always 'pro' on device.
  tier: 'pro' as const,
  totalLessonsCompleted: 0,
  lastLessonTopic: null,
  lastSyncedAt: null,
  isOnline: true,
  notificationsEnabled: false,
  soundsEnabled: true,
  authToken: null,
  hearts: MAX_HEARTS,
  heartsLastEmptiedAt: null,
  bookmarks: [] as string[],
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (data) => set((state) => ({ ...state, ...data })),

      addXp: (amount) =>
        set((state) => {
          const newXp = state.xp + amount;
          const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1;
          return { xp: newXp, level: newLevel };
        }),

      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),

      upgradeTier: () => set({ tier: 'pro' }),

      completeLesson: (xpEarned, topic) =>
        set((state) => {
          const newXp = state.xp + xpEarned;
          const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1;
          return {
            xp: newXp,
            level: newLevel,
            totalLessonsCompleted: state.totalLessonsCompleted + 1,
            lastLessonTopic: topic,
          };
        }),

      syncFromBackend: (data) =>
        set({
          xp: data.xp,
          level: data.level,
          streak: data.streak,
          // Force 'pro' regardless of backend value — paywall is removed.
          tier: 'pro',
          totalLessonsCompleted: data.totalLessonsCompleted,
          lastSyncedAt: new Date().toISOString(),
        }),

      setOnline: (online) => set({ isOnline: online }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setSoundsEnabled: (enabled) => set({ soundsEnabled: enabled }),

      setAuthToken: (token) => set({ authToken: token }),

      // -------------------- Hearts --------------------
      loseHeart: () =>
        set((state) => {
          const next = Math.max(0, state.hearts - 1);
          return {
            hearts: next,
            heartsLastEmptiedAt:
              next === 0 && !state.heartsLastEmptiedAt
                ? new Date().toISOString()
                : state.heartsLastEmptiedAt,
          };
        }),

      refillHearts: () =>
        set((state) => {
          if (state.hearts >= MAX_HEARTS) return {};
          if (!state.heartsLastEmptiedAt) {
            return { hearts: MAX_HEARTS, heartsLastEmptiedAt: null };
          }
          const elapsedMin =
            (Date.now() - new Date(state.heartsLastEmptiedAt).getTime()) / 60000;
          const refilled = Math.floor(elapsedMin / HEART_REFILL_MINUTES);
          if (refilled <= 0) return {};
          const next = Math.min(MAX_HEARTS, state.hearts + refilled);
          return {
            hearts: next,
            heartsLastEmptiedAt:
              next >= MAX_HEARTS ? null : state.heartsLastEmptiedAt,
          };
        }),

      // -------------------- Bookmarks --------------------
      toggleBookmark: (id) =>
        set((state) => {
          const has = state.bookmarks.includes(id);
          return {
            bookmarks: has
              ? state.bookmarks.filter((b) => b !== id)
              : [...state.bookmarks, id],
          };
        }),

      resetStore: () => set(initialState),
    }),
    {
      name: 'aira-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        name: state.name,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        tier: state.tier,
        totalLessonsCompleted: state.totalLessonsCompleted,
        lastLessonTopic: state.lastLessonTopic,
        lastSyncedAt: state.lastSyncedAt,
        notificationsEnabled: state.notificationsEnabled,
        soundsEnabled: state.soundsEnabled,
        authToken: state.authToken,
        hearts: state.hearts,
        heartsLastEmptiedAt: state.heartsLastEmptiedAt,
        bookmarks: state.bookmarks,
      }),
    }
  )
);
