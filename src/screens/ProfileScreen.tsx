import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../components/ScreenContainer';
import { haptics } from '../utils/haptics';
import { Card } from '../components/Card';
import { AiraOrb } from '../components/AiraOrb';
import { AiraMessage } from '../components/AiraMessage';
import { useUserStore } from '../store/userStore';
import { fetchCurriculum } from '../services/lessonService';
import { getProgress } from '../api/client';
import {
  scheduleStreakReminder,
  cancelStreakReminder,
} from '../services/notifications';
import { colors, typography, spacing, radius } from '../theme';
import type { RootStackParamList, TabParamList, Curriculum } from '../types';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: NavigationProp;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function ProfileScreen({ navigation }: Props) {
  const { name, xp, level, streak, totalLessonsCompleted, tier, userId } = useUserStore();
  const resetStore = useUserStore((s) => s.resetStore);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useUserStore((s) => s.setNotificationsEnabled);
  const soundsEnabled = useUserStore((s) => s.soundsEnabled);
  const setSoundsEnabled = useUserStore((s) => s.setSoundsEnabled);

  const handleToggleNotifications = async (next: boolean) => {
    // Optimistic flip, then rollback if the OS refuses permission.
    setNotificationsEnabled(next);
    try {
      if (next) {
        const granted = await scheduleStreakReminder();
        if (!granted) {
          setNotificationsEnabled(false);
          Alert.alert(
            'Notifications off',
            'I couldn\u2019t get permission to send you reminders. You can enable it from your phone\u2019s settings.'
          );
        }
      } else {
        await cancelStreakReminder();
      }
    } catch {
      setNotificationsEnabled(!next);
    }
  };

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [avgAccuracy, setAvgAccuracy] = useState<number>(0);
  const [offline, setOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      const sync = async () => {
        try {
          const [curr, prog] = await Promise.all([
            fetchCurriculum(userId),
            getProgress(userId),
          ]);
          if (cancelled) return;
          setCurriculum(curr);
          setAvgAccuracy(prog.averageAccuracy);
          setOffline(false);
        } catch {
          if (!cancelled) setOffline(true);
        }
      };
      sync();
      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  // Aggregate curriculum stats
  const totalLessons = curriculum
    ? curriculum.topics.reduce((sum, t) => sum + t.totalCount, 0)
    : 0;
  const completedLessons = curriculum
    ? curriculum.topics.reduce((sum, t) => sum + t.completedCount, 0)
    : 0;
  const completionPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const topicsMastered = curriculum
    ? curriculum.topics.filter((t) => t.completedCount === t.totalCount && t.totalCount > 0).length
    : 0;

  // Achievements (computed, no storage needed)
  const achievements: Achievement[] = [
    {
      id: 'first_lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: '\u2728',
      unlocked: totalLessonsCompleted >= 1,
    },
    {
      id: 'streak_3',
      title: 'On a Roll',
      description: '3-day streak',
      icon: '\uD83D\uDD25',
      unlocked: streak >= 3,
    },
    {
      id: 'streak_7',
      title: 'One Full Week',
      description: '7-day streak',
      icon: '\u26A1',
      unlocked: streak >= 7,
    },
    {
      id: 'lessons_10',
      title: 'Getting Serious',
      description: 'Complete 10 lessons',
      icon: '\uD83D\uDCDA',
      unlocked: totalLessonsCompleted >= 10,
    },
    {
      id: 'topic_master',
      title: 'Topic Master',
      description: 'Finish a whole topic',
      icon: '\uD83C\uDFC6',
      unlocked: topicsMastered >= 1,
    },
    {
      id: 'level_5',
      title: 'Rising',
      description: 'Reach level 5',
      icon: '\uD83D\uDE80',
      unlocked: level >= 5,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const airaLine =
    completedLessons === 0
      ? `Welcome, ${name}. The story starts with your first lesson.`
      : completionPct === 100
      ? `${completedLessons} of ${totalLessons}. You finished the whole curriculum. That means something.`
      : `${completedLessons} lessons in. Quietly proud of you.`;

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Your progress is saved on the server. You can sign back in anytime — but right now this app stores your session locally, so signing out will clear it from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            haptics.warning();
            cancelStreakReminder().catch(() => {});
            resetStore();
          },
        },
      ]
    );
  };

  const stats = [
    { label: 'Total XP', value: xp.toLocaleString() },
    { label: 'Level', value: level.toString() },
    { label: 'Streak', value: `${streak}d` },
    { label: 'Lessons', value: totalLessonsCompleted.toString() },
    { label: 'Accuracy', value: `${avgAccuracy}%` },
    { label: 'Complete', value: `${completionPct}%` },
  ];

  return (
    <ScreenContainer scroll>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <LinearGradient colors={[...colors.gradientAccent]} style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.tier}>{tier === 'pro' ? 'Pro Member' : 'Free Plan'}</Text>
      </View>

      {/* Aira message */}
      <View style={styles.airaSection}>
        <AiraOrb size={40} intensity="calm" />
        <View style={styles.airaTextWrap}>
          <AiraMessage message={airaLine} />
        </View>
      </View>

      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — some stats may be out of date</Text>
        </View>
      )}

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      {/* Topic Mastery */}
      {curriculum && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topic Mastery</Text>
          <View style={styles.masteryList}>
            {curriculum.topics.map((topic) => {
              const pct =
                topic.totalCount > 0 ? (topic.completedCount / topic.totalCount) * 100 : 0;
              const isMastered = pct === 100;
              return (
                <Pressable
                  key={topic.name}
                  onPress={() => {
                    haptics.tap();
                    navigation.navigate('Topic', { topicName: topic.name });
                  }}
                >
                  <View style={styles.masteryRow}>
                    <View style={styles.masteryHeader}>
                      <Text style={styles.masteryName}>
                        {topic.name}
                        {isMastered ? '  \u2713' : ''}
                      </Text>
                      <Text style={styles.masteryCount}>
                        {topic.completedCount}/{topic.totalCount}
                      </Text>
                    </View>
                    <View style={styles.masteryTrack}>
                      <LinearGradient
                        colors={
                          isMastered
                            ? [...colors.gradientSuccess]
                            : [...colors.gradientPrimary]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.masteryFill, { width: `${pct}%` }]}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSub}>
            {unlockedCount}/{achievements.length}
          </Text>
        </View>
        <View style={styles.achievementsGrid}>
          {achievements.map((a) => (
            <View
              key={a.id}
              style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}
            >
              <Text style={[styles.achievementIcon, !a.unlocked && styles.achievementIconLocked]}>
                {a.icon}
              </Text>
              <Text
                style={[styles.achievementTitle, !a.unlocked && styles.achievementTextLocked]}
                numberOfLines={1}
              >
                {a.title}
              </Text>
              <Text
                style={[styles.achievementDesc, !a.unlocked && styles.achievementTextLocked]}
                numberOfLines={2}
              >
                {a.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Upgrade card */}
      {tier !== 'pro' && (
        <Card onPress={() => navigation.navigate('Paywall')} style={styles.upgradeCard}>
          <LinearGradient
            colors={[...colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeGradient}
          >
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>
              Unlimited lessons, advanced topics, and more
            </Text>
          </LinearGradient>
        </Card>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Daily streak reminder</Text>
            <Text style={styles.settingSub}>
              A gentle nudge at 7pm on days you haven&rsquo;t practiced yet.
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.airaCore }}
            thumbColor={colors.textPrimary}
          />
        </View>
        <View style={[styles.settingRow, { marginTop: spacing.sm }]}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Sound effects</Text>
            <Text style={styles.settingSub}>
              Subtle clicks and chimes. Muted when your phone is on silent.
            </Text>
          </View>
          <Switch
            value={soundsEnabled}
            onValueChange={setSoundsEnabled}
            trackColor={{ false: colors.border, true: colors.airaCore }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>

      {/* Sign out */}
      <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <View style={styles.bottomSpacer} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 36,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tier: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  airaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  airaTextWrap: {
    flex: 1,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '31.5%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  masteryList: {
    gap: spacing.md,
  },
  masteryRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  masteryName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  masteryCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  masteryTrack: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementCard: {
    width: '31.5%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.45,
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  achievementIconLocked: {
    opacity: 0.6,
  },
  achievementTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  achievementTextLocked: {
    color: colors.textMuted,
  },
  upgradeCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  upgradeGradient: {
    padding: spacing.lg,
    borderRadius: radius.xl - 1,
  },
  upgradeTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  upgradeSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  settingRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  signOutText: {
    ...typography.body,
    color: colors.textMuted,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
