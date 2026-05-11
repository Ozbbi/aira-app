import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MagnifyingGlass, Funnel, Lock, CheckCircle, CaretRight } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { useUserStore } from '../store/userStore';
import type { RootStackParamList, TabParamList } from '../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Lessons'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Track {
  id: string;
  title: string;
  subtitle: string;
  lessonCount: number;
  gradient: readonly [string, string];
  icon: string;
}

const TRACKS: Track[] = [
  { id: 'foundations', title: 'AI Foundations', subtitle: 'Master the basics of prompting', lessonCount: 20, gradient: ['#00B4D8', '#00E5E5'], icon: '01' },
  { id: 'critical', title: 'Critical Thinking', subtitle: 'Detect bias, hallucinations, errors', lessonCount: 10, gradient: ['#E74C3C', '#FF6B6B'], icon: '02' },
  { id: 'power', title: 'Practical Power', subtitle: 'Real-world prompting workflows', lessonCount: 15, gradient: ['#2ECC71', '#27AE60'], icon: '03' },
  { id: 'tools', title: 'Tools & Taste', subtitle: 'Right tool, right job', lessonCount: 15, gradient: ['#FF6B35', '#F39C12'], icon: '04' },
];

const CODE_TRACK = {
  id: 'code',
  title: 'Code Track',
  subtitle: 'Python, Java, HTML — pick your language',
  lessonCount: 25,
};

export function LearningMapScreen({ navigation }: { navigation: Nav }) {
  const { completedLessonIds, tier } = useUserStore();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getCompletedForTrack = (trackId: string): number => {
    return completedLessonIds.filter((id) => id.startsWith(trackId)).length;
  };

  const handleTrackPress = (trackId: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('TrackDetail', { trackId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Learn</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => setSearchVisible(!searchVisible)}>
              <MagnifyingGlass size={22} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Funnel size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {searchVisible && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search lessons..."
              placeholderTextColor={colors.textDisabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </Animated.View>
        )}

        {/* Track Cards */}
        {TRACKS.map((track, index) => {
          const completed = getCompletedForTrack(track.id);
          const progress = track.lessonCount > 0 ? (completed / track.lessonCount) * 100 : 0;
          const isComplete = completed >= track.lessonCount;

          return (
            <Animated.View key={track.id} entering={FadeInDown.duration(250).delay(60 + index * 40)}>
              <Pressable
                onPress={() => handleTrackPress(track.id)}
                style={({ pressed }) => [styles.trackCard, pressed && styles.trackPressed]}
              >
                <LinearGradient
                  colors={track.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.trackGradient}
                >
                  <View style={styles.trackTop}>
                    <View>
                      <Text style={styles.trackTitle}>{track.title}</Text>
                      <Text style={styles.trackSubtitle}>{track.subtitle}</Text>
                    </View>
                    {isComplete ? (
                      <CheckCircle size={28} weight="fill" color="#FFFFFF" />
                    ) : (
                      <CaretRight size={24} color="rgba(255,255,255,0.8)" />
                    )}
                  </View>
                  <View style={styles.trackBottom}>
                    <View style={styles.trackProgressBar}>
                      <View style={[styles.trackProgressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.trackProgressText}>
                      {completed}/{track.lessonCount} completed
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Code Track - Separated, Prominent */}
        <Animated.View entering={FadeInDown.duration(250).delay(300)}>
          <View style={styles.codeSection}>
            <Text style={styles.codeSectionLabel}>LEARN TO CODE</Text>
          </View>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('CodeTrack' as never);
            }}
            style={({ pressed }) => [styles.codeCard, pressed && styles.trackPressed]}
          >
            <LinearGradient
              colors={['#0F172A', '#1E3A8A', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.codeGradient}
            >
              <Text style={styles.codeEyebrow}>{tier === 'pro' ? 'PRO' : 'PRO REQUIRED'}</Text>
              <Text style={styles.codeTitle}>{CODE_TRACK.title}</Text>
              <Text style={styles.codeSubtitle}>{CODE_TRACK.subtitle}</Text>
              <View style={styles.codeChips}>
                <View style={styles.codeChip}><Text style={styles.codeChipText}>Python</Text></View>
                <View style={styles.codeChip}><Text style={styles.codeChipText}>Java</Text></View>
                <View style={styles.codeChip}><Text style={styles.codeChipText}>HTML</Text></View>
              </View>
              <View style={styles.codeCta}>
                <Text style={styles.codeCtaText}>Get started →</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: spacing.sm },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  title: { ...typography.display, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.cardSurface, justifyContent: 'center', alignItems: 'center',
  },

  searchWrap: { marginBottom: spacing.md },
  searchInput: {
    backgroundColor: colors.cardSurface, borderRadius: radius.md, padding: 14,
    ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.divider,
  },

  // Track cards
  trackCard: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, ...elevation.md },
  trackPressed: { transform: [{ scale: 0.97 }] },
  trackGradient: { padding: 20 },
  trackTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  trackTitle: { ...typography.headline, color: '#FFFFFF', marginBottom: 2 },
  trackSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  trackBottom: {},
  trackProgressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  trackProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },
  trackProgressText: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },

  // Code track
  codeSection: { marginTop: spacing.xl, marginBottom: spacing.md },
  codeSectionLabel: { ...typography.label, color: colors.cyan },
  codeCard: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, ...elevation.md },
  codeGradient: { padding: 20 },
  codeEyebrow: { ...typography.label, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  codeTitle: { ...typography.display, color: '#FFFFFF', marginBottom: 4 },
  codeSubtitle: { ...typography.body, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.md },
  codeChips: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  codeChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full },
  codeChipText: { ...typography.caption, color: '#FFFFFF' },
  codeCta: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md },
  codeCtaText: { ...typography.button, fontSize: 13, color: '#0F172A' },
});
