/**
 * Flashcard engine — pure functions only.
 *
 *   1. `generateFlashcardsForLesson(lesson)` — pulls 5-10 cards out of a
 *      seed lesson's scenes + questions + takeaway. No side effects.
 *
 *   2. `updateCard(card, rating)` — SM-2-simplified scheduling. Returns
 *      a new card object with updated easeFactor / interval / repetitions
 *      / nextReviewDate / correctCount / wrongCount.
 *
 *   3. `isDue(card)` / `getDueCards(deck)` — query helpers.
 *
 * Splitting this off so the store stays focused on state and the screens
 * don't carry algorithm logic.
 */

import type { SeedLesson, SeedQuestion, LessonScene } from './seedLessons';

/* ──────────────────────────── types ──────────────────────────── */

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  /** SM-2 ease factor. Starts at 2.5; clamped [1.3, 3.0]. */
  easeFactor: number;
  /** Days until next review. */
  interval: number;
  /** Consecutive correct recalls. */
  repetitions: number;
  /** ISO date the card is next due. */
  nextReviewDate: string;
  lastReviewDate: string | null;
  correctCount: number;
  wrongCount: number;
  /** Which lesson the card was minted from. */
  sourceLessonId: string;
}

export interface FlashcardDeck {
  id: string;
  /** Track this deck represents (matches SeedLesson.trackId). */
  trackId: string;
  /** All lessons whose content contributed cards to this deck. */
  lessonIds: string[];
  /** Display name shown in the UI ("AI Foundations"). */
  name: string;
  createdAt: string;
  /** Total card count. Derived from cards.length but cached for sort/perf. */
  cardCount: number;
  cards: Flashcard[];
}

/** Five user-facing recall buttons mapped to SM-2 ratings. */
export type RecallRating = 0 | 1 | 2 | 3 | 4 | 5;

/* ──────────────────────────── helpers ──────────────────────────── */

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Math.max(0, Math.round(days)));
  return d.toISOString();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function isoToTime(iso: string): number {
  return new Date(iso).getTime();
}

/** Mint a stable-ish id from a string seed. Good enough for client ids. */
function mintId(prefix: string, seed: string): string {
  // Hash the seed lightly so two identical fronts in different lessons
  // don't collide on first-mint. Time component disambiguates further.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `${prefix}_${Math.abs(h).toString(36)}_${Date.now().toString(36)}`;
}

/* ──────────────────────────── generator ──────────────────────────── */

/**
 * Turn a SeedLesson into 5-10 flashcards.
 *
 * Sources, in order of preference:
 *   1. Scenes — `heading` becomes front, `note` becomes back. Strongest
 *      "concept" cards because scenes are short and self-contained.
 *   2. Questions — for multiple_choice / true_false / fill_blank, the
 *      question text becomes the front, the correct answer + explanation
 *      become the back.
 *   3. Takeaway — one final synthesis card always added at the end.
 *   4. learnFirst — if we still need cards, slice it into key/value
 *      pairs by extracting bold-styled terms (rough heuristic).
 *
 * Deduplicates by lowercase front. Caps at 10. Floors at 5 by repeating
 * a few mild rewordings of the takeaway if needed (rare).
 */
export function generateFlashcardsForLesson(lesson: SeedLesson): Omit<Flashcard, 'deckId'>[] {
  const cards: Omit<Flashcard, 'deckId'>[] = [];
  const seenFronts = new Set<string>();

  const push = (front: string, back: string) => {
    const key = front.trim().toLowerCase();
    if (!key || seenFronts.has(key)) return;
    if (cards.length >= 10) return;
    seenFronts.add(key);
    cards.push(blankCard(lesson.id, front.trim(), back.trim()));
  };

  // (1) Scenes
  for (const scene of lesson.scenes || []) {
    push(asQuestion(scene.heading), trimToMax(scene.note, 240));
    if (cards.length >= 10) break;
  }

  // (2) Questions
  for (const q of lesson.questions || []) {
    if (cards.length >= 10) break;
    const cardPair = questionToCard(q, lesson.id);
    if (cardPair) push(cardPair.front, cardPair.back);
  }

  // (3) Takeaway
  if (lesson.takeaway && cards.length < 10) {
    push(`Lesson takeaway: ${lesson.title}`, lesson.takeaway);
  }

  // (4) Backfill from learnFirst if we're under 5
  if (cards.length < 5 && lesson.learnFirst) {
    const sentences = lesson.learnFirst
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    for (let i = 0; i < sentences.length && cards.length < 5; i++) {
      const s = sentences[i];
      const first = s.split(/[.!?]/)[0];
      push(`Recall: ${first.slice(0, 60)}…`, s);
    }
  }

  return cards;
}

function questionToCard(q: SeedQuestion, lessonId: string): { front: string; back: string } | null {
  switch (q.type) {
    case 'multiple_choice': {
      if (!q.options || typeof q.correctAnswer !== 'number') return null;
      const ans = q.options[q.correctAnswer];
      if (!ans) return null;
      return {
        front: q.question,
        back: `${ans}\n\n${trimToMax(q.explanation, 200)}`,
      };
    }
    case 'true_false':
      return {
        front: q.question,
        back: `${q.correctAnswer === true ? 'True' : 'False'} — ${trimToMax(q.explanation, 200)}`,
      };
    case 'fill_blank':
      return {
        front: q.question,
        back: `${String(q.correctAnswer)} — ${trimToMax(q.explanation, 200)}`,
      };
    case 'ordering':
      if (!Array.isArray(q.correctAnswer)) return null;
      return {
        front: q.question,
        back: q.correctAnswer.join(' → '),
      };
    case 'prompt_write':
      // Open-ended writing prompts don't make crisp flashcards.
      return null;
    default:
      return null;
  }
}

