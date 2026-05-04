import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { colors, radius, spacing, typography } from '../theme';
import { getProgress, getCurriculum } from '../api/client';
import { useUserStore } from '../store/userStore';
import { getInsightOfTheDay } from '../data';
import type { RootStackParamList, TabParamList } from '../types';

// Past 7 days, oldest → today. We mark today as "active" (pulsing dot)
// and synthesise the past 6 from streak — if streak >= n, that day is filled.
// This is a temporary stand-in; once the backend exposes a per-day activity
// log, swap in the real series.
function buildWeekDots(streak: number): { day: string; filled: boolean; isToday: boolean }[] {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7; // Mon=0 .. Sun=6
  return Array.from({ length: 7 }).map((_, i) => {
    const offsetFromToday = todayIdx - i;
    const filled = offsetFromToday >= 0 && offsetFromToday < streak;
    return { day: labels[i], filled, isToday: i === todayIdx };
  });
}

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: NavigationProp;
}

interface Topic {
  emoji: string;
  label: string;
  lessonId: string;
  tier: 'free' | 'pro';
}

const topics: Topic[] = [
  { emoji: '✨', label: 'AI Basics', lessonId: 'foundations_1', tier: 'free' },
  { emoji: '🧠', label: 'Thinking', lessonId: 'critical_1', tier: 'pro' },
  { emoji: '⚡', label: 'Prompts', lessonId: 'power_1', tier: 'pro' },
  { emoji: '🛠️', label: 'Tools', lessonId: 'tools_1', tier: 'pro' },
];

