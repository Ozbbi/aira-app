import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing } from '../theme';
import { getProgress } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList, TabParamList } from '../types';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: NavigationProp;
}

/**
 * The four topic cards shown on the dashboard mirror the landing-page mockup
 * at airamentor.com. Only "AI Basics" (Foundations track) is demo-tier; the
 * other three are Pro. Tapping a pro card while on the free tier opens the
 * paywall instead of the lesson.
 */
type TopicTier = 'demo' | 'pro';
interface Topic {
  id: string;
  label: string;
  emoji: string;
  lessonId: string; // first lesson in the track
  tier: TopicTier;
}

const TOPICS: Topic[] = [
  { id: 'foundations', label: 'AI Basics', emoji: '✨', lessonId: 'foundations_1', tier: 'demo' },
  { id: 'critical', label: 'Thinking', emoji: '🧠', lessonId: 'critical_1', tier: 'pro' },
  { id: 'power', label: 'Prompts', emoji: '⚡', lessonId: 'power_1', tier: 'pro' },
  { id: 'tools', label: 'Tools', emoji: '🛠️', lessonId: 'tools_1', tier: 'pro' },
];

function xpForLevel(level: number) {
  // Matches the store's sqrt progression — keep display + logic in sync.
  return Math.max(50, level ** 2 * 50);
}

function tapHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function DashboardScreen({ navigation }: Props) {
  const { name, xp, level, streak, tier, userId } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);

  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId || userId.startsWith('offline_')) return;
    try {
      const progress = await getProgress(userId);
      syncFromBackend({
        xp: progress.xp,
        level: progress.level,
        streak: progress.streak,
        tier: progress.tier,
        totalLessonsCompleted: progress.totalLessonsCompleted,
      });
    } catch (err) {
      // Non-fatal — dashboard still renders from the local store.
      console.warn('[dashboard] progress fetch failed', err);
    }
  }, [userId, syncFromBackend]);

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

  const handleContinue = () => {
    tapHaptic();
    // Always route new users through the first Foundations lesson. For
    // returning users, this is still a safe "pick up where you left off"
    // default until we wire resume-state.
    navigation.navigate('Lesson', { lessonId: 'foundations_1' });
  };

  const handleTopicPress = (topic: Topic) => {
    tapHaptic();
    if (topic.tier === 'pro' && tier !== 'pro') {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Lesson', { lessonId: topic.lessonId });
  };

  const firstName = (name || 'there').split(' ')[0];
  const xpGoal = xpForLevel(level);
  const xpIntoLevel = Math.max(0, Math.min(xp, xpGoal));
  const progressPct = xpGoal > 0 ? Math.min(100, (xpIntoLevel / xpGoal) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
      {/* ========== Top row: greeting + streak ========== */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.topRow}>
        <View style={styles.greetingCol}>
          <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
          <Text style={styles.greetingTitle} numberOfLines={1}>
            Hey {firstName} 👋
          </Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
        </View>
      </Animated.View>

      {/* ========== XP progress ========== */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={styles.xpBlock}
      >
        <View style={styles.xpLabelsRow}>
          <Text style={styles.xpLevelLabel}>Level {level}</Text>
          <Text style={styles.xpCountLabel}>
            {xpIntoLevel}/{xpGoal} XP
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <LinearGradient
            colors={colors.gradientLesson}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.xpFill, { width: `${progressPct}%` }]}
          />
        </View>
      </Animated.View>

      {/* ========== Continue learning hero ========== */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        style={styles.heroWrap}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [pressed && styles.heroPressed]}
        >
          <LinearGradient
            colors={colors.gradientLesson}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroEyebrow}>NEXT LESSON</Text>
            <Text style={styles.heroTitle}>Continue Learning</Text>
            <Text style={styles.heroHint}>Tap to start</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* ========== 2×2 topic grid ========== */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(300)}
        style={styles.grid}
      >
        {TOPICS.map((topic, i) => {
          const locked = topic.tier === 'pro' && tier !== 'pro';
          return (
            <Animated.View
              key={topic.id}
              entering={FadeInDown.duration(400).delay(300 + i * 70)}
              style={styles.gridCell}
            >
              <Pressable
                onPress={() => handleTopicPress(topic)}
                style={({ pressed }) => [
                  styles.topicCard,
                  pressed && styles.topicCardPressed,
                ]}
              >
                <View style={styles.topicHeaderRow}>
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  {locked && <Text style={styles.topicLock}>🔒</Text>}
                </View>
                <Text style={styles.topicLabel} numberOfLines={1}>
                  {topic.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // --- Top row ---
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greetingCol: {
    flex: 1,
    minWidth: 0, // critical on web: allows text to shrink instead of per-letter-wrap
    marginRight: spacing.md,
  },
  welcomeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakEmoji: { fontSize: 14 },
  streakNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // --- XP bar ---
  xpBlock: {
    marginBottom: spacing.lg,
  },
  xpLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLevelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  xpCountLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  xpTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  // --- Hero ---
  heroWrap: {
    marginBottom: spacing.lg,
  },
  heroPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },

  // --- Topic grid (2×2) ---
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs, // compensates per-cell padding for edge alignment
  },
  gridCell: {
    width: '50%',
    padding: spacing.xs,
  },
  topicCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  topicCardPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: colors.bgCardHover,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicEmoji: { fontSize: 20 },
  topicLock: {
    fontSize: 12,
    opacity: 0.6,
  },
  topicLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },

  bottomSpacer: { height: spacing.xl },
});
