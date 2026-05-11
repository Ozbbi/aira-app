import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette, gradients, radii, space, text, elevation } from '../theme/system';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList } from '../types';

/**
 * "Prompt or Not?" — the first AIRA mini-game.
 *
 * The user gets a short piece of text. Decide:
 *   ← swipe LEFT  → BAD prompt   (vague, no audience, no format)
 *   → swipe RIGHT → GOOD prompt  (specific, audience, format clear)
 *
 * 30-second round, +10 XP per correct, streak multiplier x2 after 3 in a row.
 * The deck is shuffled per round; the game is replayable forever from a
 * curated bank of 24 specimens.
 *
 * Self-contained: no backend, no AI grading. Pure pattern recognition
 * training that makes the AI-Foundations lessons stickier.
 */

interface Card {
  text: string;
  isGood: boolean;
  /** One-line reason shown after the swipe to teach the user. */
  reason: string;
}

const BANK: Card[] = [
  // Good prompts
  {
    text: 'Write a 3-bullet summary of remote work productivity research for a busy CFO. No jargon.',
    isGood: true,
    reason: 'Names the audience (CFO), the format (3 bullets), and what to avoid (jargon).',
  },
  {
    text: 'Act as a senior editor. Rewrite this paragraph in plain English. Max 80 words. Keep the contractions.',
    isGood: true,
    reason: 'Role + format + length cap + style note. All four moves in one prompt.',
  },
  {
    text: 'Compare Postgres and MongoDB for a small SaaS app. Reply as a markdown table with columns: criterion, Postgres, MongoDB, winner.',
    isGood: true,
    reason: 'Names the comparison axis + forces the AI to pick a winner per row.',
  },
  {
    text: 'Explain photosynthesis to a curious 10-year-old. Use one analogy. Avoid the words "biological" and "complex."',
    isGood: true,
    reason: 'Specific audience, exact device (one analogy), banned words.',
  },
  {
    text: 'Draft a 120-word cold email to a Series A investor. Tone: confident but not pushy. End with one specific question.',
    isGood: true,
    reason: 'Length cap + tone + concrete ending requirement.',
  },
  {
    text: 'Brainstorm 8 names for a productivity app. Each name 5 letters or fewer. No "ly" suffixes.',
    isGood: true,
    reason: 'Count + length cap + ban. Constraints force creativity.',
  },
  {
    text: 'Summarise this paper in 3 sentences. Sentence 1: claim. Sentence 2: evidence. Sentence 3: implication.',
    isGood: true,
    reason: 'Specifies the shape of every sentence — not just length.',
  },
  {
    text: 'Roleplay as a sceptical investor. Ask me one question at a time. React in character. Stay sceptical.',
    isGood: true,
    reason: 'Role + interaction pattern + emotional constraint.',
  },
  {
    text: 'Translate this email into Turkish for a corporate audience. Keep the formal "siz" form. Preserve all numbers.',
    isGood: true,
    reason: 'Locale + register + a specific preservation rule.',
  },
  {
    text: 'Give me 3 different rewrites: bolder, dry-witty, and quietly confident. Number them. No intro paragraph.',
    isGood: true,
    reason: 'Forces tonal variants AND removes filler.',
  },
  {
    text: 'Act as a code reviewer. Find the 3 most important issues in this function. Cite the line number for each.',
    isGood: true,
    reason: 'Role + count + format (line numbers) + priority filter.',
  },
  {
    text: 'Write a LinkedIn post for engineering managers about hiring senior ICs. 140 words. No emojis. End with one rhetorical question.',
    isGood: true,
    reason: 'Audience + length + ban + closing rule. The whole package.',
  },

  // Bad prompts
  {
    text: 'Make it better.',
    isGood: false,
    reason: 'No audience, no shape, no criteria. AI has nothing to aim at.',
  },
  {
    text: 'Write something creative about climate change.',
    isGood: false,
    reason: '"Creative" is vibes. No format, no audience, no constraint.',
  },
  {
    text: 'Be smart about this.',
    isGood: false,
    reason: 'Adjective with no target. AI averages "smart" generically.',
  },
  {
    text: 'Tell me about marketing.',
    isGood: false,
    reason: 'Topic is huge, no audience, no format. Returns Wikipedia-grade fluff.',
  },
  {
    text: 'Help me write an email.',
    isGood: false,
    reason: 'No audience, no purpose, no tone, no length. Three follow-ups required.',
  },
  {
    text: 'Try harder this time.',
    isGood: false,
    reason: 'No new information. AI cannot "try harder" — only re-aim.',
  },
  {
    text: 'Give me a great prompt.',
    isGood: false,
    reason: 'Recursive vagueness. "Great" needs a target audience and task.',
  },
  {
    text: 'Be more professional.',
    isGood: false,
    reason: 'Vague adjective. Specify: "no contractions, no slang, no exclamations."',
  },
  {
    text: 'Make this less boring.',
    isGood: false,
    reason: 'No criteria. Tell the AI what specifically to cut and what to add.',
  },
  {
    text: 'Now do better.',
    isGood: false,
    reason: '"Better" needs a dimension: shorter, sharper, more concrete.',
  },
  {
    text: 'Write a good cover letter.',
    isGood: false,
    reason: 'No company, no role, no length, no candidate strengths.',
  },
  {
    text: 'Just explain it nicely.',
    isGood: false,
    reason: '"Nicely" is unmeasurable. Specify reading level + tone + length.',
  },
];

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

