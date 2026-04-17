import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AiraOrb } from './AiraOrb';
import { AiraMessage } from './AiraMessage';
import { GradientButton } from './GradientButton';
import { colors, typography, spacing, radius } from '../theme';

interface FeedbackOverlayProps {
  correct: boolean;
  explanation: string;
  airaFeedback: string | null;
  xpEarned: number;
  onContinue: () => void;
}

export function FeedbackOverlay({
  correct,
  explanation,
  airaFeedback,
  xpEarned,
  onContinue,
}: FeedbackOverlayProps) {
  return (
    <Animated.View entering={FadeInDown.duration(350).springify()} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AiraOrb size={48} intensity={correct ? 'celebrating' : 'calm'} />
          <View style={styles.resultBadge}>
            <View style={[styles.dot, correct ? styles.dotCorrect : styles.dotIncorrect]} />
            <Text style={[styles.resultText, correct ? styles.textCorrect : styles.textIncorrect]}>
              {correct ? 'Correct' : 'Not quite'}
            </Text>
            {xpEarned > 0 && (
              <Text style={styles.xpText}>+{xpEarned} XP</Text>
            )}
          </View>
        </View>

        {airaFeedback && (
          <View style={styles.airaSection}>
            <AiraMessage message={airaFeedback} typewriter />
          </View>
        )}

        <View style={styles.explanationCard}>
          <Text style={styles.explanationLabel}>Why?</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continue"
          onPress={onContinue}
          variant={correct ? 'success' : 'primary'}
          fullWidth
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '65%',
    paddingTop: spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  dotCorrect: {
    backgroundColor: colors.success,
  },
  dotIncorrect: {
    backgroundColor: colors.error,
  },
  resultText: {
    ...typography.h3,
  },
  textCorrect: {
    color: colors.success,
  },
  textIncorrect: {
    color: colors.error,
  },
  xpText: {
    ...typography.bodyBold,
    color: colors.warning,
    marginLeft: 'auto',
  },
  airaSection: {
    marginBottom: spacing.lg,
  },
  explanationCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  explanationText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
});
