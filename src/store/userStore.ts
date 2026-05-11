import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_LIVES = 5;
export const XP_PER_LEVEL = 50;

interface CompletedLesson {
  id: string;
  completedAt: string;
}

interface UserState {
  userId: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  lives: number;
  tier: 'free' | 'pro';
  totalLessonsCompleted: number;
  completedLessonIds: string[];
  lastLessonDate: string | null;
  isOnline: boolean;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
  showMascot: boolean;
  authToken: string | null;
  bookmarks: string[];
  skillScores: {
    clarity: number;
    specificity: number;
    context: number;
    formatting: number;
    iteration: number;
  };
  sandboxSubmissions: number;

  setUser: (data: Partial<UserState>) => void;
  completeLesson: (lessonId: string, xpEarned: number) => void;
  addXp: (amount: number) => void;
  loseLife: () => void;
  earnLife: (count: number) => void;
  updateSkillScore: (skill: keyof UserState['skillScores'], score: number) => void;
  incrementSandbox: () => void;
  toggleBookmark: (id: string) => void;
  syncFromBackend: (data: {
    xp: number;
    level: number;
    streak: number;
    tier: 'free' | 'pro';
    totalLessonsCompleted: number;
  }) => void;
  setAuthToken: (token: string | null) => void;
  resetStore: () => void;
}

function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

const initialState = {
  userId: '',
  name: '',
  email: '',
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lives: MAX_LIVES,
  tier: 'free' as const,
  totalLessonsCompleted: 0,
  completedLessonIds: [] as string[],
  lastLessonDate: null as string | null,
  isOnline: true,
  notificationsEnabled: false,
  soundsEnabled: true,
  hapticsEnabled: true,
  showMascot: true,
  authToken: null as string | null,
  bookmarks: [] as string[],
  skillScores: {
    clarity: 20,
    specificity: 20,
    context: 20,
    formatting: 20,
    iteration: 20,
  },
  sandboxSubmissions: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (data) => set((s) => ({ ...s, ...data })),

      completeLesson: (lessonId, xpEarned) =>
        set((s) => {
          const newXp = s.xp + xpEarned;
          const newLevel = calcLevel(newXp);
          const today = new Date().toDateString();
          const isNewDay = s.lastLessonDate !== today;
          const newStreak = isNewDay ? s.streak + 1 : s.streak;
          const alreadyDone = s.completedLessonIds.includes(lessonId);

          return {
            xp: newXp,
            level: newLevel,
            streak: newStreak,
            bestStreak: Math.max(s.bestStreak, newStreak),
            totalLessonsCompleted: alreadyDone ? s.totalLessonsCompleted : s.totalLessonsCompleted + 1,
            completedLessonIds: alreadyDone ? s.completedLessonIds : [...s.completedLessonIds, lessonId],
            lastLessonDate: today,
          };
        }),

      addXp: (amount) =>
        set((s) => {
          const newXp = s.xp + amount;
          return { xp: newXp, level: calcLevel(newXp) };
        }),

      loseLife: () =>
        set((s) => {
          const next = Math.max(0, s.lives - 1);
          if (next === 0) {
            return { lives: 0, streak: 0 };
          }
          return { lives: next };
        }),

      earnLife: (count) =>
        set((s) => ({ lives: Math.min(MAX_LIVES, s.lives + count) })),

      updateSkillScore: (skill, score) =>
        set((s) => ({
          skillScores: { ...s.skillScores, [skill]: Math.min(100, Math.max(0, score)) },
        })),

      incrementSandbox: () =>
        set((s) => ({ sandboxSubmissions: s.sandboxSubmissions + 1 })),

      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((b) => b !== id)
            : [...s.bookmarks, id],
        })),

      syncFromBackend: (data) =>
        set({
          xp: data.xp,
          level: data.level,
          streak: data.streak,
          tier: data.tier,
          totalLessonsCompleted: data.totalLessonsCompleted,
        }),

      setAuthToken: (token) => set({ authToken: token }),

      resetStore: () => set(initialState),
    }),
    {
      name: 'aira-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        userId: s.userId,
        name: s.name,
        email: s.email,
        xp: s.xp,
        level: s.level,
        streak: s.streak,
        bestStreak: s.bestStreak,
        lives: s.lives,
        tier: s.tier,
        totalLessonsCompleted: s.totalLessonsCompleted,
        completedLessonIds: s.completedLessonIds,
        lastLessonDate: s.lastLessonDate,
        notificationsEnabled: s.notificationsEnabled,
        soundsEnabled: s.soundsEnabled,
        hapticsEnabled: s.hapticsEnabled,
        showMascot: s.showMascot,
        authToken: s.authToken,
        bookmarks: s.bookmarks,
        skillScores: s.skillScores,
        sandboxSubmissions: s.sandboxSubmissions,
      }),
    },
  ),
);