type Phase = 'ready' | 'playing' | 'result';

const SWIPE_THRESHOLD = 120;
const ROUND_SECONDS = 30;
const SCREEN_W = Dimensions.get('window').width;

export function PromptOrNotScreen({ navigation }: Props) {
  const addXp = useUserStore((s) => s.addXp);
  const [phase, setPhase] = useState<Phase>('ready');
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; reason: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Card position values (UI-thread Reanimated)
  const x = useSharedValue(0);
  const rotation = useSharedValue(0);

  const onRoundEnd = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('result');
    if (score > 0) addXp(score);
  }, [score, addXp]);

  // Round timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Defer state change to next tick so React doesn't batch with the
          // returned 0.
          setTimeout(() => onRoundEnd(), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, onRoundEnd]);

  const startRound = useCallback(() => {
    const shuffled = [...BANK].sort(() => Math.random() - 0.5).slice(0, 16);
    setDeck(shuffled);
    setIndex(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(ROUND_SECONDS);
    setLastFeedback(null);
    x.value = 0;
    rotation.value = 0;
    setPhase('playing');
  }, [x, rotation]);

  const advance = useCallback(
    (userChoseGood: boolean) => {
      const current = deck[index];
      if (!current) return;
      const correct = userChoseGood === current.isGood;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          correct
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
      }

      const newCombo = correct ? combo + 1 : 0;
      const multiplier = newCombo >= 3 ? 2 : 1;
      const xpEarned = correct ? 10 * multiplier : 0;

      setScore((s) => s + xpEarned);
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      setLastFeedback({ correct, reason: current.reason });

      // Briefly show feedback, then advance
      setTimeout(() => {
        x.value = 0;
        rotation.value = 0;
        setLastFeedback(null);
        if (index + 1 >= deck.length) {
          onRoundEnd();
        } else {
          setIndex((i) => i + 1);
        }
      }, 900);
    },
    [combo, deck, index, onRoundEnd, rotation, x]
  );

  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-30, 30])
    .onUpdate((e) => {
      'worklet';
      x.value = e.translationX;
      rotation.value = e.translationX / 18; // ~ -6° to 6°
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationX > SWIPE_THRESHOLD) {
        x.value = withSpring(SCREEN_W, { stiffness: 200, damping: 18 });
        rotation.value = withTiming(20);
        runOnJS(advance)(true);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        x.value = withSpring(-SCREEN_W, { stiffness: 200, damping: 18 });
        rotation.value = withTiming(-20);
        runOnJS(advance)(false);
      } else {
        x.value = withSpring(0, { stiffness: 200, damping: 18 });
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { rotate: `${rotation.value}deg` }],
  }));

  // Hint glow strength (left = red, right = green) based on drag offset
  const leftHintStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, -x.value / 200),
  }));
  const rightHintStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, x.value / 200),
  }));

  const card = deck[index];

  // -------------------- READY (intro) --------------------
  if (phase === 'ready') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.introWrap}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.introCenter}>
            <Text style={styles.introEyebrow}>MINI-GAME</Text>
            <Text style={styles.introTitle}>Prompt or Not?</Text>
            <Text style={styles.introBody}>
              You'll see a prompt. Decide fast:
              {'\n\n'}
              <Text style={styles.introBold}>Swipe right →</Text> if it's a good prompt.
              {'\n'}
              <Text style={styles.introBold}>← Swipe left</Text> if it's vague.
              {'\n\n'}
              30 seconds. +10 XP per correct. 3-in-a-row doubles your XP.
            </Text>
          </View>
          <Button label="Start round" onPress={startRound} variant="primary" size="lg" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  // -------------------- RESULT --------------------
  if (phase === 'result') {
    const correctCount = score / 10; // simple but ok for display
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.introWrap}>
          <View style={styles.introCenter}>
            <Animated.View entering={ZoomIn.duration(280)}>
              <Text style={styles.introEyebrow}>ROUND OVER</Text>
              <Text style={styles.resultScore}>+{score}<Text style={styles.resultXp}> XP</Text></Text>
              <Text style={styles.resultBest}>Best streak: {bestCombo}</Text>
            </Animated.View>
          </View>
          <View style={{ gap: space['3'] }}>
            <Button label="Play again" onPress={startRound} variant="primary" size="lg" fullWidth />
            <Button
              label="Back to Home"
              onPress={() => navigation.goBack()}
              variant="secondary"
              size="md"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------- PLAYING --------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.playHeader}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.timer}>
          <Text style={[styles.timerNum, timeLeft <= 5 && styles.timerNumDanger]}>{timeLeft}</Text>
          <Text style={styles.timerUnit}>s</Text>
        </View>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreText}>+{score}</Text>
          {combo >= 3 ? <Text style={styles.scoreBoost}>×2</Text> : null}
        </View>
      </View>

      <View style={styles.boardWrap}>
        {/* LEFT (BAD) hint */}
        <Animated.View
          style={[styles.hintBox, styles.hintLeft, leftHintStyle]}
          pointerEvents="none"
        >
          <Text style={styles.hintLabel}>BAD</Text>
        </Animated.View>
        {/* RIGHT (GOOD) hint */}
        <Animated.View
          style={[styles.hintBox, styles.hintRight, rightHintStyle]}
          pointerEvents="none"
        >
          <Text style={styles.hintLabel}>GOOD</Text>
        </Animated.View>

        {card ? (
          <GestureDetector gesture={swipe}>
            <Animated.View style={[styles.card, elevation.lg, cardStyle]}>
              <Text style={styles.cardEyebrow}>IS THIS A GOOD PROMPT?</Text>
              <Text style={styles.cardText}>"{card.text}"</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardHint}>← bad swipe</Text>
                <Text style={styles.cardHint}>swipe good →</Text>
              </View>
            </Animated.View>
          </GestureDetector>
        ) : null}

        {/* Inline feedback after a swipe */}
        {lastFeedback ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            style={[
              styles.feedback,
              { borderColor: lastFeedback.correct ? palette.success : palette.danger },
            ]}
          >
            <Text
              style={[
                styles.feedbackTitle,
                { color: lastFeedback.correct ? palette.success : palette.danger },
              ]}
            >
              {lastFeedback.correct ? 'Nice.' : 'Not quite.'}
            </Text>
            <Text style={styles.feedbackReason}>{lastFeedback.reason}</Text>
          </Animated.View>
        ) : null}

        {/* Tap buttons as a fallback for users who prefer not to swipe */}
        <View style={styles.tapRow}>
          <Pressable
            onPress={() => advance(false)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.tapBtn,
              styles.tapBtnBad,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.tapLabel}>Bad</Text>
          </Pressable>
          <Pressable
            onPress={() => advance(true)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.tapBtn,
              styles.tapBtnGood,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.tapLabel}>Good</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ───────────────────────────── styles ───────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  introWrap: {
    flex: 1,
    paddingHorizontal: space['5'],
    paddingTop: space['4'],
    paddingBottom: space['6'],
    justifyContent: 'space-between',
  },
  back: { paddingVertical: space['2'] },
  backIcon: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: palette.textPrimary,
  },
  introCenter: { flex: 1, justifyContent: 'center' },
  introEyebrow: { ...text.label, color: palette.brandSoft, marginBottom: space['2'] },
  introTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    lineHeight: 42,
    color: palette.textPrimary,
    marginBottom: space['4'],
    letterSpacing: -0.5,
  },
  introBody: {
    ...text.body,
    color: palette.textSecondary,
  },
  introBold: { fontFamily: 'Inter_700Bold', color: palette.textPrimary },

  // Result screen
  resultScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 64,
    lineHeight: 70,
    color: palette.brandSoft,
    marginVertical: space['3'],
    letterSpacing: -1,
  },
  resultXp: { fontSize: 24, color: palette.textSecondary },
  resultBest: { ...text.body, color: palette.textSecondary },

  // Play screen
  playHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space['5'],
    paddingTop: space['2'],
    paddingBottom: space['4'],
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: palette.bgRaised,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: space['4'],
    paddingVertical: space['1'],
    minWidth: 80,
    justifyContent: 'center',
  },
  timerNum: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: palette.textPrimary,
  },
  timerNumDanger: { color: palette.danger },
  timerUnit: { ...text.caption, color: palette.textMuted, marginLeft: 2 },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: palette.brandWash,
    borderRadius: radii.full,
    paddingHorizontal: space['4'],
    paddingVertical: space['1'],
    gap: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: palette.brandSoft,
  },
  scoreBoost: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: palette.accentWarm,
  },

  boardWrap: {
    flex: 1,
    paddingHorizontal: space['5'],
    paddingTop: space['2'],
    paddingBottom: space['6'],
    justifyContent: 'center',
  },
  hintBox: {
    position: 'absolute',
    top: '15%',
    paddingHorizontal: space['4'],
    paddingVertical: space['2'],
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: palette.brandSoft,
  },
  hintLeft: { left: space['5'], borderColor: palette.danger },
  hintRight: { right: space['5'], borderColor: palette.success },
  hintLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: 2,
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: palette.bgRaised,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space['6'],
    minHeight: 240,
    justifyContent: 'space-between',
  },
  cardEyebrow: { ...text.label, color: palette.brandSoft, marginBottom: space['4'] },
  cardText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space['4'],
  },
  cardHint: { ...text.caption, color: palette.textMuted },

  feedback: {
    position: 'absolute',
    bottom: 110,
    left: space['5'],
    right: space['5'],
    backgroundColor: palette.bgRaised2,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: space['4'],
  },
  feedbackTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 4 },
  feedbackReason: { ...text.bodySmall, color: palette.textPrimary },

  tapRow: {
    position: 'absolute',
    bottom: space['4'],
    left: space['5'],
    right: space['5'],
    flexDirection: 'row',
    gap: space['3'],
  },
  tapBtn: {
    flex: 1,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  tapBtnBad: {
    backgroundColor: palette.dangerSoft,
    borderColor: palette.danger,
  },
  tapBtnGood: {
    backgroundColor: palette.successSoft,
    borderColor: palette.success,
  },
  tapLabel: { ...text.button, fontSize: 17, color: palette.textPrimary, fontFamily: 'Inter_700Bold' },
});
