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
  lessonsCompletedToday: number;
  dailyLimit: number | 'unlimited';
  totalLessonsCompleted: number;
  lastLessonTopic: string | null;
  lastSyncedAt: string | null;
  isOnline: boolean;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  authToken: string | null;

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
    lessonsCompletedToday?: number;
    totalLessonsCompleted: number;
    dailyLimit?: number | 'unlimited';
  }) => void;
  setOnline: (online: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundsEnabled: (enabled: boolean) => void;
  setAuthToken: (token: string | null) => void;
  resetStore: () => void;
}

const initialState = {
  userId: '',
  name: '',
  xp: 0,
  level: 1,
  streak: 0,
  tier: 'free' as const,
  lessonsCompletedToday: 0,
  dailyLimit: 5 as number | 'unlimited',
  totalLessonsCompleted: 0,
  lastLessonTopic: null,
  lastSyncedAt: null,
  isOnline: true,
  notificationsEnabled: false,
  soundsEnabled: true,
  authToken: null,
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

      upgradeTier: () => set({ tier: 'pro', dailyLimit: 'unlimited' }),

      completeLesson: (xpEarned, topic) =>
        set((state) => {
          const newXp = state.xp + xpEarned;
          const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1;
          return {
            xp: newXp,
            level: newLevel,
            lessonsCompletedToday: state.lessonsCompletedToday + 1,
            totalLessonsCompleted: state.totalLessonsCompleted + 1,
            lastLessonTopic: topic,
          };
        }),

      syncFromBackend: (data) =>
        set({
          xp: data.xp,
          level: data.level,
          streak: data.streak,
          tier: data.tier,
          lessonsCompletedToday: data.lessonsCompletedToday ?? 0,
          totalLessonsCompleted: data.totalLessonsCompleted,
          dailyLimit: data.dailyLimit ?? (data.tier === 'pro' ? 'unlimited' : 5),
          lastSyncedAt: new Date().toISOString(),
        }),

      setOnline: (online) => set({ isOnline: online }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setSoundsEnabled: (enabled) => set({ soundsEnabled: enabled }),

      setAuthToken: (token) => set({ authToken: token }),

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
        lessonsCompletedToday: state.lessonsCompletedToday,
        dailyLimit: state.dailyLimit,
        totalLessonsCompleted: state.totalLessonsCompleted,
        lastLessonTopic: state.lastLessonTopic,
        lastSyncedAt: state.lastSyncedAt,
        notificationsEnabled: state.notificationsEnabled,
        soundsEnabled: state.soundsEnabled,
        authToken: state.authToken,
      }),
    }
  )
);
