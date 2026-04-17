import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

type Intensity = 'calm' | 'thinking' | 'celebrating' | 'listening';

interface AiraOrbProps {
  size?: number;
  intensity?: Intensity;
}

export function AiraOrb({ size = 120, intensity = 'calm' }: AiraOrbProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const rotation = useSharedValue(0);
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    // Reset transforms when intensity flips so previous animations don't bleed in.
    cancelAnimation(scale);
    cancelAnimation(glowOpacity);
    cancelAnimation(rotation);
    cancelAnimation(ripple1);
    cancelAnimation(ripple2);
    cancelAnimation(burst);
    rotation.value = 0;
    ripple1.value = 0;
    ripple2.value = 0;
    burst.value = 0;

    if (intensity === 'calm') {
      // Slow breathing — like real breath, ~4s cycle
      scale.value = withRepeat(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (intensity === 'thinking') {
      // Faster pulse + slow rotation — feels like processing
      scale.value = withRepeat(
        withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 6000, easing: Easing.linear }),
        -1,
        false
      );
    } else if (intensity === 'celebrating') {
      // Big punch + soft sustain + particle burst rings
      scale.value = withSequence(
        withSpring(1.25, { damping: 7, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 150 }),
        withRepeat(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.6, { duration: 700 }),
        withRepeat(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      );
      // Two staggered ring bursts
      burst.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    } else if (intensity === 'listening') {
      // Soft inner ripple — like sonar
      scale.value = withRepeat(
        withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withTiming(0.7, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      ripple1.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      ripple2.value = withDelay(
        900,
        withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
          -1,
          false
        )
      );
    }
  }, [intensity]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: 1 - burst.value,
    transform: [{ scale: 1 + burst.value * 1.5 }],
  }));

  const rippleStyle1 = useAnimatedStyle(() => ({
    opacity: 0.4 * (1 - ripple1.value),
    transform: [{ scale: 1 + ripple1.value * 0.8 }],
  }));

  const rippleStyle2 = useAnimatedStyle(() => ({
    opacity: 0.4 * (1 - ripple2.value),
    transform: [{ scale: 1 + ripple2.value * 0.8 }],
  }));

  const glowSize = size * 1.6;

  return (
    <View style={[styles.wrapper, { width: glowSize, height: glowSize }]}>
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
          },
        ]}
      />

      {/* Listening ripples */}
      {intensity === 'listening' && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ripple,
              rippleStyle1,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ripple,
              rippleStyle2,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          />
        </>
      )}

      {/* Celebration particle ring (single big ring shockwave) */}
      {intensity === 'celebrating' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.burstRing,
            burstStyle,
            {
              width: size * 1.1,
              height: size * 1.1,
              borderRadius: (size * 1.1) / 2,
            },
          ]}
        />
      )}

      <Animated.View style={[orbStyle, { width: size, height: size }]}>
        <LinearGradient
          colors={[colors.airaGlow, colors.airaCore, colors.indigo]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.airaWhisper,
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.airaGlow,
    backgroundColor: 'transparent',
  },
  burstRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.airaGlow,
    backgroundColor: 'transparent',
  },
  orb: {
    shadowColor: colors.airaGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
});
