import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle, Ellipse, Polygon, Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

export type AraState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'success'
  | 'error'
  | 'levelUp'
  | 'sleep';

export type MascotMood = 'calm' | 'thinking' | 'happy' | 'celebrating' | 'encouraging';

interface Props {
  size?: number;
  state?: AraState;
  mood?: MascotMood;
  static?: boolean;
}

const moodToState: Record<MascotMood, AraState> = {
  calm: 'idle',
  thinking: 'thinking',
  happy: 'success',
  celebrating: 'success',
  encouraging: 'error',
};

export function AiraMascot({ size = 48, state, mood, static: isStatic }: Props) {
  const resolvedState = state ?? (mood ? moodToState[mood] : 'idle');

  const bobY = useSharedValue(0);
  const bodyScale = useSharedValue(1);

  useEffect(() => {
    if (isStatic) return;
    bobY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [isStatic]);

  useEffect(() => {
    if (resolvedState === 'success' || resolvedState === 'levelUp') {
      bodyScale.value = withSequence(
        withSpring(1.15, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    } else {
      bodyScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    }
  }, [resolvedState]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY.value },
      { scale: bodyScale.value },
    ],
  }));

  const showSmile = resolvedState !== 'error' && resolvedState !== 'sleep';
  const showFrown = resolvedState === 'error';
  const showSleep = resolvedState === 'sleep';
  const showSparkles = resolvedState === 'success' || resolvedState === 'levelUp';
  const showThinkingDots = resolvedState === 'thinking';

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="bodyGlow" cx="60" cy="60" rx="50" ry="50">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity="0.15" />
            <Stop offset="1" stopColor={colors.cyan} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity="0.9" />
            <Stop offset="1" stopColor="#00B4D8" stopOpacity="0.6" />
          </LinearGradient>
          <LinearGradient id="earGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity="0.8" />
            <Stop offset="1" stopColor={colors.cyan} stopOpacity="0.4" />
          </LinearGradient>
          <RadialGradient id="eyeGlow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
            <Stop offset="0" stopColor={colors.orange} stopOpacity="1" />
            <Stop offset="0.7" stopColor={colors.orange} stopOpacity="0.6" />
            <Stop offset="1" stopColor={colors.orange} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient glow */}
        <Circle cx="60" cy="65" r="48" fill="url(#bodyGlow)" />

        {/* Tail */}
        <Path
          d="M75 80 Q95 75 100 60 Q105 45 95 35 Q90 30 88 35 Q92 45 88 55 Q84 65 70 75"
          fill="none"
          stroke={colors.cyan}
          strokeWidth="3"
          strokeOpacity={0.5}
          strokeLinecap="round"
        />
        <Circle cx="100" cy="58" r="2" fill={colors.cyan} opacity={0.6} />
        <Circle cx="96" cy="42" r="1.5" fill={colors.cyan} opacity={0.4} />
        <Circle cx="92" cy="34" r="1" fill={colors.cyan} opacity={0.3} />

        {/* Body shards */}
        <Path
          d="M60 38 L44 55 L38 78 L50 90 L70 90 L82 78 L76 55 Z"
          fill="url(#bodyGrad)"
          strokeWidth="0.5"
          stroke={colors.cyan}
          strokeOpacity={0.3}
        />
        <Path d="M60 38 L52 52 L60 50 L68 52 Z" fill={colors.cyan} opacity={0.7} />
        <Path d="M44 55 L52 52 L50 68 L38 78 Z" fill={colors.cyan} opacity={0.5} />
        <Path d="M76 55 L68 52 L70 68 L82 78 Z" fill={colors.cyan} opacity={0.5} />
        <Path d="M50 68 L60 50 L70 68 L70 90 L50 90 Z" fill={colors.cyan} opacity={0.35} />

        {/* Left ear */}
        <Path d="M42 52 L32 28 L50 45 Z" fill="url(#earGrad)" stroke={colors.cyan} strokeWidth="0.5" strokeOpacity={0.5} />
        <Path d="M38 38 L35 30 L44 42 Z" fill={colors.cyan} opacity={0.3} />

        {/* Right ear */}
        <Path d="M78 52 L88 28 L70 45 Z" fill="url(#earGrad)" stroke={colors.cyan} strokeWidth="0.5" strokeOpacity={0.5} />
        <Path d="M82 38 L85 30 L76 42 Z" fill={colors.cyan} opacity={0.3} />

        {/* Face plate */}
        <Path d="M48 58 L60 52 L72 58 L68 72 L60 76 L52 72 Z" fill={colors.bg} opacity={0.85} />

        {/* Eyes */}
        {showSleep ? (
          <>
            <Rect x="48" y="61" width="8" height="3" rx="1.5" fill={colors.cyan} opacity={0.5} />
            <Rect x="64" y="61" width="8" height="3" rx="1.5" fill={colors.cyan} opacity={0.5} />
            <Path d="M78 38 L82 38 L78 43 L82 43" fill="none" stroke={colors.cyan} strokeWidth="1.5" opacity={0.5} />
            <Path d="M85 30 L88 30 L85 34 L88 34" fill="none" stroke={colors.cyan} strokeWidth="1" opacity={0.3} />
          </>
        ) : (
          <>
            <Circle cx="52" cy="63" r="4" fill="url(#eyeGlow)" />
            <Circle cx="52" cy="63" r="2.5" fill={colors.orange} />
            <Circle cx="51" cy="62" r="1" fill="#FFF" opacity={0.8} />
            <Circle cx="68" cy="63" r="4" fill="url(#eyeGlow)" />
            <Circle cx="68" cy="63" r="2.5" fill={colors.orange} />
            <Circle cx="67" cy="62" r="1" fill="#FFF" opacity={0.8} />
          </>
        )}

        {/* Nose */}
        <Polygon points="60,68 58,71 62,71" fill={colors.cyan} opacity={0.7} />

        {/* Mouth */}
        {showSmile && (
          <Path d="M56 73 Q60 76 64 73" fill="none" stroke={colors.cyan} strokeWidth="1" strokeOpacity={0.5} strokeLinecap="round" />
        )}
        {showFrown && (
          <Path d="M56 75 Q60 73 64 75" fill="none" stroke={colors.cyan} strokeWidth="1" strokeOpacity={0.5} strokeLinecap="round" />
        )}

        {/* Thinking dots */}
        {showThinkingDots && (
          <>
            <Circle cx="94" cy="30" r="3" fill={colors.cyan} opacity={0.6} />
            <Circle cx="98" cy="22" r="2" fill={colors.cyan} opacity={0.4} />
            <Circle cx="96" cy="16" r="1.5" fill={colors.cyan} opacity={0.3} />
          </>
        )}

        {/* Success sparkles */}
        {showSparkles && (
          <>
            <Path d="M30 40 L32 36 L34 40 L32 44 Z" fill={colors.cyan} opacity={0.6} />
            <Path d="M88 48 L90 44 L92 48 L90 52 Z" fill={colors.orange} opacity={0.6} />
            <Path d="M45 30 L46 28 L47 30 L46 32 Z" fill="#2ECC71" opacity={0.5} />
            <Path d="M22 60 L24 56 L26 60 L24 64 Z" fill={colors.cyan} opacity={0.4} />
            <Path d="M95 68 L96 66 L97 68 L96 70 Z" fill={colors.orange} opacity={0.4} />
          </>
        )}

        {/* Floating particles */}
        <Circle cx="30" cy="70" r="1.5" fill={colors.cyan} opacity={0.3} />
        <Circle cx="90" cy="75" r="1" fill={colors.cyan} opacity={0.25} />
        <Circle cx="25" cy="55" r="1" fill={colors.cyan} opacity={0.2} />
        <Circle cx="95" cy="50" r="1.5" fill={colors.cyan} opacity={0.2} />

        {/* Paws */}
        <Circle cx="50" cy="92" r="3" fill={colors.cyan} opacity={0.3} />
        <Circle cx="60" cy="93" r="3" fill={colors.cyan} opacity={0.25} />
        <Circle cx="70" cy="92" r="3" fill={colors.cyan} opacity={0.3} />
      </Svg>
    </Animated.View>
  );
}
