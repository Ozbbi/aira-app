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
import { colors } from '../theme';

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
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.fill, animStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
