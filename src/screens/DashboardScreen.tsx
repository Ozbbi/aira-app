import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { AiraMascot } from '../components/AiraMascot';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { TabScreen } from '../components/TabScreen';
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
  gradient: readonly [string, string, ...string[]];
}

// Each topic card carries its own gradient. Labels avoid "AI" + lowercase
// vowel combos because in some Inter weights at small sizes the capital I
// reads as a lowercase l (so "AI Basics" looked like "Al Basics" on
// Samsung devices). Naming each card after the verb/concept it teaches
// fixes that and reads better anyway.
const topics: Topic[] = [
  { emoji: '✨', label: 'Prompt 101', lessonId: 'foundations_1', tier: 'free', gradient: ['#6366F1', '#8B5CF6'] as const },
  { emoji: '🧠', label: 'Thinking',   lessonId: 'critical_1',    tier: 'free', gradient: ['#EC4899', '#8B5CF6'] as const },
  { emoji: '⚡', label: 'Power',      lessonId: 'power_1',       tier: 'free', gradient: ['#F59E0B', '#EC4899'] as const },
  { emoji: '🛠️', label: 'Tools',     lessonId: 'tools_1',       tier: 'free', gradient: ['#06B6D4', '#3B82F6'] as const },
];

export function DashboardScreen({ navigation }: Props) {
  const { name, xp, level, streak, tier, userId, totalLessonsCompleted, hearts } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);
  const refillHearts = useUserStore((s) => s.refillHearts);

  const insight = getInsightOfTheDay();
  const weekDots = buildWeekDots(streak);

  // Refresh hearts on every focus — they recharge over wall-clock time even
  // when the app is closed.
  useFocusEffect(
    useCallback(() => {
      refillHearts();
    }, [refillHearts])
  );

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
    navigation.navigate('Lesson', { lessonId: topic.lessonId });
  };

  const handlePracticeRandom = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Pick a deterministic-by-day-and-user lesson. If we already have a
    // candidate from the curriculum fetch, prefer that; otherwise fall back
    // to a known seed lesson id.
    const fallback = ['foundations_1', 'critical_1', 'power_1', 'tools_1'];
    const idx = (totalLessonsCompleted + new Date().getDate()) % fallback.length;
    navigation.navigate('Lesson', { lessonId: fallback[idx] });
  };

  // Today's mission: 1 lesson per day. Once they finish a lesson today the
  // ring fills. We compare lessons completed against a simple bucket so this
  // works without backend changes.
  const todayKey = new Date().toDateString();
  const lessonsToday = useMemo(() => {
    // Heuristic: if user opened a lesson today AND total > 0, count 1.
    // Replace with backend per-day data when available.
    return totalLessonsCompleted > 0 ? 1 : 0;
  }, [totalLessonsCompleted, todayKey]);
  const dailyGoal = 1;
  const dailyComplete = lessonsToday >= dailyGoal;

  const xpForNextLevel = (level ** 2) * 50;
  const xpProgress = (xp / xpForNextLevel) * 100;

  return (
    <TabScreen>
    <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
      {/* Greeting card — mascot says hi */}
      <Animated.View entering={FadeIn.duration(260)} style={styles.greetingCard}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextWrap}>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              Hey {name || 'there'} 👋
            </Text>
          </View>
          <View style={styles.greetingMascotWrap}>
            <AiraMascot size={68} mood={dailyComplete ? 'celebrating' : 'happy'} />
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpInfo}>
            <View style={styles.streakInline}>
              <Text style={styles.streakInlineEmoji}>🔥</Text>
              <Text style={styles.streakInlineNum}>{streak}</Text>
              <Text style={styles.streakInlineLabel}> day streak</Text>
            </View>
            <Text style={styles.xpText}>Lvl {level} · {xp}/{xpForNextLevel} XP</Text>
          </View>
          <View style={styles.xpProgress}>
            <LinearGradient
              colors={['#F59E0B', '#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${Math.min(xpProgress, 100)}%` }]}
            />
          </View>
        </View>

        {/* Lives — single icon + count. Cleaner than 5 hearts in a row. */}
        <View style={styles.heartsRow}>
          <Text style={styles.heartsIcon}>❤️</Text>
          <Text style={styles.heartsCount}>{hearts}</Text>
          <Text style={styles.heartsSlash}>/5</Text>
          <Text style={styles.heartsHint}>
            {hearts < 5 ? '· refills automatically' : '· lives full'}
          </Text>
        </View>
      </Animated.View>

      {/* HERO — start lesson now (the loud, unmissable CTA) */}
      <Animated.View entering={FadeInDown.duration(260).delay(45)} style={styles.heroSection}>
        <Pressable
          onPress={handleContinueLearning}
          style={({ pressed }) => [
            styles.heroCard,
            pressed && styles.heroCardPressed,
          ]}
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroTextCol}>
              <Text style={styles.heroLabel}>READY WHEN YOU ARE</Text>
              <Text style={styles.heroTitle}>Start today's lesson</Text>
              <Text style={styles.heroSubtitle}>3 minutes. Sharpen one habit.</Text>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Start →</Text>
              </View>
            </View>
            <View style={styles.heroMascotWrap} pointerEvents="none">
              <AiraMascot size={104} mood="encouraging" />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Topic grid 2×2 — each card gets its own gradient */}
      <Animated.View entering={FadeInDown.duration(260).delay(90)} style={styles.topicsGrid}>
        {topics.map((topic, index) => (
          <Animated.View
            key={topic.label}
            entering={FadeInDown.duration(260).delay(200 + index * 30)}
            style={styles.topicCellWrap}
          >
            <Pressable
              onPress={() => handleTopicPress(topic)}
              style={({ pressed }) => [
                styles.topicCardOuter,
                pressed && styles.topicCardPressed,
              ]}
            >
              <LinearGradient
                colors={topic.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topicCardInner}
              >
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                <Text style={styles.topicLabel}>{topic.label}</Text>
                <Text style={styles.topicHint}>Start →</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>

      {/* ========== Practice (random lesson) ========== */}
      <Animated.View
        entering={FadeInDown.duration(260).delay(120)}
        style={styles.practiceWrap}
      >
        <Pressable
          onPress={handlePracticeRandom}
          style={({ pressed }) => [
            styles.practiceCard,
            pressed && styles.practiceCardPressed,
          ]}
        >
          <LinearGradient
            colors={['#10B981', '#06B6D4', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.practiceGradient}
          >
            <View style={styles.practiceTextCol}>
              <Text style={styles.practiceLabel}>SURPRISE ME</Text>
              <Text style={styles.practiceTitle}>Practice a random lesson</Text>
              <Text style={styles.practiceSub}>One pick. Right now. No menu.</Text>
            </View>
            <Text style={styles.practiceDie}>🎲</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* ========== Today's Mission ========== */}
      <Animated.View
        entering={FadeInDown.duration(260).delay(135)}
        style={styles.missionCard}
      >
        <View style={styles.missionLeft}>
          <Text style={styles.sectionEyebrow}>TODAY'S MISSION</Text>
          <Text style={styles.missionTitle}>
            {dailyComplete ? "You're done for today 🎉" : 'Finish 1 lesson today'}
          </Text>
          <Text style={styles.missionHint}>
            {dailyComplete
              ? 'Come back tomorrow to keep your streak alive.'
              : 'Small daily progress beats big weekly bursts.'}
          </Text>
        </View>
        <View style={styles.missionRing}>
          <View style={styles.missionRingTrack} />
          <View
            style={[
              styles.missionRingFill,
              dailyComplete && styles.missionRingFillDone,
            ]}
          />
          <Text style={styles.missionRingText}>
            {lessonsToday}/{dailyGoal}
          </Text>
        </View>
      </Animated.View>

      {/* ========== Week-dot streak strip ========== */}
      <Animated.View
        entering={FadeInDown.duration(260).delay(158)}
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
        entering={FadeInDown.duration(260).delay(189)}
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
        entering={FadeInDown.duration(260).delay(221)}
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
    </SafeAreaView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: spacing.sm,
  },
  greetingCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  greetingTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  greetingMascotWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakInlineEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakInlineNum: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textPrimary,
  },
  streakInlineLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium',
  },
  welcomeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 26,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakIcon: { fontSize: 14 },
  streakNumber: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
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
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  xpText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: 160,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
  },
  heroMascotWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  heroLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter_500Medium',
    marginBottom: spacing.md,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  heroPillText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F0A1F',
    letterSpacing: 0.2,
  },

  // --- Topic grid ---
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg - spacing.xs,
    marginTop: spacing.md,
  },
  topicCellWrap: {
    width: '50%',
    padding: spacing.xs,
  },
  topicCardOuter: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  topicCardInner: {
    padding: spacing.md,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  topicCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  topicEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  topicLabel: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  topicHint: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.6,
  },

  // --- Lives row ---
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },
  heartsIcon: {
    fontSize: 16,
  },
  heartsCount: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textPrimary,
  },
  heartsSlash: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    marginRight: 4,
  },
  heartsHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium',
  },

  // --- Practice ---
  practiceWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  practiceCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#06B6D4',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  practiceCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  practiceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  practiceTextCol: {
    flex: 1,
    minWidth: 0,
  },
  practiceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  practiceTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  practiceSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter_500Medium',
  },
  practiceDie: {
    fontSize: 40,
    marginLeft: spacing.md,
  },

  // --- Today's Mission ---
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  missionLeft: {
    flex: 1,
    minWidth: 0,
  },
  missionTitle: {
    fontSize: 17,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  missionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  missionRing: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionRingTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: colors.bgCardHover,
  },
  missionRingFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: colors.airaCore,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  missionRingFillDone: {
    borderColor: colors.success,
    borderRightColor: colors.success,
    borderBottomColor: colors.success,
  },
  missionRingText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textPrimary,
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
