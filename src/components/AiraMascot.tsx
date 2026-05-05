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
  Easing,
} from 'react-native-reanimated';

/**
 * AIRA's mascot — a friendly squircle character with expressive eyes.
 *
 * Anatomy
 *  • Rounded body, vertical brand gradient (cyan → AIRA purple → violet)
 *  • Soft pink cheek blush for warmth
 *  • Big oval eyes with white sclera + dark pupils + tiny highlight
 *  • Mouth + eye shapes change with `mood`
 *  • Subtle halo behind the body
 *  • Body gently bobs and breathes (UI-thread Reanimated, no JS bridge)
 *
 * Sizes
 *  We render in a 120-unit square viewBox and scale via the `size` prop, so
 *  it stays pixel-sharp from a 28 px chip to a 200 px hero.
 */

export type MascotMood = 'calm' | 'thinking' | 'happy' | 'celebrating' | 'encouraging';

interface Props {
  size?: number;
  mood?: MascotMood;
  /** Disable the bob/breathe loop — useful when many mascots are on screen at once. */
  static?: boolean;
}

export function AiraMascot({ size = 120, mood = 'calm', static: isStatic }: Props) {
  const bob = useSharedValue(0);
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (isStatic) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [isStatic, bob, breathe]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: breathe.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="airaBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6FD4FB" />
            <Stop offset="0.55" stopColor="#8B5CF6" />
            <Stop offset="1" stopColor="#B388FF" />
          </LinearGradient>
          <LinearGradient id="airaShine" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(255,255,255,0.45)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0)" />
          </LinearGradient>
          <RadialGradient id="airaHalo" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#B388FF" stopOpacity="0.45" />
            <Stop offset="0.6" stopColor="#8B5CF6" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="airaCheek" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#FF8FB1" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FF8FB1" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Halo */}
        <Circle cx="60" cy="60" r="56" fill="url(#airaHalo)" />

        {/* Body — squircle */}
        <Path
          d="M 60 22
             C 88 22 96 34 96 60
             C 96 86 82 96 60 96
             C 38 96 24 86 24 60
             C 24 34 32 22 60 22 Z"
          fill="url(#airaBody)"
        />

        {/* Top shine */}
        <Path
          d="M 36 32
             C 44 26 76 26 84 32
             C 80 38 60 40 60 40
             C 60 40 40 38 36 32 Z"
          fill="url(#airaShine)"
          opacity="0.55"
        />

        {/* Cheeks */}
        <Circle cx="36" cy="68" r="7" fill="url(#airaCheek)" />
        <Circle cx="84" cy="68" r="7" fill="url(#airaCheek)" />

        {/* Eyes + Mouth — vary by mood */}
        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* Sparkles for celebrating */}
        {mood === 'celebrating' && (
          <G>
            <Path d="M 22 30 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z" fill="#FFD86B" />
            <Path d="M 96 32 l 1.4 -4 l 1.4 4 l 4 1.4 l -4 1.4 l -1.4 4 l -1.4 -4 l -4 -1.4 z" fill="#FFD86B" />
            <Path d="M 100 96 l 1.6 -5 l 1.6 5 l 5 1.6 l -5 1.6 l -1.6 5 l -1.6 -5 l -5 -1.6 z" fill="#FFD86B" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

/* -------------------------------- Eyes -------------------------------- */

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy') {
    // Closed-curve happy eyes (eye-arcs)
    return (
      <G>
        <Path
          d="M 40 56 Q 46 50 52 56"
          stroke="#0F1020"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 68 56 Q 74 50 80 56"
          stroke="#0F1020"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    );
  }

  if (mood === 'encouraging') {
    // Wink: left eye open, right eye arc
    return (
      <G>
        {OpenEye(46, 58)}
        <Path
          d="M 68 58 Q 74 52 80 58"
          stroke="#0F1020"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    );
  }

  if (mood === 'thinking') {
    // Eyes look up and to the right
    return (
      <G>
        {OpenEye(46, 58, 2, -2)}
        {OpenEye(74, 58, 2, -2)}
      </G>
    );
  }

  if (mood === 'celebrating') {
    // Wide bright eyes
    return (
      <G>
        <Ellipse cx="46" cy="58" rx="7" ry="8" fill="#FFFFFF" />
        <Ellipse cx="74" cy="58" rx="7" ry="8" fill="#FFFFFF" />
        <Circle cx="47" cy="59" r="3.8" fill="#0F1020" />
        <Circle cx="75" cy="59" r="3.8" fill="#0F1020" />
        <Circle cx="48.5" cy="56" r="1.4" fill="#FFFFFF" />
        <Circle cx="76.5" cy="56" r="1.4" fill="#FFFFFF" />
      </G>
    );
  }

  // calm (default)
  return (
    <G>
      {OpenEye(46, 58)}
      {OpenEye(74, 58)}
    </G>
  );
}

function OpenEye(cx: number, cy: number, dx = 0, dy = 0) {
  return (
    <G key={`eye-${cx}-${cy}`}>
      <Ellipse cx={cx} cy={cy} rx="6" ry="7" fill="#FFFFFF" />
      <Circle cx={cx + dx} cy={cy + dy} r="3.2" fill="#0F1020" />
      <Circle cx={cx + dx + 1.2} cy={cy + dy - 1.6} r="1.2" fill="#FFFFFF" />
    </G>
  );
}

/* -------------------------------- Mouth -------------------------------- */

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'thinking') {
    return (
      <Path
        d="M 54 76 L 66 76"
        stroke="#0F1020"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    );
  }
  if (mood === 'celebrating') {
    return (
      <Path
        d="M 50 74 Q 60 86 70 74 Q 60 80 50 74 Z"
        fill="#0F1020"
      />
    );
  }
  if (mood === 'happy') {
    return (
      <Path
        d="M 48 72 Q 60 84 72 72"
        stroke="#0F1020"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  // calm + encouraging — gentle smile
  return (
    <Path
      d="M 50 74 Q 60 80 70 74"
      stroke="#0F1020"
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
    />
  );
}

const styles = StyleSheet.create({});
