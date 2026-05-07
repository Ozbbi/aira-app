import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

/**
 * Wrap every tab screen with this. Two responsibilities:
 *
 *   1. Focus animation — fade + spring scale on focus, gentle scale-down
 *      + fade on blur. UI-thread Reanimated, ~220ms cross-fade.
 *
 *   2. Subtle dark-purple gradient background that bleeds top-to-bottom.
 *      Replaces the old flat `#0A0A0F`. Same colour at the top of every
 *      tab so the visual feels continuous; tiniest violet wash near the
 *      bottom so each screen doesn't feel like a black void.
 */
interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Hide the gradient — for screens that draw their own background. */
  noGradient?: boolean;
}

export function TabScreen({ children, style, noGradient }: Props) {
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

  if (noGradient) {
    return <Animated.View style={[styles.fill, animStyle, style]}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[styles.fill, animStyle, style]}>
      <LinearGradient
        colors={[colors.bg, '#100B22', '#0A0A0F']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
