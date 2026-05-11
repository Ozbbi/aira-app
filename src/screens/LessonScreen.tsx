import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ArrowRight, CheckCircle } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraMascot } from '../components/AiraMascot';
import { Sandbox } from '../components/Sandbox';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { getLessonById, checkAnswer, saveProgress } from '../api/client';
import { useUserStore } from '../store/userStore';
import { findSeedLesson, checkSeedAnswer, isSeedLessonId } from '../data';
import { SEED_LESSONS } from '../data';
import { CODE_LESSONS } from '../data';
import type { RootStackParamList, Lesson, Question } from '../types';

type Phase = 'loading' | 'hook' | 'concept' | 'guided' | 'sandbox' | 'quiz' | 'feedback' | 'complete' | 'error';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
  route: RouteProp<RootStackParamList, 'Lesson'>;
}

export function LessonScreen({ navigation, route }: Props) {
  const { userId, tier } = useUserStore();
  const completeLesson = useUserStore((s) => s.completeLesson);
  const loseLife = useUserStore((s) => s.loseLife);

  const [isSeed, setIsSeed] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [errorMsg, setErrorMsg] = useState('');
  const [leveledUp, setLeveledUp] = useState(false);

  // Answer state
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [tfSelected, setTfSelected] = useState<boolean | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => { loadLesson(); }, []);

  const loadLesson = async () => {
    setPhase('loading');

    // Out-of-lives gate. The brief's monetization rule: hitting zero
    // lives blocks new lessons and routes to the Paywall (where the user
    // either upgrades or watches a rewarded ad to refill).
    // We read directly off the store so this guard isn't subject to React
    // stale-closure issues.
    const currentLives = useUserStore.getState().lives;
    const currentTier = useUserStore.getState().tier;
    if (currentLives <= 0 && currentTier !== 'pro') {
      navigation.navigate('Paywall');
      return;
    }

    const lessonId = route.params?.lessonId || 'foundations_1';

    const seed = findSeedLesson(lessonId);
    if (seed) {
      setLesson(seed);
      setIsSeed(true);
      setPhase('hook');
      return;
    }

    try {
      const data = await getLessonById(lessonId, userId);
      setLesson(data);
      setIsSeed(false);
      setPhase('hook');
    } catch (err: any) {
      const fallback = findSeedLesson(lessonId);
      if (fallback) { setLesson(fallback); setIsSeed(true); setPhase('hook'); return; }
      if (err.response?.status === 402) { navigation.navigate('Paywall'); return; }
      setErrorMsg("Can't reach the server. Check your connection.");
      setPhase('error');
    }
  };

  const currentQuestion: Question | null = lesson?.questions[questionIndex] ?? null;
  const totalQuestions = lesson?.questions.length ?? 0;
  const progressPercent = totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0;

  const hasAnswer = (): boolean => {
    if (!currentQuestion) return false;
    switch (currentQuestion.type) {
      case 'multiple_choice': return mcSelected !== null;
      case 'true_false': return tfSelected !== null;
      case 'fill_blank': return fillValue.trim().length > 0;
      default: return false;
    }
  };

  const getUserAnswer = (): any => {
    if (!currentQuestion) return '';
    switch (currentQuestion.type) {
      case 'multiple_choice': return mcSelected ?? 0;
      case 'true_false': return tfSelected ?? false;
      case 'fill_blank': return fillValue.trim();
      default: return '';
    }
  };

  const handleCheck = async () => {
    if (!lesson || !currentQuestion || checking) return;
    setChecking(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const answer = getUserAnswer();
    let result: any;

    if (isSeed) {
      result = checkSeedAnswer(lesson.id, currentQuestion.id, answer);
    } else {
      try {
        result = await checkAnswer(userId, lesson.id, currentQuestion.id, answer);
      } catch {
        result = isSeedLessonId(lesson.id)
          ? checkSeedAnswer(lesson.id, currentQuestion.id, answer)
          : { correct: false, explanation: 'Connection error.', xpEarned: 0 };
      }
    }

    if (result.correct) {
      setCorrectCount((c) => c + 1);
      setTotalXpEarned((x) => x + (result.xpEarned || 5));
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      loseLife();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setFeedbackData(result);
    setPhase('feedback');
    setChecking(false);
  };

  const handleContinue = () => {
    setFeedbackData(null);
    resetAnswerState();
    if (lesson && questionIndex < lesson.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setPhase('quiz');
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (!lesson) return;
    const prevLevel = useUserStore.getState().level;
    const earnedXp = totalXpEarned > 0 ? totalXpEarned : 15;
    completeLesson(lesson.id, earnedXp);
    const newLevel = useUserStore.getState().level;
    if (newLevel > prevLevel) setLeveledUp(true);
    setPhase('complete');
  };

  const handleSandboxComplete = (score: number) => {
    setTotalXpEarned((x) => x + Math.round(score / 10));
    setPhase('quiz');
  };

  const resetAnswerState = () => {
    setMcSelected(null);
    setTfSelected(null);
    setFillValue('');
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === 'quiz' && questionIndex > 0) {
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
      <View style={styles.center}>
        <AiraMascot size={120} state="thinking" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  // --- ERROR ---
  if (phase === 'error') {
    return (
      <View style={styles.center}>
        <CloseButton onPress={() => navigation.goBack()} />
        <AiraMascot size={80} state="error" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Pressable style={styles.primaryBtn} onPress={loadLesson}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!lesson) return null;

  // --- PHASE 1: HOOK ---
  if (phase === 'hook') {
    return (
      <ScrollView style={styles.screen}>
        <CloseButton onPress={handleClose} />
        <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContent}>
          <AiraMascot size={100} state="idle" />
          <Text style={styles.phaseTitle}>{lesson.title}</Text>
          {lesson.realWorldScenario && (
            <View style={styles.scenarioBubble}>
              <Text style={styles.scenarioLabel}>REAL SCENARIO</Text>
              <Text style={styles.scenarioText}>{lesson.realWorldScenario}</Text>
            </View>
          )}
          <Text style={styles.introText}>{lesson.airaIntro || "Let's dive in."}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => setPhase('concept')}>
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  // --- PHASE 2: CONCEPT ---
  if (phase === 'concept') {
    return (
      <ScrollView style={styles.screen}>
        <CloseButton onPress={handleClose} />
        <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContent}>
          <Text style={styles.phaseLabel}>CORE CONCEPT</Text>
          <Text style={styles.phaseTitle}>Why this matters</Text>

          {/* Side-by-side comparison */}
          <View style={styles.compareRow}>
            <View style={[styles.compareCard, styles.compareBad]}>
              <Text style={styles.compareLabel}>WEAK PROMPT</Text>
              <Text style={styles.compareText}>"Write a report."</Text>
            </View>
            <View style={[styles.compareCard, styles.compareGood]}>
              <Text style={styles.compareLabel}>STRONG PROMPT</Text>
              <Text style={styles.compareText}>"Write a 500-word report on renewable energy for a college freshman."</Text>
            </View>
          </View>

          <Text style={styles.conceptBody}>
            {lesson.takeaway || 'The more specific your prompt, the better the AI output. Specificity turns generic answers into useful ones.'}
          </Text>

          <Pressable style={styles.primaryBtn} onPress={() => setPhase('guided')}>
            <Text style={styles.primaryBtnText}>Practice This →</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  // --- PHASE 3: GUIDED PRACTICE ---
  if (phase === 'guided') {
    return (
      <ScrollView style={styles.screen}>
        <CloseButton onPress={handleClose} />
        <ProgressBar percent={25} xp={totalXpEarned} />
        <Animated.View entering={FadeInDown.duration(300)} style={styles.phaseContent}>
          <Text style={styles.phaseLabel}>GUIDED PRACTICE</Text>
          {currentQuestion && (
            <>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              {currentQuestion.type === 'fill_blank' && (
                <TextInput
                  style={styles.fillInput}
                  placeholder="Type your answer..."
                  placeholderTextColor={colors.textDisabled}
                  value={fillValue}
                  onChangeText={setFillValue}
                />
              )}
              <Pressable
                style={[styles.primaryBtn, fillValue.trim().length === 0 && styles.btnDisabled]}
                onPress={() => { setPhase('sandbox'); }}
                disabled={fillValue.trim().length === 0 && currentQuestion.type === 'fill_blank'}
              >
                <Text style={styles.primaryBtnText}>Next →</Text>
              </Pressable>
            </>
          )}
          {!currentQuestion && (
            <Pressable style={styles.primaryBtn} onPress={() => setPhase('sandbox')}>
              <Text style={styles.primaryBtnText}>Open Sandbox →</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    );
  }

  // --- PHASE 4: SANDBOX ---
  if (phase === 'sandbox') {
    return (
      <View style={{ flex: 1 }}>
        <CloseButton onPress={handleClose} />
        <Sandbox
          topic={lesson.topic || 'prompting'}
          focusSkill="clarity"
          scenario={lesson.realWorldScenario || 'Write the best prompt you can for this topic.'}
          onComplete={handleSandboxComplete}
        />
      </View>
    );
  }

  // --- PHASE 5: QUIZ ---
  if (phase === 'quiz' || phase === 'feedback') {
    return (
      <ScrollView style={styles.screen}>
        <CloseButton onPress={handleClose} />
        <ProgressBar percent={progressPercent} xp={totalXpEarned} />

        {phase === 'quiz' && currentQuestion && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.phaseContent}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {currentQuestion.type === 'multiple_choice' && (
              <View style={styles.optionsContainer}>
                {(currentQuestion.options || []).map((opt: string, i: number) => (
                  <Pressable
                    key={i}
                    style={[styles.optionCard, mcSelected === i && styles.optionSelected]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMcSelected(i);
                    }}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                    {mcSelected === i && <CheckCircle size={22} weight="fill" color={colors.cyan} />}
                  </Pressable>
                ))}
              </View>
            )}

            {currentQuestion.type === 'true_false' && (
              <View style={styles.tfRow}>
                {[true, false].map((val) => (
                  <Pressable
                    key={String(val)}
                    style={[styles.tfBtn, tfSelected === val && styles.tfBtnSelected]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTfSelected(val);
                    }}
                  >
                    <Text style={styles.tfBtnText}>{val ? 'True' : 'False'}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {currentQuestion.type === 'fill_blank' && (
              <TextInput
                style={styles.fillInput}
                placeholder="Type your answer..."
                placeholderTextColor={colors.textDisabled}
                value={fillValue}
                onChangeText={setFillValue}
                autoFocus
              />
            )}

            <Pressable
              style={[styles.checkBtn, !hasAnswer() && styles.btnDisabled]}
              onPress={handleCheck}
              disabled={!hasAnswer() || checking}
            >
              <Text style={styles.checkBtnText}>{checking ? 'Checking...' : 'CHECK'}</Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === 'feedback' && feedbackData && (
          <Animated.View entering={SlideInUp.duration(300)} style={styles.feedbackCard}>
            <LinearGradient
              colors={feedbackData.correct ? ['#1A2E1A', '#0B0E14'] : ['#2E1A1A', '#0B0E14']}
              style={styles.feedbackGradient}
            >
              <AiraMascot size={80} state={feedbackData.correct ? 'success' : 'error'} />
              <Text style={[styles.feedbackTitle, feedbackData.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
                {feedbackData.correct ? 'Correct!' : "Let's try again!"}
              </Text>
              <Text style={styles.feedbackExplanation}>{feedbackData.explanation}</Text>
              {feedbackData.airaFeedback && (
                <Text style={styles.feedbackTip}>{feedbackData.airaFeedback}</Text>
              )}
              <Pressable style={styles.primaryBtn} onPress={handleContinue}>
                <Text style={styles.primaryBtnText}>Continue →</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    );
  }

  // --- COMPLETE ---
  if (phase === 'complete') {
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const timeMins = Math.max(1, Math.round((Date.now() - startTime) / 60000));

    return (
      <ScrollView style={styles.screen}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.completeContent}>
          <AiraMascot size={140} state="success" />
          <Text style={styles.completeTitle}>Lesson Complete!</Text>

          {leveledUp && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.levelUpBadge}>
              <Text style={styles.levelUpText}>LEVEL UP!</Text>
            </Animated.View>
          )}

          <View style={styles.completeStats}>
            <StatRow label="XP Earned" value={`+${totalXpEarned}`} />
            <StatRow label="Accuracy" value={`${accuracy}%`} />
            <StatRow label="Time" value={`${timeMins} min`} />
          </View>

          {lesson.takeaway && (
            <View style={styles.takeawayCard}>
              <Text style={styles.takeawayLabel}>KEY TAKEAWAY</Text>
              <Text style={styles.takeawayText}>{lesson.takeaway}</Text>
            </View>
          )}

          <CreateFlashcardsButton lessonId={lesson.id} navigation={navigation} />

          <Pressable style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  return null;
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.closeBtn} onPress={onPress}>
      <X size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

function ProgressBar({ percent, xp }: { percent: number; xp: number }) {
  return (
    <View style={styles.progressBar}>
      <View style={styles.progressTrack}>
        <MotiView
          style={styles.progressFill}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 400 }}
        />
      </View>
      <Text style={styles.progressXp}>+{xp} XP</Text>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={styles.statRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: 16 },
  errorText: { ...typography.body, color: colors.textPrimary, textAlign: 'center', marginVertical: 16 },

  closeBtn: {
    position: 'absolute', top: 56, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.cardSurface, justifyContent: 'center', alignItems: 'center',
  },

  progressBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 64, gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.divider, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.cyan, borderRadius: 3 },
  progressXp: { ...typography.caption, color: colors.textSecondary },

  phaseContent: { padding: 24, paddingTop: 80 },
  phaseLabel: { ...typography.label, color: colors.cyan, marginBottom: 8 },
  phaseTitle: { ...typography.display, color: colors.textPrimary, marginBottom: 16 },
  introText: { ...typography.body, color: colors.textSecondary, marginBottom: 24, lineHeight: 24 },

  scenarioBubble: {
    backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: 20,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: colors.cyan,
  },
  scenarioLabel: { ...typography.label, color: colors.orange, marginBottom: 6 },
  scenarioText: { ...typography.body, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  // Concept compare
  compareRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  compareCard: { flex: 1, borderRadius: radius.md, padding: 14 },
  compareBad: { backgroundColor: colors.errorSoft, borderWidth: 1, borderColor: colors.error },
  compareGood: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success },
  compareLabel: { ...typography.label, fontSize: 9, marginBottom: 6 },
  compareText: { ...typography.body, fontSize: 13, color: colors.textPrimary, fontStyle: 'italic' },

  conceptBody: { ...typography.body, color: colors.textSecondary, marginBottom: 24, lineHeight: 24 },

  // Quiz
  questionText: { ...typography.headline, color: colors.textPrimary, marginBottom: 24, fontSize: 22, lineHeight: 30 },
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionCard: {
    backgroundColor: colors.cardSurface, borderRadius: radius.md, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  optionSelected: { borderColor: colors.cyan, backgroundColor: colors.cyanWash },
  optionText: { ...typography.body, color: colors.textPrimary, flex: 1, marginRight: 8 },

  tfRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tfBtn: {
    flex: 1, backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  tfBtnSelected: { borderColor: colors.cyan, backgroundColor: colors.cyanWash },
  tfBtnText: { ...typography.bodyBold, color: colors.textPrimary },

  fillInput: {
    backgroundColor: colors.cardSurface, borderRadius: radius.md, padding: 16,
    ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.divider,
    marginBottom: 24,
  },

  checkBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.md,
    padding: 16, alignItems: 'center', height: 52, justifyContent: 'center',
    ...elevation.cyanGlow,
  },
  checkBtnText: { ...typography.button, color: colors.bg },
  btnDisabled: { opacity: 0.4 },

  primaryBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.md,
    padding: 16, alignItems: 'center', height: 52, justifyContent: 'center',
    ...elevation.cyanGlow,
  },
  primaryBtnText: { ...typography.button, color: colors.bg },

  // Feedback
  feedbackCard: { margin: 16, borderRadius: radius.lg, overflow: 'hidden' },
  feedbackGradient: { padding: 24, alignItems: 'center' },
  feedbackTitle: { ...typography.display, marginTop: 16, marginBottom: 12 },
  feedbackCorrect: { color: colors.success },
  feedbackWrong: { color: colors.error },
  feedbackExplanation: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 12, lineHeight: 22 },
  feedbackTip: { ...typography.body, fontSize: 14, color: colors.cyan, textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },

  // Complete
  completeContent: { padding: 24, paddingTop: 80, alignItems: 'center' },
  completeTitle: { ...typography.display, color: colors.textPrimary, marginTop: 16, marginBottom: 24 },
  levelUpBadge: {
    backgroundColor: colors.orange, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: radius.full, marginBottom: 24,
  },
  levelUpText: { ...typography.button, color: '#FFFFFF' },
  completeStats: {
    backgroundColor: colors.cardSurface, borderRadius: radius.lg,
    padding: 20, width: '100%', marginBottom: 24,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  statRowLabel: { ...typography.body, color: colors.textSecondary },
  statRowValue: { ...typography.bodyBold, fontSize: 20, color: colors.textPrimary },
  takeawayCard: {
    backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: 20,
    width: '100%', marginBottom: 24, borderLeftWidth: 3, borderLeftColor: colors.cyan,
  },
  takeawayLabel: { ...typography.label, color: colors.cyan, marginBottom: 8 },
  takeawayText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },

  // Create-Flashcards button on lesson summary
  flashBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgCardHover,
    borderColor: colors.cyan,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  flashBtnText: { ...typography.button, color: colors.cyan, fontSize: 15 },
  flashBtnSub: { ...typography.caption, color: colors.textSecondary, marginBottom: 18, textAlign: 'center' },
});

/* ─────────────────── CreateFlashcardsButton ─────────────────── */

function CreateFlashcardsButton({
  lessonId,
  navigation,
}: {
  lessonId: string;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
}) {
  const decks = useUserStore((s) => s.flashcardDecks);
  const tier = useUserStore((s) => s.tier);
  const createFlashcardsForLesson = useUserStore((s) => s.createFlashcardsForLesson);

  // Find the seed lesson so we can generate. Try main pool first, then code lessons.
  const seedLesson = React.useMemo(() => {
    return SEED_LESSONS.find((l) => l.id === lessonId) ?? CODE_LESSONS.find((l) => l.id === lessonId);
  }, [lessonId]);

  if (!seedLesson) {
    // Backend-only lesson — generator can't run. Hide silently.
    return null;
  }

  // Show "View" if a deck for this track exists AND already contains this lesson.
  const existingDeck = decks.find(
    (d) => d.trackId === seedLesson.trackId && d.lessonIds.includes(seedLesson.id),
  );

  const trackName = trackNameFor(seedLesson.trackId);

  const onCreate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const result = createFlashcardsForLesson(seedLesson, trackName);
    if (result.blockedByPaywall) {
      navigation.navigate('Paywall');
      return;
    }
    if (result.deckId) {
      navigation.navigate('Flashcards');
    }
  };

  const onView = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    navigation.navigate('Flashcards');
  };

  if (existingDeck) {
    return (
      <>
        <Pressable style={styles.flashBtn} onPress={onView}>
          <Text style={styles.flashBtnText}>View flashcards →</Text>
        </Pressable>
        <Text style={styles.flashBtnSub}>{existingDeck.cardCount} cards in {existingDeck.name}</Text>
      </>
    );
  }

  return (
    <>
      <Pressable style={styles.flashBtn} onPress={onCreate}>
        <Text style={styles.flashBtnText}>✨ Create flashcards from this lesson</Text>
      </Pressable>
      <Text style={styles.flashBtnSub}>Turn this lesson into 5-10 quick recall cards.</Text>
    </>
  );
}

function trackNameFor(trackId: string): string {
  switch (trackId) {
    case 'prompt':   return 'Prompt Craft';
    case 'critical': return 'Critical Thinking';
    case 'power':    return 'Power User Moves';
    case 'tools':    return 'AI Tools Mastery';
    case 'vibe':     return 'Vibe Code';
    case 'create':   return 'Create with AI';
    default:         return 'AI Foundations';
  }
}
