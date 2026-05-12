import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, space, text, elevation, screen } from '../theme/system';
import { Button } from '../components/Button';
import { AiraMascot } from '../components/AiraMascot';
import { useUserStore } from '../store/userStore';
import { SEED_LESSONS, CODE_LESSONS } from '../data';
import { AI_FOUNDATIONS_ADVANCED } from '../data/aiFoundationsAdvanced';
import type { RootStackParamList } from '../types';

/**
 * Notebook — every completed lesson's takeaway in one searchable list.
 *
 * The brief (multiple sessions) asked for "AIRA's Live Notes" — auto
 * summaries saved per lesson. The seed lessons already carry a
 * `takeaway` field which IS a summary, so this screen synthesises the
 * notebook from completedLessonIds + lesson data without needing a
 * separate persistence layer.
 *
 * Future versions can extend this to actually persist user-edited notes
 * and AI-generated key-term highlights. For now: the lesson's takeaway
 * is the auto-summary.
 */

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

interface Entry {
  lessonId: string;
  title: string;
  takeaway: string;
  character: string;
  trackId: string;
  trackName: string;
}

const TRACK_NAMES: Record<string, string> = {
  prompt: 'AI Foundations',
  critical: 'Critical Thinking',
  power: 'Practical Power',
  tools: 'Tools & Taste',
  create: 'Create with AI',
  vibe: 'Code Track',
  foundations: 'AI Foundations',
};

export function NotebookScreen({ navigation }: Props) {
  const completedLessonIds = useUserStore((s) => s.completedLessonIds);
  const [query, setQuery] = useState('');

  const allLessons = useMemo(
    () => [...SEED_LESSONS, ...CODE_LESSONS, ...AI_FOUNDATIONS_ADVANCED],
    [],
  );

  const entries: Entry[] = useMemo(() => {
    const completed = new Set(completedLessonIds);
    const list: Entry[] = [];
    for (const l of allLessons) {
      if (!completed.has(l.id)) continue;
      if (!l.takeaway) continue;
      list.push({
        lessonId: l.id,
        title: l.title,
        takeaway: l.takeaway,
        character: l.character,
        trackId: l.trackId,
        trackName: TRACK_NAMES[l.trackId] ?? l.trackId,
      });
    }
    return list;
  }, [allLessons, completedLessonIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.takeaway.toLowerCase().includes(q) ||
        e.character.toLowerCase().includes(q) ||
        e.trackName.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notebook</Text>
        <Text style={styles.headerSub}>
          {entries.length === 0
            ? "Your lesson takeaways will appear here."
            : `${entries.length} lesson${entries.length === 1 ? '' : 's'} captured`}
        </Text>
      </View>

      {entries.length > 0 ? (
        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes by topic, character, or word…"
            placeholderTextColor={palette.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <EmptyState
            onStartLesson={() => navigation.navigate('Lesson', { lessonId: 'foundations_1' })}
          />
        ) : filtered.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsTitle}>Nothing matches that search.</Text>
            <Text style={styles.noResultsBody}>Try a different word.</Text>
          </View>
        ) : (
          filtered.map((entry, i) => (
            <Animated.View
              key={entry.lessonId}
              entering={FadeInDown.duration(220).delay(i * 40)}
            >
              <Pressable
                onPress={() =>
                  navigation.navigate('Lesson', { lessonId: entry.lessonId })
                }
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <Text style={styles.cardEyebrow}>
                  {entry.trackName} · with {entry.character}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {entry.title}
                </Text>
                <View style={styles.takeawayBox}>
                  <Text style={styles.takeawayLabel}>TAKEAWAY</Text>
                  <Text style={styles.takeawayText}>{entry.takeaway}</Text>
                </View>
                <Text style={styles.cardCta}>Open lesson →</Text>
              </Pressable>
            </Animated.View>
          ))
        )}

        <View style={{ height: space['12'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ──────────────────────── Empty state ──────────────────────── */

function EmptyState({ onStartLesson }: { onStartLesson: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <AiraMascot size={140} mood="encouraging" />
      <Text style={styles.emptyTitle}>No notes yet.</Text>
      <Text style={styles.emptyBody}>
        Finish a lesson and its key takeaway lands here automatically. You can search them all later.
      </Text>
      <Button label="Start your first lesson" onPress={onStartLesson} size="lg" />
    </View>
  );
}

/* ──────────────────────── styles ──────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },

  headerWrap: { paddingHorizontal: screen.hPadding, paddingTop: space['2'], paddingBottom: space['3'] },
  back: { paddingVertical: space['2'] },
  backIcon: { fontFamily: 'Inter_700Bold', fontSize: 30, color: palette.textPrimary },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: palette.textPrimary,
    letterSpacing: -0.5,
    marginTop: space['1'],
  },
  headerSub: { ...text.caption, color: palette.textMuted, marginTop: space['1'] },

  searchWrap: { paddingHorizontal: screen.hPadding, paddingBottom: space['3'] },
  searchInput: {
    backgroundColor: palette.cardSurface,
    borderColor: palette.divider,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space['4'],
    paddingVertical: 12,
    color: palette.textPrimary,
    ...text.body,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: screen.hPadding },

  card: {
    backgroundColor: palette.cardSurface,
    borderRadius: radii.lg,
    borderColor: palette.divider,
    borderWidth: 1,
    padding: space['5'],
    marginBottom: space['3'],
    ...elevation.sm,
  },
  cardEyebrow: { ...text.label, color: palette.brand, marginBottom: space['1'] },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    lineHeight: 22,
    color: palette.textPrimary,
    marginBottom: space['3'],
    letterSpacing: -0.2,
  },
  takeawayBox: {
    backgroundColor: palette.brandSoft,
    borderRadius: radii.md,
    padding: space['3'],
    marginBottom: space['3'],
  },
  takeawayLabel: { ...text.label, color: palette.brand, marginBottom: 4 },
  takeawayText: { ...text.body, color: palette.textPrimary, fontFamily: 'Inter_600SemiBold' },
  cardCta: { ...text.caption, color: palette.brand, fontFamily: 'Inter_700Bold' },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: space['10'],
    paddingHorizontal: space['4'],
    gap: space['3'],
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: palette.textPrimary,
    marginTop: space['3'],
  },
  emptyBody: {
    ...text.body,
    color: palette.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: space['3'],
  },

  noResults: { alignItems: 'center', paddingVertical: space['10'] },
  noResultsTitle: { ...text.title, color: palette.textPrimary, marginBottom: space['1'] },
  noResultsBody: { ...text.body, color: palette.textSecondary },
});
