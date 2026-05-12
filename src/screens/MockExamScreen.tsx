import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { palette, radii, space, text, elevation, screen } from '../theme/system';
import { Button } from '../components/Button';
import { AiraMascot } from '../components/AiraMascot';
import { useUserStore } from '../store/userStore';
import { SEED_LESSONS, CODE_LESSONS } from '../data';
import { AI_FOUNDATIONS_ADVANCED } from '../data/aiFoundationsAdvanced';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../types';

/**
 * Mock Exam — pulls 10 random questions from completed lessons, scores
 * them, awards XP.
 *
 * MVP scope: multiple_choice + true_false questions only (the auto-
 * gradeable ones). Other types are skipped at selection time. If the
 * user hasn't completed enough lessons to fill 10 questions, we drop
 * to 5; if still not enough, we show a "Complete more lessons" empty
 * state with a CTA.
 *
 * Future: Pro-only "Track Exam" that pulls only from one track + adds
 * a 10-minute timer + grants a Certificate (already an IAP product).
 */

const EXAM_QUESTION_COUNT = 10;

interface ExamQuestion {
  lessonId: string;
  lessonTitle: string;
  trackName: string;
  qId: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer: number | boolean;
  explanation: string;
}

const TRACK_NAMES: Record<string, string> = {
  prompt: 'AI Foundations',
  critical: 'Critical Thinking',
  power: 'Practical Power',
  tools: 'Tools & Taste',
  create: 'Create with AI',
  vibe: 'Code Track',
  foundations: 'AI Foundations',
};

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

type Phase = 'intro' | 'taking' | 'review';

