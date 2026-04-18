import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { colors, radius, spacing } from '../theme';
import { getLessonById, checkAnswer, saveProgress, getProgress } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList, Lesson, Question } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
  route: RouteProp<RootStackParamList, 'Lesson'>;
}

type Phase = 'loading' | 'intro' | 'question' | 'feedback' | 'complete' | 'error';

export function LessonScreen({ navigation, route }: Props) {
  const { userId, tier } = useUserStore((s) => s);
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);

  const [phase, setPhase] = useState<Phase>('loading');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [errorMsg, setErrorMsg] = useState('');
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);
  const [streakMilestone, setStreakMilestone] = useState(false);

  // Answer state
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [tfSelected, setTfSelected] = useState<boolean | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [orderingItems, setOrderingItems] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<{term: string; definition: string}>>([]);

  // Feedback state
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    setPhase('loading');
    setErrorMsg('');
    try {
      const lessonId = route.params?.lessonId || 'foundations_1';
      const data = await getLessonById(lessonId, userId);
      setLesson(data);
      setStartTime(Date.now());
      setPhase('intro');
    } catch (err: any) {
      if (err.response?.status === 402) {
        navigation.navigate('Paywall');
      } else {
        setErrorMsg("I can't reach the server right now. Check your connection and try again.");
        setPhase('error');
      }
    }
  };

  const currentQuestion: Question | null = lesson?.questions[questionIndex] ?? null;

  const hasAnswer = (): boolean => {
    if (!currentQuestion) return false;
    switch (currentQuestion.type) {
      case 'multiple_choice': return mcSelected !== null;
      case 'true_false': return tfSelected !== null;
      case 'fill_blank': return fillValue.trim().length > 0;
      case 'prompt_write': return promptValue.trim().length > 10;
      case 'ordering': return orderingItems.length > 0;
      case 'match_pairs': return matchedPairs.length > 0;
      default: return false;
    }
  };

  const getUserAnswer = (): number | boolean | string | string[] | any => {
    if (!currentQuestion) return '';
    switch (currentQuestion.type) {
      case 'multiple_choice': return mcSelected ?? 0;
      case 'true_false': return tfSelected ?? false;
      case 'fill_blank': return fillValue.trim();
      case 'prompt_write': return promptValue.trim();
      case 'ordering': return orderingItems;
      case 'match_pairs': return matchedPairs;
      default: return '';
    }
  };

  const handleCheck = async () => {
    if (!lesson || !currentQuestion || checking) return;
    setChecking(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const answer = getUserAnswer();
    let result: any;

    try {
      result = await checkAnswer(userId, lesson.id, currentQuestion.id, answer);
    } catch (err) {
      result = { correct: false, explanation: 'Something went wrong checking your answer.', xpEarned: 0 };
    }

    if (result.correct) {
      setCorrectCount((c) => c + 1);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    setTotalXpEarned((x) => x + result.xpEarned);
    setFeedbackData(result);
    setPhase('feedback');
    setChecking(false);
  };

  const handleContinueAfterFeedback = () => {
    setFeedbackData(null);
    resetAnswerState();
    if (lesson && questionIndex < lesson.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setPhase('question');
    } else {
      handleLessonComplete();
    }
  };

  const handleLessonComplete = async () => {
    if (!lesson) return;
    try {
      const prevLevel = useUserStore.getState().level;
      const prevStreak = useUserStore.getState().streak;
      const result = await saveProgress(userId, lesson.id, correctCount, lesson.questions.length);
      
      if (result.newLevel > prevLevel) {
        setLeveledUp(true);
        setNewLevel(result.newLevel);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      }
      
      if (prevStreak === 2 || prevStreak === 6 || prevStreak === 29 || prevStreak === 99) {
        setStreakMilestone(true);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      syncFromBackend({
        xp: result.newTotalXp,
        level: result.newLevel,
        streak: result.streak,
        tier: result.tier || tier,
        totalLessonsCompleted: result.totalLessonsCompleted,
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
    setPhase('complete');
  };

  const resetAnswerState = () => {
    setMcSelected(null);
    setTfSelected(null);
    setFillValue('');
    setPromptValue('');
    setOrderingItems([]);
    setSelectedTerm(null);
    setMatchedPairs([]);
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (phase === 'question' && questionIndex > 0) {
      Alert.alert('Leave lesson?', 'Your progress will be lost.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // --- LOADING ---
  if (phase === 'loading') {
    return (
      <View style={styles.container}>
        <AiraCharacter mood="thinking" size={120} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  // --- ERROR ---
  if (phase === 'error') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <AiraCharacter mood="calm" size={80} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Pressable style={styles.primaryButton} onPress={loadLesson}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // --- INTRO ---
  if (phase === 'intro' && lesson) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.introContent}>
          <AiraCharacter mood="calm" size={120} />
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {lesson.realWorldScenario && (
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioLabel}>Real scenario</Text>
              <Text style={styles.scenarioText}>{lesson.realWorldScenario}</Text>
            </View>
          )}
          <View style={styles.introText}>
            <Text style={styles.airaIntro}>{lesson.airaIntro || "Let's dive in."}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setPhase('question')}>
            <Text style={styles.primaryButtonText}>Let's Start</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  // --- COMPLETE ---
  if (phase === 'complete' && lesson) {
    const accuracy = Math.round((correctCount / lesson.questions.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime) / 1000 / 60);

    return (
      <ScrollView style={styles.container}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.completeContent}>
          <AiraCharacter mood="celebrating" size={140} />
          <Text style={styles.completeTitle}>Lesson Complete!</Text>
          
          {leveledUp && (
            <Animated.View entering={SlideInDown.duration(500)} style={styles.levelUpBanner}>
              <Text style={styles.levelUpText}>LEVEL UP! 🎉</Text>
            </Animated.View>
          )}
          
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>XP Earned</Text>
              <Text style={styles.statValue}>+{totalXpEarned}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{timeTaken} min</Text>
            </View>
          </View>

          {streakMilestone && (
            <View style={styles.streakCard}>
              <Text style={styles.streakText}>🔥 Streak Milestone!</Text>
            </View>
          )}

          <View style={styles.outroCard}>
            <Text style={styles.outroText}>{lesson.airaOutro}</Text>
            <Text style={styles.takeawayText}>{lesson.takeaway}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  // --- QUESTION / FEEDBACK ---
  if (!lesson || !currentQuestion) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <MotiView
            style={styles.progressFill}
            animate={{
              width: `${lesson ? ((questionIndex + 1) / lesson.questions.length) * 100 : 0}%`,
            }}
            transition={{ duration: 400 }}
          />
        </View>
        <Text style={styles.progressLabel}>+{totalXpEarned} XP</Text>
      </View>

      <Animated.View entering={FadeInUp.duration(300)} style={styles.questionContent}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.type === 'multiple_choice' && (
          <View style={styles.optionsContainer}>
            {(currentQuestion.options || []).map((option: string, index: number) => (
              <Pressable
                key={index}
                style={[
                  styles.optionCard,
                  mcSelected === index && styles.optionSelected,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setMcSelected(index);
                }}
              >
                <Text style={styles.optionText}>{option}</Text>
                {mcSelected === index && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {currentQuestion.type === 'true_false' && (
          <View style={styles.tfContainer}>
            <Pressable
              style={[styles.tfButton, tfSelected === true && styles.tfSelected]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setTfSelected(true);
              }}
            >
              <Text style={styles.tfText}>True</Text>
            </Pressable>
            <Pressable
              style={[styles.tfButton, tfSelected === false && styles.tfSelected]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setTfSelected(false);
              }}
            >
              <Text style={styles.tfText}>False</Text>
            </Pressable>
          </View>
        )}

        {currentQuestion.type === 'fill_blank' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer..."
              placeholderTextColor={colors.textMuted}
              value={fillValue}
              onChangeText={setFillValue}
              autoFocus
            />
          </View>
        )}

        {currentQuestion.type === 'prompt_write' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Write your response..."
              placeholderTextColor={colors.textMuted}
              value={promptValue}
              onChangeText={setPromptValue}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.hintText}>Try to include: {Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.join(', ') : 'key terms'}</Text>
          </View>
        )}

        {currentQuestion.type === 'ordering' && (
          <View style={styles.orderingContainer}>
            {(currentQuestion.options || []).map((item: string, index: number) => (
              <Pressable
                key={index}
                style={styles.orderingItem}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  // Simplified ordering - just select items
                  if (!orderingItems.includes(item)) {
                    setOrderingItems([...orderingItems, item]);
                  }
                }}
              >
                <Text style={styles.orderingText}>{orderingItems.includes(item) ? `${orderingItems.indexOf(item) + 1}. ${item}` : item}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {currentQuestion.type === 'match_pairs' && (
          <View style={styles.matchContainer}>
            <Text style={styles.matchHint}>Tap a term, then tap its match</Text>
            {/* Simplified match pairs - would need full implementation */}
            <Text style={styles.matchPlaceholder}>Match pairs question type</Text>
          </View>
        )}
      </Animated.View>

      {phase === 'question' && (
        <Pressable
          style={[styles.checkButton, !hasAnswer() && styles.checkButtonDisabled]}
          onPress={handleCheck}
          disabled={!hasAnswer() || checking}
        >
          <Text style={styles.checkButtonText}>{checking ? 'Checking...' : 'CHECK'}</Text>
        </Pressable>
      )}

      {phase === 'feedback' && feedbackData && (
        <Animated.View entering={SlideInUp.duration(300)} style={styles.feedbackOverlay}>
          <LinearGradient
            colors={feedbackData.correct ? colors.gradientSuccess : ['#FB7185', '#F472B6']}
            style={styles.feedbackGradient}
          >
            <AiraCharacter mood={feedbackData.correct ? 'happy' : 'encouraging'} size={100} />
            <Text style={styles.feedbackTitle}>{feedbackData.correct ? 'Correct!' : 'Not quite'}</Text>
            <Text style={styles.feedbackText}>{feedbackData.airaFeedback || feedbackData.explanation}</Text>
            <View style={styles.explanationCard}>
              <Text style={styles.explanationText}>{feedbackData.explanation}</Text>
            </View>
            <Pressable style={styles.continueButton} onPress={handleContinueAfterFeedback}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.trackFoundations,
    borderRadius: radius.full,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  introContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scenarioCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
  },
  scenarioLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  scenarioText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  introText: {
    marginBottom: spacing.xl,
  },
  airaIntro: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  questionContent: {
    padding: spacing.xl,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.trackFoundations,
    backgroundColor: colors.bgGlass,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  checkmark: {
    fontSize: 20,
    color: colors.trackFoundations,
    fontWeight: '700',
  },
  tfContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tfButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tfSelected: {
    borderColor: colors.trackFoundations,
    backgroundColor: colors.bgGlass,
  },
  tfText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  textInput: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  orderingContainer: {
    gap: spacing.md,
  },
  orderingItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  orderingText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  matchContainer: {
    padding: spacing.lg,
  },
  matchHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  matchPlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  checkButton: {
    backgroundColor: colors.trackFoundations,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    margin: spacing.xl,
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  feedbackOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  feedbackGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  feedbackText: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  explanationCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    maxWidth: '90%',
  },
  explanationText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  completeContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  levelUpBanner: {
    backgroundColor: colors.airaPro,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  levelUpText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.airaPro,
    textAlign: 'center',
  },
  outroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
  },
  outroText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  takeawayText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: colors.trackFoundations,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
