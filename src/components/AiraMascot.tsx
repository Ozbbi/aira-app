import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

/**
 * Ara 2.0 — the chubby fox mascot.
 *
 * Procedural SVG (no PNG asset), so every screen renders the same
 * character without anyone needing to drop a file. 5 mood variants:
 *
 *   calm          gentle bounce, ears wiggle slightly
 *   happy         bigger bounce, sparkly eyes
 *   thinking      head tilt, one ear droops, "…" bubble
 *   celebrating   jumps + tail spin + stars overhead
 *   encouraging   leans forward, tiny paw raised
 *
 * Anatomy: oversized head, huge round eyes (white with tiny pupil),
 * pink nose, pink inner ears, peach body (#FFB997), pink cheek
 * circles, fluffy curly tail.
 *
 * All animation is transform-only (translate/rotate/scale). The SVG
 * path tree never re-renders — perf stays clean even with multiple
 * mascots on a screen.
 */

export type MascotMood = 'calm' | 'happy' | 'thinking' | 'celebrating' | 'encouraging';

interface Props {
  size?: number;
  mood?: MascotMood;
  /** Disable bob/breathe loop — useful when many mascots share a screen. */
  static?: boolean;
}

// Brand colours for Ara (separate from the global palette so the fox
// stays cute even if the global theme changes).
const PEACH = '#FFB997';
const PEACH_DARK = '#F2A07B';
const PINK = '#FF6B8A';
const PINK_SOFT = '#FFB8C9';
const WHITE = '#FFFFFF';
const NOSE = '#FF7A8A';
const EYE_DOT = '#2D2D2D';

