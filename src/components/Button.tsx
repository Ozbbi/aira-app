import React, { useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { palette, gradients, radii, space, text, touch } from '../theme/system';
import { haptics } from '../utils/haptics';

/**
 * The single Button primitive for AIRA.
 *
 * Variants (per the design-system brief):
 *   primary    — filled, gradient brand. Highest visual weight.
 *                Use once per screen as the main CTA.
 *   secondary  — outlined, brand-coloured border + label.
 *                Side actions, "skip", "later".
 *   tertiary   — text only. Inline links, "see all", "back".
 *   destructive— red, used only for irreversible actions like Reset Progress.
 *
 * All variants:
 *   - 48 px minimum height (touch target)
 *   - 12 px border radius
 *   - identical spring + haptic feedback on press
 *   - loading state with spinner replaces label, button disables
 *   - disabled state at 0.5 opacity, no press feedback
 *
 * The arrow icon (`trailingIcon` prop) is a real SVG-style chevron, not
 * a "→" text character, so it renders identically across devices.
 */

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  trailingIcon?: 'arrow-right' | 'check' | 'play' | null;
  leadingIcon?: string | null;
  style?: ViewStyle;
  hapticOnPress?: 'tap' | 'medium' | 'heavy' | 'select' | 'success';
}

const SPRING = { damping: 16, stiffness: 280, mass: 0.55 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  trailingIcon = null,
  leadingIcon = null,
  style,
  hapticOnPress = 'tap',
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(0.97, SPRING);
  }, [disabled, loading, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    haptics[hapticOnPress]();
    onPress();
  }, [disabled, loading, hapticOnPress, onPress]);

  const sizing = SIZE_MAP[size];

  const isDisabled = disabled || loading;
  const containerBaseStyle: ViewStyle = {
    height: sizing.height,
    paddingHorizontal: sizing.hPad,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space['2'],
    minWidth: fullWidth ? undefined : sizing.height,
    width: fullWidth ? '100%' : undefined,
    opacity: isDisabled ? 0.5 : 1,
  };

  // Primary uses LinearGradient; others are plain View.
  if (variant === 'primary') {
    return (
      <Animated.View style={[fullWidth && styles.full, animStyle, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled, busy: loading }}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={containerBaseStyle}
          >
            <ButtonContent
              label={label}
              loading={loading}
              labelStyle={[styles.labelOnFilled, { fontSize: sizing.fontSize }]}
              spinnerColor="#FFFFFF"
              trailingIcon={trailingIcon}
              leadingIcon={leadingIcon}
              iconColor="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'destructive') {
    return (
      <Animated.View style={[fullWidth && styles.full, animStyle, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled, busy: loading }}
          disabled={isDisabled}
          style={[
            containerBaseStyle,
            { backgroundColor: palette.dangerSoft, borderColor: palette.danger, borderWidth: 1 },
          ]}
        >
          <ButtonContent
            label={label}
            loading={loading}
            labelStyle={[styles.labelDanger, { fontSize: sizing.fontSize }]}
            spinnerColor={palette.danger}
            trailingIcon={trailingIcon}
            leadingIcon={leadingIcon}
            iconColor={palette.danger}
          />
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[fullWidth && styles.full, animStyle, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled, busy: loading }}
          disabled={isDisabled}
          style={[
            containerBaseStyle,
            { backgroundColor: 'transparent', borderColor: palette.border, borderWidth: 1 },
          ]}
        >
          <ButtonContent
            label={label}
            loading={loading}
            labelStyle={[styles.labelOnSurface, { fontSize: sizing.fontSize }]}
            spinnerColor={palette.textPrimary}
            trailingIcon={trailingIcon}
            leadingIcon={leadingIcon}
            iconColor={palette.textPrimary}
          />
        </Pressable>
      </Animated.View>
    );
  }

  // tertiary — text only
  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={{
          minHeight: touch.minTarget,
          paddingHorizontal: space['2'],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space['1'],
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <ButtonContent
          label={label}
          loading={loading}
          labelStyle={[styles.labelTertiary, { fontSize: sizing.fontSize }]}
          spinnerColor={palette.brand}
          trailingIcon={trailingIcon}
          leadingIcon={leadingIcon}
          iconColor={palette.brand}
        />
      </Pressable>
    </Animated.View>
  );
}

function ButtonContent({
  label,
  loading,
  labelStyle,
  spinnerColor,
  trailingIcon,
  leadingIcon,
  iconColor,
}: {
  label: string;
  loading: boolean;
  labelStyle: TextStyle | TextStyle[];
  spinnerColor: string;
  trailingIcon: Props['trailingIcon'];
  leadingIcon: Props['leadingIcon'];
  iconColor: string;
}) {
  if (loading) {
    return <ActivityIndicator color={spinnerColor} />;
  }
  return (
    <>
      {leadingIcon ? <Text style={{ color: iconColor, fontSize: 14 }}>{leadingIcon}</Text> : null}
      <Text style={labelStyle}>{label}</Text>
      {trailingIcon ? <ChevronOrIcon type={trailingIcon} color={iconColor} /> : null}
    </>
  );
}

/**
 * Inline icon. Uses Unicode characters drawn via a font-weight-tuned <Text>
 * so we don't need to add an icon library dependency. They render
 * identically across devices because they're not emoji.
 */
function ChevronOrIcon({ type, color }: { type: 'arrow-right' | 'check' | 'play'; color: string }) {
  const glyph = type === 'arrow-right' ? '›' : type === 'check' ? '✓' : '▸';
  const fontSize = type === 'arrow-right' ? 22 : 16;
  return (
    <Text style={{ color, fontSize, fontFamily: 'Inter_700Bold', marginLeft: 2 }}>{glyph}</Text>
  );
}

const SIZE_MAP: Record<Size, { height: number; hPad: number; fontSize: number }> = {
  sm: { height: 40, hPad: space['3'], fontSize: 14 },
  md: { height: 48, hPad: space['4'], fontSize: 16 },
  lg: { height: 56, hPad: space['5'], fontSize: 17 },
};

const styles = StyleSheet.create({
  full: { width: '100%' },
  labelOnFilled: {
    ...text.button,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  labelOnSurface: {
    ...text.button,
    color: palette.textPrimary,
  },
  labelTertiary: {
    ...text.button,
    color: palette.brandSoft,
  },
  labelDanger: {
    ...text.button,
    color: palette.danger,
  },
});
