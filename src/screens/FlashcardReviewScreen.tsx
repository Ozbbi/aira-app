import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  FadeIn,
  ZoomIn,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette, radii, space, text, elevation, gradients } from '../theme/system';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import type { Flashcard, FlashcardDeck, RecallRating } from '../data/flashcards';
import { getDueCards } from '../data/flashcards';
import type { RootStackParamList } from '../types';

/**
 * Flashcard review — Tinder-style swipeable cards with a 3D flip to
 * reveal the back, plus SM-2-driven scheduling under the hood.
 *
 * Phase machine:
 *   loading  — first paint, picks deck + due cards
 *   review   — the swipe loop
 *   empty    — deck exists but no cards due today (with an override
 *              button to force-review the whole deck)
 *   done     — all session cards reviewed, summary card with XP bonus
 *
 * Swipe rules:
 *   • PanGestureHandler with activeOffsetX([-15, 15]) + failOffsetY([-30, 30])
 *     so vertical scrolls don't accidentally trigger.
 *   • Card translates with the finger + rotates ±15° max.
 *   • Right swipe past threshold → rating 4 (correct).
 *   • Left swipe past threshold → rating 1 (incorrect).
 *   • Below threshold → spring back to centre.
 *   • Velocity > 800px/s also counts as a commit.
 *
 * Flip rules:
 *   • Card starts face-down (front visible). Tap to reveal back via
 *     rotateY 180deg. Tap again to flip back.
 *   • Swiping a card that hasn't been flipped is allowed but counts the
 *     swipe — the brief said "user thinks, then taps to reveal" but UX
 *     research says some users swipe-without-flipping when they're
 *     confident. We don't punish that.
 */

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FlashcardReview'>;
  route: RouteProp<RootStackParamList, 'FlashcardReview'>;
}

type Phase = 'loading' | 'review' | 'empty' | 'done';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;
const VELOCITY_THRESHOLD = 800;

