import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Svg, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

type Mood = 'calm' | 'thinking' | 'happy' | 'celebrating' | 'encouraging' | 'proud';

interface AiraCharacterProps {
  mood?: Mood;
  size?: number;
}

const moodConfig: Record<
  Mood,
  {
    colors: string[];
    pulseSpeed: number;
    particleSpeed: number;
    particleBehavior: 'orbit' | 'bounce' | 'burst' | 'glow';
  }
> = {
  calm: {
    colors: [colors.airaCore, colors.airaGlow],
    pulseSpeed: 2000,
    particleSpeed: 3000,
    particleBehavior: 'orbit',
  },
  thinking: {
    colors: [colors.trackCriticalThinking, colors.airaCore],
    pulseSpeed: 1200,
    particleSpeed: 1500,
    particleBehavior: 'orbit',
  },
  happy: {
    colors: [colors.airaPro, colors.airaGlow],
    pulseSpeed: 1500,
    particleSpeed: 2000,
    particleBehavior: 'bounce',
  },
  celebrating: {
    colors: colors.confettiColors,
    pulseSpeed: 800,
    particleSpeed: 1000,
    particleBehavior: 'burst',
  },
  encouraging: {
    colors: [colors.trackCriticalThinking, colors.airaGlow],
    pulseSpeed: 1800,
    particleSpeed: 2500,
    particleBehavior: 'glow',
  },
  proud: {
    colors: [colors.airaPro, colors.airaCore],
    pulseSpeed: 1600,
    particleSpeed: 2200,
    particleBehavior: 'glow',
  },
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Particle = ({ index, size, mood }: { index: number; size: number; mood: Mood }) => {
  const config = moodConfig[mood];
  const angle = useSharedValue((index * 360) / 5);
  const radius = useSharedValue(size * 0.7);
  const scale = useSharedValue(1);

  useEffect(() => {
    const orbitAnimation = () => {
      angle.value = withRepeat(
        withTiming(angle.value + 360, {
          duration: config.particleSpeed,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    };

    const scaleAnimation = () => {
      if (config.particleBehavior === 'bounce') {
        scale.value = withRepeat(
          withSequence(
            withSpring(1.3),
            withSpring(1)
          ),
          -1,
          false
        );
      } else if (config.particleBehavior === 'burst') {
        scale.value = withSequence(
          withSpring(1.5),
          withSpring(0.5),
          withSpring(1)
        );
        scale.value = withRepeat(scale.value, -1, false);
      }
    };

    orbitAnimation();
    scaleAnimation();
  }, [mood]);

  const animatedStyle = useAnimatedStyle(() => {
    const rad = (angle.value * Math.PI) / 180;
    return {
      transform: [
        {
          translateX: Math.cos(rad) * radius.value,
        },
        {
          translateY: Math.sin(rad) * radius.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  const particleColor = mood === 'celebrating' 
    ? colors.confettiColors[index % colors.confettiColors.length]
    : config.colors[0];

  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={size * 0.08}
      fill={particleColor}
      style={animatedStyle}
    />
  );
};

const BlobPath = ({ size, mood }: { size: number; mood: Mood }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: moodConfig[mood].pulseSpeed,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [mood]);

  const animatedPath = useAnimatedStyle(() => {
    const t = progress.value;
    // Generate organic blob shape that morphs
    const r = size / 2;
    const noise1 = Math.sin(t * Math.PI * 2) * r * 0.15;
    const noise2 = Math.cos(t * Math.PI * 2 + 1) * r * 0.1;
    const noise3 = Math.sin(t * Math.PI * 2 + 2) * r * 0.12;
    const noise4 = Math.cos(t * Math.PI * 2 + 3) * r * 0.08;

    const d = `
      M ${r + noise1} ${r * 0.1}
      C ${r * 1.8 + noise2} ${r * 0.2}
      ${r * 1.9 + noise3} ${r * 0.5}
      ${r * 1.8 + noise4} ${r * 0.9}
      C ${r * 1.7 - noise1} ${r * 1.4}
      ${r * 1.2 - noise2} ${r * 1.8}
      ${r * 0.8 - noise3} ${r * 1.9}
      C ${r * 0.4 - noise4} ${r * 1.8}
      ${r * 0.1 + noise1} ${r * 1.4}
      ${r * 0.05 + noise2} ${r * 0.9}
      ${r * 0.1 + noise3} ${r * 0.5}
      ${r * 0.2 + noise4} ${r * 0.2}
      Z
    `;
    return { d };
  });

  const config = moodConfig[mood];

  return (
    <Path
      d={animatedPath.d}
      fill="url(#gradient)"
      style={animatedPath}
    />
  );
};

export const AiraCharacter: React.FC<AiraCharacterProps> = ({ mood = 'calm', size = 120 }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 10 }),
        withSpring(1, { damping: 10 })
      ),
      -1,
      false
    );
  }, [mood]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const config = moodConfig[mood];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.character, animatedStyle, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <LinearGradient
            id="gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            colors={config.colors}
          />
          <BlobPath size={size} mood={mood} />
          {[...Array(5)].map((_, i) => (
            <Particle key={i} index={i} size={size} mood={mood} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  character: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
