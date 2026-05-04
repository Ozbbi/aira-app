import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

/**
 * Shimmer skeleton placeholder. The shimmer is a translucent gradient
 * that sweeps left-to-right on a 1.5s loop. Reanimated keeps it on the UI
 * thread so it stays smooth even when JS is busy on first paint.
 */
interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: br = radius.sm,
  style,
}: SkeletonProps) {
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, [x]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${x.value * 100}%` as `${number}%` }],
  }));

  return (
    <View
      style={[
        { width, height, borderRadius: br, backgroundColor: colors.bgCardHover },
        styles.wrap,
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, sweepStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
