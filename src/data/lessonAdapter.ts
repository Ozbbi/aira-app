// Bridges hand-written `SEED_LESSONS` into the runtime shape `LessonScreen`
// expects from the backend. Lets the app run real lesson content without
// requiring the backend to know about every lessonId yet.
//
// Use it when /api/lessons/:id 404s — fall back to a local seed lesson;
// when /api/lessons/check-answer fails or the lesson is local-only, use
// `checkSeedAnswer` to evaluate against the seed's `correctAnswer` field.

import { SEED_LESSONS, SeedLesson } from './seedLessons';
import { CODE_LESSONS } from './codeLessons';
import type { Lesson, Question, AnswerResult } from '../types';

// Single union pool for any local lesson lookup.
const ALL_LOCAL_LESSONS: SeedLesson[] = [...SEED_LESSONS, ...CODE_LESSONS];

/**
 * Map track ids in seed lessons to the topic strings used elsewhere.
 * Kept loose so any new track id is still surfaced as something readable.
 */
function trackToTopic(trackId: SeedLesson['trackId']): string {
  switch (trackId) {
    case 'prompt':   return 'Prompt Craft';
    case 'critical': return 'Critical Thinking';
    case 'power':    return 'Power User Moves';
    case 'tools':    return 'AI Tools Mastery';
    case 'vibe':     return 'Vibe Code';
    case 'create':   return 'Create with AI';
    default:         return 'Foundations';
  }
}

/**
 * Convert a `SeedLesson` into the `Lesson` shape the rest of the UI
 * already understands. Question shapes line up by construction so this
 * is a straight cast plus a couple of derived fields.
 */
export function seedToLesson(seed: SeedLesson): Lesson {
  const description =
    seed.scenes && seed.scenes.length > 0
      ? seed.scenes[0].note
      : seed.realWorldScenario.split('. ').slice(0, 1).join('. ');

  return {
    id: seed.id,
    title: seed.title,
    topic: trackToTopic(seed.trackId),
    difficulty: 1,
    description,
    questions: seed.questions as unknown as Question[],
    airaIntro: seed.airaIntro,
    airaOutro: seed.airaOutro,
    realWorldScenario: seed.realWorldScenario,
    takeaway: seed.takeaway,
  };
}

export function findSeedLesson(lessonId: string): Lesson | null {
  const seed = ALL_LOCAL_LESSONS.find((l) => l.id === lessonId);
  return seed ? seedToLesson(seed) : null;
}

/**
 * Local answer evaluator. Mirrors the backend's check-answer endpoint
 * closely enough that the UI can't tell the difference.
 *
 * Comparison rules:
 *   • multiple_choice / true_false   strict equality
 *   • fill_blank                     case-insensitive trim, plural form
 *                                    of the answer also accepted
 *   • prompt_write                   any non-trivial answer counts as
 *                                    correct (writing is rewarded;
 *                                    feedback teaches)
 *   • ordering                       arrays compared element-by-element
 */
export function checkSeedAnswer(
  lessonId: string,
  questionId: string,
  userAnswer: number | boolean | string | string[]
): AnswerResult {
  const lesson = ALL_LOCAL_LESSONS.find((l) => l.id === lessonId);
  const question = lesson?.questions.find((q) => q.id === questionId);
  if (!lesson || !question) {
    return {
      correct: false,
      correctAnswer: '',
      explanation: 'Question not found.',
      xpEarned: 0,
    };
  }

  const expected = question.correctAnswer;
  let correct = false;

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      correct = userAnswer === expected;
      break;
    case 'fill_blank': {
      const u = String(userAnswer).trim().toLowerCase();
      const e = String(expected).trim().toLowerCase();
      correct = u === e || u === e + 's' || u + 's' === e;
      break;
    }
    case 'prompt_write':
      // Reward any thoughtful attempt (10+ chars). Real grading happens
      // in the explanation + AIRA feedback, not pass/fail.
      correct = String(userAnswer).trim().length >= 10;
      break;
    case 'ordering': {
      const u = Array.isArray(userAnswer) ? (userAnswer as string[]) : [];
      const e = Array.isArray(expected) ? (expected as string[]) : [];
      correct = u.length === e.length && u.every((v, i) => v === e[i]);
      break;
    }
    default:
      correct = false;
  }

  // XP scale matches the backend: 10 for first try correct, 0 otherwise.
  // Real backend gives partial credit on retries — we keep it simple here.
  const xpEarned = correct ? 10 : 0;

  return {
    correct,
    correctAnswer: expected as any,
    explanation: question.explanation,
    xpEarned,
    airaFeedback: correct ? question.airaFeedback.correct : question.airaFeedback.incorrect,
  };
}

export function isSeedLessonId(lessonId: string): boolean {
  return ALL_LOCAL_LESSONS.some((l) => l.id === lessonId);
}

/** Total count of locally-shipped lessons (AI + code). For UI badges. */
export function localLessonCount(): number {
  return ALL_LOCAL_LESSONS.length;
}
