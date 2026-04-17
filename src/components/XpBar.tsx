import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../theme';

interface XpBarProps {
  currentXp: number;
  level: number;
  xpForNextLevel: number;
}

export function XpBar({ currentXp, level, xpForNextLevel }: XpBarProps) {
  const xpInLevel = currentXp - ((level - 1) ** 2) * 50;
  const xpNeeded = xpForNextLevel - ((level - 1) ** 2) * 50;
  const pct = Math.min(xpInLevel / xpNeeded, 1);
  const isFull = pct >= 0.999;

  const width = useSharedValue(0);
  const shimmerX = useSharedValue(-1);
  const glow = useSharedValue(0);

  useEffect(() => {
    // Smooth easeOutCubic fill — premium, decisive feel
    width.value = withTiming(pct, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    if (isFull) {
      // Glow pulse: bar is full → ready to level up
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [pct, isFull]);

  useEffect(() => {
    // Continuous subtle shimmer that crosses the bar every few seconds
    shimmerX.value = withRepeat(
      withSequence(
        withDelay(1200, withTiming(1, { duration: 1400, easing: Easing.linear })),
        withTiming(-1, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as `${number}%`,
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    shadowOpacity: glow.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerX.value,
          [-1, 1],
          [-80, 220],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(shimmerX.value, [-1, -0.8, 0, 0.8, 1], [0, 0.6, 0.9, 0.6, 0]),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.level}>Level {level}</Text>
        <Text style={styles.xpText}>
          {xpInLevel} / {xpNeeded} XP
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFill]}>
          <LinearGradient
            colors={[...colors.gradientXp]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
          {/* Shimmer streak — only visible while bar has any width */}
          <Animated.View pointerEvents="none" style={[styles.shimmer, shimmerStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerInner}
            />
          </Animated.View>
        </Animated.View>
        {/* Level-up ready glow */}
        <Animated.View pointerEvents="none" style={[styles.glow, animatedGlow]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  level: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  xpText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  track: {
    height: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
  shimmerInner: {
    flex: 1,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    shadowColor: colors.airaGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },
});
