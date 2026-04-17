import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { haptics } from '../utils/haptics';
import { colors, typography, spacing, radius } from '../theme';

interface StreakBadgeProps {
  streak: number;
  onPress?: () => void;
}

// Streak milestones — user gets a NEW dot when they cross one
const MILESTONES = [3, 7, 14, 30, 60, 100];

export function StreakBadge({ streak, onPress }: StreakBadgeProps) {
  // Subtle flame flicker — slight rotation + opacity pulse, never jumpy
  const flicker = useSharedValue(0);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 150 }),
        withTiming(0.7, { duration: 260 })
      ),
      -1,
      false
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + flicker.value * 0.15,
    transform: [
      { scale: 0.96 + flicker.value * 0.08 },
      { rotate: `${(flicker.value - 0.5) * 4}deg` },
    ],
  }));

  const isMilestone = useMemo(
    () => MILESTONES.includes(streak),
    [streak]
  );

  const handlePress = () => {
    haptics.tap();
    onPress?.();
  };

  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress ? handlePress : undefined} style={styles.badge}>
      <Animated.Text style={[styles.flame, flameStyle]}>
        {'\uD83D\uDD25'}
      </Animated.Text>
      <Text style={styles.count}>{streak}</Text>
      {isMilestone && (
        <View style={styles.newPill}>
          <Text style={styles.newText}>NEW</Text>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  flame: {
    fontSize: 16,
  },
  count: {
    ...typography.bodyBold,
    color: colors.warning,
  },
  newPill: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.warning,
  },
  newText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    color: '#1a0e00',
  },
});
