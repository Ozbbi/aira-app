import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { haptics } from '../utils/haptics';
import { sounds } from '../utils/sounds';
import { ScreenContainer } from '../components/ScreenContainer';
import { GradientButton } from '../components/GradientButton';
import { AiraOrb } from '../components/AiraOrb';
import { AiraMessage } from '../components/AiraMessage';
import { FeedbackOverlay } from '../components/FeedbackOverlay';
import { LessonComplete } from '../components/LessonComplete';
import { MultipleChoiceQuestion } from '../components/questions/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '../components/questions/TrueFalseQuestion';
import { FillBlankQuestion } from '../components/questions/FillBlankQuestion';
import { PromptWriteQuestion } from '../components/questions/PromptWriteQuestion';
import { useUserStore } from '../store/userStore';
import {
  fetchLesson,
  submitAnswer,
  completeLessonProgress,
  DailyLimitError,
  NetworkError,
} from '../services/lessonService';
import { handleLessonCompletedForReminder } from '../services/notifications';
import { colors, typography, spacing, radius } from '../theme';
import type { RootStackParamList, Lesson, Question, AnswerResult } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
  route: RouteProp<RootStackParamList, 'Lesson'>;
}

type Phase = 'loading' | 'intro' | 'question' | 'feedback' | 'complete' | 'error' | 'daily_limit';

