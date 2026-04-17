import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  runOnJS,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { AiraOrb } from './AiraOrb';
import { AiraMessage } from './AiraMessage';
import { GradientButton } from './GradientButton';
import { colors, typography, spacing, radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface LessonCompleteProps {
  correctCount: number;
  totalCount: number;
  xpEarned: number;
  airaOutro: string;
  lessonTitle: string;
  onFinish: () => void;
  leveledUp?: boolean;
  newLevel?: number;
}

// Confetti piece — deterministic per index, so it doesn't re-shuffle on re-render.
interface PieceProps {
  index: number;
  delay: number;
}

const CONFETTI_COLORS = ['#7C3AED', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#3B82F6'];

function ConfettiPiece({ index, delay }: PieceProps) {
  const startX = (index * 73) % SCREEN_W; // pseudo-random but stable
  const driftX = (((index * 37) % 80) - 40); // -40..40
  const rot = ((index * 53) % 360);
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 4) * 2;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1800 + (index % 5) * 120, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftX * progress.value },
      { translateY: interpolate(progress.value, [0, 1], [-40, 700]) },
      { rotate: `${rot + progress.value * 540}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        style,
        {
          left: startX,
          backgroundColor: color,
          width: size,
          height: size * 2,
          borderRadius: 1,
        },
      ]}
    />
  );
}

export function LessonComplete({
  correctCount,
  totalCount,
  xpEarned,
  airaOutro,
  lessonTitle,
  onFinish,
  leveledUp = false,
  newLevel,
}: LessonCompleteProps) {
  const accuracy = Math.round((correctCount / totalCount) * 100);

  // Count-up XP
  const xpProgress = useSharedValue(0);
  const [displayXp, setDisplayXp] = useState(0);

  // Accuracy bar
  const barWidth = useSharedValue(0);

  // Level-up badge pulse
  const badgeScale = useSharedValue(0);
  const badgeGlow = useSharedValue(0);

  useEffect(() => {
    xpProgress.value = withDelay(
      700,
      withTiming(xpEarned, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
    barWidth.value = withDelay(600, withTiming(accuracy, { duration: 1000 }));

    if (leveledUp) {
      badgeScale.value = withDelay(
        1400,
        withSequence(
          withSpring(1.2, { damping: 6, stiffness: 180 }),
          withSpring(1, { damping: 12, stiffness: 140 })
        )
      );
      badgeGlow.value = withDelay(
        1400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 900 }),
            withTiming(0.4, { duration: 900 })
          ),
          -1,
          true
        )
      );
    }
  }, [xpEarned, accuracy, leveledUp]);

  useAnimatedReaction(
    () => Math.round(xpProgress.value),
    (v, prev) => {
      if (v !== prev) runOnJS(setDisplayXp)(v);
    }
  );

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%` as `${number}%`,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const badgeGlowStyle = useAnimatedStyle(() => ({
    opacity: badgeGlow.value,
    shadowOpacity: badgeGlow.value,
  }));

  const confettiCount = accuracy >= 80 ? 40 : 24;

  return (
    <View style={styles.container}>
      {/* Confetti layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <ConfettiPiece key={i} index={i} delay={i * 25} />
        ))}
      </View>

      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.orbArea}>
        <AiraOrb size={100} intensity="celebrating" />
      </Animated.View>

      {leveledUp && newLevel !== undefined && (
        <Animated.View
          entering={ZoomIn.delay(1400).duration(500).springify()}
          style={[styles.levelBadgeWrap, badgeStyle]}
        >
          <Animated.View style={[styles.levelBadgeGlow, badgeGlowStyle]} />
          <LinearGradient
            colors={[...colors.gradientAccent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelBadge}
          >
            <Text style={styles.levelBadgeSub}>LEVEL UP</Text>
            <Text style={styles.levelBadgeNum}>{newLevel}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(400).duration(400)}>
        <Text style={styles.title}>Lesson Complete</Text>
        <Text style={styles.lessonName}>{lessonTitle}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{correctCount}/{totalCount}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.xpValue]}>+{displayXp}</Text>
          <Text style={styles.statLabel}>XP Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.accuracyBar}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFillWrap, barStyle]}>
            <LinearGradient
              colors={accuracy >= 80 ? [...colors.gradientSuccess] : [...colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barFill}
            />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(1000).duration(400)} style={styles.airaSection}>
        <AiraMessage message={airaOutro} typewriter />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(1400).duration(400)} style={styles.footer}>
        <GradientButton title="Continue" onPress={onFinish} fullWidth haptic="heavy" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  orbArea: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  levelBadgeWrap: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  levelBadgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    shadowColor: colors.airaGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 12,
  },
  levelBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  levelBadgeSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    fontWeight: '700',
  },
  levelBadgeNum: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  lessonName: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  xpValue: {
    color: colors.warning,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  accuracyBar: {
    marginBottom: spacing.xl,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFillWrap: {
    height: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    flex: 1,
  },
  airaSection: {
    marginBottom: spacing.xl,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
