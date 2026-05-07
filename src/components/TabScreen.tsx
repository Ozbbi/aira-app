import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

/**
 * Wrap every tab screen with this. On focus, the screen springs from
 * scale 0.985 + opacity 0.0 → 1.0 in ~220ms. Off-focus it gently scales
 * down + fades. The transition is UI-thread (Reanimated), so it stays
 * smooth even while the new screen's data is loading.
 *
 * Why we wrap each tab instead of customising the navigator:
 * `@react-navigation/bottom-tabs` v7 supports `animation: 'shift' | 'fade'`
 * but those are coarse, JS-driven, and not springy. Wrapping the screen
 * gives us a single, designer-tunable transition that's the same on
 * every tab.
 */
interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function TabScreen({ children, style }: Props) {
  const focused = useIsFocused();
  const opacity = useSharedValue(focused ? 1 : 0);
  const scale = useSharedValue(focused ? 1 : 0.985);

  useEffect(() => {
    if (focused) {
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      scale.value = withSpring(1, { damping: 18, stiffness: 220, mass: 0.6 });
    } else {
      opacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) });
      scale.value = withTiming(0.985, { duration: 160 });
    }
  }, [focused, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.fill, animStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
