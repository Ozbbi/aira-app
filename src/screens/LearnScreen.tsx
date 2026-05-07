import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../theme';
import {
  INSIGHTS,
  PATTERNS,
  MISTAKES,
  QUICK_WINS,
  dailyPick,
  hoursUntilTomorrow,
  userDailyShuffle,
} from '../data';
import { haptics } from '../utils/haptics';
import { useUserStore } from '../store/userStore';
import { AiraMascot } from '../components/AiraMascot';
import { TabScreen } from '../components/TabScreen';

/**
 * Learn — colourful, daily-rotating library.
 *
 * Layout
 *   • Hero: "TODAY'S PICK" — one insight that rotates by day-of-year. The
 *     same insight all day; tomorrow it changes. Mascot peeks from the
 *     right; counter shows hours until the next refresh.
 *   • Saved tab + 4 category tabs (Insights / Patterns / Mistakes / Wins)
 *   • Each category has its own gradient theme — no more grey wall.
 *   • Every card has a bookmark heart that toggles into the user's
 *     persisted Saved list.
 */

type Section = 'today' | 'saved' | 'insights' | 'patterns' | 'mistakes' | 'wins';

interface SectionDef {
  id: Section;
  label: string;
  emoji: string;
  /** "savedCount" only matters for the Saved pill — every other section
      hides its count to feel "always more". */
  showCount?: boolean;
  count?: number;
  gradient: readonly [string, string, ...string[]];
}

