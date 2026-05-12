import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { MagnifyingGlass, X as XIcon } from 'phosphor-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { palette, radii, space, text, elevation } from '../theme/system';
import { useUserStore } from '../store/userStore';
import { SEED_LESSONS } from '../data';
import { CODE_LESSONS } from '../data';
import { AI_FOUNDATIONS_ADVANCED } from '../data/aiFoundationsAdvanced';
import { haptics } from '../utils/haptics';

/**
 * Search bar component for the Learn tab.
 *
 * Features:
 *   • Debounced fuzzy match (200 ms) across lesson title, character,
 *     scenes, takeaway, and trackId.
 *   • Results card slides into a panel under the input when focused.
 *   • Recent searches as chips below the input when empty + focused.
 *   • "No results" empty state with Ara-voice copy.
 *   • Calls `onSelectLesson(lessonId)` when the user taps a result —
 *     parent decides whether to open a preview sheet or navigate.
 */

interface Lite {
  id: string;
  trackId: string;
  title: string;
  character?: string;
  /** A small bag of searchable text — used for matching only. */
  haystack: string;
}

interface Props {
  onSelectLesson: (lessonId: string) => void;
  style?: any;
}

export function LessonSearchBar({ onSelectLesson, style }: Props) {
  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  const searchHistory = useUserStore((s) => s.searchHistory);
  const recordSearch = useUserStore((s) => s.recordSearch);
  const clearSearchHistory = useUserStore((s) => s.clearSearchHistory);

  // Build the search index from all known lesson pools.
  const index = useMemo(() => buildIndex(), []);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), 200);
    return () => clearTimeout(id);
  }, [value]);

  const results = useMemo(() => fuzzySearch(index, debounced).slice(0, 15), [index, debounced]);
  const showOverlay = focused && (value.length > 0 || searchHistory.length > 0);

  const onClear = useCallback(() => {
    haptics.tap();
    setValue('');
    inputRef.current?.focus();
  }, []);

  const onPick = useCallback(
    (id: string) => {
      haptics.select();
      if (debounced) recordSearch(debounced);
      setValue('');
      setFocused(false);
      inputRef.current?.blur();
      onSelectLesson(id);
    },
    [debounced, recordSearch, onSelectLesson],
  );

  const onChipTap = useCallback((q: string) => {
    setValue(q);
    inputRef.current?.focus();
  }, []);

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.bar, focused && styles.barFocused]}>
        <MagnifyingGlass size={18} color={palette.textMuted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder="Search lessons, topics, skills…"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
        />
        {value.length > 0 ? (
          <Pressable onPress={onClear} hitSlop={10}>
            <XIcon size={18} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {showOverlay ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.overlay}>
          {value.length === 0 && searchHistory.length > 0 ? (
            <View style={styles.recentWrap}>
              <View style={styles.recentHead}>
                <Text style={styles.recentLabel}>RECENT</Text>
                <Pressable onPress={clearSearchHistory} hitSlop={8}>
                  <Text style={styles.recentClear}>Clear</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {searchHistory.map((q) => (
                  <Pressable key={q} onPress={() => onChipTap(q)} style={styles.chip}>
                    <Text style={styles.chipText}>{q}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {value.length > 0 ? (
            results.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsTitle}>Nothing found.</Text>
                <Text style={styles.noResultsBody}>Try a different word — like "audience" or "format."</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
                {results.map((r) => (
                  <Pressable
                    key={r.lesson.id}
                    onPress={() => onPick(r.lesson.id)}
                    style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {highlightText(r.lesson.title, debounced)}
                    </Text>
                    <Text style={styles.resultMeta}>{trackLabel(r.lesson.trackId)}</Text>
                    {r.preview ? (
                      <Text style={styles.resultPreview} numberOfLines={2}>
                        {highlightText(r.preview, debounced)}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            )
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function trackLabel(trackId: string): string {
  switch (trackId) {
    case 'prompt': return 'AI Foundations';
    case 'critical': return 'Critical Thinking';
    case 'power': return 'Practical Power';
    case 'tools': return 'Tools & Taste';
    case 'create': return 'Create with AI';
    case 'vibe': return 'Code Track';
    case 'foundations': return 'AI Foundations';
    default: return trackId;
  }
}

/**
 * Build a flat list of lesson "lite" records from every known pool.
 * Keeps the matcher pure + the index recomputed only once on mount.
 */
function buildIndex(): Lite[] {
  const lite: Lite[] = [];
  const push = (id: string, trackId: string, title: string, character: string | undefined, body: string) => {
    lite.push({ id, trackId, title, character, haystack: `${title} ${character ?? ''} ${body} ${trackLabel(trackId)}`.toLowerCase() });
  };
  for (const l of SEED_LESSONS) {
    const body = (l.scenes || []).map((s) => `${s.heading} ${s.note}`).join(' ') + ' ' + (l.takeaway || '');
    push(l.id, l.trackId, l.title, l.character, body);
  }
  for (const l of CODE_LESSONS) {
    const body = (l.scenes || []).map((s) => `${s.heading} ${s.note}`).join(' ') + ' ' + (l.takeaway || '');
    push(l.id, l.trackId, l.title, l.character, body);
  }
  for (const l of AI_FOUNDATIONS_ADVANCED) {
    const body = (l.scenes || []).map((s) => `${s.heading} ${s.note}`).join(' ') + ' ' + (l.takeaway || '');
    push(l.id, l.trackId, l.title, l.character, body);
  }
  return lite;
}

/**
 * Tokenize the query and require every token to appear somewhere in the
 * haystack. Score by where matches land (title hit > track hit > body).
 */
function fuzzySearch(index: Lite[], query: string): { lesson: Lite; score: number; preview?: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const out: { lesson: Lite; score: number; preview?: string }[] = [];
  for (const lite of index) {
    const titleLower = lite.title.toLowerCase();
    const trackLower = trackLabel(lite.trackId).toLowerCase();
    // Every token must appear in the combined haystack.
    if (!tokens.every((t) => lite.haystack.includes(t))) continue;

    let score = 0;
    for (const t of tokens) {
      if (titleLower.includes(t)) score += 5;
      if (trackLower.includes(t)) score += 2;
      // Body match — give 1 point per body occurrence.
      score += Math.max(0, lite.haystack.split(t).length - 1);
    }

    // Build a small preview snippet showing the first match in the body
    // (everything in haystack after title + track).
    let preview: string | undefined;
    const firstToken = tokens[0];
    const idx = lite.haystack.indexOf(firstToken);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(lite.haystack.length, idx + 60);
      preview = (start > 0 ? '…' : '') + lite.haystack.slice(start, end) + (end < lite.haystack.length ? '…' : '');
    }

    out.push({ lesson: lite, score, preview });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/**
 * Lightweight highlight — split on the first matching token and wrap
 * the match in a styled <Text>. Not full Aho-Corasick, but enough.
 */
function highlightText(input: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return input;
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return input;
  const tok = tokens[0];
  const lower = input.toLowerCase();
  const i = lower.indexOf(tok);
  if (i < 0) return input;
  return (
    <>
      {input.slice(0, i)}
      <Text style={{ color: palette.brandSoft, fontFamily: 'Inter_700Bold' }}>
        {input.slice(i, i + tok.length)}
      </Text>
      {input.slice(i + tok.length)}
    </>
  );
}

/* ───────────────────────── styles ───────────────────────── */

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space['4'] },
  bar: {
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.bgRaised,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: space['3'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['2'],
  },
  barFocused: { borderColor: palette.brand, transform: [{ scale: 1.02 }] },
  input: {
    flex: 1,
    ...text.body,
    color: palette.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 0 : 4,
  },
  overlay: {
    backgroundColor: palette.bgRaised,
    borderRadius: radii.md,
    borderColor: palette.border,
    borderWidth: 1,
    marginTop: space['2'],
    padding: space['3'],
    ...elevation.md,
  },

  recentWrap: { gap: space['2'] },
  recentHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  recentLabel: { ...text.label, color: palette.textMuted },
  recentClear: { ...text.caption, color: palette.brandSoft },
  chipsRow: { gap: space['2'], paddingVertical: space['1'] },
  chip: {
    paddingHorizontal: space['3'],
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.bgRaised2,
    borderColor: palette.border,
    borderWidth: 1,
  },
  chipText: { ...text.caption, color: palette.textPrimary, fontFamily: 'Inter_600SemiBold' },

  noResults: { padding: space['4'], alignItems: 'center' },
  noResultsTitle: { ...text.title, color: palette.textPrimary, marginBottom: 4 },
  noResultsBody: { ...text.bodySmall, color: palette.textSecondary, textAlign: 'center' },

  resultRow: {
    paddingVertical: space['3'],
    paddingHorizontal: space['1'],
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
  },
  resultTitle: { ...text.bodyEmphasis, color: palette.textPrimary, marginBottom: 2 },
  resultMeta: { ...text.caption, color: palette.brandSoft, marginBottom: 4 },
  resultPreview: { ...text.caption, color: palette.textSecondary },
});
