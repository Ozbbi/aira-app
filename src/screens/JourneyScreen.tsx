import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AiraMascot } from '../components/AiraMascot';
import { colors, radius, spacing, typography } from '../theme';
import { useUserStore } from '../store/userStore';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../types';

/**
 * Journey — a Candy Crush-style vertical zigzag path of lesson nodes.
 *
 * Node states:
 *   completed   solid gradient fill, ✓ glyph, no glow
 *   active      brand gradient fill + halo + the live AIRA mascot beside it
 *   upcoming    soft outlined disc, dimmed
 *
 * The connecting curve is one continuous SVG path drawn behind the nodes.
 * Its colour switches mid-path: the segment up to the active node uses the
 * "completed" gradient; everything past it is muted.
 *
 * Sections (Anthropic-inspired phases) act as chapter dividers between
 * groups of 4–5 nodes.
 */

interface JourneyNode {
  id: string;
  title: string;
  lessonId?: string;
  phase: 1 | 2 | 3;
}

const NODES: JourneyNode[] = [
  // Phase 1 — Get fluent
  { id: 'n1',  phase: 1, title: 'Why specific beats creative', lessonId: 'prompt_specific' },
  { id: 'n2',  phase: 1, title: '3-second test for any prompt' },
  { id: 'n3',  phase: 1, title: 'Audience + format + tone' },
  { id: 'n4',  phase: 1, title: 'The follow-up move',           lessonId: 'power_iteration' },
  // Phase 2 — Get sharp
  { id: 'n5',  phase: 2, title: '3-question trust test',        lessonId: 'critical_three_question_test' },
  { id: 'n6',  phase: 2, title: 'Reading AI confidence',        lessonId: 'critical_reading_confidence' },
  { id: 'n7',  phase: 2, title: 'Verify in 60 seconds',         lessonId: 'critical_verify_workflow' },
  { id: 'n8',  phase: 2, title: 'What AI is bad at',            lessonId: 'capabilities_what_ai_cant' },
  { id: 'n9',  phase: 2, title: 'Chain of thought',             lessonId: 'power_chain_of_thought' },
  // Phase 3 — Get dangerous
  { id: 'n10', phase: 3, title: 'System prompts',               lessonId: 'power_system_prompts' },
  { id: 'n11', phase: 3, title: 'Tool use, in plain English',   lessonId: 'power_tool_use' },
  { id: 'n12', phase: 3, title: 'Pick the right AI',            lessonId: 'tools_picking_right_ai' },
  { id: 'n13', phase: 3, title: 'Make AI write like you',       lessonId: 'create_voice_clone' },
  { id: 'n14', phase: 3, title: 'The 4 Ds of AI fluency',       lessonId: 'fluency_four_ds' },
];

