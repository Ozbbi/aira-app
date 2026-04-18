import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { colors, radius, spacing } from '../theme';
import { getTrackLessons } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TrackDetail'>;
  route: {
    params: {
      trackId: string;
    };
  };
}

const trackConfig: Record<string, { title: string; subtitle: string; icon: string; color: string; gradient: readonly string[] }> = {
  foundations: { title: 'Foundations', subtitle: 'Prompt basics', icon: '🌱', color: colors.trackFoundations, gradient: colors.gradientLesson },
  critical: { title: 'Critical Thinking', subtitle: 'Verify AI output', icon: '🧠', color: colors.trackCritical, gradient: [colors.trackCritical, colors.airaCore] as const },
  power: { title: 'Power User', subtitle: 'Advanced techniques', icon: '⚡', color: colors.trackPower, gradient: [colors.trackPower, colors.airaCore] as const },
  tools: { title: 'Tools & Taste', subtitle: 'AI tools comparison', icon: '🛠️', color: colors.trackTools, gradient: [colors.trackTools, colors.airaCore] as const },
  creators: { title: 'AI for Creators', subtitle: 'Build with AI', icon: '✨', color: colors.trackCreators, gradient: [colors.trackCreators, colors.airaCore] as const },
  master: { title: 'The AI Master', subtitle: 'Meta-prompting & more', icon: '🏆', color: colors.trackMaster, gradient: [colors.trackMaster, colors.airaCore] as const },
};

export function TrackDetailScreen({ navigation, route }: Props) {
  const { trackId } = route.params;
  const { tier, userId } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const config = trackConfig[trackId] || trackConfig.foundations;

  const fetchData = useCallback(async () => {
    try {
      const data = await getTrackLessons(trackId);
      setLessons(data.lessons || []);

      // Find first incomplete lesson
      const firstIncomplete = data.lessons?.findIndex((l: any) => !l.completed);
      setCurrentLessonIndex(firstIncomplete >= 0 ? firstIncomplete : data.lessons?.length - 1 || 0);
    } catch (error) {
      console.error('Failed to fetch track lessons:', error);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLessonPress = (lesson: any, index: number) => {
    if (lesson.completed) return;

    if (index === currentLessonIndex) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      navigation.navigate('Lesson', { lessonId: lesson.id });
    } else if (index > currentLessonIndex) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      navigation.navigate('Paywall');
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AiraCharacter mood="thinking" size={120} />
        <Text style={styles.loadingText}>Loading track...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Hero Banner */}
      <LinearGradient colors={config.gradient as any} style={styles.hero}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.heroIcon}>{config.icon}</Text>
        <Text style={styles.heroTitle}>{config.title}</Text>
        <Text style={styles.heroSubtitle}>{config.subtitle}</Text>
      </LinearGradient>

      {/* AIRA Intro */}
      <View style={styles.airaSection}>
        <AiraCharacter mood="calm" size={80} />
        <Text style={styles.airaText}>
          Welcome to {config.title}. This track will help you master {config.subtitle.toLowerCase()}.
          Let's begin your journey.
        </Text>
      </View>

      {/* Lesson Path */}
      <View style={styles.pathSection}>
        {lessons.map((lesson, index) => {
          const isCompleted = lesson.completed;
          const isCurrent = index === currentLessonIndex;
          const isLocked = index > currentLessonIndex;
          const isProLocked = isLocked && tier === 'free' && config.title !== 'Foundations';

          return (
            <View key={lesson.id} style={styles.pathRow}>
              {index % 2 === 0 ? (
                <>
                  <View style={styles.lessonNode}>
                    <MotiView
                      style={[
                        styles.node,
                        isCompleted && styles.nodeCompleted,
                        isCurrent && styles.nodeCurrent,
                        isLocked && styles.nodeLocked,
                      ]}
                      animate={isCurrent ? {
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{
                        loop: true,
                        duration: 1500,
                      }}
                    >
                      {isCompleted ? (
                        <Text style={styles.checkIcon}>✓</Text>
                      ) : isProLocked ? (
                        <Text style={styles.lockIcon}>🔒</Text>
                      ) : (
                        <Text style={styles.nodeNumber}>{index + 1}</Text>
                      )}
                    </MotiView>
                    {isCurrent && <Text style={styles.startLabel}>START</Text>}
                  </View>
                  <View style={styles.spacer} />
                </>
              ) : (
                <>
                  <View style={styles.spacer} />
                  <View style={styles.lessonNode}>
                    <MotiView
                      style={[
                        styles.node,
                        isCompleted && styles.nodeCompleted,
                        isCurrent && styles.nodeCurrent,
                        isLocked && styles.nodeLocked,
                      ]}
                      animate={isCurrent ? {
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{
                        loop: true,
                        duration: 1500,
                      }}
                    >
                      {isCompleted ? (
                        <Text style={styles.checkIcon}>✓</Text>
                      ) : isProLocked ? (
                        <Text style={styles.lockIcon}>🔒</Text>
                      ) : (
                        <Text style={styles.nodeNumber}>{index + 1}</Text>
                      )}
                    </MotiView>
                    {isCurrent && <Text style={styles.startLabel}>START</Text>}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

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
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  airaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bgCard,
    margin: spacing.lg,
    borderRadius: radius.xl,
  },
  airaText: {
    flex: 1,
    marginLeft: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  pathSection: {
    padding: spacing.xl,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  spacer: {
    flex: 1,
  },
  lessonNode: {
    alignItems: 'center',
  },
  node: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
  },
  nodeCompleted: {
    backgroundColor: colors.trackFoundations,
    borderColor: colors.trackFoundations,
  },
  nodeCurrent: {
    borderColor: colors.trackFoundations,
    shadowColor: colors.trackFoundations,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  nodeLocked: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
  },
  nodeNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkIcon: {
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  lockIcon: {
    fontSize: 24,
    color: colors.textMuted,
  },
  startLabel: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
    color: colors.trackFoundations,
    letterSpacing: 1,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
