import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

/**
 * Count-up number with tabular figures so digits don't shift width as the
 * value changes. Uses Reanimated's UI-thread timing then mirrors the rounded
 * value to JS so we can render plain <Text>.
 *
 * Why not a fancy SVG morph? The native <Text> with `fontVariant: tabular-nums`
 * is faster and respects the user's system font scale. Good enough.
 */
interface Props {
  value: number;
  durationMs?: number;
  style?: TextStyle | TextStyle[];
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  durationMs = 1200,
  style,
  prefix = '',
  suffix = '',
}: Props) {
  const sv = useSharedValue(value);
  const [display, setDisplay] = useState<number>(value);

  useEffect(() => {
    sv.value = withTiming(value, {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, durationMs, sv]);

  useAnimatedReaction(
    () => Math.round(sv.value),
    (rounded, prev) => {
      if (rounded !== prev) {
        runOnJS(setDisplay)(rounded);
      }
    },
    []
  );

  return (
    <Text style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
}
