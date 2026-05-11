import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette, radii, space, text, elevation, gradients } from '../theme/system';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { getDueCards, FREE_DECK_LIMIT, totalDueAcrossDecks } from '../data/flashcards';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../types';

/**
 * Flashcards (deck list) — the hub.
 *
 * Top:
 *   - "X due today across N decks" banner, navigates to a combined-due
 *     review when tapped (uses the deck with the most due cards as
 *     entry — keeps MVP simple; later we can build a true mixed deck).
 *
 * Body:
 *   - One card per deck. Track-colour stripe, deck name, card count,
 *     "N due" badge, "Review" button.
 *   - Long-press a deck → confirm delete.
 *   - Pro/free badge (Free: X/3 decks).
 *
 * Empty state:
 *   - AIRA mascot voice: "Finish a lesson and tap 'Create Flashcards'
 *     to spawn your first deck."
 */

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Flashcards'>;
}

/** One subtle gradient per track id. Keeps deck stripes visually distinct. */
const TRACK_GRADIENT: Record<string, readonly [string, string, ...string[]]> = {
  prompt:   ['#7C3AED', '#A855F7'] as const,
  critical: ['#EC4899', '#F472B6'] as const,
  power:    ['#06B6D4', '#3B82F6'] as const,
  tools:    ['#F59E0B', '#FB923C'] as const,
  vibe:     ['#10B981', '#34D399'] as const,
  create:   ['#EC4899', '#F59E0B'] as const,
  default:  gradients.hero,
};

function gradientFor(trackId: string) {
  return TRACK_GRADIENT[trackId] ?? TRACK_GRADIENT.default;
}

