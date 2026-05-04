import React, { useCallback } from 'react';
import { Pressable, ViewStyle, GestureResponderEvent, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { haptics } from '../utils/haptics';

/**
 * Tactile card wrapper. Press → spring to 0.97 + light haptic; release →
 * spring back. Use this on every interactive card so the whole app shares
 * one press feel.
 */
interface Props {
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  hapticStrength?: 'tap' | 'select' | 'medium';
  disabled?: boolean;
  accessibilityLabel?: string;
}

const SPRING = { damping: 14, stiffness: 260, mass: 0.6 };

export function PressableCard({
  onPress,
  style,
  children,
  hapticStrength = 'tap',
  disabled,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING);
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
  }, [scale]);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;
      haptics[hapticStrength]();
      onPress?.(e);
    },
    [disabled, hapticStrength, onPress]
  );

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
