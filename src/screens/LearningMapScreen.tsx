import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { colors, radius, spacing } from '../theme';
import { getProgress, getCurriculum } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LearningMap'>;

interface Props {
  navigation: NavigationProp;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

const trackConfig: Record<string, { 
  title: string; 
  subtitle: string; 
  icon: string; 
  color: string; 
  gradient: readonly string[];
  lessons: number;
}> = {
  foundations: { 
    title: 'AI Foundations', 
    subtitle: '10 lessons', 
    icon: '🌱', 
    color: colors.trackFoundations, 
    gradient: colors.gradientLesson,
    lessons: 10
  },
  critical: { 
    title: 'Critical Thinking', 
    subtitle: '10 lessons', 
    icon: '🧠', 
    color: colors.trackCritical, 
    gradient: [colors.trackCritical, colors.airaCore] as const,
    lessons: 10
  },
  power: { 
    title: 'Practical Power', 
    subtitle: '10 lessons', 
    icon: '⚡', 
    color: colors.trackPower, 
    gradient: [colors.trackPower, colors.airaCore] as const,
    lessons: 10
  },
  tools: { 
    title: 'Tools & Taste', 
    subtitle: '10 lessons', 
    icon: '🛠️', 
    color: colors.trackTools, 
    gradient: [colors.trackTools, colors.airaCore] as const,
    lessons: 10
  },
  creators: { 
    title: 'Creating with AI', 
    subtitle: '10 lessons', 
    icon: '✨', 
    color: colors.trackCreators, 
    gradient: [colors.trackCreators, colors.airaCore] as const,
    lessons: 10
  },
};

export function LearningMapScreen({ navigation }: Props) {
  const { tier, userId, xp, level } = useUserStore();
  const syncFromBackend = useUserStore((s) => s.syncFromBackend);
  
  const [loading, setLoading] = useState(true);
  const [trackProgress, setTrackProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

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

      // Calculate progress per track
      if (curriculum && curriculum.topics) {
        const progressMap: Record<string, { completed: number; total: number }> = {};
        curriculum.topics.forEach((topic: any) => {
          const completed = topic.lessons.filter((l: any) => l.completed).length;
          progressMap[topic.id] = { completed, total: topic.lessons.length };
        });
        setTrackProgress(progressMap);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, syncFromBackend]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTrackPress = (trackId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const config = trackConfig[trackId];
    const isPro = trackId !== 'foundations';
    
    if (isPro && tier === 'free') {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate('TrackDetail', { trackId });
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const getProgressPercent = (trackId: string) => {
    const progress = trackProgress[trackId];
    if (!progress) return 0;
    return (progress.completed / progress.total) * 100;
  };

  const getTrackStatus = (trackId: string) => {
    const progress = trackProgress[trackId];
    const isPro = trackId !== 'foundations';
    
    if (!progress) return 'locked';
    if (progress.completed === progress.total) return 'completed';
    if (progress.completed > 0) return 'in-progress';
    if (isPro && tier === 'free') return 'locked';
    return 'available';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AiraCharacter mood="thinking" size={120} />
        <Text style={styles.loadingText}>Loading your learning map...</Text>
      </View>
    );
  }

  const totalCompleted = Object.values(trackProgress).reduce((sum, p) => sum + p.completed, 0);
  const totalLessons = Object.values(trackProgress).reduce((sum, p) => sum + p.total, 0);
  const overallProgress = totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>Your Journey</Text>
          <Text style={styles.headerTitle}>Learning Map</Text>
        </View>
      </View>

      {/* Overall Progress Card */}
      <Animated.View entering={FadeIn.duration(260)} style={styles.overallProgressCard}>
        <LinearGradient colors={colors.gradientLesson} style={styles.progressGradient}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressTitle}>{Math.round(overallProgress)}% Complete</Text>
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressStat}>{totalCompleted}/{totalLessons}</Text>
              <Text style={styles.progressStatLabel}>lessons</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 800, delay: 200 }}
              style={styles.progressFill}
            />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Track Cards Grid */}
      <Animated.View entering={FadeInDown.duration(260).delay(90)} style={styles.tracksGrid}>
        {Object.entries(trackConfig).map(([trackId, config], index) => {
          const status = getTrackStatus(trackId);
          const progressPercent = getProgressPercent(trackId);
          
          return (
            <Animated.View
              key={trackId}
              entering={FadeInDown.duration(260).delay(300 + index * 35)}
              style={styles.trackCardWrapper}
            >
              <Pressable
                onPress={() => handleTrackPress(trackId)}
                style={({ pressed }) => [
                  styles.trackCard,
                  pressed && styles.trackCardPressed,
                  status === 'locked' && styles.trackCardLocked,
                ]}
              >
                <LinearGradient 
                  colors={status === 'locked' ? [colors.bgCard, colors.bg] : config.gradient as any}
                  style={styles.trackGradient}
                >
                  <View style={styles.trackIconContainer}>
                    <Text style={styles.trackIcon}>{config.icon}</Text>
                    {status === 'locked' && (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeIcon}>🔒</Text>
                      </View>
                    )}
                    {status === 'completed' && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.trackTitle}>{config.title}</Text>
                  <Text style={styles.trackSubtitle}>{config.subtitle}</Text>
                  
                  {/* Progress Bar */}
                  {status !== 'locked' && (
                    <View style={styles.trackProgressContainer}>
                      <View style={styles.trackProgressBar}>
                        <MotiView
                          from={{ width: '0%' }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 600, delay: 400 + index * 35 }}
                          style={[
                            styles.trackProgressFill,
                            { backgroundColor: status === 'completed' ? colors.trackFoundations : config.color }
                          ]}
                        />
                      </View>
                      <Text style={styles.trackProgressText}>
                        {Math.round(progressPercent)}%
                      </Text>
                    </View>
                  )}

                  {status === 'in-progress' && (
                    <Text style={styles.continueLabel}>Continue →</Text>
                  )}
                  {status === 'available' && (
                    <Text style={styles.startLabel}>Start →</Text>
                  )}
                  {status === 'locked' && (
                    <Text style={styles.lockedLabel}>Coming up</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* AIRA Message */}
      <Animated.View entering={FadeInUp.duration(260).delay(360)} style={styles.airaSection}>
        <View style={styles.airaRow}>
          <AiraCharacter mood="calm" size={60} />
          <View style={styles.airaMessage}>
            <Text style={styles.airaText}>
              This is your learning map. Complete lessons in order to unlock new tracks.
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  overallProgressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  progressGradient: {
    padding: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  progressTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressStats: {
    alignItems: 'flex-end',
  },
  progressStat: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  trackCardWrapper: {
    width: TRACK_CARD_WIDTH,
  },
  trackCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 180,
  },
  trackCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  trackCardLocked: {
    opacity: 0.7,
  },
  trackGradient: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  trackIconContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  trackIcon: {
    fontSize: 32,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    padding: 2,
  },
  lockBadgeIcon: {
    fontSize: 12,
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.trackFoundations,
    borderRadius: radius.full,
    padding: 2,
  },
  completedBadgeIcon: {
    fontSize: 12,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  trackSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  trackProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  trackProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  trackProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  continueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  startLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  lockedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  airaSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  airaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  airaMessage: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  airaText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xxl * 2,
  },
});
