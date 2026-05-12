import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, space, text, screen } from '../theme/system';
import { LessonSearchBar } from '../components/LessonSearchBar';
import { SkillTree, type SkillTreeNode, type NodeStatus } from '../components/SkillTree';
import { TabScreen } from '../components/TabScreen';
import { SEED_LESSONS } from '../data';
import { CODE_LESSONS } from '../data';
import { AI_FOUNDATIONS_ADVANCED } from '../data/aiFoundationsAdvanced';
import { useUserStore } from '../store/userStore';
import { totalDueAcrossDecks } from '../data/flashcards';
import type { RootStackParamList } from '../types';
import { haptics } from '../utils/haptics';

/**
 * Learn tab (new) — Search bar + Skill Tree path.
 *
 * Replaces the old flat grid in LearningMapScreen. The Skill Tree
 * groups lessons by track, draws Bezier connectors, and applies
 * status colours from userStore (completedLessonIds).
 *
 * Study tools row sits between search and the tree:
 *   - My Flashcards (with due-today badge)
 *   - Mock Exam (Pro chip, routes to paywall)
 *   - Notebook (placeholder route)
 *   - Smart Reader (placeholder)
 */

const TRACK_NAMES: Record<string, string> = {
  prompt: 'AI Foundations',
  critical: 'Critical Thinking',
  power: 'Practical Power',
  tools: 'Tools & Taste',
  create: 'Create with AI',
  vibe: 'Code Track',
  foundations: 'AI Foundations',
};

export function LearnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const completedLessonIds = useUserStore((s) => s.completedLessonIds);
  const tier = useUserStore((s) => s.tier);
  const flashcardDecks = useUserStore((s) => s.flashcardDecks);
  const dueCardCount = totalDueAcrossDecks(flashcardDecks);

  // Build the flat ordered node list. Order:
  //   AI Foundations seeds → Foundations Advanced → Critical → Power → Tools → Create → Code (Pro)
  const nodes: SkillTreeNode[] = useMemo(() => {
    const ordered: { trackId: string; lessons: typeof SEED_LESSONS }[] = [
      // Group SEED_LESSONS by their trackId so they line up.
      { trackId: 'prompt', lessons: SEED_LESSONS.filter((l) => l.trackId === 'prompt') },
      { trackId: 'prompt', lessons: AI_FOUNDATIONS_ADVANCED as any },
      { trackId: 'critical', lessons: SEED_LESSONS.filter((l) => l.trackId === 'critical') },
      { trackId: 'power', lessons: SEED_LESSONS.filter((l) => l.trackId === 'power') },
      { trackId: 'tools', lessons: SEED_LESSONS.filter((l) => l.trackId === 'tools') },
      { trackId: 'create', lessons: SEED_LESSONS.filter((l) => l.trackId === 'create') },
      { trackId: 'vibe', lessons: CODE_LESSONS as any },
    ];
    const completed = new Set(completedLessonIds);
    const flatNodes: SkillTreeNode[] = [];
    let firstAvailableMarked = false;
    let perTrackNumber: Record<string, number> = {};

    for (const group of ordered) {
      for (const lesson of group.lessons) {
        const trackId = lesson.trackId;
        perTrackNumber[trackId] = (perTrackNumber[trackId] ?? 0) + 1;
        const isCompleted = completed.has(lesson.id);
        const isProTrack = trackId === 'vibe' && tier !== 'pro';

        let status: NodeStatus;
        if (isCompleted) status = 'completed';
        else if (isProTrack) status = 'locked';
        else if (!firstAvailableMarked) {
          status = 'current';
          firstAvailableMarked = true;
        } else status = 'available';

        flatNodes.push({
          id: `${trackId}_node_${lesson.id}`,
          lessonId: lesson.id,
          trackId,
          trackName: TRACK_NAMES[trackId] ?? trackId,
          number: perTrackNumber[trackId],
          title: lesson.title,
          status,
          isPro: isProTrack,
        });
      }
    }
    return flatNodes;
  }, [completedLessonIds, tier]);

  // Per-track progress for the header chip.
  const trackProgress = useMemo(() => {
    const out: Record<string, { completed: number; total: number }> = {};
    for (const n of nodes) {
      if (!out[n.trackId]) out[n.trackId] = { completed: 0, total: 0 };
      out[n.trackId].total += 1;
      if (n.status === 'completed') out[n.trackId].completed += 1;
    }
    return out;
  }, [nodes]);

  const onTapNode = useCallback(
    (node: SkillTreeNode) => {
      haptics.tap();
      if (node.isPro && tier !== 'pro') {
        navigation.navigate('Paywall');
        return;
      }
      navigation.navigate('Lesson', { lessonId: node.lessonId });
    },
    [navigation, tier],
  );

  const onSearchSelect = useCallback(
    (lessonId: string) => {
      navigation.navigate('Lesson', { lessonId });
    },
    [navigation],
  );

  return (
    <TabScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Learn</Text>
          <Text style={styles.headerSub}>{nodes.length} lessons across {Object.keys(trackProgress).length} tracks</Text>
        </View>

        <LessonSearchBar onSelectLesson={onSearchSelect} style={styles.searchBar} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <StudyToolsRow
            dueCardCount={dueCardCount}
            tier={tier}
            onFlashcards={() => navigation.navigate('Flashcards')}
            onMockExam={() => navigation.navigate('MockExam')}
            onNotebook={() => navigation.navigate('Notebook')}
          />

          <Animated.View entering={FadeInDown.duration(220).delay(60)}>
            <SkillTree
              nodes={nodes}
              onTapNode={onTapNode}
              trackProgress={trackProgress}
            />
          </Animated.View>

          <View style={{ height: screen.tabBarClearance }} />
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  );
}

