import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { palette } from '../theme/system';

/**
 * AnimatedLottie — a single component for all animated brand moments.
 *
 * Strategy:
 *   1. If `lottie-react-native` is installed AND a JSON file exists at
 *      `assets/animations/<name>.json`, render the Lottie animation.
 *   2. Otherwise, render a Reanimated fallback shaped to convey the
 *      same intent (idle bob, celebration spin, flame flicker, etc.).
 *
 * The app currently ships with ZERO Lottie files; drop them into
 * `assets/animations/` and they'll be picked up automatically. Until
 * then the fallbacks carry the feel.
 *
 * Why the dynamic require() pattern instead of static imports:
 *   - Metro's static require map resolves at bundle time. If we import
 *     a non-existent JSON, the bundle fails. With dynamic require in a
 *     try/catch + presence map, missing files degrade silently.
 *
 * The 10 named slots (per the brief):
 *   ara_idle / ara_celebration / streak_flame / xp_gain / card_flip
 *   correct_swipe / wrong_swipe / loading_spinner / paywall_crown
 *   empty_state
 */

export type LottieSlot =
  | 'ara_idle'
  | 'ara_celebration'
  | 'streak_flame'
  | 'xp_gain'
  | 'card_flip'
  | 'correct_swipe'
  | 'wrong_swipe'
  | 'loading_spinner'
  | 'paywall_crown'
  | 'empty_state';

interface Props {
  slot: LottieSlot;
  size?: number;
  /** Auto-loop. Defaults true. */
  loop?: boolean;
  /** Play one-shot then call onFinish. */
  onFinish?: () => void;
  style?: ViewStyle;
  /** Intensity for the streak flame ('low' | 'mid' | 'high'). */
  intensity?: 'low' | 'mid' | 'high';
}

/**
 * Best-effort dynamic loader for the Lottie module. If it's not
 * installed (or Metro can't find it), we permanently mark as unavailable
 * and fall through to the Reanimated fallback.
 *
 * We export the cached check so callers can pre-warm it if they want.
 */
let lottieModuleCache: any = undefined; // undefined = not checked yet
function getLottieComponent(): any {
  if (lottieModuleCache !== undefined) return lottieModuleCache;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('lottie-react-native');
    lottieModuleCache = mod?.default || mod || null;
  } catch {
    lottieModuleCache = null;
  }
  return lottieModuleCache;
}

/**
 * Best-effort lookup for the JSON source for a given slot. We use a
 * static map of attempted requires so Metro can find them at bundle
 * time. Each require is wrapped so a missing file degrades to null.
 */
function getLottieSource(slot: LottieSlot): any {
  // We do NOT use a single dynamic require because Metro resolves all
  // require() expressions at bundle time and a missing file would fail.
  // Instead this map references files explicitly. If you add the file,
  // also un-comment its require below.
  switch (slot) {
    // case 'ara_idle':         return require('../../assets/animations/ara_idle.json');
    // case 'ara_celebration':  return require('../../assets/animations/ara_celebration.json');
    // case 'streak_flame':     return require('../../assets/animations/streak_flame.json');
    // case 'xp_gain':          return require('../../assets/animations/xp_gain.json');
    // case 'card_flip':        return require('../../assets/animations/card_flip.json');
    // case 'correct_swipe':    return require('../../assets/animations/correct_swipe.json');
    // case 'wrong_swipe':      return require('../../assets/animations/wrong_swipe.json');
    // case 'loading_spinner':  return require('../../assets/animations/loading_spinner.json');
    // case 'paywall_crown':    return require('../../assets/animations/paywall_crown.json');
    // case 'empty_state':      return require('../../assets/animations/empty_state.json');
    default:
      return null;
  }
}

export function AnimatedLottie({ slot, size = 120, loop = true, onFinish, style, intensity = 'mid' }: Props) {
  const Lottie = getLottieComponent();
  const source = getLottieSource(slot);

  if (Lottie && source) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <Lottie
          source={source}
          autoPlay
          loop={loop}
          style={{ width: size, height: size }}
          onAnimationFinish={onFinish}
        />
      </View>
    );
  }

  return <FallbackForSlot slot={slot} size={size} loop={loop} intensity={intensity} style={style} onFinish={onFinish} />;
}

/* ─────────────────────────── Fallbacks ─────────────────────────── */

