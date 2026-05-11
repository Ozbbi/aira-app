import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Fire, Clock, Lightning } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AiraMascot } from '../components/AiraMascot';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { useUserStore, XP_PER_LEVEL } from '../store/userStore';
import { getInsightOfTheDay } from '../data';
import type { RootStackParamList, TabParamList } from '../types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildWeekDots(streak: number): { day: string; filled: boolean; isToday: boolean; missed: boolean }[] {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  return labels.map((day, i) => {
    const offset = todayIdx - i;
    const filled = offset >= 0 && offset < streak;
    return { day, filled, isToday: i === todayIdx, missed: !filled && i < todayIdx };
  });
}

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const INSIGHTS = [
  { id: '1', tag: "Today's Pattern", title: 'Refine This', body: 'Improving a draft you already wrote is the fastest way to get better output.' },
  { id: '2', tag: 'Common Mistake', title: 'Shipping AI Output', body: 'Treat AI output as a first draft. Always cut 20% before sending.' },
  { id: '3', tag: '60-sec Win', title: 'Provide 2 Examples', body: 'Show two emails you like. Few-shot examples beat long descriptions.' },
];

export function DashboardScreen({ navigation }: { navigation: Nav }) {
  const { name, xp, level, streak, lives, totalLessonsCompleted, showMascot, completedLessonIds } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);
  const bookmarks = useUserStore((s) => s.bookmarks);

  const weekDots = useMemo(() => buildWeekDots(streak), [streak]);
  const xpForNext = level * XP_PER_LEVEL;
  const xpInLevel = xp - (level - 1) * XP_PER_LEVEL;
  const xpProgress = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);

  const handleStartLesson = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Lesson', { lessonId: 'foundations_1' });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.cyan} progressBackgroundColor={colors.cardSurface} />
        }
      >
        {/* Section 1: Header */}
        <Animated.View entering={FadeIn.duration(250)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}, {name || 'there'}</Text>
            <Text style={styles.subtitle}>Ready for today's lesson?</Text>
          </View>
          {showMascot && (
            <Pressable onPress={() => {}}>
              <AiraMascot size={40} state="idle" />
            </Pressable>
          )}
        </Animated.View>

        {/* Section 2: Status Bar */}
        <Animated.View entering={FadeInDown.duration(250).delay(30)} style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Fire size={16} weight="fill" color={colors.orange} />
              <Text style={styles.statusText}>{streak} days</Text>
            </View>
            <Text style={styles.statusDot}>·</Text>
            <View style={styles.statusItem}>
              <Heart size={16} weight="fill" color={colors.error} />
              <Text style={styles.statusText}>{lives}/5</Text>
            </View>
            <Text style={styles.statusDot}>·</Text>
            <Pressable style={styles.levelPill} onPress={() => navigation.navigate('Progress' as never)}>
              <Text style={styles.levelPillText}>Lvl {level}</Text>
            </Pressable>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpLabel}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
        </Animated.View>

        {/* Section 3: Today's Lesson Hero Card */}
        <Animated.View entering={FadeInDown.duration(250).delay(60)} style={styles.heroWrap}>
          <Pressable
            onPress={handleStartLesson}
            style={({ pressed }) => [styles.heroCard, pressed && styles.heroPressed]}
          >
            <LinearGradient
              colors={['#00B4D8', '#00E5E5', '#0B0E14']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>TODAY'S LESSON</Text>
                <Text style={styles.heroTitle}>Naming Your Audience</Text>
                <Text style={styles.heroSubtitle}>The single biggest win in prompting.</Text>
                <View style={styles.heroMeta}>
                  <Clock size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroMetaText}>3 min</Text>
                  <Lightning size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroMetaText}>+15 XP</Text>
                </View>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaText}>Start Lesson →</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Section 5: Daily Insights - Horizontal Scroll */}
        <Animated.View entering={FadeInDown.duration(250).delay(120)}>
          <Text style={styles.sectionLabel}>DAILY INSIGHTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightsRow}>
            {INSIGHTS.map((ins) => (
              <View key={ins.id} style={styles.insightCard}>
                <Text style={styles.insightTag}>{ins.tag}</Text>
                <Text style={styles.insightTitle}>{ins.title}</Text>
                <Text style={styles.insightBody} numberOfLines={3}>{ins.body}</Text>
                <View style={styles.insightActions}>
                  <Pressable onPress={() => toggleBookmark(ins.id)}>
                    <Text style={[styles.insightAction, bookmarks.includes(ins.id) && styles.insightActionActive]}>
                      {bookmarks.includes(ins.id) ? 'Saved' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Mini Games row — first playable game lives here */}
        <Animated.View entering={FadeInDown.duration(250).delay(135)}>
          <Text style={styles.sectionLabel}>MINI GAMES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            <Pressable
              onPress={() => navigation.navigate('PromptOrNot' as never)}
              style={({ pressed }) => [
                {
                  width: 240,
                  borderRadius: 16,
                  overflow: 'hidden',
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={['#7C3AED', '#EC4899', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, minHeight: 130, justifyContent: 'space-between' }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)' }}>
                  30-SECOND ROUND
                </Text>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 4 }}>
                    Prompt or Not?
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>
                    Swipe good prompts right, bad ones left. +10 XP each.
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <View
              style={{
                width: 200,
                borderRadius: 16,
                padding: 16,
                backgroundColor: '#1C1C1E',
                borderColor: '#38383A',
                borderWidth: 1,
                justifyContent: 'space-between',
                minHeight: 130,
                opacity: 0.6,
              }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, color: '#6B6B7E' }}>
                COMING SOON
              </Text>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#A8A8B8', letterSpacing: -0.3, marginBottom: 4 }}>
                  Fill the Gap
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B6B7E' }}>
                  Drag-and-drop the missing parts of a prompt.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Section 6: Weekly Activity */}
        <Animated.View entering={FadeInDown.duration(250).delay(150)} style={styles.weekCard}>
          <Text style={styles.sectionLabelInline}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            {weekDots.map((d, i) => (
              <View key={i} style={styles.weekCol}>
                <View style={[
                  styles.weekDot,
                  d.filled && styles.weekDotFilled,
                  d.isToday && styles.weekDotToday,
                  d.missed && !d.filled && styles.weekDotMissed,
                ]} />
                <Text style={[styles.weekDayLabel, d.isToday && styles.weekDayToday]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Section 7: Lifetime Stats */}
        <Animated.View entering={FadeInDown.duration(250).delay(180)} style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{totalLessonsCompleted}</Text>
            <Text style={styles.statLabel}>LESSONS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{xp}</Text>
            <Text style={styles.statLabel}>TOTAL XP</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scrollContent: { paddingTop: spacing.sm },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: spacing.md,
  },
  headerLeft: { flex: 1 },
  greeting: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },

  // Status
  statusCard: {
    marginHorizontal: 16,
    marginTop: spacing.md,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    padding: 20,
    ...elevation.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { ...typography.caption, color: colors.textPrimary },
  statusDot: { color: colors.textDisabled, marginHorizontal: spacing.sm },
  levelPill: {
    backgroundColor: colors.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cyan,
  },
  levelPillText: { ...typography.label, color: colors.cyan, fontSize: 10 },
  xpBar: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.cyan,
    borderRadius: 3,
  },
  xpLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },

  // Hero
  heroWrap: { marginHorizontal: 16, marginTop: spacing.lg },
  heroCard: { borderRadius: radius.lg, overflow: 'hidden', ...elevation.cyanGlow },
  heroPressed: { transform: [{ scale: 0.97 }] },
  heroGradient: { padding: 20, minHeight: 180 },
  heroContent: { flex: 1 },
  heroEyebrow: { ...typography.label, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  heroTitle: { ...typography.display, color: '#FFFFFF', marginBottom: 4 },
  heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.9)', marginBottom: spacing.md },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  heroMetaText: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cyan,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...elevation.cyanGlow,
  },
  heroCtaText: { ...typography.button, color: colors.bg },

  // Section Labels
  sectionLabel: {
    ...typography.label,
    color: colors.cyan,
    marginHorizontal: 16,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionLabelInline: {
    ...typography.label,
    color: colors.cyan,
    marginBottom: spacing.md,
  },

  // Insights
  insightsRow: { paddingHorizontal: 16, gap: 12 },
  insightCard: {
    width: 260,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    padding: 20,
    ...elevation.sm,
  },
  insightTag: { ...typography.label, color: colors.orange, marginBottom: 6 },
  insightTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 4 },
  insightBody: { ...typography.body, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  insightActions: { flexDirection: 'row', marginTop: spacing.md, gap: 16 },
  insightAction: { ...typography.caption, color: colors.textDisabled },
  insightActionActive: { color: colors.cyan },

  // Week
  weekCard: {
    marginHorizontal: 16,
    marginTop: spacing.lg,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    padding: 16,
    ...elevation.sm,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  weekCol: { alignItems: 'center', gap: 6 },
  weekDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.divider,
  },
  weekDotFilled: { backgroundColor: colors.cyan },
  weekDotToday: { backgroundColor: colors.cyan, borderWidth: 2, borderColor: colors.orange, width: 14, height: 14, borderRadius: 7 },
  weekDotMissed: {},
  weekDayLabel: { ...typography.label, fontSize: 9, color: colors.textDisabled },
  weekDayToday: { color: colors.textPrimary },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: spacing.lg,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    padding: 16,
    ...elevation.sm,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.divider, marginVertical: spacing.xs },
  statNumber: { fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.textPrimary, marginBottom: 2 },
  statLabel: { ...typography.label, fontSize: 9, color: colors.textDisabled },
});
