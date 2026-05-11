import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_LIVES = 5;
export const XP_PER_LEVEL = 50;

interface CompletedLesson {
  id: string;
  completedAt: string;
}

/**
 * Sandbox submission entry — captures the full multi-judge breakdown
 * so Profile > History can replay it.
 */
export interface SandboxEntry {
  id: string;
  timestamp: string;
  lessonId?: string;
  prompt: string;
  scores: {
    clarity: number;
    specificity: number;
    audience: number;
    format: number;
  };
  overallStars: number;
  /** Free-form Q&A as the user taps "Ask Why?" chips. */
  followUps: { question: string; answer: string }[];
}

// Flashcard system — the rich schema lives in src/data/flashcards.ts.
// Re-exporting here keeps store consumers from importing two modules.
import type {
  Flashcard,
  FlashcardDeck,
  RecallRating,
} from '../data/flashcards';
import {
  updateCard,
  mergeLessonIntoDeckSet,
  FREE_DECK_LIMIT,
  totalDueAcrossDecks,
} from '../data/flashcards';
import type { SeedLesson } from '../data/seedLessons';
export type { Flashcard, FlashcardDeck, RecallRating };

/**
 * Placeholder shapes for OTHER Phase-2 features (not flashcards —
 * flashcards are now real). Kept so screens can read/write without
 * forcing a schema migration when those features ship.
 */
export interface ImportedContent {
  id: string;
  source: 'url' | 'pdf' | 'youtube' | 'image' | 'text';
  rawText?: string;
  importedAt: string;
  summary?: string;
}
export interface PodcastRecap {
  id: string;
  lessonId: string;
  scriptText: string;
  audioUri?: string; // populated when audio gets generated
  createdAt: string;
}
export interface MockExamRecord {
  id: string;
  trackId: string;
  takenAt: string;
  score: number;
  durationSec: number;
}
export interface LeagueData {
  leagueTier: 'bronze' | 'silver' | 'gold' | 'sapphire' | 'ruby' | 'diamond';
  weeklyXp: number;
  rank: number;
  cohortIds: string[];
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
  /** Persisted sandbox submissions for Profile > History. */
  sandboxHistory: SandboxEntry[];

  // ── Phase-2 feature scaffolding ──
  // These start empty / null and are populated when their features ship.
  // Adding them now avoids a store migration when Phase 2 lands.
  flashcardDecks: FlashcardDeck[];
  importedContent: ImportedContent[];
  podcastRecaps: PodcastRecap[];
  mockExams: MockExamRecord[];
  leagueData: LeagueData | null;

  setUser: (data: Partial<UserState>) => void;
  completeLesson: (lessonId: string, xpEarned: number) => void;
  addXp: (amount: number) => void;
  loseLife: () => void;
  earnLife: (count: number) => void;
  updateSkillScore: (skill: keyof UserState['skillScores'], score: number) => void;
  incrementSandbox: () => void;
  addSandboxEntry: (entry: SandboxEntry) => void;
  toggleBookmark: (id: string) => void;

  // ── Flashcard actions (real, not scaffolded) ──
  /**
   * Create or merge cards for the given seed lesson into a deck keyed
   * by trackId. Returns { deckId, addedCount, blockedByPaywall }.
   * Free tier: max 3 decks; attempting to create a 4th sets
   * blockedByPaywall=true (screen should navigate to Paywall).
   */
  createFlashcardsForLesson: (
    lesson: SeedLesson,
    trackName: string,
  ) => { deckId: string | null; addedCount: number; blockedByPaywall: boolean };
  reviewFlashcard: (deckId: string, cardId: string, rating: RecallRating) => void;
  deleteFlashcardDeck: (deckId: string) => void;
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
  sandboxHistory: [] as SandboxEntry[],

  // Phase-2 scaffolding: empty until those features ship.
  flashcardDecks: [] as FlashcardDeck[],
  importedContent: [] as ImportedContent[],
  podcastRecaps: [] as PodcastRecap[],
  mockExams: [] as MockExamRecord[],
  leagueData: null as LeagueData | null,
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

      addSandboxEntry: (entry) =>
        set((s) => ({
          // Cap at 50 most-recent entries so persisted state doesn't bloat.
          sandboxHistory: [entry, ...s.sandboxHistory].slice(0, 50),
        })),

      // ── Flashcards ──────────────────────────────────────────────
      createFlashcardsForLesson: (lesson, trackName) => {
        const state = get();
        const hasTrackDeck = state.flashcardDecks.some((d) => d.trackId === lesson.trackId);
        const wouldCreateNew = !hasTrackDeck;
        const atLimit = state.flashcardDecks.length >= FREE_DECK_LIMIT;

        // Pro is unlimited. Free hits paywall only when minting a NEW deck
        // at the cap. Merging into an existing deck always allowed.
        if (wouldCreateNew && atLimit && state.tier !== 'pro') {
          return { deckId: null, addedCount: 0, blockedByPaywall: true };
        }

        const { decks, deckId, addedCount } = mergeLessonIntoDeckSet(
          state.flashcardDecks,
          lesson,
          trackName,
        );
        set({ flashcardDecks: decks });
        return { deckId, addedCount, blockedByPaywall: false };
      },

      reviewFlashcard: (deckId, cardId, rating) =>
        set((s) => ({
          flashcardDecks: s.flashcardDecks.map((d) => {
            if (d.id !== deckId) return d;
            const cards = d.cards.map((c) => (c.id === cardId ? updateCard(c, rating) : c));
            return { ...d, cards };
          }),
        })),

      deleteFlashcardDeck: (deckId) =>
        set((s) => ({
          flashcardDecks: s.flashcardDecks.filter((d) => d.id !== deckId),
        })),

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
        sandboxHistory: s.sandboxHistory,
        // Phase-2 fields persisted now to avoid migration later.
        flashcardDecks: s.flashcardDecks,
        importedContent: s.importedContent,
        podcastRecaps: s.podcastRecaps,
        mockExams: s.mockExams,
        leagueData: s.leagueData,
      }),
    },
  ),
);
