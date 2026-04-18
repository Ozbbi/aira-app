import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Svg, Circle } from 'react-native-svg';
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

interface Track {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  tier: 'free' | 'pro';
}

const tracks: Track[] = [
  { id: 'foundations', title: 'Foundations', subtitle: 'Prompt basics', icon: '🌱', color: colors.trackFoundations, progress: 0, totalLessons: 5, completedLessons: 0, tier: 'free' },
  { id: 'critical', title: 'Critical Thinking', subtitle: 'Verify AI output', icon: '🧠', color: colors.trackCritical, progress: 0, totalLessons: 5, completedLessons: 0, tier: 'pro' },
  { id: 'power', title: 'Power User', subtitle: 'Advanced techniques', icon: '⚡', color: colors.trackPower, progress: 0, totalLessons: 5, completedLessons: 0, tier: 'pro' },
  { id: 'tools', title: 'Tools & Taste', subtitle: 'AI tools comparison', icon: '🛠️', color: colors.trackTools, progress: 0, totalLessons: 5, completedLessons: 0, tier: 'pro' },
  { id: 'creators', title: 'AI for Creators', subtitle: 'Build with AI', icon: '✨', color: colors.trackCreators, progress: 0, totalLessons: 5, completedLessons: 0, tier: 'pro' },
  { id: 'master', title: 'The AI Master', subtitle: 'Meta-prompting & more', icon: '🏆', color: colors.trackMaster, progress: 0, totalLessons: 5, completedLessons: 0, tier: 'pro' },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function DashboardScreen({ navigation }: Props) {
  const { name, xp, level, streak, tier, userId } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tracksData, setTracksData] = useState<Track[]>(tracks);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [stats, setStats] = useState({ totalXp: 0, streak: 0, lessonsDone: 0, accuracy: 0 });

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

      setStats({
        totalXp: progress.xp,
        streak: progress.streak,
        lessonsDone: progress.totalLessonsCompleted,
        accuracy: 0,
      });

      // Find next lesson from curriculum
      if (curriculum && curriculum.topics) {
        const updatedTracks = tracks.map((track) => {
          const curriculumTopic = curriculum.topics.find((t: any) => t.name.toLowerCase() === track.id);
          if (curriculumTopic) {
            const completed = curriculumTopic.lessons.filter((l: any) => l.completed).length;
            return {
              ...track,
              completedLessons: completed,
              progress: completed / curriculumTopic.lessons.length,
            };
          }
          return track;
        });
        setTracksData(updatedTracks);

        // Find first incomplete lesson
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

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getEmptyStateMessage = () => {
    if (stats.streak === 0) {
      return "First day. Let's start something small.";
    }
    return null;
  };

  const handleContinueLearning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (nextLesson) {
      navigation.navigate('Lesson', { lessonId: nextLesson.id });
    }
  };

  const handleTrackPress = (track: Track) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (track.tier === 'pro' && tier === 'free') {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate('TrackDetail', { trackId: track.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AiraCharacter mood="thinking" size={120} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const emptyMessage = getEmptyStateMessage();

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
          <AiraCharacter mood="calm" size={60} />
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>
              {getTimeGreeting()}, {name || 'friend'}.
            </Text>
          </View>
        </View>
        {streak >= 3 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
          </View>
        )}
      </Animated.View>

      {/* XP Bar */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.xpSection}>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpInfo}>
            <Text style={styles.levelText}>Level {level}</Text>
            <Text style={styles.xpText}>{xp} XP</Text>
          </View>
          <View style={styles.xpProgress}>
            <Animated.View
              style={[
                styles.xpFill,
                {
                  width: `${(xp / ((level ** 2) * 50)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Continue Learning Hero */}
      {nextLesson && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.heroSection}>
          <Pressable
            onPress={handleContinueLearning}
            style={({ pressed }) => [
              styles.heroCard,
              pressed && styles.heroCardPressed,
            ]}
          >
            <LinearGradient colors={colors.gradientLesson} style={styles.heroGradient}>
              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>Continue Learning</Text>
                <Text style={styles.heroTitle}>{nextLesson.title}</Text>
                <Text style={styles.heroSubtitle}>
                  {tracksData.find((t) => t.id === nextLesson.trackId)?.icon} {nextLesson.estimatedMinutes} min
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* Empty State */}
      {emptyMessage && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.emptyState}>
          <AiraCharacter mood="calm" size={80} />
          <Text style={styles.emptyStateText}>
            {streak === 0 ? "First day. Let's start something small." : emptyMessage}
          </Text>
        </Animated.View>
      )}

      {/* Tracks Grid */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.tracksSection}>
        <Text style={styles.sectionTitle}>Tracks</Text>
        <View style={styles.tracksGrid}>
          {tracksData.map((track, index) => (
            <Animated.View
              key={track.id}
              entering={FadeInDown.duration(400).delay(300 + index * 100)}
            >
              <Pressable
                onPress={() => handleTrackPress(track)}
                style={({ pressed }) => [
                  styles.trackCard,
                  pressed && styles.trackCardPressed,
                  { borderLeftColor: track.color },
                ]}
              >
                <View style={styles.trackIconContainer}>
                  <Text style={styles.trackIcon}>{track.icon}</Text>
                  {track.completedLessons > 0 && (
                    <Svg style={styles.progressRing} width={60} height={60}>
                      <Circle
                        cx={30}
                        cy={30}
                        r={28}
                        stroke={track.color}
                        strokeWidth={3}
                        fill="none"
                        strokeDasharray={`${track.progress * 175} 175`}
                        strokeLinecap="round"
                      />
                    </Svg>
                  )}
                  {track.tier === 'pro' && tier === 'free' && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackSubtitle}>{track.subtitle}</Text>
                <Text style={styles.trackProgress}>
                  {track.completedLessons} / {track.totalLessons}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Stats Strip */}
      <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{stats.totalXp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue}>{stats.lessonsDone}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.lg,
  },
  greetingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgGlass,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.airaPro,
  },
  xpSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  xpBarContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  xpText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  xpProgress: {
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.gradientLesson[0],
    borderRadius: radius.full,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  heroGradient: {
    padding: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  tracksSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  trackCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  trackCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  trackIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  trackIcon: {
    fontSize: 32,
  },
  progressRing: {
    position: 'absolute',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 20,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  trackSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  trackProgress: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
