import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { XpBar } from '../components/XpBar';
import { StreakBadge } from '../components/StreakBadge';
import { AiraOrb } from '../components/AiraOrb';
import { AiraMessage } from '../components/AiraMessage';
import { GradientButton } from '../components/GradientButton';
import { useUserStore } from '../store/userStore';
import { getProgress, getUserLimits } from '../api/client';
import { colors, typography, spacing, radius } from '../theme';
import type { RootStackParamList, TabParamList } from '../types';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: NavigationProp;
}

const topics = [
  { name: 'Foundations', icon: '\u2728', difficulty: 1 },
  { name: 'Critical\nThinking', icon: '\uD83E\uDDE0', difficulty: 2 },
  { name: 'Practical', icon: '\u26A1', difficulty: 3 },
  { name: 'Tools', icon: '\uD83D\uDEE0\uFE0F', difficulty: 2 },
  { name: 'Creating', icon: '\uD83D\uDCBB', difficulty: 4 },
];

export function DashboardScreen({ navigation }: Props) {
  const { name, xp, level, streak, tier, lessonsCompletedToday, dailyLimit, totalLessonsCompleted, userId } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);
  const setUser = useUserStore((s) => s.setUser);
  const xpForNextLevel = (level ** 2) * 50;

  const [offline, setOffline] = useState(false);
  const [canTakeLesson, setCanTakeLesson] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const syncProgress = useCallback(async () => {
    if (!userId || userId.startsWith('offline_')) return;
    try {
      const [progress, limits] = await Promise.all([
        getProgress(userId),
        getUserLimits(userId),
      ]);
      syncFromBackend({
        xp: progress.xp,
        level: progress.level,
        streak: progress.streak,
        tier: progress.tier,
        totalLessonsCompleted: progress.totalLessonsCompleted,
        lessonsCompletedToday: limits.lessonsToday,
        dailyLimit: limits.dailyLimit,
      });
      setCanTakeLesson(limits.canTakeLesson);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [userId]);

  // Fetch real progress on every screen focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      syncProgress();
      return () => { cancelled = true; };
    }, [syncProgress])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncProgress();
    setRefreshing(false);
  }, [syncProgress]);

  const atLimit = tier === 'free' && !canTakeLesson;
  const limitNum = typeof dailyLimit === 'number' ? dailyLimit : 0;

  const handleContinueLearning = () => {
    if (atLimit) {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate('Lesson', {});
    }
  };

  const getLimitText = (): string => {
    if (tier === 'pro') return 'Unlimited lessons';
    if (lessonsCompletedToday >= limitNum && limitNum > 0) {
      return `Today: ${lessonsCompletedToday} of ${limitNum} done. See you tomorrow, or go Pro`;
    }
    if (lessonsCompletedToday === limitNum - 1) {
      return `Today: ${lessonsCompletedToday} of ${limitNum} lessons — one more left`;
    }
    return `Today: ${lessonsCompletedToday} of ${limitNum} lessons`;
  };

  return (
    <ScreenContainer
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.airaGlow}
          colors={[colors.purple]}
          progressBackgroundColor={colors.bgCard}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <AiraOrb size={48} intensity="calm" />
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>
              {streak === 0
                ? `Hey ${name}. Let's start something.`
                : streak >= 7
                ? `Hey ${name}. ${streak} days strong. Proud of you.`
                : `Hey ${name}. Day ${streak} — ready when you are.`}
            </Text>
          </View>
        </View>
        <StreakBadge streak={streak} />
      </View>

      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — showing last saved data</Text>
        </View>
      )}

      {/* XP Bar */}
      <View style={styles.xpSection}>
        <XpBar currentXp={xp} level={level} xpForNextLevel={xpForNextLevel} />
      </View>

      {/* Continue Learning */}
      <Card
        onPress={handleContinueLearning}
        style={[styles.continueCard, atLimit && styles.continueCardDisabled]}
      >
        {atLimit ? (
          <View style={styles.continueDisabledInner}>
            <AiraOrb size={40} intensity="calm" />
            <Text style={styles.continueDisabledText}>
              You've finished today's lessons. Rest, or unlock unlimited.
            </Text>
          </View>
        ) : (
          <LinearGradient
            colors={[...colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueLabel}>Continue Learning</Text>
            <Text style={styles.continueTitle}>Next Lesson</Text>
            <Text style={styles.continueSubtitle}>Tap to start</Text>
          </LinearGradient>
        )}
      </Card>

      {/* Limit indicator */}
      <Pressable
        onPress={atLimit ? () => navigation.navigate('Paywall') : undefined}
        style={styles.limitRow}
      >
        <Text style={[styles.limitText, tier === 'pro' && styles.limitTextPro]}>
          {getLimitText()}
        </Text>
        {atLimit && <Text style={styles.limitArrow}>{'\u2197'}</Text>}
      </Pressable>

      {/* Topics */}
      <Text style={styles.sectionTitle}>Topics</Text>
      <View style={styles.topicsGrid}>
        {topics.map((topic) => (
          <Card
            key={topic.name}
            onPress={() => navigation.navigate('Topic', { topicName: topic.name.replace('\n', ' ') })}
            style={styles.topicCard}
          >
            <Text style={styles.topicIcon}>{topic.icon}</Text>
            <Text style={styles.topicName}>{topic.name}</Text>
            <View style={styles.difficultyRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.star, i < topic.difficulty && styles.starFilled]}
                />
              ))}
            </View>
          </Card>
        ))}
      </View>
      <View style={styles.bottomSpacer} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  offlineBanner: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  offlineText: {
    ...typography.caption,
    color: colors.warning,
  },
  xpSection: {
    marginBottom: spacing.lg,
  },
  continueCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  continueCardDisabled: {
    opacity: 0.8,
  },
  continueGradient: {
    padding: spacing.lg,
    borderRadius: radius.xl - 1,
  },
  continueDisabledInner: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  continueDisabledText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  continueLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  continueTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  continueSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  limitText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  limitTextPro: {
    color: colors.airaGlow,
  },
  limitArrow: {
    color: colors.airaGlow,
    fontSize: 14,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  topicCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  topicIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  topicName: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  starFilled: {
    backgroundColor: colors.warning,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
