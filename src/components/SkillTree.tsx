import React, { useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { palette, radii, space, text } from '../theme/system';

/**
 * SkillTree — Duolingo-style zigzag node path.
 *
 * Takes an ordered list of nodes (one per lesson) and renders them along
 * a vertical sinusoidal path. Each node's screen position is computed
 * deterministically from its index so the SVG connector path and the
 * absolute-positioned node views agree on geometry.
 *
 * Nodes are interactive: tap → opens the lesson preview. Locked nodes
 * with `isPro=true` route to the paywall instead.
 *
 * Track groups: when a node's trackId differs from the previous one's
 * we inject a header card with the track name + progress.
 *
 * Honest deferral: this is the basics — zigzag, SVG bezier, status
 * colours, pulse for current. Shimmer-on-completed and auto-scroll-to-
 * current are deferred; the brief calls them out as nice-to-haves.
 */

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'current';

export interface SkillTreeNode {
  id: string;
  lessonId: string;
  trackId: string;
  trackName: string;
  /** 1-indexed lesson number, for display inside the node. */
  number: number;
  title: string;
  status: NodeStatus;
  /** Pro-locked lessons show a Pro chip and route to paywall on tap. */
  isPro?: boolean;
}

interface Props {
  nodes: SkillTreeNode[];
  onTapNode: (node: SkillTreeNode) => void;
  /** Optional track totals for the header progress bar. */
  trackProgress?: Record<string, { completed: number; total: number }>;
}

const { width: SCREEN_W } = Dimensions.get('window');

const NODE_SIZE = 76;
const VERTICAL_GAP = 110;
const HORIZONTAL_SWING = Math.min(110, SCREEN_W * 0.28);
const HEADER_HEIGHT = 68; // height reserved when a track header is inserted

const TRACK_GRADIENT: Record<string, readonly [string, string, ...string[]]> = {
  prompt: ['#7C3AED', '#A855F7'] as const,
  critical: ['#EC4899', '#F472B6'] as const,
  power: ['#06B6D4', '#3B82F6'] as const,
  tools: ['#F59E0B', '#FB923C'] as const,
  vibe: ['#10B981', '#34D399'] as const,
  create: ['#EC4899', '#F59E0B'] as const,
  default: ['#7C3AED', '#A855F7'] as const,
};

export function SkillTree({ nodes, onTapNode, trackProgress }: Props) {
  // Compute per-node screen positions + insert header rows between tracks.
  // Returns interleaved entries (header or node) and the SVG connector path
  // that traces every node centre with smooth Bezier curves.
  const { entries, pathD, completedPathD, totalHeight } = useMemo(
    () => layout(nodes),
    [nodes],
  );

  return (
    <View style={[styles.wrap, { height: totalHeight }]}>
      {/* Connectors live behind the nodes */}
      <Svg
        width={SCREEN_W}
        height={totalHeight}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {/* Base (muted) — the full path */}
        <Path
          d={pathD}
          stroke={palette.border}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="6,7"
          fill="none"
        />
        {/* Completed segment — solid cyan-ish accent on top */}
        {completedPathD ? (
          <Path
            d={completedPathD}
            stroke={palette.brandSoft}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </Svg>

      {entries.map((entry, i) => {
        if (entry.kind === 'header') {
          const totals = trackProgress?.[entry.trackId];
          const completion = totals && totals.total > 0 ? totals.completed / totals.total : 0;
          return (
            <View key={`h-${i}`} style={[styles.headerWrap, { top: entry.y }]}>
              <LinearGradient
                colors={TRACK_GRADIENT[entry.trackId] ?? TRACK_GRADIENT.default}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
                <View style={styles.headerLeft}>
                  <Text style={styles.headerEyebrow}>{entry.lessonCount} LESSONS</Text>
                  <Text style={styles.headerName}>{entry.trackName}</Text>
                </View>
                {totals ? (
                  <View style={styles.headerRight}>
                    <Text style={styles.headerPct}>{Math.round(completion * 100)}%</Text>
                  </View>
                ) : null}
              </LinearGradient>
            </View>
          );
        }
        return (
          <NodeView
            key={entry.node.id}
            node={entry.node}
            x={entry.x}
            y={entry.y}
            indexOnPath={entry.indexOnPath}
            onPress={() => onTapNode(entry.node)}
          />
        );
      })}
    </View>
  );
}

/* ──────────────────────────── layout ──────────────────────────── */

interface PositionedNode {
  kind: 'node';
  node: SkillTreeNode;
  x: number; // centre X
  y: number; // top of bounding box (we render the node at this top + size/2 = cy)
  indexOnPath: number; // 0-indexed across all nodes (for stagger anim)
}
interface HeaderEntry {
  kind: 'header';
  trackId: string;
  trackName: string;
  lessonCount: number;
  y: number;
}
type Entry = PositionedNode | HeaderEntry;

function layout(nodes: SkillTreeNode[]) {
  const centerX = SCREEN_W / 2;
  const entries: Entry[] = [];
  const nodeCenters: { x: number; y: number }[] = [];

  let cursorY = space['2'];
  let lastTrackId: string | null = null;
  let pathNodeIdx = 0;

  // Pre-compute lesson counts per track so the header can show them.
  const trackCounts: Record<string, number> = {};
  for (const n of nodes) trackCounts[n.trackId] = (trackCounts[n.trackId] ?? 0) + 1;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.trackId !== lastTrackId) {
      entries.push({
        kind: 'header',
        trackId: n.trackId,
        trackName: n.trackName,
        lessonCount: trackCounts[n.trackId],
        y: cursorY,
      });
      cursorY += HEADER_HEIGHT + space['2'];
      lastTrackId = n.trackId;
    }

    // Sinusoidal zigzag within this track
    const swing = Math.sin((pathNodeIdx * Math.PI) / 2.2) * HORIZONTAL_SWING;
    const cx = centerX + swing;
    const cy = cursorY + NODE_SIZE / 2;
    nodeCenters.push({ x: cx, y: cy });
    entries.push({
      kind: 'node',
      node: n,
      x: cx,
      y: cursorY,
      indexOnPath: pathNodeIdx,
    });

    cursorY += VERTICAL_GAP;
    pathNodeIdx++;
  }

  const totalHeight = cursorY + space['4'];

  // Bezier path through every node centre
  const pathD = pathOf(nodeCenters);
  // Completed sub-path: up to the last completed/current node.
  const lastCompletedIdx = (() => {
    let last = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].status === 'completed' || nodes[i].status === 'current') last = i;
    }
    return last;
  })();
  const completedPathD = lastCompletedIdx >= 0 ? pathOf(nodeCenters.slice(0, lastCompletedIdx + 1)) : '';

  return { entries, pathD, completedPathD, totalHeight };
}

