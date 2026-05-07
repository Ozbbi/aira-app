import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * AIRA mascot — image-backed.
 *
 * Reads from `assets/mascot.png`. To swap the character art, replace
 * that single file (recommended size: 1024x1024 with transparent
 * background or square crop). Every screen using <AiraMascot /> picks
 * up the new art automatically — Home greeting, Home hero, onboarding,
 * Journey active node, Library hero, empty states.
 *
 * Why image instead of SVG: the previous procedural SVG mascot couldn't
 * match the look of an artist-drawn character. Letting the user drop
 * any PNG keeps the brand surface consistent without locking us into
 * the geometry an SVG can express.
 *
 * The `mood` prop is preserved so existing call sites compile, but it's
 * no longer rendered — the same image is used for every mood. We can
 * add per-mood variants later by reading `assets/mascot-{mood}.png`.
 *
 * Animation stays the same: gentle UI-thread bob + breathe loop.
 */

export type MascotMood = 'calm' | 'thinking' | 'happy' | 'celebrating' | 'encouraging';

interface Props {
  size?: number;
  mood?: MascotMood;
  /** Disable bob/breathe — useful when many mascots share a screen. */
  static?: boolean;
}

export function AiraMascot({ size = 120, static: isStatic }: Props) {
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
        withTiming(1.025, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
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
      <Image
        source={require('../../assets/mascot.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
