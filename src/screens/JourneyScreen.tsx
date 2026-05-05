import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Journey tab — shows the long-arc roadmap so users feel where they are
 * heading. We split the 90-day journey into three phases. Each phase card
 * uses one of the brand gradients and lists what gets unlocked.
 *
 * This is intentionally a static "north star" screen for now — once we wire
 * cohort progress data we'll fill in the per-phase progress chips.
 */

interface Phase {
  id: string;
  weekRange: string;
  title: string;
  blurb: string;
  unlocks: string[];
  gradient: readonly [string, string, ...string[]];
}

const PHASES: Phase[] = [
  {
    id: 'phase-1',
    weekRange: 'Weeks 1–4',
    title: 'Get fluent',
    blurb: 'Stop fighting the AI. Learn to ask cleanly so the answers stop being beige.',
    unlocks: [
      'The 3-second test for any prompt',
      'Audience + format + tone',
      'Your first prompt library (10 templates)',
    ],
    gradient: ['#6366F1', '#8B5CF6'] as const,
  },
  {
    id: 'phase-2',
    weekRange: 'Weeks 5–8',
    title: 'Get sharp',
    blurb: 'Spot hallucinations, force counter-arguments, and stop trusting the first answer.',
    unlocks: [
      'The 3-question trust test',
      'Chain-of-thought on hard decisions',
      'Asking AI to disagree with itself',
    ],
    gradient: ['#EC4899', '#F59E0B'] as const,
  },
  {
    id: 'phase-3',
    weekRange: 'Weeks 9–12',
    title: 'Get dangerous',
    blurb: 'Ship real things. Build with AI as a partner — code, content, decisions.',
    unlocks: [
      'A weekend side-project shipped',
      'A personal style the AI mirrors',
      'A workflow you can teach a friend',
    ],
    gradient: ['#F59E0B', '#EC4899', '#8B5CF6'] as const,
  },
];

export function JourneyScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(260)}>
        <Text style={styles.eyebrow}>YOUR 90-DAY JOURNEY</Text>
        <Text style={styles.headline}>From curious to dangerous.</Text>
        <Text style={styles.sub}>
          AIRA is built around three phases. Each one is a real shift in how you use AI — not just more lessons.
        </Text>
      </Animated.View>

      {PHASES.map((phase, i) => (
        <Animated.View
          key={phase.id}
          entering={FadeInDown.duration(260).delay(150 + i * 120)}
          style={styles.phaseWrap}
        >
          <LinearGradient
            colors={phase.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.phaseHeader}
          >
            <Text style={styles.phaseRange}>{phase.weekRange}</Text>
            <Text style={styles.phaseTitle}>{phase.title}</Text>
            <Text style={styles.phaseBlurb}>{phase.blurb}</Text>
          </LinearGradient>

          <View style={styles.unlockBox}>
            <Text style={styles.unlockTitle}>You'll unlock</Text>
            {phase.unlocks.map((u) => (
              <View key={u} style={styles.unlockRow}>
                <Text style={styles.unlockDot}>•</Text>
                <Text style={styles.unlockText}>{u}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ))}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.airaGlow,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  phaseWrap: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phaseHeader: {
    padding: spacing.lg,
  },
  phaseRange: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xs,
  },
  phaseTitle: {
    ...typography.headline,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  phaseBlurb: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
  },
  unlockBox: {
    padding: spacing.lg,
  },
  unlockTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  unlockDot: {
    ...typography.body,
    color: colors.airaCore,
    marginRight: spacing.sm,
  },
  unlockText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0, // RN-Web fix: prevents per-letter wrap
  },
  bottomSpace: { height: 100 }, // floating tab bar clearance
});