const PHASE_HEADERS: { phase: 1 | 2 | 3; range: string; title: string; gradient: readonly [string, string, ...string[]] }[] = [
  { phase: 1, range: 'WEEKS 1–4',  title: 'Get fluent',     gradient: ['#6366F1', '#8B5CF6'] as const },
  { phase: 2, range: 'WEEKS 5–8',  title: 'Get sharp',      gradient: ['#EC4899', '#F59E0B'] as const },
  { phase: 3, range: 'WEEKS 9–12', title: 'Get dangerous',  gradient: ['#F59E0B', '#EC4899', '#8B5CF6'] as const },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const NODE_SIZE = 84;
const NODE_GAP_Y = 110; // vertical distance between consecutive node centres
// Horizontal swing — keeps the path inside the screen with a comfy margin.
const SWING_X = Math.min(110, (SCREEN_WIDTH - NODE_SIZE) / 2 - 24);

export function JourneyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const totalCompleted = useUserStore((s) => s.totalLessonsCompleted);

  // Active node = first uncompleted node (or last node if everything's done).
  const activeIndex = Math.min(totalCompleted, NODES.length - 1);

  // Pre-compute screen-space (cx, cy) for every node so the SVG path and
  // the absolute-positioned node views agree on geometry.
  const positions = useMemo(() => {
    const centerX = SCREEN_WIDTH / 2;
    return NODES.map((_, i) => {
      // Sinusoidal sway — even index left of centre, odd right.
      const sway = Math.sin((i * Math.PI) / 2) * SWING_X;
      const cx = centerX + sway;
      const cy = NODE_SIZE / 2 + i * NODE_GAP_Y;
      return { cx, cy };
    });
  }, []);

  const totalHeight = NODE_SIZE + (NODES.length - 1) * NODE_GAP_Y;

  // Build the SVG path that traces every node centre with smooth bezier curves.
  const fullPath = useMemo(() => {
    if (positions.length === 0) return '';
    let d = `M ${positions[0].cx} ${positions[0].cy}`;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const cur = positions[i];
      const c1x = prev.cx;
      const c1y = (prev.cy + cur.cy) / 2;
      const c2x = cur.cx;
      const c2y = (prev.cy + cur.cy) / 2;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cur.cx} ${cur.cy}`;
    }
    return d;
  }, [positions]);

  const onNodeTap = (node: JourneyNode) => {
    haptics.tap();
    if (node.lessonId) {
      navigation.navigate('Lesson', { lessonId: node.lessonId });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(260)} style={styles.heading}>
        <Text style={styles.eyebrow}>YOUR 90-DAY JOURNEY</Text>
        <Text style={styles.headline}>From curious to dangerous.</Text>
        <Text style={styles.sub}>
          Tap any node to start that lesson. The active node is where AIRA
          thinks you'll grow most today.
        </Text>
      </Animated.View>

      {/* Phase header — what part of the journey you're on right now */}
      <Animated.View entering={FadeInDown.duration(260).delay(60)}>
        <PhaseHeader phase={NODES[activeIndex].phase} />
      </Animated.View>

      {/* The map */}
      <View style={[styles.mapWrap, { height: totalHeight + spacing.lg }]}>
        {/* Connecting curve, behind the nodes */}
        <Svg width={SCREEN_WIDTH} height={totalHeight + spacing.lg} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="trailDone" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F59E0B" />
              <Stop offset="0.5" stopColor="#EC4899" />
              <Stop offset="1" stopColor="#8B5CF6" />
            </SvgGradient>
          </Defs>
          {/* Muted full path */}
          <Path d={fullPath} stroke={colors.border} strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* Coloured "done" path overlay — subpath up to the active node */}
          <Path
            d={buildSubpath(positions, activeIndex)}
            stroke="url(#trailDone)"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>

        {/* Nodes */}
        {NODES.map((node, i) => {
          const { cx, cy } = positions[i];
          const state: 'completed' | 'active' | 'upcoming' =
            i < totalCompleted ? 'completed' : i === activeIndex ? 'active' : 'upcoming';

          return (
            <View
              key={node.id}
              style={[
                styles.nodeAbs,
                { left: cx - NODE_SIZE / 2, top: cy - NODE_SIZE / 2 },
              ]}
            >
              <Pressable
                onPress={() => onNodeTap(node)}
                style={({ pressed }) => [
                  styles.nodePressable,
                  pressed && styles.nodePressed,
                ]}
              >
                <NodeBadge state={state} index={i} />
              </Pressable>

              <Text
                numberOfLines={2}
                style={[styles.nodeLabel, state === 'upcoming' && styles.nodeLabelMuted]}
              >
                {node.title}
              </Text>

              {state === 'active' && (
                <View
                  style={[
                    styles.activeMascotWrap,
                    cx > SCREEN_WIDTH / 2 ? styles.activeMascotLeft : styles.activeMascotRight,
                  ]}
                  pointerEvents="none"
                >
                  <AiraMascot size={64} mood="encouraging" />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Phase preview cards (legend) */}
      <Animated.View entering={FadeInDown.duration(260).delay(120)} style={styles.legend}>
        {PHASE_HEADERS.map((p) => (
          <LinearGradient
            key={p.phase}
            colors={p.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.legendChip}
          >
            <Text style={styles.legendRange}>{p.range}</Text>
            <Text style={styles.legendTitle}>{p.title}</Text>
          </LinearGradient>
        ))}
      </Animated.View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

/* -------------------------------- subpath builder -------------------------------- */

function buildSubpath(
  positions: { cx: number; cy: number }[],
  upToIndex: number,
): string {
  if (positions.length === 0 || upToIndex <= 0) {
    // Even at index 0 we draw a tiny "starter" so something glows.
    if (positions[0]) return `M ${positions[0].cx} ${positions[0].cy} L ${positions[0].cx} ${positions[0].cy + 1}`;
    return '';
  }
  let d = `M ${positions[0].cx} ${positions[0].cy}`;
  for (let i = 1; i <= upToIndex; i++) {
    const prev = positions[i - 1];
    const cur = positions[i];
    const c1x = prev.cx;
    const c1y = (prev.cy + cur.cy) / 2;
    const c2x = cur.cx;
    const c2y = (prev.cy + cur.cy) / 2;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cur.cx} ${cur.cy}`;
  }
  return d;
}