export function AiraMascot({ size = 120, mood = 'calm', static: isStatic }: Props) {
  // Body bob — vertical translate, intensity by mood
  const bob = useSharedValue(0);
  // Left/right ear wiggle (rotation degrees, small)
  const earL = useSharedValue(0);
  const earR = useSharedValue(0);
  // Tail wobble — rotation around its origin
  const tail = useSharedValue(0);

  useEffect(() => {
    if (isStatic) {
      bob.value = 0;
      earL.value = 0;
      earR.value = 0;
      tail.value = 0;
      return;
    }

    // Mood-tuned cadence
    const bobAmp = mood === 'happy' || mood === 'celebrating' ? -6 : -3;
    const bobDur = mood === 'celebrating' ? 380 : mood === 'happy' ? 600 : 1200;

    bob.value = withRepeat(
      withSequence(
        withTiming(bobAmp, { duration: bobDur, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: bobDur, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    earL.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    earR.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(-3, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Tail wobbles faster on cheerful moods
    const tailAmp = mood === 'celebrating' ? 30 : mood === 'happy' ? 18 : 10;
    const tailDur = mood === 'celebrating' ? 320 : 900;
    tail.value = withRepeat(
      withSequence(
        withTiming(tailAmp, { duration: tailDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-tailAmp * 0.6, { duration: tailDur, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [mood, isStatic, bob, earL, earR, tail]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));
  const earLStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${earL.value}deg` }],
  }));
  const earRStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${earR.value}deg` }],
  }));
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tail.value}deg` }],
  }));

  // For "thinking" mood, the head tilts slightly and one ear droops.
  // We apply a static body rotation by mood as a final layer.
  const moodTilt =
    mood === 'thinking' ? '-6deg' :
    mood === 'encouraging' ? '4deg' :
    '0deg';

  return (
    <Animated.View style={[{ width: size, height: size }, bobStyle]} pointerEvents="none">
      <View style={{ width: size, height: size, transform: [{ rotate: moodTilt }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Defs>
            {/* Body gradient — peach with a tiny inner shadow at bottom */}
            <RadialGradient id="bodyG" cx="50%" cy="40%" r="70%">
              <Stop offset="0%" stopColor={PEACH} />
              <Stop offset="80%" stopColor={PEACH} />
              <Stop offset="100%" stopColor={PEACH_DARK} />
            </RadialGradient>
            {/* Sparkle gradient — radial white for happy/celebrating eye dots */}
            <RadialGradient id="eyeSparkle" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            {/* Soft shadow under the fox */}
            <RadialGradient id="shadow" cx="50%" cy="50%" r="50%" fy="50%">
              <Stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
              <Stop offset="1" stopColor="rgba(0,0,0,0)" />
            </RadialGradient>
          </Defs>

          {/* Ground shadow */}
          <Ellipse cx="60" cy="108" rx="28" ry="3.5" fill="url(#shadow)" />

          {/* Tail — drawn first so it sits behind the body. Rotates around
              its base (approx (90, 76)). We translate the rotation origin
              by wrapping in <G transform>. */}
          <AnimatedG style={tailStyle} originX={88} originY={78}>
            <Path
              d="M 88 78
                 C 102 60 118 64 112 80
                 C 108 92 96 94 88 86 Z"
              fill={PEACH}
              stroke={PEACH_DARK}
              strokeWidth="1.5"
            />
            {/* Tail tip — cream white */}
            <Path
              d="M 110 70
                 C 116 70 118 76 112 80
                 C 108 80 106 76 110 70 Z"
              fill="#FFF3EA"
            />
          </AnimatedG>

          {/* Body — soft chubby oval, head-heavy */}
          <Ellipse cx="60" cy="80" rx="30" ry="22" fill="url(#bodyG)" />
          {/* Body cream chest patch */}
          <Ellipse cx="60" cy="88" rx="16" ry="10" fill="#FFF3EA" />

          {/* Ear LEFT — wraps in animated G so it can wiggle */}
          <AnimatedG style={earLStyle} originX={40} originY={42}>
            <Path
              d="M 36 22 L 30 46 L 50 42 Z"
              fill={mood === 'thinking' ? PEACH_DARK : PEACH}
              stroke={PEACH_DARK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Inner ear — pink */}
            <Path
              d="M 38 28 L 36 42 L 46 41 Z"
              fill={PINK_SOFT}
            />
          </AnimatedG>

          {/* Ear RIGHT */}
          <AnimatedG style={earRStyle} originX={80} originY={42}>
            <Path
              d="M 84 22 L 90 46 L 70 42 Z"
              fill={PEACH}
              stroke={PEACH_DARK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <Path
              d="M 82 28 L 84 42 L 74 41 Z"
              fill={PINK_SOFT}
            />
          </AnimatedG>

          {/* Head — oversized */}
          <Ellipse cx="60" cy="52" rx="28" ry="26" fill="url(#bodyG)" stroke={PEACH_DARK} strokeWidth="1.5" />
          {/* Head highlight */}
          <Ellipse cx="48" cy="42" rx="9" ry="5" fill="#FFFFFF" opacity="0.35" />

          {/* White muzzle */}
          <Ellipse cx="60" cy="63" rx="15" ry="10" fill="#FFF3EA" />

          {/* Cheek blush */}
          <Circle cx="42" cy="60" r="4" fill={PINK_SOFT} opacity="0.7" />
          <Circle cx="78" cy="60" r="4" fill={PINK_SOFT} opacity="0.7" />

          {/* Eyes — wrapped so we can swap them by mood */}
          <Eyes mood={mood} />

          {/* Nose — small triangle */}
          <Path d="M 56 60 L 64 60 L 60 65 Z" fill={NOSE} />

          {/* Mouth — varies by mood */}
          <Mouth mood={mood} />

          {/* Mood extras */}
          {mood === 'thinking' ? <ThinkingBubble /> : null}
          {mood === 'celebrating' ? <Stars /> : null}
          {mood === 'happy' ? <Sparkles /> : null}
          {mood === 'encouraging' ? <Paw /> : null}
        </Svg>
      </View>
    </Animated.View>
  );
}

/* ──────────────────────── helpers ──────────────────────── */

/** Animated <G> wrapper — react-native-svg's G doesn't accept style props
 *  directly with Reanimated, so we use createAnimatedComponent. */
const AnimatedG = Animated.createAnimatedComponent(G);

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'celebrating') {
    // Sparkly happy eyes — closed-arc smile shape
    return (
      <G>
        <Path d="M 44 48 Q 49 42 54 48" stroke={EYE_DOT} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <Path d="M 66 48 Q 71 42 76 48" stroke={EYE_DOT} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (mood === 'thinking') {
    return (
      <G>
        {/* Eyes look up-left in thought */}
        <Circle cx="49" cy="50" r="4.2" fill={WHITE} />
        <Circle cx="71" cy="50" r="4.2" fill={WHITE} />
        <Circle cx="47.5" cy="48.5" r="1.6" fill={EYE_DOT} />
        <Circle cx="69.5" cy="48.5" r="1.6" fill={EYE_DOT} />
      </G>
    );
  }
  // calm / encouraging — big round eyes with sparkle highlight
  return (
    <G>
      <Circle cx="49" cy="50" r="4.6" fill={WHITE} />
      <Circle cx="71" cy="50" r="4.6" fill={WHITE} />
      <Circle cx="49" cy="51" r="2" fill={EYE_DOT} />
      <Circle cx="71" cy="51" r="2" fill={EYE_DOT} />
      <Circle cx="50.4" cy="49.6" r="0.9" fill={WHITE} />
      <Circle cx="72.4" cy="49.6" r="0.9" fill={WHITE} />
    </G>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'thinking') {
    return <Path d="M 55 72 L 65 72" stroke={EYE_DOT} strokeWidth="2" strokeLinecap="round" />;
  }
  if (mood === 'celebrating') {
    return (
      <G>
        <Path d="M 53 68 Q 60 78 67 68 Q 60 73 53 68 Z" fill={EYE_DOT} />
        <Path d="M 56 72 Q 60 75 64 72" stroke={NOSE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (mood === 'happy') {
    return <Path d="M 53 68 Q 60 76 67 68" stroke={EYE_DOT} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
  // calm / encouraging — gentle smile
  return <Path d="M 55 68 Q 60 73 65 68" stroke={EYE_DOT} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
}

function ThinkingBubble() {
  return (
    <G>
      <Circle cx="92" cy="38" r="6" fill={WHITE} stroke={PEACH_DARK} strokeWidth="1.2" />
      <Circle cx="88" cy="45" r="3" fill={WHITE} stroke={PEACH_DARK} strokeWidth="1" />
      <Circle cx="84" cy="50" r="1.6" fill={WHITE} stroke={PEACH_DARK} strokeWidth="0.8" />
      <Circle cx="90" cy="38" r="0.7" fill={EYE_DOT} />
      <Circle cx="92.4" cy="38" r="0.7" fill={EYE_DOT} />
      <Circle cx="94.6" cy="38" r="0.7" fill={EYE_DOT} />
    </G>
  );
}

function Stars() {
  return (
    <G>
      <Path d="M 28 22 l 1.6 -4 l 1.6 4 l 4 1.6 l -4 1.6 l -1.6 4 l -1.6 -4 l -4 -1.6 z" fill="#F5C26B" />
      <Path d="M 96 18 l 1.4 -3.6 l 1.4 3.6 l 3.6 1.4 l -3.6 1.4 l -1.4 3.6 l -1.4 -3.6 l -3.6 -1.4 z" fill={PINK} />
      <Path d="M 18 60 l 1.2 -3 l 1.2 3 l 3 1.2 l -3 1.2 l -1.2 3 l -1.2 -3 l -3 -1.2 z" fill="#F5C26B" />
    </G>
  );
}

function Sparkles() {
  return (
    <G>
      <Path d="M 26 36 l 1.2 -3 l 1.2 3 l 3 1.2 l -3 1.2 l -1.2 3 l -1.2 -3 l -3 -1.2 z" fill="#F5C26B" />
      <Path d="M 98 50 l 1.2 -3 l 1.2 3 l 3 1.2 l -3 1.2 l -1.2 3 l -1.2 -3 l -3 -1.2 z" fill={PINK} />
    </G>
  );
}

function Paw() {
  // Tiny paw raised on the right side — gesture of encouragement
  return (
    <G>
      <Ellipse cx="92" cy="74" rx="5" ry="6" fill={PEACH} stroke={PEACH_DARK} strokeWidth="1.2" />
      <Circle cx="89" cy="71" r="1.2" fill={PEACH_DARK} />
      <Circle cx="92" cy="69.5" r="1.2" fill={PEACH_DARK} />
      <Circle cx="95" cy="71" r="1.2" fill={PEACH_DARK} />
    </G>
  );
}

const styles = StyleSheet.create({});