export function LearnScreen() {
  const userId = useUserStore((s) => s.userId);
  const bookmarks = useUserStore((s) => s.bookmarks);
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);
  const [active, setActive] = useState<Section>('today');

  // Daily-rotating, per-user shuffles — the same user sees the same order
  // all day, and tomorrow it shifts. Two users get different orders, so
  // word-of-mouth recommendations stay accurate ("the one near the top
  // about X") even when content is the same.
  const insightsOrder = useMemo(() => userDailyShuffle(INSIGHTS, userId), [userId]);
  const patternsOrder = useMemo(() => userDailyShuffle(PATTERNS, userId), [userId]);
  const mistakesOrder = useMemo(() => userDailyShuffle(MISTAKES, userId), [userId]);
  const winsOrder = useMemo(() => userDailyShuffle(QUICK_WINS, userId), [userId]);

  const todayInsight = useMemo(() => dailyPick(INSIGHTS), []);
  const todayPattern = useMemo(() => dailyPick(PATTERNS), []);
  const todayMistake = useMemo(() => dailyPick(MISTAKES), []);
  const todayWin = useMemo(() => dailyPick(QUICK_WINS), []);
  const hoursLeft = hoursUntilTomorrow();

  const sections: SectionDef[] = [
    { id: 'today',    label: 'Today',    emoji: '🌅', gradient: ['#F59E0B', '#EC4899'] as const },
    { id: 'saved',    label: 'Saved',    emoji: '💛', showCount: true, count: bookmarks.length, gradient: ['#A855F7', '#EC4899'] as const },
    { id: 'insights', label: 'Insights', emoji: '💡', gradient: ['#F59E0B', '#FB923C'] as const },
    { id: 'patterns', label: 'Patterns', emoji: '🧩', gradient: ['#06B6D4', '#3B82F6'] as const },
    { id: 'mistakes', label: 'Mistakes', emoji: '⚠️', gradient: ['#EC4899', '#F43F5E'] as const },
    { id: 'wins',     label: 'Quick Wins', emoji: '⚡', gradient: ['#10B981', '#06B6D4'] as const },
  ];

  const onPickSection = (s: Section) => {
    haptics.select();
    setActive(s);
  };

  const onBookmark = (id: string) => {
    haptics.tap();
    toggleBookmark(id);
  };

  const allItems = useMemo(() => [
    ...INSIGHTS.map((i) => ({ kind: 'insight' as const, id: i.id, item: i })),
    ...PATTERNS.map((i) => ({ kind: 'pattern' as const, id: i.id, item: i })),
    ...MISTAKES.map((i) => ({ kind: 'mistake' as const, id: i.id, item: i })),
    ...QUICK_WINS.map((i) => ({ kind: 'win' as const, id: i.id, item: i })),
  ], []);

  const savedItems = useMemo(
    () => allItems.filter((x) => bookmarks.includes(x.id)),
    [allItems, bookmarks]
  );

  return (
    <TabScreen>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(260)}>
        <Text style={styles.eyebrow}>LEARN</Text>
        <Text style={styles.headline}>Your AIRA library.</Text>
        <Text style={styles.sub}>
          Bite-sized reads. New picks every 24h.
        </Text>
      </Animated.View>

      {/* Section pill row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillRowContent}
      >
        {sections.map((s) => {
          const isActive = active === s.id;
          const label = s.showCount ? `${s.emoji}  ${s.label}  ·  ${s.count ?? 0}` : `${s.emoji}  ${s.label}`;
          if (isActive) {
            return (
              <LinearGradient
                key={s.id}
                colors={s.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.pill, styles.pillActive]}
              >
                <Pressable onPress={() => onPickSection(s.id)} style={styles.pillInner}>
                  <Text style={[styles.pillText, styles.pillTextActive]}>{label}</Text>
                </Pressable>
              </LinearGradient>
            );
          }
          return (
            <Pressable key={s.id} onPress={() => onPickSection(s.id)} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {active === 'today' && (
        <TodayView
          insight={todayInsight}
          pattern={todayPattern}
          mistake={todayMistake}
          win={todayWin}
          hoursLeft={hoursLeft}
          bookmarks={bookmarks}
          onBookmark={onBookmark}
        />
      )}

      {active === 'saved' && (
        <SavedView items={savedItems} onBookmark={onBookmark} />
      )}

      {active === 'insights' && (
        <InsightsList items={insightsOrder} bookmarks={bookmarks} onBookmark={onBookmark} />
      )}

      {active === 'patterns' && (
        <PatternsList items={patternsOrder} bookmarks={bookmarks} onBookmark={onBookmark} />
      )}

      {active === 'mistakes' && (
        <MistakesList items={mistakesOrder} bookmarks={bookmarks} onBookmark={onBookmark} />
      )}

      {active === 'wins' && (
        <WinsList items={winsOrder} bookmarks={bookmarks} onBookmark={onBookmark} />
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
    </TabScreen>
  );
}

/* -------------------------------- Today view -------------------------------- */

function TodayView({
  insight, pattern, mistake, win, hoursLeft, bookmarks, onBookmark,
}: {
  insight: typeof INSIGHTS[number];
  pattern: typeof PATTERNS[number];
  mistake: typeof MISTAKES[number];
  win: typeof QUICK_WINS[number];
  hoursLeft: number;
  bookmarks: string[];
  onBookmark: (id: string) => void;
}) {
  return (
    <View>
      {/* Hero */}
      <Animated.View entering={FadeIn.duration(280)}>
        <LinearGradient
          colors={['#F59E0B', '#EC4899', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHead}>
            <Text style={styles.heroEyebrow}>TODAY'S PICK · refreshes in {hoursLeft}h</Text>
            <BookmarkButton
              active={bookmarks.includes(insight.id)}
              onPress={() => onBookmark(insight.id)}
            />
          </View>
          <Text style={styles.heroTitle}>{insight.title}</Text>
          <Text style={styles.heroBody} numberOfLines={4}>
            {insight.body.split('\n\n')[0]}
          </Text>
          <View style={styles.heroFooter}>
            <View style={styles.heroTakeawayPill}>
              <Text style={styles.heroTakeawayText}>{insight.takeaway}</Text>
            </View>
            <View style={styles.heroMascot} pointerEvents="none">
              <AiraMascot size={68} mood="encouraging" />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Three colourful "today" mini-cards */}
      <Animated.View entering={FadeInDown.duration(280).delay(60)}>
        <ColorCard
          eyebrow="TODAY'S PATTERN"
          title={pattern.name}
          body={pattern.useCase}
          gradient={['#06B6D4', '#3B82F6'] as const}
          isSaved={bookmarks.includes(pattern.id)}
          onBookmark={() => onBookmark(pattern.id)}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(280).delay(110)}>
        <ColorCard
          eyebrow="TODAY'S COMMON MISTAKE"
          title={mistake.title}
          body={mistake.theFix}
          gradient={['#EC4899', '#F43F5E'] as const}
          isSaved={bookmarks.includes(mistake.id)}
          onBookmark={() => onBookmark(mistake.id)}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(280).delay(160)}>
        <ColorCard
          eyebrow="TODAY'S 60-SEC WIN"
          title={win.title}
          body={win.body}
          gradient={['#10B981', '#06B6D4'] as const}
          isSaved={bookmarks.includes(win.id)}
          onBookmark={() => onBookmark(win.id)}
        />
      </Animated.View>
    </View>
  );
}