function pathOf(centers: { x: number; y: number }[]): string {
  if (centers.length === 0) return '';
  let d = `M ${centers[0].x} ${centers[0].y}`;
  for (let i = 1; i < centers.length; i++) {
    const prev = centers[i - 1];
    const cur = centers[i];
    const c1x = prev.x;
    const c1y = (prev.y + cur.y) / 2;
    const c2x = cur.x;
    const c2y = (prev.y + cur.y) / 2;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

/* ──────────────────────────── node view ──────────────────────────── */

function NodeView({
  node, x, y, indexOnPath, onPress,
}: { node: SkillTreeNode; x: number; y: number; indexOnPath: number; onPress: () => void }) {
  const pulse = useSharedValue(1);
  const press = useSharedValue(1);

  // Subtle pulse for the current node, fixed otherwise.
  useEffect(() => {
    if (node.status === 'current' || node.status === 'available') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    }
  }, [node.status, pulse]);

  const a = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * press.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(260).delay(60 + indexOnPath * 40)}
      style={[
        styles.nodeWrap,
        {
          left: x - NODE_SIZE / 2,
          top: y,
        },
        a,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { press.value = withTiming(0.95, { duration: 120 }); }}
        onPressOut={() => { press.value = withTiming(1, { duration: 180 }); }}
        accessibilityRole="button"
        accessibilityLabel={
          `Lesson ${node.number}: ${node.title}, ${node.status}` +
          (node.isPro ? ', requires Pro' : '')
        }
        style={[styles.nodeHit, statusStyle(node.status)]}
      >
        {node.status === 'completed' ? (
          <Text style={styles.nodeCheck}>✓</Text>
        ) : node.status === 'locked' ? (
          <Text style={styles.nodeLock}>🔒</Text>
        ) : (
          <Text style={styles.nodeNum}>{node.number}</Text>
        )}
      </Pressable>

      {node.isPro && node.status === 'locked' ? (
        <View style={styles.proChip}><Text style={styles.proChipText}>PRO</Text></View>
      ) : null}

      <Text
        style={[styles.nodeLabel, node.status === 'locked' && styles.nodeLabelLocked]}
        numberOfLines={2}
      >
        {node.title}
      </Text>
    </Animated.View>
  );
}

function statusStyle(status: NodeStatus) {
  switch (status) {
    case 'completed':
      return { backgroundColor: palette.success, borderColor: palette.success };
    case 'available':
      return { backgroundColor: 'transparent', borderColor: palette.brandSoft, borderWidth: 3 };
    case 'in_progress':
      return { backgroundColor: palette.warning, borderColor: palette.warning };
    case 'current':
      return { backgroundColor: palette.brand, borderColor: palette.brandSoft, borderWidth: 3 };
    case 'locked':
    default:
      return { backgroundColor: palette.bgRaised, borderColor: palette.border, borderWidth: 2 };
  }
}

/* ──────────────────────────── styles ──────────────────────────── */

const styles = StyleSheet.create({
  wrap: { width: '100%', position: 'relative' },

  // Header
  headerWrap: {
    position: 'absolute',
    left: space['4'],
    right: space['4'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space['4'],
    paddingVertical: space['3'],
    borderRadius: radii.lg,
    height: HEADER_HEIGHT,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  headerEyebrow: { ...text.label, color: 'rgba(255,255,255,0.85)' },
  headerName: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.2 },
  headerRight: {
    paddingHorizontal: space['3'],
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerPct: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },

  // Nodes
  nodeWrap: {
    position: 'absolute',
    width: NODE_SIZE,
    alignItems: 'center',
  },
  nodeHit: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNum: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FFFFFF' },
  nodeCheck: { fontFamily: 'Inter_700Bold', fontSize: 28, color: '#FFFFFF' },
  nodeLock: { fontSize: 24 },
  nodeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: palette.textPrimary,
    textAlign: 'center',
    marginTop: 6,
    width: NODE_SIZE + 36,
    marginLeft: -18,
  },
  nodeLabelLocked: { color: palette.textMuted },

  proChip: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: palette.accentWarm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proChipText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#0F0A1F', letterSpacing: 0.4 },
});