export function DashboardScreen({ navigation }: Props) {
  const { name, xp, level, streak, tier, userId, totalLessonsCompleted } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);

  const insight = getInsightOfTheDay();
  const weekDots = buildWeekDots(streak);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextLesson, setNextLesson] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!userId || userId.startsWith('offline_')) {
      setLoading(false);
      return;
    }
    
    try {
      const [progress, curriculum] = await Promise.all([
        getProgress(userId),
        getCurriculum(userId),
      ]);
      
      syncFromBackend({
        xp: progress.xp,
        level: progress.level,
        streak: progress.streak,
        tier: progress.tier,
        totalLessonsCompleted: progress.totalLessonsCompleted,
      });

      // Find first incomplete lesson
      if (curriculum && curriculum.topics) {
        for (const topic of curriculum.topics) {
          const incomplete = topic.lessons.find((l: any) => !l.completed);
          if (incomplete) {
            setNextLesson(incomplete);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleContinueLearning = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (nextLesson) {
      navigation.navigate('Lesson', { lessonId: nextLesson.id });
    } else {
      navigation.navigate('Lesson', { lessonId: 'foundations_1' });
    }
  };

  const handleTopicPress = (topic: Topic) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (topic.tier === 'pro' && tier === 'free') {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate('Lesson', { lessonId: topic.lessonId });
    }
  };

  const xpForNextLevel = (level ** 2) * 50;
  const xpProgress = (xp / xpForNextLevel) * 100;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.airaGlow}
          colors={[colors.airaCore]}
          progressBackgroundColor={colors.bgCard}
        />
      }
    >
      {/* Greeting Card */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.greetingCard}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.welcomeLabel}>Welcome back</Text>
            <Text style={styles.greeting}>Hey {name || 'there'} 👋</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpInfo}>
            <Text style={styles.levelText}>Level {level}</Text>
            <Text style={styles.xpText}>{xp}/{xpForNextLevel} XP</Text>
          </View>
          <View style={styles.xpProgress}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ duration: 500, delay: 200 }}
              style={styles.xpFill}
            />
          </View>
        </View>
      </Animated.View>

      {/* Continue Learning Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.heroSection}>
        <Pressable
          onPress={handleContinueLearning}
          style={({ pressed }) => [
            styles.heroCard,
            pressed && styles.heroCardPressed,
          ]}
        >
          <LinearGradient colors={colors.gradientLesson} style={styles.heroGradient}>
            <Text style={styles.heroLabel}>Next Lesson</Text>
            <Text style={styles.heroTitle}>Continue Learning</Text>
            <Text style={styles.heroSubtitle}>Tap to start</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Topic Grid 2x2 */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.topicsGrid}>
        {topics.map((topic, index) => (
          <Animated.View
            key={topic.label}
            entering={FadeInDown.duration(400).delay(200 + index * 50)}
            style={{ flex: 1 }}
          >
            <Pressable
              onPress={() => handleTopicPress(topic)}
              style={({ pressed }) => [
                styles.topicCard,
                pressed && styles.topicCardPressed,
              ]}
            >
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <Text style={styles.topicLabel}>{topic.label}</Text>
              {topic.tier === 'pro' && tier === 'free' && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Learning Map Button */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.mapButtonSection}>
        <Pressable
          onPress={() => navigation.navigate('LearningMap')}
          style={({ pressed }) => [
            styles.mapButton,
            pressed && styles.mapButtonPressed,
          ]}
        >
          <LinearGradient colors={[colors.bgCard, colors.bg]} style={styles.mapButtonGradient}>
            <Text style={styles.mapButtonIcon}>🗺️</Text>
            <Text style={styles.mapButtonText}>View Learning Map</Text>
            <Text style={styles.mapButtonArrow}>→</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* ========== Week-dot streak strip ========== */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(350)}
        style={styles.weekDotsCard}
      >
        <View style={styles.weekDotsHeader}>
          <Text style={styles.sectionEyebrow}>THIS WEEK</Text>
          <Text style={styles.sectionEyebrowMuted}>{streak}-day streak</Text>
        </View>
        <View style={styles.weekDotsRow}>
          {weekDots.map((d, i) => (
            <View key={i} style={styles.weekDotCol}>
              <View
                style={[
                  styles.weekDot,
                  d.filled && styles.weekDotFilled,
                  d.isToday && styles.weekDotToday,
                ]}
              />
              <Text style={[styles.weekDayLabel, d.isToday && styles.weekDayLabelToday]}>
                {d.day}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ========== Insight of the day ========== */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(420)}
        style={styles.insightCard}
      >
        <View style={styles.insightHeader}>
          <Text style={styles.sectionEyebrow}>💡 INSIGHT OF THE DAY</Text>
        </View>
        <Text style={styles.insightTitle} numberOfLines={2}>
          {insight.title}
        </Text>
        <Text style={styles.insightBody} numberOfLines={3}>
          {insight.body.split('\n\n')[0]}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Learn' as never)}
          style={styles.insightCta}
        >
          <Text style={styles.insightCtaText}>Read the full insight →</Text>
        </Pressable>
      </Animated.View>

      {/* ========== Lifetime stats row (animated count-up) ========== */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(490)}
        style={styles.statsRow}
      >
        <View style={styles.statCell}>
          <AnimatedNumber value={totalLessonsCompleted} style={styles.statNumber} />
          <Text style={styles.statLabel}>LESSONS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <AnimatedNumber value={xp} style={styles.statNumber} />
          <Text style={styles.statLabel}>TOTAL XP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <AnimatedNumber value={streak} style={styles.statNumber} suffix="🔥" />
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
      </Animated.View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  greetingCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcomeLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakIcon: { fontSize: 11 },
  streakNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // --- XP bar ---
  xpSection: {
    marginTop: spacing.sm,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  xpText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  xpProgress: {
    height: 6,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.gradientLesson[0],
  },

  // --- Hero card ---
  heroSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  heroCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  heroCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  heroGradient: {
    padding: spacing.md,
  },
  heroLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },

  // --- Topic grid ---
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: 8,
  },
  topicCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 130,
  },
  topicCardPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: colors.bgGlass,
  },
  topicEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  topicLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 20,
  },

  // --- Learning Map Button ---
  mapButtonSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  mapButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  mapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  mapButtonIcon: {
    fontSize: 20,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mapButtonArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },

  // --- Week dots ---
  weekDotsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    ...typography.label,
    color: colors.airaGlow,
  },
  sectionEyebrowMuted: {
    ...typography.caption,
    color: colors.textMuted,
  },
  weekDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  weekDotCol: {
    alignItems: 'center',
    gap: 6,
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bgCardHover,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDotFilled: {
    backgroundColor: colors.airaCore,
    borderColor: colors.airaCore,
  },
  weekDotToday: {
    backgroundColor: colors.airaGlow,
    borderColor: colors.airaGlow,
    transform: [{ scale: 1.3 }],
  },
  weekDayLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  weekDayLabelToday: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  // --- Insight of the day ---
  insightCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightHeader: {
    marginBottom: spacing.sm,
  },
  insightTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  insightBody: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  insightCta: {
    alignSelf: 'flex-start',
  },
  insightCtaText: {
    ...typography.caption,
    color: colors.airaCore,
    fontFamily: 'Inter_600SemiBold',
  },

  // --- Lifetime stats row ---
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.label,
    fontSize: 9,
    color: colors.textMuted,
  },

  bottomSpacer: {
    // Clears the floating tab bar (~64px bar + 16px bottom inset + breathing room)
    height: 100,
  },
});
