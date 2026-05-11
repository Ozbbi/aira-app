import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Fire, Trophy, BookOpen, Target } from 'phosphor-react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { useUserStore, XP_PER_LEVEL } from '../store/userStore';

const SCREEN_W = Dimensions.get('window').width;

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: string;
}

function SkillRadar({ scores }: { scores: Record<string, number> }) {
  const size = SCREEN_W - 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;
  const labels = ['Clarity', 'Specificity', 'Context', 'Formatting', 'Iteration'];
  const values = [scores.clarity, scores.specificity, scores.context, scores.formatting, scores.iteration];

  const getPoint = (i: number, radius: number) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridPoints = (radius: number) =>
    Array.from({ length: 5 }).map((_, i) => getPoint(i, radius)).map((p) => `${p.x},${p.y}`).join(' ');

  const dataPoints = values
    .map((v, i) => getPoint(i, (v / 100) * r))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <Svg width={size} height={size} style={{ alignSelf: 'center' }}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((s) => (
        <Polygon key={s} points={gridPoints(r * s)} fill="none" stroke={colors.divider} strokeWidth="1" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => {
        const p = getPoint(i, r);
        return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.divider} strokeWidth="0.5" />;
      })}
      <Polygon points={dataPoints} fill={colors.cyanWash} stroke={colors.cyan} strokeWidth="2" />
      {values.map((_, i) => {
        const p = getPoint(i, (values[i] / 100) * r);
        return <Circle key={i} cx={p.x} cy={p.y} r="4" fill={colors.cyan} />;
      })}
      {labels.map((label, i) => {
        const p = getPoint(i, r + 18);
        return (
          <SvgText
            key={label}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill={colors.textSecondary}
            fontSize="11"
            fontFamily="Inter_500Medium"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export function ProgressScreen() {
  const { xp, level, streak, bestStreak, totalLessonsCompleted, bookmarks, skillScores, sandboxSubmissions, completedLessonIds } = useUserStore();

  const xpForNext = level * XP_PER_LEVEL;
  const xpInLevel = xp - (level - 1) * XP_PER_LEVEL;
  const xpProgress = Math.min(1, xpInLevel / XP_PER_LEVEL);

  const days = useMemo(() => buildCalendar(streak), [streak]);

  const achievements: Achievement[] = useMemo(() => [
    { id: 'first', name: 'First Step', description: 'Complete your first lesson', unlocked: totalLessonsCompleted >= 1 },
    { id: 'five', name: 'Getting Started', description: '5 lessons done', unlocked: totalLessonsCompleted >= 5, progress: totalLessonsCompleted < 5 ? `${totalLessonsCompleted}/5` : undefined },
    { id: 'ten', name: 'Sharp Learner', description: '10 lessons done', unlocked: totalLessonsCompleted >= 10, progress: totalLessonsCompleted < 10 ? `${totalLessonsCompleted}/10` : undefined },
    { id: 'twentyfive', name: 'Dedicated', description: '25 lessons done', unlocked: totalLessonsCompleted >= 25, progress: totalLessonsCompleted < 25 ? `${totalLessonsCompleted}/25` : undefined },
    { id: 's3', name: 'Warming Up', description: '3-day streak', unlocked: streak >= 3, progress: streak < 3 ? `${streak}/3` : undefined },
    { id: 's7', name: 'Week Warrior', description: '7-day streak', unlocked: streak >= 7, progress: streak < 7 ? `${streak}/7` : undefined },
    { id: 's30', name: 'Monthly Master', description: '30-day streak', unlocked: streak >= 30, progress: streak < 30 ? `${streak}/30` : undefined },
    { id: 'sandbox', name: 'Sandbox Pro', description: '10 sandbox submissions', unlocked: sandboxSubmissions >= 10, progress: sandboxSubmissions < 10 ? `${sandboxSubmissions}/10` : undefined },
    { id: 'curator', name: 'Curator', description: 'Save 10 cards', unlocked: bookmarks.length >= 10, progress: bookmarks.length < 10 ? `${bookmarks.length}/10` : undefined },
    { id: 'audience', name: 'Audience Master', description: 'Complete the audience lesson', unlocked: completedLessonIds.includes('foundations_2') },
  ], [totalLessonsCompleted, streak, sandboxSubmissions, bookmarks.length, completedLessonIds]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(250)}>
          <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.title}>Keep going.</Text>
        </Animated.View>

        {/* Level + XP */}
        <Animated.View entering={FadeInDown.duration(250).delay(40)}>
          <View style={styles.levelCard}>
            <View style={styles.levelCircle}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level {level}</Text>
              <View style={styles.levelXpBar}>
                <View style={[styles.levelXpFill, { width: `${xpProgress * 100}%` }]} />
              </View>
              <Text style={styles.levelXpText}>{xpInLevel}/{XP_PER_LEVEL} XP to next level</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(250).delay(80)} style={styles.statsRow}>
          <StatCell icon={<Target size={18} color={colors.cyan} />} value={String(xp)} label="Total XP" />
          <StatCell icon={<Fire size={18} color={colors.orange} />} value={String(streak)} label="Streak" />
          <StatCell icon={<Trophy size={18} color={colors.success} />} value={String(bestStreak)} label="Best" />
          <StatCell icon={<BookOpen size={18} color={colors.cyan} />} value={String(totalLessonsCompleted)} label="Lessons" />
        </Animated.View>

        {/* Skill Radar */}
        <Animated.View entering={FadeInDown.duration(250).delay(120)} style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Radar</Text>
          <View style={styles.radarCard}>
            <SkillRadar scores={skillScores} />
          </View>
        </Animated.View>

        {/* Streak Calendar */}
        <Animated.View entering={FadeInDown.duration(250).delay(160)} style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.calendarCard}>
            <View style={styles.calendarGrid}>
              {days.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.calendarCell,
                    d.filled && styles.calendarFilled,
                    d.isToday && styles.calendarToday,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.calendarCaption}>
              {days.filter((d) => d.filled).length} active days this month
            </Text>
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInDown.duration(250).delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionMeta}>{unlockedCount}/{achievements.length}</Text>
          </View>
          <View style={styles.achievementGrid}>
            {achievements.map((a) => (
              <View key={a.id} style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}>
                <View style={[styles.achievementBadge, a.unlocked && styles.achievementBadgeUnlocked]}>
                  <Text style={styles.achievementGlyph}>{a.unlocked ? '✓' : '?'}</Text>
                </View>
                <Text style={[styles.achievementName, !a.unlocked && styles.achievementNameLocked]} numberOfLines={1}>
                  {a.unlocked ? a.name : '???'}
                </Text>
                <Text style={styles.achievementDesc} numberOfLines={2}>{a.description}</Text>
                {a.progress && <Text style={styles.achievementProgress}>{a.progress}</Text>}
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function buildCalendar(streak: number): { filled: boolean; isToday: boolean }[] {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  return Array.from({ length: daysInMonth }).map((_, i) => {
    const dayNum = i + 1;
    const daysAgo = currentDay - dayNum;
    return {
      filled: daysAgo >= 0 && daysAgo < streak,
      isToday: dayNum === currentDay,
    };
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: spacing.lg },

  eyebrow: { ...typography.label, color: colors.cyan, marginBottom: 4 },
  title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },

  // Level
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: 20,
    marginBottom: spacing.md, ...elevation.card,
  },
  levelCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, borderColor: colors.cyan,
    justifyContent: 'center', alignItems: 'center',
  },
  levelNumber: { fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.cyan },
  levelInfo: { flex: 1 },
  levelLabel: { ...typography.headline, color: colors.textPrimary, marginBottom: 6 },
  levelXpBar: { height: 6, backgroundColor: colors.divider, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  levelXpFill: { height: '100%', backgroundColor: colors.cyan, borderRadius: 3 },
  levelXpText: { ...typography.caption, color: colors.textSecondary },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.cardSurface,
    borderRadius: radius.lg, padding: 16, marginBottom: spacing.lg, ...elevation.sm,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.textPrimary },
  statLabel: { ...typography.caption, fontSize: 11, color: colors.textDisabled },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.md },
  sectionMeta: { ...typography.caption, color: colors.textSecondary },

  // Radar
  radarCard: { backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: 16, ...elevation.sm },

  // Calendar
  calendarCard: { backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: 16, ...elevation.sm },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  calendarCell: {
    width: (SCREEN_W - 32 - 32 - 6 * 6) / 7, height: 28,
    borderRadius: 4, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.divider,
  },
  calendarFilled: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  calendarToday: { borderColor: colors.orange, borderWidth: 2 },
  calendarCaption: { ...typography.caption, color: colors.textDisabled },

  // Achievements
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementCard: {
    width: '47%', backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 14, minHeight: 120, ...elevation.sm,
  },
  achievementLocked: { opacity: 0.5 },
  achievementBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.elevated, justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: colors.divider,
  },
  achievementBadgeUnlocked: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  achievementGlyph: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 },
  achievementName: { ...typography.bodyBold, fontSize: 14, color: colors.textPrimary, marginBottom: 2 },
  achievementNameLocked: { color: colors.textSecondary },
  achievementDesc: { ...typography.caption, color: colors.textDisabled },
  achievementProgress: { ...typography.caption, color: colors.cyan, fontFamily: 'Inter_700Bold', marginTop: 4 },
});