/* -------------------------------- node badge -------------------------------- */

function NodeBadge({ state, index }: { state: 'completed' | 'active' | 'upcoming'; index: number }) {
  if (state === 'upcoming') {
    return (
      <View style={[styles.node, styles.nodeUpcoming]}>
        <Text style={styles.nodeNum}>{index + 1}</Text>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={state === 'active' ? ['#F59E0B', '#EC4899', '#8B5CF6'] : ['#6366F1', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.node, state === 'active' && styles.nodeActive]}
    >
      {state === 'completed' ? (
        <Text style={styles.nodeCheck}>✓</Text>
      ) : (
        <Text style={styles.nodeNum}>{index + 1}</Text>
      )}
    </LinearGradient>
  );
}

/* -------------------------------- phase header -------------------------------- */

function PhaseHeader({ phase }: { phase: 1 | 2 | 3 }) {
  const def = PHASE_HEADERS.find((p) => p.phase === phase) ?? PHASE_HEADERS[0];
  return (
    <LinearGradient
      colors={def.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.phaseHeader}
    >
      <Text style={styles.phaseRange}>{def.range}</Text>
      <Text style={styles.phaseTitle}>{def.title}</Text>
    </LinearGradient>
  );
}

/* -------------------------------- styles -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingTop: spacing.lg,
  },

  heading: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  eyebrow: {
    ...typography.label,
    color: colors.airaGlow,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
  },

  phaseHeader: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  phaseRange: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  phaseTitle: {
    ...typography.headline,
    fontSize: 22,
    color: '#FFFFFF',
  },

  mapWrap: {
    width: '100%',
    position: 'relative',
  },

  nodeAbs: {
    position: 'absolute',
    width: NODE_SIZE,
    alignItems: 'center',
  },
  nodePressable: {
    width: NODE_SIZE,
    height: NODE_SIZE,
  },
  nodePressed: {
    transform: [{ scale: 0.95 }],
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nodeActive: {
    shadowColor: '#EC4899',
    shadowOpacity: 0.7,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  nodeUpcoming: {
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
  },
  nodeNum: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  nodeCheck: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  nodeLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginTop: 6,
    width: NODE_SIZE + 30,
    marginLeft: -15,
  },
  nodeLabelMuted: {
    color: colors.textMuted,
  },

  activeMascotWrap: {
    position: 'absolute',
    top: NODE_SIZE / 2 - 32,
  },
  activeMascotLeft: {
    left: -56,
  },
  activeMascotRight: {
    left: NODE_SIZE + 4,
  },

  legend: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  legendChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  legendRange: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  legendTitle: {
    ...typography.title,
    color: '#FFFFFF',
  },

  bottomSpace: { height: 100 },
});
