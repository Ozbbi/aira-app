export interface User {
  userId: string;
  name: string;
  email?: string;
  xp: number;
  level: number;
  streak: number;
  tier: 'free' | 'pro';
  lessonsCompletedToday: number;
  totalLessonsCompleted: number;
  accuracyHistory: number[];
  lastActiveDate: string | null;
  createdAt: string;
}

export interface AiraFeedback {
  correct: string;
  incorrect: string;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'prompt_write';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string | string[];
  explanation: string;
  airaFeedback?: AiraFeedback;
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  difficulty: number;
  description: string;
  questions: Question[];
  airaIntro?: string;
  airaOutro?: string;
  realWorldScenario?: string;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: number | boolean | string | string[];
  explanation: string;
  xpEarned: number;
  airaFeedback?: string;
}

export interface ProgressResult {
  xpEarned: number;
  newTotalXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  streak: number;
}

export interface UserProgress {
  xp: number;
  level: number;
  xpForNextLevel: number;
  streak: number;
  totalLessonsCompleted: number;
  averageAccuracy: number;
  tier: 'free' | 'pro';
}

export type LessonStatus = 'locked' | 'unlocked' | 'completed';

export interface CurriculumLesson {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  questionCount: number;
  status: LessonStatus;
}

export interface CurriculumTopic {
  name: string;
  lessons: CurriculumLesson[];
  completedCount: number;
  totalCount: number;
}

export interface Curriculum {
  topics: CurriculumTopic[];
}

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: { name?: string };
  MainTabs: undefined;
  Topic: { topicName: string };
  Lesson: { lessonId?: string; topic?: string };
  Paywall: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Profile: undefined;
};
