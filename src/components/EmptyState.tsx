import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../theme';
import { PressableCard } from './PressableCard';

/**
 * Empty / error state with AIRA personality. Uses a static orb glyph
 * (the SVG-rendered icon would be heavier here than it's worth). The CTA
 * is optional — without it, this is a pure tell-the-user-what's-up panel.
 */
type Mood = 'thinking' | 'encouraging' | 'calm' | 'celebrating';

interface Props {
  mood?: Mood;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

const moodEmoji: Record<Mood, string> = {
  thinking: '🤔',
  encouraging: '✨',
  calm: '🌙',
  celebrating: '🎉',
};

export function EmptyState({ mood = 'encouraging', title, body, ctaLabel, onCtaPress }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.orbWrap}>
        <LinearGradient
          colors={['rgba(139,92,246,0.25)', 'rgba(139,92,246,0)']}
          style={styles.orbGlow}
        />
        <Text style={styles.orbEmoji}>{moodEmoji[mood]}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}

      {ctaLabel && onCtaPress ? (
        <PressableCard onPress={onCtaPress} style={styles.ctaWrap} hapticStrength="medium">
          <LinearGradient
            colors={colors.gradientLesson}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
          </LinearGradient>
        </PressableCard>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  orbWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  orbGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  orbEmoji: { fontSize: 56 },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaWrap: {
    marginTop: spacing.lg,
  },
  cta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    minWidth: 180,
    alignItems: 'center',
  },
  ctaLabel: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