export function FlashcardsScreen({ navigation }: Props) {
  const decks = useUserStore((s) => s.flashcardDecks);
  const tier = useUserStore((s) => s.tier);
  const deleteFlashcardDeck = useUserStore((s) => s.deleteFlashcardDeck);

  const totalDue = useMemo(() => totalDueAcrossDecks(decks), [decks]);

  const openDeck = useCallback(
    (deckId: string, forceAll = false) => {
      haptics.tap();
      navigation.navigate('FlashcardReview', { deckId, forceAll });
    },
    [navigation],
  );

  const confirmDelete = useCallback(
    (deckId: string, name: string) => {
      Alert.alert(
        'Delete deck?',
        `"${name}" and all its cards will be removed. Scheduled reviews go with it. This can't be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              haptics.warning();
              deleteFlashcardDeck(deckId);
            },
          },
        ],
      );
    },
    [deleteFlashcardDeck],
  );

  const deckCap = tier === 'pro' ? '∞' : `${decks.length}/${FREE_DECK_LIMIT}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Flashcards</Text>
        <View style={styles.deckCap}>
          <Text style={styles.deckCapText}>{deckCap}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {decks.length === 0 ? (
          <EmptyState onBack={() => navigation.goBack()} />
        ) : (
          <>
            {/* Due-today banner */}
            <Animated.View entering={FadeInDown.duration(220)}>
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.duebanner, elevation.md]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dueEyebrow}>TODAY</Text>
                  <Text style={styles.dueTitle}>
                    {totalDue === 0
                      ? 'All caught up.'
                      : `${totalDue} card${totalDue === 1 ? '' : 's'} due`}
                  </Text>
                  <Text style={styles.dueSub}>
                    {totalDue === 0
                      ? 'Come back tomorrow, or force-review a deck below.'
                      : 'Tap any deck to start.'}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Decks */}
            {decks.map((d, i) => {
              const due = getDueCards(d).length;
              const grad = gradientFor(d.trackId);
              return (
                <Animated.View
                  key={d.id}
                  entering={FadeInDown.duration(220).delay(60 + i * 40)}
                >
                  <Pressable
                    onPress={() => openDeck(d.id, due === 0)}
                    onLongPress={() => confirmDelete(d.id, d.name)}
                    style={({ pressed }) => [
                      styles.deckRow,
                      pressed && styles.deckRowPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={grad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.deckStripe}
                    />
                    <View style={styles.deckBody}>
                      <View style={styles.deckHeader}>
                        <Text style={styles.deckName} numberOfLines={1}>{d.name}</Text>
                        {due > 0 ? (
                          <View style={styles.dueBadge}>
                            <Text style={styles.dueBadgeText}>{due} due</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.deckMeta}>
                        {d.cardCount} card{d.cardCount === 1 ? '' : 's'} · {d.lessonIds.length} lesson{d.lessonIds.length === 1 ? '' : 's'}
                      </Text>
                      <Text style={styles.deckCta}>
                        {due > 0 ? 'Review →' : 'All caught up · long-press to delete'}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {tier !== 'pro' && decks.length >= FREE_DECK_LIMIT ? (
              <Animated.View entering={FadeInDown.duration(220).delay(300)} style={styles.proCard}>
                <Text style={styles.proCardEyebrow}>FREE LIMIT REACHED</Text>
                <Text style={styles.proCardTitle}>You've used all 3 decks.</Text>
                <Text style={styles.proCardBody}>
                  Upgrade to AIRA Pro for unlimited decks, unlimited follow-ups, and every track.
                </Text>
                <Button
                  label="See Pro"
                  onPress={() => navigation.navigate('Paywall')}
                  variant="primary"
                  size="md"
                />
              </Animated.View>
            ) : null}
          </>
        )}

        <View style={{ height: space['8'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ──────────────────────────── empty state ──────────────────────────── */

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={styles.empty}>
      <Text style={styles.emptyTitle}>No decks yet.</Text>
      <Text style={styles.emptyBody}>
        Finish a lesson and tap “Create Flashcards” on the summary screen. AIRA turns the key
        concepts and quiz answers into 5-10 cards in seconds.
      </Text>
      <Button
        label="Back"
        onPress={onBack}
        variant="primary"
        size="md"
        fullWidth
        style={{ marginTop: space['6'] }}
      />
    </Animated.View>
  );
}

/* ───────────────────────────── styles ───────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { paddingHorizontal: space['4'], paddingTop: space['2'], paddingBottom: space['12'] },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space['4'],
    paddingTop: space['2'],
    paddingBottom: space['2'],
    gap: space['3'],
  },
  back: { padding: space['2'] },
  backIcon: { fontFamily: 'Inter_700Bold', fontSize: 32, color: palette.textPrimary },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: palette.textPrimary,
    flex: 1,
    letterSpacing: -0.5,
  },
  deckCap: {
    paddingHorizontal: space['3'],
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.bgRaised,
    borderColor: palette.border,
    borderWidth: 1,
  },
  deckCapText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: palette.textSecondary,
  },

  // Due banner
  duebanner: {
    borderRadius: radii.lg,
    padding: space['5'],
    marginBottom: space['5'],
  },
  dueEyebrow: { ...text.label, color: 'rgba(255,255,255,0.85)' },
  dueTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginVertical: space['1'],
    letterSpacing: -0.3,
  },
  dueSub: { ...text.bodySmall, color: 'rgba(255,255,255,0.9)' },

  // Deck row
  deckRow: {
    flexDirection: 'row',
    backgroundColor: palette.bgRaised,
    borderRadius: radii.lg,
    borderColor: palette.border,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: space['3'],
    minHeight: 96,
    ...elevation.sm,
  },
  deckRowPressed: { transform: [{ scale: 0.99 }], opacity: 0.96 },
  deckStripe: { width: 6 },
  deckBody: { flex: 1, padding: space['4'], justifyContent: 'space-between' },
  deckHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space['2'] },
  deckName: { ...text.title, color: palette.textPrimary, flex: 1, minWidth: 0 },
  dueBadge: {
    paddingHorizontal: space['2'],
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: palette.brand,
  },
  dueBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  deckMeta: { ...text.caption, color: palette.textMuted, marginTop: 4 },
  deckCta: {
    ...text.bodyEmphasis,
    fontSize: 14,
    color: palette.brandSoft,
    marginTop: space['2'],
  },

  // Pro upsell card
  proCard: {
    backgroundColor: palette.bgRaised2,
    borderColor: palette.brand,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space['5'],
    marginTop: space['4'],
    gap: space['2'],
  },
  proCardEyebrow: { ...text.label, color: palette.brandSoft },
  proCardTitle: { ...text.title, color: palette.textPrimary },
  proCardBody: { ...text.bodySmall, color: palette.textSecondary, marginBottom: space['2'] },

  // Empty
  empty: { paddingVertical: space['8'] },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: palette.textPrimary,
    marginBottom: space['2'],
    letterSpacing: -0.5,
  },
  emptyBody: { ...text.body, color: palette.textSecondary, maxWidth: 360 },
});
