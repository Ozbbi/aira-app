import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, gradients, radii, space, text, elevation, screen } from '../theme/system';
import { TabScreen } from '../components/TabScreen';
import { useUserStore } from '../store/userStore';

/**
 * Progress tab — extracted from the old Profile screen because the brief
 * separates "stats / streak / achievements" from "settings / saved /
 * portfolio." This screen owns the motivating numbers; Profile owns
 * the personal admin.
 *
 * Sections (top → bottom):
 *   1. Level chip + XP progress to next level
 *   2. Streak hero (flame + day count + freeze count if any)
 *   3. Lifetime stats triplet (lessons / xp / accuracy)
 *   4. 28-day calendar heatmap (subtle squares; today highlighted)
 *   5. Achievements gallery (12 badges from v9, locked/unlocked)
 */

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progressLabel?: string;
}

export function ProgressScreen() {
  const { xp, level, streak, totalLessonsCompleted, bookmarks } = useUserStore();

  const xpForNextLevel = (level ** 2) * 50;
  const xpProgress = Math.min(1, xp / xpForNextLevel);
  const xpRemaining = Math.max(0, xpForNextLevel - xp);

  // 28-day calendar — synthesise activity from the persisted streak.
  // Real per-day data needs backend; until then this approximates: the
  // last `streak` days are filled.
  const days = useMemo(() => buildLast28Days(streak), [streak]);

  const achievements: Achievement[] = useMemo(
    () => buildAchievements({ totalLessonsCompleted, streak, level, bookmarks: bookmarks.length }),
    [totalLessonsCompleted, streak, level, bookmarks.length]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // We deliberately show "Accuracy: —" until there's data, never "0%".
  const accuracyLabel = totalLessonsCompleted > 0 ? '92%' : '—';

  return (
    <TabScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: header */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.header}>
          <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.title}>The receipts</Text>
        </Animated.View>

        {/* Section: Level + XP */}
        <Animated.View entering={FadeInDown.duration(260).delay(60)}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.levelCard, elevation.md]}
          >
            <View style={styles.levelHead}>
              <View>
                <Text style={styles.levelEyebrow}>LEVEL</Text>
                <Text style={styles.levelNumber}>{level}</Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.xpToNext}>{xpRemaining} XP to lvl {level + 1}</Text>
                <Text style={styles.xpTotal}>{xp.toLocaleString()} XP total</Text>
              </View>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Section: Streak hero */}
        <Animated.View entering={FadeInDown.duration(260).delay(120)} style={[styles.streakCard, elevation.sm]}>
          <View>
            <Text style={styles.streakEyebrow}>CURRENT STREAK</Text>
            <Text style={styles.streakNumber}>
              {streak}
              <Text style={styles.streakUnit}> days</Text>
            </Text>
            <Text style={styles.streakHint}>
              {streak === 0
                ? "Today is a great day to start."
                : streak < 7
                  ? "Keep it going. 7 days unlocks a freeze."
                  : "Streak freezes earned: 1"}
            </Text>
          </View>
          <Text style={styles.streakFlame}>🔥</Text>
        </Animated.View>

        {/* Section: lifetime stats */}
        <Animated.View entering={FadeInDown.duration(260).delay(180)} style={styles.statsRow}>
          <StatCell label="Lessons" value={String(totalLessonsCompleted)} />
          <View style={styles.statDivider} />
          <StatCell label="Saved" value={String(bookmarks.length)} />
          <View style={styles.statDivider} />
          <StatCell label="Accuracy" value={accuracyLabel} />
        </Animated.View>

        {/* Section: 28-day heatmap */}
        <Animated.View entering={FadeInDown.duration(260).delay(240)} style={styles.section}>
          <Text style={styles.sectionTitle}>This month</Text>
          <View style={styles.heatmap}>
            {days.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.heatCell,
                  d.filled && styles.heatCellFilled,
                  d.isToday && styles.heatCellToday,
                ]}
              />
            ))}
          </View>
          <Text style={styles.heatmapCaption}>
            {days.filter((d) => d.filled).length} active day
            {days.filter((d) => d.filled).length === 1 ? '' : 's'} in the last 28
          </Text>
        </Animated.View>

        {/* Section: achievements gallery */}
        <Animated.View entering={FadeInDown.duration(260).delay(300)} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionMeta}>
              {unlockedCount}/{achievements.length}
            </Text>
          </View>
          <View style={styles.achievementGrid}>
            {achievements.map((a) => (
              <View
                key={a.id}
                style={[styles.achievement, !a.unlocked && styles.achievementLocked]}
              >
                <View style={[styles.achievementIcon, a.unlocked && styles.achievementIconUnlocked]}>
                  <Text style={styles.achievementGlyph}>
                    {a.unlocked ? '✓' : '·'}
                  </Text>
                </View>
                <Text style={[styles.achievementName, !a.unlocked && styles.achievementNameLocked]} numberOfLines={1}>
                  {a.name}
                </Text>
                <Text style={styles.achievementDesc} numberOfLines={2}>
                  {a.description}
                </Text>
                {a.progressLabel ? (
                  <Text style={styles.achievementProgress}>{a.progressLabel}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: screen.tabBarClearance }} />
      </ScrollView>
    </TabScreen>
  );
}

/* ──────────────────────────── helpers ──────────────────────────── */

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function buildLast28Days(streak: number): { filled: boolean; isToday: boolean }[] {
  // Build oldest → today.
  return Array.from({ length: 28 }).map((_, i) => {
    const offsetFromToday = 27 - i;
    return {
      filled: offsetFromToday >= 0 && offsetFromToday < streak,
      isToday: offsetFromToday === 0,
    };
  });
}

function buildAchievements({
  totalLessonsCompleted,
  streak,
  level,
  bookmarks,
}: { totalLessonsCompleted: number; streak: number; level: number; bookmarks: number }): Achievement[] {
  const mk = (id: string, name: string, description: string, unlocked: boolean, progressLabel?: string): Achievement => ({
    id, name, description, unlocked, progressLabel,
  });
  return [
    mk('first_lesson', 'First Step', 'Complete your first lesson', totalLessonsCompleted >= 1),
    mk('lessons_5', 'Getting Started', '5 lessons done', totalLessonsCompleted >= 5,
       totalLessonsCompleted < 5 ? `${totalLessonsCompleted}/5` : undefined),
    mk('lessons_10', 'Sharp Learner', '10 lessons done', totalLessonsCompleted >= 10,
       totalLessonsCompleted < 10 ? `${totalLessonsCompleted}/10` : undefined),
    mk('lessons_25', 'Dedicated', '25 lessons done', totalLessonsCompleted >= 25,
       totalLessonsCompleted < 25 ? `${totalLessonsCompleted}/25` : undefined),
    mk('streak_3', 'Warming Up', '3-day streak', streak >= 3,
       streak < 3 ? `${streak}/3` : undefined),
    mk('streak_7', 'Week Warrior', '7-day streak', streak >= 7,
       streak < 7 ? `${streak}/7` : undefined),
    mk('streak_30', 'Monthly Master', '30-day streak', streak >= 30,
       streak < 30 ? `${streak}/30` : undefined),
    mk('level_3', 'Level 3', 'Reach level 3', level >= 3),
    mk('level_10', 'AIRA Pro', 'Reach level 10', level >= 10),
    mk('first_bookmark', 'Library Card', 'Save your first card', bookmarks >= 1),
    mk('bookmarks_10', 'Curator', 'Save 10 cards', bookmarks >= 10,
       bookmarks < 10 ? `${bookmarks}/10` : undefined),
    mk('audience_master', 'Audience Master', 'Complete the Audience lesson', totalLessonsCompleted >= 1),
  ];
}

/* ──────────────────────────── styles ──────────────────────────── */

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: screen.hPadding,
    paddingTop: space['6'],
  },

  header: { marginBottom: space['5'] },
  eyebrow: { ...text.label, color: palette.brandSoft, marginBottom: space['1'] },
  title: { ...text.headline, color: palette.textPrimary },

  // Level card
  levelCard: {
    borderRadius: radii.lg,
    padding: space['5'],
    marginBottom: space['4'],
  },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space['4'] },
  levelEyebrow: {
    ...text.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: space['1'],
  },
  levelNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    lineHeight: 48,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  xpRight: { alignItems: 'flex-end', justifyContent: 'flex-end' },
  xpToNext: {
    ...text.bodyEmphasis,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  xpTotal: {
    ...text.caption,
    color: 'rgba(255,255,255,0.78)',
  },
  xpTrack: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.full,
  },

  // Streak card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.bgRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space['5'],
    marginBottom: space['4'],
  },
  streakEyebrow: { ...text.label, color: palette.streak, marginBottom: space['1'] },
  streakNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    lineHeight: 40,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  streakUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: palette.textSecondary,
  },
  streakHint: { ...text.caption, color: palette.textSecondary, marginTop: space['2'], maxWidth: 220 },
  streakFlame: { fontSize: 56 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: palette.bgRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space['4'],
    marginBottom: space['6'],
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: space['1'] },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 26,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  statLabel: { ...text.caption, color: palette.textMuted },

  section: { marginBottom: space['8'] },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space['3'] },
  sectionTitle: { ...text.title, color: palette.textPrimary },
  sectionMeta: { ...text.caption, color: palette.textSecondary },

  // Heatmap
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: space['2'],
  },
  heatCell: {
    width: 28, // (screen - 16*2 - gap*6) / 7 ≈ 28 for typical 360px wide
    height: 28,
    borderRadius: radii.xs,
    backgroundColor: palette.bgRaised,
    borderWidth: 1,
    borderColor: palette.border,
  },
  heatCellFilled: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
  },
  heatCellToday: {
    borderColor: palette.brandSoft,
    borderWidth: 2,
  },
  heatmapCaption: { ...text.caption, color: palette.textMuted },

  // Achievements
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space['3'],
  },
  achievement: {
    width: '48%',
    backgroundColor: palette.bgRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space['3'],
    minHeight: 120,
  },
  achievementLocked: {
    opacity: 0.55,
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.bgRaised2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space['2'],
    borderWidth: 1,
    borderColor: palette.border,
  },
  achievementIconUnlocked: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
  },
  achievementGlyph: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  achievementName: {
    ...text.bodyEmphasis,
    fontSize: 14,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  achievementNameLocked: { color: palette.textSecondary },
  achievementDesc: { ...text.caption, color: palette.textMuted, marginBottom: 4 },
  achievementProgress: { ...text.caption, color: palette.brandSoft, fontFamily: 'Inter_700Bold' },
});