export function MockExamScreen({ navigation }: Props) {
  const completedLessonIds = useUserStore((s) => s.completedLessonIds);
  const addXp = useUserStore((s) => s.addXp);
  const tier = useUserStore((s) => s.tier);

  const allLessons = useMemo(
    () => [...SEED_LESSONS, ...CODE_LESSONS, ...AI_FOUNDATIONS_ADVANCED],
    [],
  );

  // Build the question pool from completed lessons only.
  const questionPool: ExamQuestion[] = useMemo(() => {
    const completed = new Set(completedLessonIds);
    const pool: ExamQuestion[] = [];
    for (const l of allLessons) {
      if (!completed.has(l.id)) continue;
      for (const q of l.questions || []) {
        if (q.type !== 'multiple_choice' && q.type !== 'true_false') continue;
        pool.push({
          lessonId: l.id,
          lessonTitle: l.title,
          trackName: TRACK_NAMES[l.trackId] ?? l.trackId,
          qId: q.id,
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer as number | boolean,
          explanation: q.explanation,
        });
      }
    }
    return pool;
  }, [allLessons, completedLessonIds]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | boolean | null>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const startExam = useCallback(() => {
    haptics.medium();
    // Fisher-Yates shuffle, then take N.
    const arr = [...questionPool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const target = Math.min(EXAM_QUESTION_COUNT, arr.length);
    setQuestions(arr.slice(0, target));
    setAnswers({});
    setCurrentIdx(0);
    setPhase('taking');
  }, [questionPool]);

  const onAnswer = useCallback(
    (value: number | boolean) => {
      const q = questions[currentIdx];
      if (!q) return;
      haptics.tap();
      setAnswers((prev) => ({ ...prev, [q.qId]: value }));
      // auto-advance after a brief beat
      setTimeout(() => {
        if (currentIdx + 1 >= questions.length) {
          finalize();
        } else {
          setCurrentIdx((i) => i + 1);
        }
      }, 250);
    },
    [questions, currentIdx],
  );

  const finalize = useCallback(() => {
    haptics.success();
    // Award XP per correct
    let correct = 0;
    for (const q of questions) {
      if (answers[q.qId] === q.correctAnswer) correct++;
    }
    addXp(correct * 5);
    setPhase('review');
  }, [questions, answers, addXp]);

  const onExit = useCallback(() => {
    if (phase === 'taking') {
      // confirm
      // (using a simple back-tap without confirm for MVP)
      navigation.goBack();
      return;
    }
    navigation.goBack();
  }, [phase, navigation]);

  // ── EMPTY STATE — not enough completed material to build an exam ──
  if (questionPool.length < 3) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Pressable onPress={onExit} hitSlop={12} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.emptyWrap}>
          <AiraMascot size={140} mood="encouraging" />
          <Text style={styles.emptyTitle}>Not enough lessons yet.</Text>
          <Text style={styles.emptyBody}>
            Finish at least 3 lessons and I'll build you a custom mock exam from the questions you've seen. Stretching what you know is the best way to lock it in!
          </Text>
          <Button
            label="Go pick a lesson"
            onPress={() => navigation.navigate('Lessons' as never)}
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── INTRO ──
  if (phase === 'intro') {
    const targetCount = Math.min(EXAM_QUESTION_COUNT, questionPool.length);
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Pressable onPress={onExit} hitSlop={12} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.introWrap}>
          <AiraMascot size={140} mood="happy" />
          <Text style={styles.eyebrow}>MOCK EXAM</Text>
          <Text style={styles.introTitle}>Ready to stretch what you know?</Text>
          <Text style={styles.introBody}>
            {targetCount} questions, drawn at random from lessons you've completed. Each correct answer earns +5 XP. Take your time — there's no timer.
          </Text>
          <Button label={`Start exam · ${targetCount} questions`} onPress={startExam} size="lg" />
          {tier !== 'pro' ? (
            <Text style={styles.proHint}>Pro unlocks track-specific exams and certificates.</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ── TAKING ──
  if (phase === 'taking') {
    const q = questions[currentIdx];
    if (!q) return null;
    const userAnswer = answers[q.qId];
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.takeHeader}>
          <Pressable onPress={onExit} hitSlop={12}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.takeProgress}>
            {currentIdx + 1} / {questions.length}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%` }]} />
        </View>

        <ScrollView style={styles.takeScroll} contentContainerStyle={styles.takeContent} showsVerticalScrollIndicator={false}>
          <Animated.View key={q.qId} entering={FadeIn.duration(220)}>
            <Text style={styles.questionEyebrow}>
              {q.trackName} · {q.lessonTitle}
            </Text>
            <Text style={styles.questionText}>{q.question}</Text>

            {q.type === 'multiple_choice' && q.options ? (
              <View style={styles.choices}>
                {q.options.map((opt, i) => {
                  const isSelected = userAnswer === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => onAnswer(i)}
                      disabled={userAnswer !== undefined && userAnswer !== null}
                      style={[styles.choice, isSelected && styles.choiceSelected]}
                    >
                      <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {q.type === 'true_false' ? (
              <View style={styles.tfRow}>
                <Pressable
                  onPress={() => onAnswer(true)}
                  disabled={userAnswer !== undefined && userAnswer !== null}
                  style={[styles.tfBtn, userAnswer === true && styles.choiceSelected]}
                >
                  <Text style={styles.choiceText}>True</Text>
                </Pressable>
                <Pressable
                  onPress={() => onAnswer(false)}
                  disabled={userAnswer !== undefined && userAnswer !== null}
                  style={[styles.tfBtn, userAnswer === false && styles.choiceSelected]}
                >
                  <Text style={styles.choiceText}>False</Text>
                </Pressable>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── REVIEW ──
  const correct = questions.filter((q) => answers[q.qId] === q.correctAnswer).length;
  const pct = Math.round((correct / questions.length) * 100);
  const reviewMood =
    pct >= 80 ? 'celebrating' : pct >= 50 ? 'happy' : 'encouraging';
  const reviewHeadline =
    pct === 100 ? 'Perfect score!' :
    pct >= 80 ? "That's a great result!" :
    pct >= 50 ? 'Solid effort!' :
    'Nice try — keep going!';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable onPress={onExit} hitSlop={12} style={styles.back}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewHero}>
          <AiraMascot size={140} mood={reviewMood} />
          <Text style={styles.reviewScore}>{correct} / {questions.length}</Text>
          <Text style={styles.reviewHeadline}>{reviewHeadline}</Text>
          <View style={styles.xpChip}>
            <Text style={styles.xpChipText}>+{correct * 5} XP earned</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Review every question</Text>
        {questions.map((q, i) => {
          const userAns = answers[q.qId];
          const isCorrect = userAns === q.correctAnswer;
          return (
            <Animated.View key={q.qId} entering={FadeInDown.duration(220).delay(40 + i * 30)} style={styles.reviewCard}>
              <View style={styles.reviewCardHead}>
                <Text style={styles.reviewQNum}>Q{i + 1}</Text>
                <Text style={[styles.reviewBadge, isCorrect ? styles.reviewBadgeOk : styles.reviewBadgeFail]}>
                  {isCorrect ? '✓ Got it' : 'Almost'}
                </Text>
              </View>
              <Text style={styles.reviewQText}>{q.question}</Text>
              <Text style={styles.reviewLessonRef}>From: {q.lessonTitle}</Text>
              {!isCorrect ? (
                <View style={styles.explainBox}>
                  <Text style={styles.explainLabel}>WHY</Text>
                  <Text style={styles.explainText}>{q.explanation}</Text>
                </View>
              ) : null}
            </Animated.View>
          );
        })}

        <View style={{ marginTop: space['5'], gap: space['3'] }}>
          <Button label="Try another mock exam" onPress={() => setPhase('intro')} size="md" fullWidth />
          <Button
            label="Back to Learn"
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>
        <View style={{ height: space['12'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────── styles ─────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  back: { paddingVertical: space['2'], paddingHorizontal: screen.hPadding },
  backIcon: { fontFamily: 'Inter_700Bold', fontSize: 30, color: palette.textPrimary },

  introWrap: {
    flex: 1,
    paddingHorizontal: space['5'],
    paddingBottom: space['6'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: space['3'],
  },
  eyebrow: { ...text.label, color: palette.brand, marginTop: space['2'] },
  introTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  introBody: {
    ...text.body,
    color: palette.textSecondary,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: space['3'],
  },
  proHint: { ...text.caption, color: palette.textMuted, textAlign: 'center', marginTop: space['2'] },

  // taking phase
  takeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screen.hPadding,
    paddingVertical: space['2'],
  },
  takeProgress: { ...text.bodyEmphasis, color: palette.textSecondary },
  progressBar: {
    height: 4,
    backgroundColor: palette.divider,
    marginHorizontal: screen.hPadding,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: palette.brand },
  takeScroll: { flex: 1 },
  takeContent: { padding: screen.hPadding, paddingBottom: space['12'] },
  questionEyebrow: { ...text.label, color: palette.brand, marginBottom: space['2'] },
  questionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: palette.textPrimary,
    marginBottom: space['5'],
    letterSpacing: -0.2,
  },
  choices: { gap: space['2'] },
  choice: {
    backgroundColor: palette.cardSurface,
    borderColor: palette.divider,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: space['4'],
    paddingHorizontal: space['4'],
    minHeight: 56,
  },
  choiceSelected: {
    backgroundColor: palette.brandSoft,
    borderColor: palette.brand,
    borderWidth: 2,
  },
  choiceText: { ...text.body, color: palette.textPrimary },
  choiceTextSelected: { fontFamily: 'Inter_700Bold' },
  tfRow: { flexDirection: 'row', gap: space['3'] },
  tfBtn: {
    flex: 1,
    backgroundColor: palette.cardSurface,
    borderColor: palette.divider,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: space['4'],
    alignItems: 'center',
  },

  // review phase
  reviewContent: { padding: screen.hPadding, paddingBottom: space['8'] },
  reviewHero: { alignItems: 'center', marginBottom: space['6'], gap: space['2'] },
  reviewScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 56,
    lineHeight: 60,
    color: palette.brand,
    letterSpacing: -1,
  },
  reviewHeadline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  xpChip: {
    backgroundColor: palette.brandSoft,
    paddingHorizontal: space['4'],
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: space['2'],
  },
  xpChipText: { ...text.bodyEmphasis, color: palette.brand, fontFamily: 'Inter_700Bold' },

  sectionTitle: { ...text.title, color: palette.textPrimary, marginBottom: space['3'] },
  reviewCard: {
    backgroundColor: palette.cardSurface,
    borderColor: palette.divider,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space['4'],
    marginBottom: space['2'],
    ...elevation.sm,
  },
  reviewCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space['2'] },
  reviewQNum: { ...text.label, color: palette.textMuted },
  reviewBadge: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  reviewBadgeOk: { color: palette.success, backgroundColor: palette.successSoft },
  reviewBadgeFail: { color: palette.danger, backgroundColor: palette.dangerSoft },
  reviewQText: { ...text.bodyEmphasis, color: palette.textPrimary, marginBottom: 4 },
  reviewLessonRef: { ...text.caption, color: palette.textMuted, marginBottom: space['2'] },
  explainBox: {
    backgroundColor: palette.bgRaised2,
    borderRadius: radii.sm,
    padding: space['3'],
    borderLeftColor: palette.brand,
    borderLeftWidth: 3,
  },
  explainLabel: { ...text.label, color: palette.textMuted, marginBottom: 4 },
  explainText: { ...text.bodySmall, color: palette.textPrimary },

  // empty
  emptyWrap: {
    flex: 1,
    paddingHorizontal: space['5'],
    paddingBottom: space['6'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: space['3'],
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: palette.textPrimary,
    marginTop: space['3'],
  },
  emptyBody: {
    ...text.body,
    color: palette.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: space['3'],
  },
});
