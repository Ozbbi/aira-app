import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { TabScreen } from '../components/TabScreen';
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
  // Subtitles describe what the track teaches, not "10 lessons" — that
  // number was lying anyway (we don't know how many lessons until the
  // backend or seed pool is queried) and the user perceived it as both
  // unimpressive and inaccurate.
  foundations: {
    title: 'AI Foundations',
    subtitle: 'Prompts that work',
    icon: '🌱',
    color: colors.trackFoundations,
    gradient: colors.gradientLesson,
    lessons: 0,
  },
  critical: {
    title: 'Critical Thinking',
    subtitle: 'Spot the bullshit',
    icon: '🧠',
    color: colors.trackCritical,
    gradient: [colors.trackCritical, colors.airaCore] as const,
    lessons: 0,
  },
  power: {
    title: 'Practical Power',
    subtitle: 'Pro-level moves',
    icon: '⚡',
    color: colors.trackPower,
    gradient: [colors.trackPower, colors.airaCore] as const,
    lessons: 0,
  },
  tools: {
    title: 'Tools & Taste',
    subtitle: 'Right tool, right job',
    icon: '🛠️',
    color: colors.trackTools,
    gradient: [colors.trackTools, colors.airaCore] as const,
    lessons: 0,
  },
  creators: {
    title: 'Creating with AI',
    subtitle: 'Make AI sound like you',
    icon: '✨',
    color: colors.trackCreators,
    gradient: [colors.trackCreators, colors.airaCore] as const,
    lessons: 0,
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
    // All tracks are open. We always go to the track detail; the user
    // picks which lesson to start there.
    navigation.navigate('TrackDetail', { trackId });
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
    // No more locked / "Coming up" — every track is open. Status only
    // reflects what's been completed so the CTA wording reads naturally.
    const progress = trackProgress[trackId];
    if (!progress) return 'available';
    if (progress.completed === progress.total && progress.total > 0) return 'completed';
    if (progress.completed > 0) return 'in-progress';
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
    <TabScreen>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
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
                ]}
              >
                <LinearGradient
                  colors={config.gradient as any}
                  style={styles.trackGradient}
                >
                  <View style={styles.trackIconContainer}>
                    <Text style={styles.trackIcon}>{config.icon}</Text>
                    {status === 'completed' && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeIcon}>✓</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.trackTitle}>{config.title}</Text>
                  <Text style={styles.trackSubtitle}>{config.subtitle}</Text>

                  {/* Progress Bar */}
                  <View style={styles.trackProgressContainer}>
                    <View style={styles.trackProgressBar}>
                      <MotiView
                        from={{ width: '0%' }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 600, delay: 400 + index * 35 }}
                        style={[
                          styles.trackProgressFill,
                          { backgroundColor: status === 'completed' ? colors.trackFoundations : config.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.trackProgressText}>
                      {Math.round(progressPercent)}%
                    </Text>
                  </View>

                  {status === 'in-progress' ? (
                    <Text style={styles.continueLabel}>Continue →</Text>
                  ) : status === 'completed' ? (
                    <Text style={styles.continueLabel}>Review →</Text>
                  ) : (
                    <Text style={styles.startLabel}>Start →</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Learn how to code — separate gradient card with its own entry point */}
      <Animated.View entering={FadeInDown.duration(260).delay(280)} style={styles.codeWrap}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate('CodeTrack' as never);
          }}
          style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
        >
          <LinearGradient
            colors={['#0F172A', '#1E3A8A', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.codeCard}
          >
            <Text style={styles.codeEyebrow}>NEW · CODE TRACK</Text>
            <Text style={styles.codeTitle}>Learn how to code</Text>
            <Text style={styles.codeBody}>
              Python, Java, or HTML. Pick your language, pick your level, start.
            </Text>
            <View style={styles.codeChips}>
              <View style={styles.codeChip}><Text style={styles.codeChipText}>🐍 Python</Text></View>
              <View style={styles.codeChip}><Text style={styles.codeChipText}>☕ Java</Text></View>
              <View style={styles.codeChip}><Text style={styles.codeChipText}>🌐 HTML</Text></View>
            </View>
            <View style={styles.codeCta}>
              <Text style={styles.codeCtaText}>Get started →</Text>
            </View>
          </LinearGradient>
        </Pressable>
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
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scrollPad: { paddingBottom: 100 },

  // Learn how to code card
  codeWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  codeCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  codeEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  codeTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  codeBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: spacing.sm,
  },
  codeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  codeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
  },
  codeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  codeCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  codeCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#0F172A',
  },
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