/* ───────────────────────── Study Tools row ───────────────────────── */

function StudyToolsRow({
  dueCardCount, tier, onFlashcards, onMockExam, onNotebook,
}: {
  dueCardCount: number;
  tier: 'free' | 'pro';
  onFlashcards: () => void;
  onMockExam: () => void;
  onNotebook: () => void;
}) {
  return (
    <View style={styles.studyToolsWrap}>
      <Text style={styles.studyToolsLabel}>STUDY TOOLS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.studyToolsRow}
      >
        <ToolCard
          title="My Flashcards"
          sub={dueCardCount > 0 ? `${dueCardCount} due` : 'Review decks'}
          tint="#7C3AED"
          onPress={onFlashcards}
        />
        <ToolCard
          title="Mock Exam"
          sub="10 random questions"
          tint="#F5A361"
          onPress={onMockExam}
        />
        <ToolCard
          title="Notebook"
          sub="Lesson takeaways"
          tint="#7BC89C"
          onPress={onNotebook}
        />
        <ToolCard
          title="Smart Reader"
          sub="Import + summarise"
          tint="#10B981"
          disabled
          onPress={() => null}
        />
      </ScrollView>
    </View>
  );
}

function ToolCard({
  title, sub, tint, onPress, locked, disabled,
}: {
  title: string;
  sub: string;
  tint: string;
  onPress: () => void;
  locked?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.toolCard,
        { borderColor: tint },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.toolTitle, { color: tint }]}>{title}</Text>
      <Text style={styles.toolSub}>{sub}</Text>
      {locked ? (
        <Text style={styles.toolPro}>PRO</Text>
      ) : disabled ? (
        <Text style={styles.toolSoon}>SOON</Text>
      ) : null}
    </Pressable>
  );
}

/* ───────────────────────── styles ───────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },

  headerWrap: {
    paddingHorizontal: screen.hPadding,
    paddingTop: space['2'],
    paddingBottom: space['2'],
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: { ...text.caption, color: palette.textMuted },

  searchBar: { marginBottom: space['3'] },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: space['8'] },

  // Study tools
  studyToolsWrap: { marginBottom: space['5'] },
  studyToolsLabel: {
    ...text.label,
    color: palette.brandSoft,
    marginLeft: screen.hPadding,
    marginBottom: space['2'],
  },
  studyToolsRow: {
    paddingHorizontal: screen.hPadding,
    gap: space['3'],
  },
  toolCard: {
    width: 150,
    minHeight: 92,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: palette.bgRaised,
    padding: space['3'],
    justifyContent: 'space-between',
  },
  toolTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: -0.2 },
  toolSub: { ...text.caption, color: palette.textSecondary },
  toolPro: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: palette.accentWarm,
    letterSpacing: 0.6,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: palette.accentWarmSoft,
    borderRadius: 6,
  },
  toolSoon: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: palette.textMuted,
    letterSpacing: 0.6,
  },
});