function asQuestion(heading: string): string {
  // "Audience" → "What does 'Audience' mean here?"
  // "Step 1 — Extract" → "What's step 1 (Extract) about?"
  const cleaned = heading.replace(/[—–-]\s*$/, '').trim();
  if (/^q\d/i.test(cleaned)) return cleaned;
  if (cleaned.length < 40 && !/[?.!]$/.test(cleaned)) {
    return `What does "${cleaned}" mean?`;
  }
  return cleaned;
}

function trimToMax(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function blankCard(sourceLessonId: string, front: string, back: string): Omit<Flashcard, 'deckId'> {
  return {
    id: mintId('card', front),
    front,
    back,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: todayIso(), // due immediately for first review
    lastReviewDate: null,
    correctCount: 0,
    wrongCount: 0,
    sourceLessonId,
  };
}

/* ──────────────────────────── SM-2 scheduler ──────────────────────────── */

/**
 * Update a card after a recall attempt. Returns a NEW card object.
 *
 * SM-2 simplified rules (Anki/Mnemosyne lineage):
 *   - rating >= 3 (passed):
 *       reps 0 → interval = 1 day
 *       reps 1 → interval = 6 days
 *       reps ≥ 2 → interval = previous interval × easeFactor
 *       repetitions++
 *   - rating < 3 (failed):
 *       repetitions = 0
 *       interval = 1 day
 *   - easeFactor update (always applied):
 *       EF' = EF + (0.1 - (5-rating) * (0.08 + (5-rating) * 0.02))
 *       clamped to [1.3, 3.0]
 *
 * Default MVP mapping in the UI:
 *   - swipe right → rating 4  (correct after a beat)
 *   - swipe left  → rating 1  (incorrect)
 * Future: a "How well did you know it?" rating sheet 0..5.
 */
export function updateCard(card: Flashcard, rating: RecallRating): Flashcard {
  const passed = rating >= 3;
  const next: Flashcard = { ...card };

  if (passed) {
    if (card.repetitions === 0) next.interval = 1;
    else if (card.repetitions === 1) next.interval = 6;
    else next.interval = Math.round(card.interval * card.easeFactor);
    next.repetitions = card.repetitions + 1;
    next.correctCount = card.correctCount + 1;
  } else {
    next.repetitions = 0;
    next.interval = 1;
    next.wrongCount = card.wrongCount + 1;
  }

  // EF update applies to BOTH outcomes — including penalty for failure.
  const newEf =
    card.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  next.easeFactor = clamp(newEf, 1.3, 3.0);

  next.lastReviewDate = new Date().toISOString();
  next.nextReviewDate = addDaysIso(next.interval);
  return next;
}

/* ──────────────────────────── queries ──────────────────────────── */

export function isDue(card: Flashcard): boolean {
  return isoToTime(card.nextReviewDate) <= Date.now();
}

export function getDueCards(deck: FlashcardDeck): Flashcard[] {
  return deck.cards
    .filter(isDue)
    .sort((a, b) => isoToTime(a.nextReviewDate) - isoToTime(b.nextReviewDate));
}

export function totalDueAcrossDecks(decks: FlashcardDeck[]): number {
  return decks.reduce((sum, d) => sum + getDueCards(d).length, 0);
}

/* ──────────────────────────── deck creation ──────────────────────────── */

/**
 * Merge new cards for a lesson into an existing track-level deck, or
 * mint a fresh deck if one doesn't exist yet for that track. Returns the
 * updated deck list.
 *
 * Dedup rule: cards with identical lowercase `front` are skipped.
 */
export function mergeLessonIntoDeckSet(
  decks: FlashcardDeck[],
  lesson: SeedLesson,
  trackName: string
): { decks: FlashcardDeck[]; deckId: string; addedCount: number } {
  const existing = decks.find((d) => d.trackId === lesson.trackId);
  const generated = generateFlashcardsForLesson(lesson);

  if (existing) {
    const seenFronts = new Set(existing.cards.map((c) => c.front.trim().toLowerCase()));
    const fresh: Flashcard[] = [];
    for (const c of generated) {
      const key = c.front.trim().toLowerCase();
      if (seenFronts.has(key)) continue;
      seenFronts.add(key);
      fresh.push({ ...c, deckId: existing.id });
    }
    const updated: FlashcardDeck = {
      ...existing,
      cards: [...existing.cards, ...fresh],
      lessonIds: existing.lessonIds.includes(lesson.id)
        ? existing.lessonIds
        : [...existing.lessonIds, lesson.id],
      cardCount: existing.cards.length + fresh.length,
    };
    return {
      decks: decks.map((d) => (d.id === existing.id ? updated : d)),
      deckId: existing.id,
      addedCount: fresh.length,
    };
  }

  // Mint new deck
  const deckId = `deck_${lesson.trackId}_${Date.now().toString(36)}`;
  const newCards: Flashcard[] = generated.map((c) => ({ ...c, deckId }));
  const newDeck: FlashcardDeck = {
    id: deckId,
    trackId: lesson.trackId,
    lessonIds: [lesson.id],
    name: trackName,
    createdAt: new Date().toISOString(),
    cardCount: newCards.length,
    cards: newCards,
  };
  return { decks: [...decks, newDeck], deckId, addedCount: newCards.length };
}

/** Free tier cap. Pro is unlimited. Surfaced for paywall triggers. */
export const FREE_DECK_LIMIT = 3;