export function LessonScreen({ navigation, route }: Props) {
  const userId = useUserStore((s) => s.userId);
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);

  const [phase, setPhase] = useState<Phase>('loading');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);

  // Answer state
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [tfSelected, setTfSelected] = useState<boolean | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [promptValue, setPromptValue] = useState('');

  // Feedback state
  const [feedbackData, setFeedbackData] = useState<AnswerResult | null>(null);
  const [checking, setChecking] = useState(false);

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as `${number}%`,
  }));

  // Wrong-answer shake
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 80 }), 4, true),
      withTiming(0, { duration: 50 })
    );
  };

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    setPhase('loading');
    setErrorMsg('');
    try {
      const topic = route.params?.topic;
      const lessonId = route.params?.lessonId;
      const data = await fetchLesson(userId, topic, lessonId);
      setLesson(data);
      setPhase('intro');
    } catch (err) {
      if (err instanceof DailyLimitError) {
        setPhase('daily_limit');
      } else {
        setErrorMsg(
          err instanceof NetworkError
            ? "I can't reach the server right now. Check your connection and try again."
            : 'Something went wrong loading the lesson.'
        );
        setPhase('error');
      }
    }
  };

  useEffect(() => {
    if (lesson && phase === 'question') {
      progressWidth.value = withTiming(
        (questionIndex / lesson.questions.length) * 100,
        { duration: 400 }
      );
    }
  }, [questionIndex, lesson, phase]);

  const currentQuestion: Question | null = lesson?.questions[questionIndex] ?? null;

  const hasAnswer = (): boolean => {
    if (!currentQuestion) return false;
    switch (currentQuestion.type) {
      case 'multiple_choice': return mcSelected !== null;
      case 'true_false': return tfSelected !== null;
      case 'fill_blank': return fillValue.trim().length > 0;
      case 'prompt_write': return promptValue.trim().length > 10;
      default: return false;
    }
  };

  const getUserAnswer = (): number | boolean | string => {
    if (!currentQuestion) return '';
    switch (currentQuestion.type) {
      case 'multiple_choice': return mcSelected ?? 0;
      case 'true_false': return tfSelected ?? false;
      case 'fill_blank': return fillValue.trim();
      case 'prompt_write': return promptValue.trim();
      default: return '';
    }
  };

  // Local fallback for when backend is down
  const checkLocally = (q: Question, answer: number | boolean | string): AnswerResult => {
    let correct = false;
    if (q.type === 'multiple_choice') correct = answer === q.correctAnswer;
    else if (q.type === 'true_false') correct = answer === q.correctAnswer;
    else if (q.type === 'fill_blank') correct = String(answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
    else if (q.type === 'prompt_write' && Array.isArray(q.correctAnswer)) {
      const a = String(answer).toLowerCase();
      correct = q.correctAnswer.every((kw) => a.includes(kw.toLowerCase()));
    }
    const fb = q.airaFeedback ? (correct ? q.airaFeedback.correct : q.airaFeedback.incorrect) : null;
    return { correct, correctAnswer: q.correctAnswer, explanation: q.explanation, xpEarned: correct ? 10 : 0, airaFeedback: fb ?? undefined };
  };

  const handleCheck = async () => {
    if (!lesson || !currentQuestion || checking) return;
    setChecking(true);
    haptics.medium();

    const answer = getUserAnswer();
    let result: AnswerResult;

    try {
      result = await submitAnswer(userId, lesson.id, currentQuestion.id, answer);
    } catch {
      result = checkLocally(currentQuestion, answer);
    }

    if (result.correct) {
      setCorrectCount((c) => c + 1);
      haptics.success();
      sounds.correct();
    } else {
      haptics.error();
      sounds.wrong();
      triggerShake();
    }

    setTotalXpEarned((x) => x + result.xpEarned);
    setFeedbackData(result);
    setPhase('feedback');
    setChecking(false);
  };

  const handleContinueAfterFeedback = () => {
    setFeedbackData(null);
    if (lesson && questionIndex < lesson.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      resetAnswerState();
      setPhase('question');
    } else {
      handleLessonComplete();
    }
  };

  const handleLessonComplete = async () => {
    if (!lesson) return;
    // Save progress to backend
    try {
      const prevLevel = useUserStore.getState().level;
      const result = await completeLessonProgress(userId, lesson.id, correctCount, lesson.questions.length);
      if (result.newLevel > prevLevel) {
        setLeveledUp(true);
        setNewLevel(result.newLevel);
        haptics.heavy();
        sounds.levelup();
      }
      syncFromBackend({
        xp: result.newTotalXp,
        level: result.newLevel,
        streak: result.streak,
        tier: useUserStore.getState().tier,
        totalLessonsCompleted: useUserStore.getState().totalLessonsCompleted + 1,
        lessonsCompletedToday: useUserStore.getState().lessonsCompletedToday + 1,
      });
    } catch {
      // Offline — update locally
      useUserStore.getState().completeLesson(totalXpEarned, lesson.topic);
    }
    // Streak is safe for today — push tomorrow's reminder out by a day.
    // Fire-and-forget; don't block the UI if it errors.
    handleLessonCompletedForReminder(
      useUserStore.getState().notificationsEnabled
    ).catch(() => {});
    setPhase('complete');
  };

  const resetAnswerState = () => {
    setMcSelected(null);
    setTfSelected(null);
    setFillValue('');
    setPromptValue('');
  };

  // --- LOADING ---
  if (phase === 'loading') {
    return (
      <ScreenContainer>
        <View style={styles.centerFull}>
          <AiraOrb size={80} intensity="thinking" />
          <AiraMessage message="Finding the right lesson for you..." typewriter />
        </View>
      </ScreenContainer>
    );
  }

  // --- ERROR ---
  if (phase === 'error') {
    return (
      <ScreenContainer>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>{'\u2715'}</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.centerFull}>
          <AiraOrb size={80} intensity="calm" />
          <AiraMessage message={errorMsg} />
          <GradientButton title="Try Again" onPress={loadLesson} fullWidth />
          <Pressable onPress={() => navigation.goBack()} style={styles.laterBtn}>
            <Text style={styles.laterText}>Go back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // --- DAILY LIMIT ---
  if (phase === 'daily_limit') {
    return (
      <ScreenContainer>
        <View style={styles.centerFull}>
          <AiraOrb size={80} intensity="calm" />
          <AiraMessage
            message="You've hit today's 5-lesson limit. That's already great work. Come back tomorrow — or unlock unlimited with Pro."
            typewriter
          />
          <GradientButton
            title="Unlock Pro"
            onPress={() => navigation.replace('Paywall')}
            fullWidth
          />
          <Pressable onPress={() => navigation.goBack()} style={styles.laterBtn}>
            <Text style={styles.laterText}>Come back tomorrow</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // --- INTRO ---
  if (phase === 'intro' && lesson) {
    return (
      <ScreenContainer scroll>
        <View style={styles.topBar}>
          <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.closeBtn}>
            <Text style={styles.closeText}>{'\u2715'}</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.introContainer}>
          <AiraOrb size={80} intensity="calm" />
          <Text style={styles.introTitle}>{lesson.title}</Text>
          {lesson.realWorldScenario && (
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioLabel}>Real scenario</Text>
              <Text style={styles.scenarioText}>{lesson.realWorldScenario}</Text>
            </View>
          )}
          <View style={styles.introMessage}>
            <AiraMessage message={lesson.airaIntro ?? lesson.description} typewriter />
          </View>
          <GradientButton title="Let's Go" onPress={() => setPhase('question')} fullWidth />
        </View>
      </ScreenContainer>
    );
  }

  // --- COMPLETE ---
  if (phase === 'complete' && lesson) {
    return (
      <LessonComplete
        correctCount={correctCount}
        totalCount={lesson.questions.length}
        xpEarned={totalXpEarned}
        airaOutro={lesson.airaOutro ?? 'Great work. Keep going.'}
        lessonTitle={lesson.title}
        onFinish={() => navigation.goBack()}
        leveledUp={leveledUp}
        newLevel={newLevel}
      />
    );
  }

  // --- QUESTION / FEEDBACK ---
  if (!lesson || !currentQuestion) return null;

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.closeBtn}>
          <Text style={styles.closeText}>{'\u2715'}</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrap, progressStyle]}>
            <LinearGradient colors={[...colors.gradientPrimary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFillGradient} />
          </Animated.View>
        </View>
        <Text style={styles.progressLabel}>{questionIndex + 1}/{lesson.questions.length}</Text>
      </View>

      <Animated.View
        style={[styles.content, shakeStyle]}
        key={questionIndex}
        entering={FadeIn.duration(280)}
      >
        {currentQuestion.type === 'multiple_choice' && (
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options ?? []}
            selected={mcSelected}
            onSelect={setMcSelected}
            disabled={phase === 'feedback'}
            correctAnswer={feedbackData ? (currentQuestion.correctAnswer as number) : undefined}
            showResult={phase === 'feedback'}
          />
        )}
        {currentQuestion.type === 'true_false' && (
          <TrueFalseQuestion
            question={currentQuestion.question}
            selected={tfSelected}
            onSelect={setTfSelected}
            disabled={phase === 'feedback'}
            correctAnswer={feedbackData ? (currentQuestion.correctAnswer as boolean) : undefined}
            showResult={phase === 'feedback'}
          />
        )}
        {currentQuestion.type === 'fill_blank' && (
          <FillBlankQuestion
            question={currentQuestion.question}
            value={fillValue}
            onChange={setFillValue}
            disabled={phase === 'feedback'}
            correctAnswer={feedbackData ? String(currentQuestion.correctAnswer) : undefined}
            showResult={phase === 'feedback'}
          />
        )}
        {currentQuestion.type === 'prompt_write' && (
          <PromptWriteQuestion
            question={currentQuestion.question}
            value={promptValue}
            onChange={setPromptValue}
            disabled={phase === 'feedback'}
            keywords={feedbackData && Array.isArray(currentQuestion.correctAnswer) ? (currentQuestion.correctAnswer as string[]) : undefined}
            showResult={phase === 'feedback'}
            isCorrect={feedbackData?.correct ?? false}
          />
        )}
      </Animated.View>

      {phase === 'question' && (
        <View style={styles.footer}>
          <GradientButton
            title={checking ? 'Checking...' : 'Check'}
            onPress={handleCheck}
            disabled={!hasAnswer() || checking}
            fullWidth
          />
        </View>
      )}

      {phase === 'feedback' && feedbackData && (
        <FeedbackOverlay
          correct={feedbackData.correct}
          explanation={feedbackData.explanation}
          airaFeedback={feedbackData.airaFeedback ?? null}
          xpEarned={feedbackData.xpEarned}
          onContinue={handleContinueAfterFeedback}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFillWrap: {
    height: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFillGradient: {
    flex: 1,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'right',
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  introTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scenarioCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  scenarioLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  scenarioText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  introMessage: {
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  laterText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
