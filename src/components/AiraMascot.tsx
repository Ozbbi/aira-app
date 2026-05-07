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
  Rect,
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
 * AIRA mascot — refined "Canva-quality" version.
 *
 * Anatomy (built up in layers, like a real illustrator would):
 *
 *   1. Soft drop-shadow ellipse beneath the body
 *   2. Outer halo (radial)
 *   3. Antennae stems (gradient strokes), tips (concentric glowing circles)
 *   4. Body main fill — vertical 4-stop gradient (cyan → indigo → violet → mauve)
 *   5. Body BOTTOM inner shadow — darker rim, sells weight
 *   6. Body TOP highlight cap — brighter, sells lighting from above
 *   7. Body LEFT rim light — thin white edge for "sun on the curve"
 *   8. Cheek blush — radial pink, soft falloff
 *   9. Eyes — white sclera with subtle vertical gradient, dark pupil with
 *      its own gradient, two highlights (one large primary, one small
 *      catch-light)
 *  10. Mouth — proper bezier with stroke + cap
 *  11. Signature corner sparkle
 *
 * Animation: gentle UI-thread bob + breathe loop + subtle antenna sway.
 */

export type MascotMood = 'calm' | 'thinking' | 'happy' | 'celebrating' | 'encouraging';

interface Props {
  size?: number;
  mood?: MascotMood;
  /** Disable the loop — useful when many mascots share a screen. */
  static?: boolean;
}

