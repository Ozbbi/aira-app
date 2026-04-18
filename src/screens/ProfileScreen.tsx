import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch, ScrollView, TextInput, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AiraCharacter } from '../components/AiraCharacter';
import { colors, radius, spacing } from '../theme';
import { useUserStore } from '../store/userStore';
import { getCurriculum, getProgress } from '../api/client';
import type { RootStackParamList, TabParamList } from '../types';

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

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(name);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      getProgress(userId).then((prog) => {
        setAvgAccuracy(0); // Temporarily hardcoded until API returns accuracy
      }).catch(() => {});
    }, [userId])
  );

  const getRankName = (lvl: number): string => {
    if (lvl < 3) return 'Beginner';
    if (lvl < 7) return 'Explorer';
    if (lvl < 12) return 'Adept';
    return 'Master';
  };

  const achievements: Achievement[] = [
    {
      id: 'first_lesson',
      title: 'First Lesson',
      description: 'Complete your first lesson',
      icon: '🌟',
      unlocked: totalLessonsCompleted >= 1,
    },
    {
      id: 'streak_3',
      title: '3-Day Streak',
      description: 'Practice for 3 days in a row',
      icon: '🔥',
      unlocked: streak >= 3,
    },
    {
      id: 'lessons_10',
      title: '10 Lessons',
      description: 'Complete 10 lessons',
      icon: '📚',
      unlocked: totalLessonsCompleted >= 10,
    },
    {
      id: 'perfect_score',
      title: 'Perfect Score',
      description: '100% accuracy in a lesson',
      icon: '💯',
      unlocked: avgAccuracy === 100,
    },
    {
      id: 'foundations',
      title: 'Foundations',
      description: 'Complete all Foundations lessons',
      icon: '🌱',
      unlocked: totalLessonsCompleted >= 5,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleSaveName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // setName(newName); // TODO: Add setName to userStore
    setEditingName(false);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will delete all your progress and reset you to level 1. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            resetStore();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with AiraCharacter */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <AiraCharacter mood="calm" size={80} />
        <Text style={styles.greeting}>
          {totalLessonsCompleted === 0
            ? `Welcome, ${name}. Your story starts with your first lesson.`
            : `Hey, ${name}. Level ${level} — ${getRankName(level)}.`}
        </Text>
      </Animated.View>

      {/* Stats Grid 2x2 */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{xp.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue}>{totalLessonsCompleted}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{avgAccuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </Animated.View>

      {/* Achievements Row */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {achievements.map((a) => (
            <View
              key={a.id}
              style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}
            >
              <Text style={[styles.achievementIcon, !a.unlocked && styles.achievementIconLocked]}>
                {a.icon}
              </Text>
              <Text style={[styles.achievementTitle, !a.unlocked && styles.achievementTextLocked]}>
                {a.title}
              </Text>
              <Text style={[styles.achievementDesc, !a.unlocked && styles.achievementTextLocked]}>
                {a.description}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Settings Section */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <Pressable style={styles.settingRow} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setEditingName(true);
        }}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Edit Name</Text>
            <Text style={styles.settingValue}>{name}</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </Pressable>

        <View style={styles.settingRow}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHapticsEnabled(value);
            }}
            trackColor={{ false: colors.border, true: colors.airaCore }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Haptics</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHapticsEnabled(value);
            }}
            trackColor={{ false: colors.border, true: colors.airaCore }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <Pressable style={[styles.settingRow, styles.settingDestructive]} onPress={handleResetProgress}>
          <Text style={styles.settingLabel}>Reset Progress</Text>
        </Pressable>
      </Animated.View>

      {/* Upgrade to Pro Card */}
      {tier === 'free' && (
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.upgradeSection}>
          <Pressable
            style={styles.upgradeCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Paywall');
            }}
          >
            <LinearGradient colors={colors.gradientPro} style={styles.upgradeGradient}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSubtitle}>
                Unlock all 6 tracks, unlimited lessons, advanced AI techniques
              </Text>
              <Text style={styles.upgradePrice}>$9.99 — one time, forever</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* Edit Name Modal */}
      <Modal visible={editingName} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingName(false);
                  setNewName(name);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveName}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  statsSection: {
    padding: spacing.lg,
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
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  achievementsScroll: {
    flexDirection: 'row',
  },
  achievementCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    width: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  achievementIconLocked: {
    opacity: 0.6,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  achievementTextLocked: {
    color: colors.textMuted,
  },
  settingsSection: {
    padding: spacing.lg,
  },
  settingRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingArrow: {
    fontSize: 24,
    color: colors.textMuted,
  },
  settingDestructive: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  upgradeSection: {
    padding: spacing.lg,
  },
  upgradeCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  upgradePrice: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.bg,
  },
  modalButtonSave: {
    backgroundColor: colors.trackFoundations,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
