import {
  generateLesson,
  getLessonById,
  getCurriculum,
  checkAnswer,
  saveProgress,
  getUserLimits,
  DailyLimitError,
  NetworkError,
} from '../api/client';
import type { Lesson, AnswerResult, ProgressResult, Curriculum } from '../types';
import type { UserLimits } from '../api/client';

export { DailyLimitError, NetworkError };

export async function fetchLesson(
  userId: string,
  topic?: string,
  lessonId?: string
): Promise<Lesson> {
  if (lessonId) return getLessonById(lessonId, userId);
  return generateLesson(userId, topic);
}

export async function fetchCurriculum(userId: string): Promise<Curriculum> {
  return getCurriculum(userId);
}

export async function submitAnswer(
  userId: string,
  lessonId: string,
  questionId: string,
  userAnswer: number | boolean | string
): Promise<AnswerResult> {
  return checkAnswer(userId, lessonId, questionId, userAnswer);
}

export async function completeLessonProgress(
  userId: string,
  lessonId: string,
  correctCount: number,
  totalCount: number
): Promise<ProgressResult> {
  return saveProgress(userId, lessonId, correctCount, totalCount);
}

export async function fetchUserLimits(userId: string): Promise<UserLimits> {
  return getUserLimits(userId);
}
