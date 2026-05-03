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
import { colors, radius, spacing } from '../theme';
import { getProgress, getCurriculum } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList, TabParamList } from '../types';

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
  const { name, xp, level, streak, tier, userId } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);
  
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

  bottomSpacer: {
    height: spacing.xxl,
  },
});