export function FlashcardReviewScreen({ navigation, route }: Props) {
  const { deckId, forceAll } = route.params;
  const allDecks = useUserStore((s) => s.flashcardDecks);
  const reviewFlashcard = useUserStore((s) => s.reviewFlashcard);
  const addXp = useUserStore((s) => s.addXp);

  const deck: FlashcardDeck | undefined = useMemo(
    () => allDecks.find((d) => d.id === deckId),
    [allDecks, deckId],
  );

  // Snapshot the cards to review at session start. We do NOT recompute
  // due cards as the user reviews — otherwise a card moved to nextDay
  // would vanish mid-swipe.
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Initial pick
  useEffect(() => {
    if (!deck) {
      setPhase('empty');
      return;
    }
    const cards = forceAll ? [...deck.cards] : getDueCards(deck);
    if (cards.length === 0) {
      setPhase('empty');
      return;
    }
    setSessionCards(cards);
    setPhase('review');
  }, [deck, forceAll]);

  /* ──────────── animated card geometry ──────────── */

  const x = useSharedValue(0);
  const flip = useSharedValue(0); // 0 = front, 1 = back

  const onCommitSwipe = useCallback(
    (rating: RecallRating) => {
      const card = sessionCards[index];
      if (!card) return;
      // Persist the SM-2-updated card
      reviewFlashcard(card.deckId, card.id, rating);
      addXp(1);
      if (rating >= 3) setCorrectCount((c) => c + 1);
      else setWrongCount((c) => c + 1);

      // Tactile feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(
          rating >= 3
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        ).catch(() => {});
        setTimeout(() => {
          Haptics.notificationAsync(
            rating >= 3
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Error
          ).catch(() => {});
        }, 60);
      }

      const nextIdx = index + 1;
      if (nextIdx >= sessionCards.length) {
        // Perfect-session bonus
        if (wrongCount === 0 && rating >= 3) addXp(5);
        setPhase('done');
      } else {
        setIndex(nextIdx);
        setFlipped(false);
        x.value = 0;
        flip.value = 0;
      }
    },
    [sessionCards, index, reviewFlashcard, addXp, wrongCount, x, flip],
  );

  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-30, 30])
    .onUpdate((e) => {
      'worklet';
      x.value = e.translationX;
    })
    .onEnd((e) => {
      'worklet';
      const passed =
        e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;
      const failed =
        e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      if (passed) {
        x.value = withTiming(SCREEN_W * 1.5, { duration: 220 });
        runOnJS(onCommitSwipe)(4);
      } else if (failed) {
        x.value = withTiming(-SCREEN_W * 1.5, { duration: 220 });
        runOnJS(onCommitSwipe)(1);
      } else {
        x.value = withSpring(0, { damping: 16, stiffness: 240 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      {
        rotate: `${interpolate(
          x.value,
          [-SCREEN_W / 2, 0, SCREEN_W / 2],
          [-15, 0, 15],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  // Two faces of the card. Front rotates 0→180, back rotates 180→360, so
  // exactly one face is visible at any time.
  const frontFaceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: interpolate(flip.value, [0, 0.5, 0.5001, 1], [1, 1, 0, 0], Extrapolation.CLAMP),
  }));
  const backFaceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: interpolate(flip.value, [0, 0.4999, 0.5, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
  }));

  const onFlip = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setFlipped((f) => {
      flip.value = withTiming(f ? 0 : 1, { duration: 380, easing: Easing.inOut(Easing.cubic) });
      return !f;
    });
  }, [flip]);

  // Hint overlays (CORRECT / WRONG) grow with drag
  const correctHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const wrongHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  /* ──────────── loading ──────────── */

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.loading}>Loading deck…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ──────────── empty ──────────── */

  if (phase === 'empty') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.wrap}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>All caught up.</Text>
            <Text style={styles.emptyBody}>
              {deck
                ? "No cards due in this deck today. Come back tomorrow — or force-review everything now."
                : "Couldn't find that deck."}
            </Text>
            {deck && deck.cards.length > 0 ? (
              <View style={styles.emptyActions}>
                <Button
                  label="Review everything anyway"
                  onPress={() => {
                    setSessionCards([...deck.cards]);
                    setPhase('review');
                    setIndex(0);
                    setCorrectCount(0);
                    setWrongCount(0);
                  }}
                  variant="primary"
                  size="md"
                  fullWidth
                />
                <Button
                  label="Back"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  size="md"
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.emptyActions}>
                <Button label="Back" onPress={() => navigation.goBack()} variant="primary" size="md" fullWidth />
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ──────────── done ──────────── */

  if (phase === 'done') {
    const perfect = wrongCount === 0;
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.wrap}>
          <View style={styles.centered}>
            <Animated.View entering={ZoomIn.duration(280)}>
              <Text style={styles.summaryEyebrow}>SESSION COMPLETE</Text>
              <Text style={styles.summaryScore}>
                {correctCount}
                <Text style={styles.summaryScoreOf}> / {sessionCards.length}</Text>
              </Text>
              <Text style={styles.summarySub}>
                {perfect ? 'Perfect run. +5 XP bonus.' : `${wrongCount} card${wrongCount === 1 ? '' : 's'} to revisit soon.`}
              </Text>
              <Text style={styles.summaryXp}>+{sessionCards.length + (perfect ? 5 : 0)} XP earned</Text>
            </Animated.View>
          </View>
          <View style={{ gap: space['3'] }}>
            <Button label="Done" onPress={() => navigation.goBack()} variant="primary" size="lg" fullWidth />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ──────────── review (main) ──────────── */

  const card = sessionCards[index];
  if (!card) {
    // shouldn't happen, but bail gracefully
    setPhase('done');
    return null;
  }

  const remaining = sessionCards.length - index;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerMeta}>
            <View style={styles.chip}>
              <Text style={styles.chipNum}>{remaining}</Text>
              <Text style={styles.chipUnit}>left</Text>
            </View>
            <View style={styles.scoreSplit}>
              <Text style={styles.scoreCorrect}>{correctCount}</Text>
              <Text style={styles.scoreSep}>·</Text>
              <Text style={styles.scoreWrong}>{wrongCount}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setPhase('done')}
            hitSlop={12}
            style={styles.endBtn}
          >
            <Text style={styles.endBtnText}>End</Text>
          </Pressable>
        </View>

        {/* Hint overlays */}
        <View pointerEvents="none" style={styles.hints}>
          <Animated.View style={[styles.hint, styles.hintWrong, wrongHintStyle]}>
            <Text style={styles.hintText}>WRONG</Text>
          </Animated.View>
          <Animated.View style={[styles.hint, styles.hintCorrect, correctHintStyle]}>
            <Text style={styles.hintText}>CORRECT</Text>
          </Animated.View>
        </View>

        {/* Card stack */}
        <View style={styles.stack}>
          <GestureDetector gesture={swipe}>
            <Animated.View style={[styles.cardBase, cardStyle]}>
              {/* Front face */}
              <Animated.View style={[styles.face, frontFaceStyle]}>
                <Pressable onPress={onFlip} style={styles.faceInner}>
                  <Text style={styles.faceLabel}>FRONT · tap to flip</Text>
                  <Text style={styles.faceText}>{card.front}</Text>
                  <Text style={styles.faceHint}>Think first, then flip.</Text>
                </Pressable>
              </Animated.View>

              {/* Back face */}
              <Animated.View style={[styles.face, styles.faceBack, backFaceStyle]}>
                <Pressable onPress={onFlip} style={styles.faceInner}>
                  <Text style={styles.faceLabel}>ANSWER</Text>
                  <Text style={styles.faceTextBack}>{card.back}</Text>
                  <Text style={styles.faceHint}>Swipe right if you knew it, left if not.</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Tap-button fallback for non-swipers */}
        <View style={styles.tapRow}>
          <Pressable
            onPress={() => {
              x.value = withTiming(-SCREEN_W * 1.5, { duration: 200 });
              onCommitSwipe(1);
            }}
            style={({ pressed }) => [styles.tapBtn, styles.tapWrong, pressed && { opacity: 0.85 }]}
            hitSlop={8}
          >
            <Text style={styles.tapWrongText}>Didn't know</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              x.value = withTiming(SCREEN_W * 1.5, { duration: 200 });
              onCommitSwipe(4);
            }}
            style={({ pressed }) => [styles.tapBtn, styles.tapCorrect, pressed && { opacity: 0.85 }]}
            hitSlop={8}
          >
            <Text style={styles.tapCorrectText}>Knew it</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ───────────────────────────── styles ───────────────────────────── */

const CARD_W = Math.min(340, SCREEN_W - space['6'] * 2);
const CARD_H = 420;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  wrap: { flex: 1, paddingHorizontal: space['6'], paddingTop: space['2'], paddingBottom: space['4'] },
  back: { paddingVertical: space['2'] },
  backIcon: { fontFamily: 'Inter_700Bold', fontSize: 32, color: palette.textPrimary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { ...text.body, color: palette.textSecondary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: space['3'] },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: space['3'],
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: palette.bgRaised,
    borderColor: palette.border,
    borderWidth: 1,
    gap: 4,
  },
  chipNum: { fontFamily: 'Inter_700Bold', fontSize: 16, color: palette.textPrimary },
  chipUnit: { ...text.caption, color: palette.textMuted },
  scoreSplit: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreCorrect: { fontFamily: 'Inter_700Bold', fontSize: 14, color: palette.success },
  scoreSep: { color: palette.textMuted, fontSize: 14 },
  scoreWrong: { fontFamily: 'Inter_700Bold', fontSize: 14, color: palette.danger },
  endBtn: { padding: space['2'] },
  endBtnText: { ...text.button, color: palette.textSecondary, fontSize: 14 },

  // Stack
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBase: {
    width: CARD_W,
    height: CARD_H,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.bgRaised,
    borderRadius: 20,
    borderColor: palette.border,
    borderWidth: 1,
    ...elevation.lg,
    backfaceVisibility: 'hidden' as any,
  },
  faceBack: {
    backgroundColor: palette.bgRaised2,
    borderColor: palette.brand,
  },
  faceInner: {
    flex: 1,
    padding: space['6'],
    justifyContent: 'space-between',
  },
  faceLabel: { ...text.label, color: palette.brandSoft },
  faceText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  faceTextBack: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    lineHeight: 26,
    color: palette.textPrimary,
  },
  faceHint: { ...text.caption, color: palette.textMuted },

  // Hint overlays
  hints: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space['8'],
    zIndex: 5,
  },
  hint: {
    paddingHorizontal: space['4'],
    paddingVertical: space['2'],
    borderWidth: 2,
    borderRadius: radii.sm,
  },
  hintWrong: { borderColor: palette.danger },
  hintCorrect: { borderColor: palette.success },
  hintText: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: 2, color: '#FFFFFF' },

  // Tap fallback
  tapRow: { flexDirection: 'row', gap: space['3'], marginTop: space['4'] },
  tapBtn: {
    flex: 1,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  tapWrong: { borderColor: palette.danger, backgroundColor: palette.dangerSoft },
  tapWrongText: { ...text.button, color: palette.danger, fontFamily: 'Inter_700Bold' },
  tapCorrect: { borderColor: palette.success, backgroundColor: palette.successSoft },
  tapCorrectText: { ...text.button, color: palette.success, fontFamily: 'Inter_700Bold' },

  // Empty
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: space['2'],
  },
  emptyBody: { ...text.body, color: palette.textSecondary, textAlign: 'center', maxWidth: 320 },
  emptyActions: { marginTop: space['6'], gap: space['3'], width: '100%' },

  // Summary
  summaryEyebrow: { ...text.label, color: palette.brandSoft, textAlign: 'center', marginBottom: space['2'] },
  summaryScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 72,
    lineHeight: 78,
    color: palette.brandSoft,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  summaryScoreOf: { fontSize: 28, color: palette.textSecondary },
  summarySub: { ...text.body, color: palette.textSecondary, textAlign: 'center', marginTop: space['2'] },
  summaryXp: { ...text.bodyEmphasis, color: palette.success, textAlign: 'center', marginTop: space['3'] },
});