export function AiraMascot({ size = 120, mood = 'calm', static: isStatic }: Props) {
  const bob = useSharedValue(0);
  const breathe = useSharedValue(1);
  const antennaSway = useSharedValue(0);

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
        withTiming(1.025, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    antennaSway.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [isStatic, bob, breathe, antennaSway]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: breathe.value }],
  }));

  const antennaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${antennaSway.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <Defs>
          {/* ---- Body main: 4-stop vertical brand gradient ---- */}
          <LinearGradient id="airaBodyMain" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#7DD8FF" />
            <Stop offset="0.35" stopColor="#6366F1" />
            <Stop offset="0.7" stopColor="#8B5CF6" />
            <Stop offset="1" stopColor="#C4B5FD" />
          </LinearGradient>

          {/* ---- Body bottom inner shadow (darker rim) ---- */}
          <LinearGradient id="airaBottomShade" x1="0.5" y1="0.55" x2="0.5" y2="1">
            <Stop offset="0" stopColor="rgba(15,8,40,0)" />
            <Stop offset="1" stopColor="rgba(15,8,40,0.32)" />
          </LinearGradient>

          {/* ---- Body top highlight cap ---- */}
          <LinearGradient id="airaTopCap" x1="0.5" y1="0" x2="0.5" y2="0.55">
            <Stop offset="0" stopColor="rgba(255,255,255,0.45)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0)" />
          </LinearGradient>

          {/* ---- Left rim light ---- */}
          <LinearGradient id="airaRim" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0" stopColor="rgba(255,255,255,0.55)" />
            <Stop offset="0.18" stopColor="rgba(255,255,255,0)" />
          </LinearGradient>

          {/* ---- Halo behind whole character ---- */}
          <RadialGradient id="airaHalo" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#B388FF" stopOpacity="0.55" />
            <Stop offset="0.55" stopColor="#8B5CF6" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </RadialGradient>

          {/* ---- Drop shadow ---- */}
          <RadialGradient id="airaShadow" cx="50%" cy="50%" rx="50%" ry="40%">
            <Stop offset="0" stopColor="rgba(0,0,0,0.45)" />
            <Stop offset="1" stopColor="rgba(0,0,0,0)" />
          </RadialGradient>

          {/* ---- Cheek blush ---- */}
          <RadialGradient id="airaCheek" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#FF8FB1" stopOpacity="0.78" />
            <Stop offset="0.55" stopColor="#FF8FB1" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#FF8FB1" stopOpacity="0" />
          </RadialGradient>

          {/* ---- Eye sclera (subtle vertical white→cool-cream) ---- */}
          <LinearGradient id="airaSclera" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#E8ECFA" />
          </LinearGradient>

          {/* ---- Pupil gradient (slight depth) ---- */}
          <LinearGradient id="airaPupil" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#1A1530" />
            <Stop offset="1" stopColor="#0A0814" />
          </LinearGradient>

          {/* ---- Antenna tip glow ---- */}
          <RadialGradient id="airaTipGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#FFE998" />
            <Stop offset="0.55" stopColor="#FFD86B" />
            <Stop offset="1" stopColor="rgba(255,216,107,0)" />
          </RadialGradient>
        </Defs>

        {/* 1. Drop shadow */}
        <Ellipse cx="70" cy="124" rx="38" ry="6" fill="url(#airaShadow)" />

        {/* 2. Halo */}
        <Circle cx="70" cy="68" r="62" fill="url(#airaHalo)" />

        {/* 3. Antennae — slightly swayed via wrapper transform */}
        <G>
          <AntennaPair />
        </G>

        {/* 4. Body — squircle */}
        <Path
          d="M 70 28
             C 100 28 110 42 110 70
             C 110 98 92 110 70 110
             C 48 110 30 98 30 70
             C 30 42 40 28 70 28 Z"
          fill="url(#airaBodyMain)"
        />

        {/* 5. Bottom inner shadow */}
        <Path
          d="M 70 28
             C 100 28 110 42 110 70
             C 110 98 92 110 70 110
             C 48 110 30 98 30 70
             C 30 42 40 28 70 28 Z"
          fill="url(#airaBottomShade)"
        />

        {/* 6. Top highlight cap */}
        <Path
          d="M 70 28
             C 100 28 110 42 110 70
             L 110 50
             C 110 36 96 28 70 28 Z"
          fill="url(#airaTopCap)"
          opacity="0.85"
        />

        {/* 7. Left rim light */}
        <Path
          d="M 70 28
             C 48 28 30 42 30 70
             C 30 98 48 110 70 110
             L 70 28 Z"
          fill="url(#airaRim)"
          opacity="0.6"
        />

        {/* 8. Cheeks */}
        <Circle cx="40" cy="78" r="9" fill="url(#airaCheek)" />
        <Circle cx="100" cy="78" r="9" fill="url(#airaCheek)" />

        {/* 9 + 10. Eyes + mouth (mood-driven) */}
        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* 11. Signature sparkle */}
        <SignatureSparkle />

        {/* Extra sparkle burst when celebrating */}
        {mood === 'celebrating' && <CelebrationSparkles />}
      </Svg>
    </Animated.View>
  );
}

/* -------------------------------- antennae -------------------------------- */

function AntennaPair() {
  return (
    <G>
      {/* Left stem */}
      <Path
        d="M 54 32 Q 48 18 44 10"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      {/* Right stem */}
      <Path
        d="M 86 32 Q 92 18 96 10"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      {/* Tip glows — concentric */}
      <Circle cx="44" cy="10" r="9" fill="url(#airaTipGlow)" />
      <Circle cx="44" cy="10" r="4.4" fill="#FFD86B" />
      <Circle cx="44" cy="10" r="2.6" fill="#FFFFFF" />

      <Circle cx="96" cy="10" r="9" fill="url(#airaTipGlow)" />
      <Circle cx="96" cy="10" r="4.4" fill="#FFD86B" />
      <Circle cx="96" cy="10" r="2.6" fill="#FFFFFF" />
    </G>
  );
}