/* -------------------------------- Saved view -------------------------------- */

function SavedView({
  items, onBookmark,
}: {
  items: { kind: 'insight' | 'pattern' | 'mistake' | 'win'; id: string; item: any }[];
  onBookmark: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <AiraMascot size={120} mood="thinking" />
        <Text style={styles.emptyTitle}>Nothing saved yet.</Text>
        <Text style={styles.emptyBody}>
          Tap the heart on any card and it lands here. Build your own AIRA cheat sheet.
        </Text>
      </View>
    );
  }
  return (
    <View>
      {items.map((x, i) => {
        const gradient =
          x.kind === 'pattern' ? (['#06B6D4', '#3B82F6'] as const) :
          x.kind === 'mistake' ? (['#EC4899', '#F43F5E'] as const) :
          x.kind === 'win'     ? (['#10B981', '#06B6D4'] as const) :
                                 (['#F59E0B', '#FB923C'] as const);
        const eyebrow =
          x.kind === 'pattern' ? 'PATTERN' :
          x.kind === 'mistake' ? 'COMMON MISTAKE' :
          x.kind === 'win'     ? '60-SEC WIN' :
                                 'INSIGHT';
        const title = x.kind === 'pattern' ? x.item.name : x.item.title;
        const body =
          x.kind === 'pattern' ? x.item.useCase :
          x.kind === 'mistake' ? x.item.theFix :
          x.kind === 'win'     ? x.item.body :
                                 x.item.takeaway;
        return (
          <Animated.View key={x.id} entering={FadeInDown.duration(220).delay(i * 28)}>
            <ColorCard
              eyebrow={eyebrow}
              title={title}
              body={body}
              gradient={gradient}
              isSaved
              onBookmark={() => onBookmark(x.id)}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

/* ---------------------------- per-category lists ---------------------------- */

function InsightsList({
  items, bookmarks, onBookmark,
}: { items: typeof INSIGHTS; bookmarks: string[]; onBookmark: (id: string) => void }) {
  return (
    <View>
      {items.map((it, i) => (
        <Animated.View key={it.id} entering={FadeInDown.duration(220).delay(i * 22)}>
          <ColorCard
            eyebrow="INSIGHT"
            title={it.title}
            body={it.body.split('\n\n')[0]}
            takeaway={it.takeaway}
            gradient={['#F59E0B', '#FB923C'] as const}
            isSaved={bookmarks.includes(it.id)}
            onBookmark={() => onBookmark(it.id)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

function PatternsList({ items, bookmarks, onBookmark }: { items: typeof PATTERNS; bookmarks: string[]; onBookmark: (id: string) => void }) {
  return (
    <View>
      {items.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.duration(220).delay(i * 22)}>
          <ColorCard
            eyebrow="PATTERN"
            title={p.name}
            body={p.useCase}
            gradient={['#06B6D4', '#3B82F6'] as const}
            isSaved={bookmarks.includes(p.id)}
            onBookmark={() => onBookmark(p.id)}
            footer={
              <>
                <Text style={styles.codeLabel}>TEMPLATE</Text>
                <Text style={styles.codeText}>{p.template}</Text>
              </>
            }
          />
        </Animated.View>
      ))}
    </View>
  );
}

function MistakesList({ items, bookmarks, onBookmark }: { items: typeof MISTAKES; bookmarks: string[]; onBookmark: (id: string) => void }) {
  return (
    <View>
      {items.map((m, i) => (
        <Animated.View key={m.id} entering={FadeInDown.duration(220).delay(i * 22)}>
          <ColorCard
            eyebrow="COMMON MISTAKE"
            title={m.title}
            body={m.whyPeopleDoIt}
            gradient={['#EC4899', '#F43F5E'] as const}
            isSaved={bookmarks.includes(m.id)}
            onBookmark={() => onBookmark(m.id)}
            footer={
              <>
                <Text style={styles.miniLabel}>The fix</Text>
                <Text style={styles.fixText}>{m.theFix}</Text>
              </>
            }
          />
        </Animated.View>
      ))}
    </View>
  );
}

function WinsList({ items, bookmarks, onBookmark }: { items: typeof QUICK_WINS; bookmarks: string[]; onBookmark: (id: string) => void }) {
  return (
    <View>
      {items.map((q, i) => (
        <Animated.View key={q.id} entering={FadeInDown.duration(220).delay(i * 18)}>
          <ColorCard
            eyebrow="60-SEC WIN"
            title={q.title}
            body={q.body}
            gradient={['#10B981', '#06B6D4'] as const}
            isSaved={bookmarks.includes(q.id)}
            onBookmark={() => onBookmark(q.id)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

/* ----------------------------- ColorCard ----------------------------- */

function ColorCard({
  eyebrow, title, body, gradient, isSaved, onBookmark, footer, takeaway,
}: {
  eyebrow: string;
  title: string;
  body: string;
  gradient: readonly [string, string, ...string[]];
  isSaved: boolean;
  onBookmark: () => void;
  footer?: React.ReactNode;
  takeaway?: string;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardHead}>
        <Text style={styles.cardEyebrow}>{eyebrow}</Text>
        <BookmarkButton active={isSaved} onPress={onBookmark} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
      {takeaway ? (
        <View style={styles.takeawayPill}>
          <Text style={styles.takeawayText}>{takeaway}</Text>
        </View>
      ) : null}
      {footer ? <View style={styles.cardFooter}>{footer}</View> : null}
    </LinearGradient>
  );
}

function BookmarkButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable hitSlop={8} onPress={onPress} style={styles.bookmarkBtn}>
      <Text style={styles.bookmarkIcon}>{active ? '💛' : '🤍'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: { ...typography.label, color: colors.airaGlow, marginBottom: spacing.xs },
  headline: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
  sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },

  pillRow: { marginHorizontal: -spacing.lg, marginBottom: spacing.md },
  pillRowContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderColor: 'transparent',
  },
  pillInner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillText: { ...typography.caption, color: colors.textSecondary },
  pillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },

  // Hero
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroEyebrow: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  heroTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  heroBody: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTakeawayPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    flexShrink: 1,
  },
  heroTakeawayText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  heroMascot: { marginLeft: spacing.sm },

  // ColorCard
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardEyebrow: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardBody: {
    ...typography.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.93)',
    lineHeight: 22,
  },
  takeawayPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  takeawayText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  cardFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopColor: 'rgba(255,255,255,0.22)',
    borderTopWidth: 1,
  },
  miniLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  fixText: {
    ...typography.body,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  codeLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  codeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },

  bookmarkBtn: {
    paddingLeft: spacing.sm,
  },
  bookmarkIcon: {
    fontSize: 22,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },

  bottomSpace: { height: 100 },
});