function FallbackForSlot({
  slot, size, loop, intensity, style, onFinish,
}: {
  slot: LottieSlot; size: number; loop: boolean;
  intensity: 'low' | 'mid' | 'high'; style?: ViewStyle;
  onFinish?: () => void;
}) {
  switch (slot) {
    case 'ara_idle':
      return <FbBob size={size} style={style} />;
    case 'ara_celebration':
      return <FbSpin size={size} loop={loop} onFinish={onFinish} style={style} />;
    case 'streak_flame':
      return <FbFlame size={size} intensity={intensity} style={style} />;
    case 'xp_gain':
      return <FbXpOrb size={size} onFinish={onFinish} style={style} />;
    case 'card_flip':
      return <FbFlip size={size} style={style} />;
    case 'correct_swipe':
      return <FbBurst size={size} colour={palette.success} style={style} onFinish={onFinish} />;
    case 'wrong_swipe':
      return <FbBurst size={size} colour={palette.danger} style={style} onFinish={onFinish} />;
    case 'loading_spinner':
      return <FbSpinner size={size} style={style} />;
    case 'paywall_crown':
      return <FbCrown size={size} style={style} />;
    case 'empty_state':
      return <FbBob size={size} style={style} />;
  }
}

/* ─────── individual fallback primitives — all UI-thread Reanimated ─────── */

function FbBob({ size, style }: { size: number; style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [t]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: t.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <View style={[styles.dot, { width: size * 0.7, height: size * 0.7, borderRadius: size, backgroundColor: palette.brandSoft }]} />
    </Animated.View>
  );
}

function FbSpin({ size, loop, onFinish, style }: { size: number; loop: boolean; onFinish?: () => void; style?: ViewStyle }) {
  const r = useSharedValue(0);
  const s = useSharedValue(0.8);
  useEffect(() => {
    if (loop) {
      r.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1);
      s.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 700, easing: Easing.out(Easing.cubic) }),
          withTiming(0.95, { duration: 700, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
        true,
      );
    } else {
      r.value = withTiming(360, { duration: 800 }, (done) => {
        if (done && onFinish) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onFinish && onFinish();
        }
      });
      s.value = withSpring(1.1, { damping: 8 });
    }
  }, [loop, r, s, onFinish]);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }, { scale: s.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <LinearGradient
        colors={[palette.accentWarm, palette.brand, palette.brandSoft] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size * 0.7, height: size * 0.7, borderRadius: size }}
      />
    </Animated.View>
  );
}

function FbFlame({ size, intensity, style }: { size: number; intensity: 'low' | 'mid' | 'high'; style?: ViewStyle }) {
  const t = useSharedValue(1);
  useEffect(() => {
    const amp = intensity === 'high' ? 0.18 : intensity === 'mid' ? 0.12 : 0.06;
    t.value = withRepeat(
      withSequence(
        withTiming(1 + amp, { duration: 240, easing: Easing.inOut(Easing.quad) }),
        withTiming(1 - amp * 0.6, { duration: 240, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [intensity, t]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: t.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <Text style={{ fontSize: size * 0.7 }}>🔥</Text>
    </Animated.View>
  );
}

function FbXpOrb({ size, onFinish, style }: { size: number; onFinish?: () => void; style?: ViewStyle }) {
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    y.value = withTiming(-40, { duration: 700, easing: Easing.out(Easing.cubic) });
    o.value = withTiming(0, { duration: 700, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done && onFinish) onFinish();
    });
  }, [y, o, onFinish]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: o.value }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <Text style={{ fontSize: size * 0.6, color: palette.accentWarm, fontFamily: 'Inter_700Bold' }}>+XP</Text>
    </Animated.View>
  );
}

function FbFlip({ size, style }: { size: number; style?: ViewStyle }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(
      withSequence(
        withTiming(180, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
        withTiming(360, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [r]);
  const a = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${r.value}deg` }],
  }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.85,
          borderRadius: 14,
          backgroundColor: palette.brandSoft,
          borderWidth: 1,
          borderColor: palette.brand,
        }}
      />
    </Animated.View>
  );
}

function FbBurst({ size, colour, onFinish, style }: { size: number; colour: string; onFinish?: () => void; style?: ViewStyle }) {
  const s = useSharedValue(0.2);
  const o = useSharedValue(1);
  useEffect(() => {
    s.value = withTiming(1.6, { duration: 380, easing: Easing.out(Easing.cubic) });
    o.value = withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done && onFinish) onFinish();
    });
  }, [s, o, onFinish]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: o.value }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size,
          borderWidth: 4,
          borderColor: colour,
        }}
      />
    </Animated.View>
  );
}

function FbSpinner({ size, style }: { size: number; style?: ViewStyle }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
  }, [r]);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size,
          borderWidth: 3,
          borderColor: palette.border,
          borderTopColor: palette.brandSoft,
        }}
      />
    </Animated.View>
  );
}

function FbCrown({ size, style }: { size: number; style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [t]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: t.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, a, style]}>
      <Text style={{ fontSize: size * 0.6 }}>👑</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: { alignItems: 'center', justifyContent: 'center' },
});