/* -------------------------------- eyes -------------------------------- */

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy') {
    return (
      <G>
        <Path
          d="M 48 66 Q 56 58 64 66"
          stroke="#1A1530"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 76 66 Q 84 58 92 66"
          stroke="#1A1530"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    );
  }

  if (mood === 'encouraging') {
    return (
      <G>
        {OpenEye(54, 68)}
        <Path
          d="M 76 68 Q 84 60 92 68"
          stroke="#1A1530"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    );
  }

  if (mood === 'thinking') {
    return (
      <G>
        {OpenEye(54, 68, 2.5, -2.5)}
        {OpenEye(86, 68, 2.5, -2.5)}
      </G>
    );
  }

  if (mood === 'celebrating') {
    return (
      <G>
        {/* Big bright eyes */}
        <Ellipse cx="54" cy="68" rx="8.5" ry="9.5" fill="url(#airaSclera)" />
        <Ellipse cx="86" cy="68" rx="8.5" ry="9.5" fill="url(#airaSclera)" />
        <Circle cx="55" cy="69" r="4.4" fill="url(#airaPupil)" />
        <Circle cx="87" cy="69" r="4.4" fill="url(#airaPupil)" />
        {/* Two highlights per eye for shine */}
        <Circle cx="56.5" cy="66" r="1.6" fill="#FFFFFF" />
        <Circle cx="53.5" cy="71" r="0.9" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="88.5" cy="66" r="1.6" fill="#FFFFFF" />
        <Circle cx="85.5" cy="71" r="0.9" fill="#FFFFFF" opacity="0.8" />
      </G>
    );
  }

  // calm (default)
  return (
    <G>
      {OpenEye(54, 68)}
      {OpenEye(86, 68)}
    </G>
  );
}

function OpenEye(cx: number, cy: number, dx = 0, dy = 0) {
  return (
    <G key={`eye-${cx}-${cy}`}>
      <Ellipse cx={cx} cy={cy} rx="7.2" ry="8.4" fill="url(#airaSclera)" />
      <Circle cx={cx + dx} cy={cy + dy} r="3.8" fill="url(#airaPupil)" />
      <Circle cx={cx + dx + 1.4} cy={cy + dy - 1.8} r="1.4" fill="#FFFFFF" />
      <Circle cx={cx + dx - 1.6} cy={cy + dy + 1.6} r="0.7" fill="#FFFFFF" opacity="0.7" />
    </G>
  );
}

/* -------------------------------- mouth -------------------------------- */

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'thinking') {
    return (
      <Path
        d="M 62 88 L 78 88"
        stroke="#1A1530"
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  }
  if (mood === 'celebrating') {
    return (
      <G>
        {/* Open smile with tongue hint */}
        <Path
          d="M 56 84 Q 70 100 84 84 Q 70 92 56 84 Z"
          fill="#1A1530"
        />
        <Path
          d="M 64 90 Q 70 96 76 90"
          stroke="#FF8FB1"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </G>
    );
  }
  if (mood === 'happy') {
    return (
      <Path
        d="M 56 82 Q 70 96 84 82"
        stroke="#1A1530"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  // calm + encouraging
  return (
    <Path
      d="M 58 84 Q 70 92 82 84"
      stroke="#1A1530"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  );
}

/* -------------------------------- sparkles -------------------------------- */

function SignatureSparkle() {
  return (
    <G>
      <Path
        d="M 120 92 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z"
        fill="#FFD86B"
      />
      <Path
        d="M 120 92 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z"
        fill="rgba(255,255,255,0.55)"
      />
    </G>
  );
}

function CelebrationSparkles() {
  return (
    <G>
      <Path d="M 16 40 l 2 -7 l 2 7 l 7 2 l -7 2 l -2 7 l -2 -7 l -7 -2 z" fill="#FFD86B" />
      <Path d="M 110 30 l 1.6 -5 l 1.6 5 l 5 1.6 l -5 1.6 l -1.6 5 l -1.6 -5 l -5 -1.6 z" fill="#FFE998" />
      <Path d="M 24 110 l 1.4 -4 l 1.4 4 l 4 1.4 l -4 1.4 l -1.4 4 l -1.4 -4 l -4 -1.4 z" fill="#FFD86B" />
    </G>
  );
}

const styles = StyleSheet.create({});
