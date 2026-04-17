import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { haptics } from '../utils/haptics';
import { colors, typography, spacing, radius } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'accent' | 'success';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  /** Haptic intensity. Default 'medium' (primary CTA). */
  haptic?: 'tap' | 'medium' | 'heavy' | 'none';
}

const gradientMap: Record<Variant, readonly [string, string]> = {
  primary: colors.gradientPrimary,
  accent: colors.gradientAccent,
  success: colors.gradientSuccess,
};

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  style,
  haptic = 'medium',
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // Snappier feel per polish spec: stiffness 400, damping 15
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (haptic !== 'none') haptics[haptic]();
    onPress();
  };

  const gradient = gradientMap[variant];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, fullWidth && styles.fullWidth, style]}
    >
      <LinearGradient
        colors={disabled ? [colors.bgCardHover, colors.bgCard] : [...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, fullWidth && styles.fullWidth]}
      >
        <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    ...typography.button,
    color: colors.textPrimary,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
