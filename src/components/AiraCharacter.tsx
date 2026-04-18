import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
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
    particleColors: string[];
  }
> = {
  calm: {
    colors: [colors.airaCore, colors.airaGlow],
    pulseSpeed: 2000,
    particleColors: [colors.airaGlow],
  },
  thinking: {
    colors: [colors.trackCritical, colors.airaCore],
    pulseSpeed: 1200,
    particleColors: [colors.trackCritical, colors.airaCore],
  },
  happy: {
    colors: [colors.airaPro, colors.airaGlow],
    pulseSpeed: 1500,
    particleColors: [colors.airaPro, colors.airaGlow],
  },
  celebrating: {
    colors: colors.confettiColors,
    pulseSpeed: 800,
    particleColors: colors.confettiColors,
  },
  encouraging: {
    colors: [colors.trackCritical, colors.airaGlow],
    pulseSpeed: 1800,
    particleColors: [colors.trackCritical, colors.airaGlow],
  },
  proud: {
    colors: [colors.airaPro, colors.airaCore],
    pulseSpeed: 1600,
    particleColors: [colors.airaPro, colors.airaCore],
  },
};

const Particle = ({ index, size, mood }: { index: number; size: number; mood: Mood }) => {
  const config = moodConfig[mood];
  const angle = (index * 360) / 5;
  const radius = size * 0.35;
  const particleColor = config.particleColors[index % config.particleColors.length];

  // Calculate position
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <MotiView
      style={[
        styles.particle,
        {
          width: size * 0.1,
          height: size * 0.1,
          borderRadius: size * 0.05,
          backgroundColor: particleColor,
          transform: [{ translateX: x }, { translateY: y }],
        },
      ]}
      animate={{
        opacity: [0.4, 1, 0.4],
        scale: [1, 1.3, 1],
      }}
      transition={{
        loop: true,
        duration: config.pulseSpeed,
        delay: index * 100,
      }}
    />
  );
};

export const AiraCharacter: React.FC<AiraCharacterProps> = ({ mood = 'calm', size = 120 }) => {
  const config = moodConfig[mood];
  const blobSize = size * 0.8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main blob with gradient */}
      <MotiView
        style={[
          styles.blob,
          {
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize * 0.4,
          },
        ]}
        animate={{
          scale: [1, 1.05, 1],
          borderRadius: [blobSize * 0.4, blobSize * 0.45, blobSize * 0.4],
        }}
        transition={{
          loop: true,
          duration: config.pulseSpeed,
        }}
      >
        <LinearGradient
          colors={config.colors as unknown as readonly [string, string, ...string[]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </MotiView>

      {/* Particles */}
      {[...Array(5)].map((_, i) => (
        <Particle key={i} index={i} size={size} mood={mood} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
  },
});
