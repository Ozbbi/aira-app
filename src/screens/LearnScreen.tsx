import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../theme';
import { INSIGHTS, PATTERNS, MISTAKES, QUICK_WINS } from '../data';
import { haptics } from '../utils/haptics';

/**
 * Learn tab — the AIRA "library." Insights, patterns, mistakes, quick wins.
 *
 * UX note: a single ScrollView with a horizontal section pill row at the top
 * acts as a tab-within-tab so users can find content fast without leaving the
 * tab. We keep one screen rather than a nested stack so the back-button story
 * stays simple.
 */

type Section = 'insights' | 'patterns' | 'mistakes' | 'quickwins';

const SECTIONS: { id: Section; label: string; emoji: string; count: number }[] = [
  { id: 'insights', label: 'Insights', emoji: '💡', count: INSIGHTS.length },
  { id: 'patterns', label: 'Patterns', emoji: '🧩', count: PATTERNS.length },
  { id: 'mistakes', label: 'Mistakes', emoji: '⚠️', count: MISTAKES.length },
  { id: 'quickwins', label: 'Quick Wins', emoji: '⚡', count: QUICK_WINS.length },
];

export function LearnScreen() {
  const [active, setActive] = useState<Section>('insights');

  const onPick = (s: Section) => {
    haptics.select();
    setActive(s);
  };

  const body = useMemo(() => {
    switch (active) {
      case 'insights':
        return (
          <View>
            {INSIGHTS.map((it, i) => (
              <Animated.View
                key={it.id}
                entering={FadeInDown.duration(300).delay(i * 40)}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>{it.title}</Text>
                <Text style={styles.cardBody}>{it.body}</Text>
                <View style={styles.takeawayPill}>
                  <Text style={styles.takeawayText}>{it.takeaway}</Text>
                </View>
                <Text style={styles.metaText}>~{Math.round(it.readingTimeSec)}s read</Text>
              </Animated.View>
            ))}
          </View>
        );

      case 'patterns':
        return (
          <View>
            {PATTERNS.map((p, i) => (
              <Animated.View
                key={p.id}
                entering={FadeInDown.duration(300).delay(i * 40)}
                style={styles.card}
              >
                <Text style={styles.cardEyebrow}>PATTERN</Text>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardBody}>{p.useCase}</Text>
                <Text style={styles.codeBlockLabel}>TEMPLATE</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{p.template}</Text>
                </View>
                <Text style={styles.codeBlockLabel}>EXAMPLE</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{p.example}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        );

      case 'mistakes':
        return (
          <View>
            {MISTAKES.map((m, i) => (
              <Animated.View
                key={m.id}
                entering={FadeInDown.duration(300).delay(i * 40)}
                style={styles.card}
              >
                <Text style={styles.cardEyebrow}>COMMON MISTAKE</Text>
                <Text style={styles.cardTitle}>{m.title}</Text>
                <Text style={styles.miniLabel}>Why people do it</Text>
                <Text style={styles.cardBody}>{m.whyPeopleDoIt}</Text>
                <Text style={styles.miniLabel}>What it costs</Text>
                <Text style={styles.cardBody}>{m.whatItCosts}</Text>
                <Text style={styles.miniLabel}>The fix</Text>
                <Text style={[styles.cardBody, styles.fixText]}>{m.theFix}</Text>
              </Animated.View>
            ))}
          </View>
        );

      case 'quickwins':
        return (
          <View>
            {QUICK_WINS.map((q, i) => (
              <Animated.View
                key={q.id}
                entering={FadeInDown.duration(280).delay(i * 30)}
                style={[styles.card, styles.cardCompact]}
              >
                <Text style={styles.cardEyebrow}>60-SEC WIN</Text>
                <Text style={styles.cardTitle}>{q.title}</Text>
                <Text style={styles.cardBody}>{q.body}</Text>
              </Animated.View>
            ))}
          </View>
        );
    }
  }, [active]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(350)}>
        <Text style={styles.eyebrow}>LEARN</Text>
        <Text style={styles.headline}>Your AIRA library.</Text>
        <Text style={styles.sub}>Bite-sized reads you can finish on a coffee break.</Text>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillRowContent}
      >
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onPick(s.id)}
              style={[styles.pill, isActive && styles.pillActive]}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {s.emoji}  {s.label}  ·  {s.count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {body}

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
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  pillRow: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  pillRowContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.airaWhisper,
    borderColor: colors.airaCore,
  },
  pillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardCompact: {
    padding: spacing.md,
  },
  cardEyebrow: {
    ...typography.label,
    color: colors.airaGlow,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  miniLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  fixText: {
    color: colors.success,
    fontFamily: 'Inter_600SemiBold',
  },
  takeawayPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.airaWhisper,
    marginBottom: spacing.xs,
  },
  takeawayText: {
    ...typography.caption,
    color: colors.airaGlow,
    fontFamily: 'Inter_600SemiBold',
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  codeBlockLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  codeBlock: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  bottomSpace: { height: spacing.xl },
});
