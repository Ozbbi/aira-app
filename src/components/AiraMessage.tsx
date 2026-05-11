import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../theme';

interface AiraMessageProps {
  message: string;
  typewriter?: boolean;
  onComplete?: () => void;
}

export function AiraMessage({ message, typewriter = false, onComplete }: AiraMessageProps) {
  const [displayedText, setDisplayedText] = useState(typewriter ? '' : message);
  const [speaking, setSpeaking] = useState(typewriter);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Breathing indicator dot — gentle fade in/out while AIRA "speaks"
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (speaking) {
      dotOpacity.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      dotOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [speaking]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: 0.8 + dotOpacity.value * 0.3 }],
  }));

  useEffect(() => {
    if (!typewriter) {
      setDisplayedText(message);
      setSpeaking(false);
      onComplete?.();
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    setSpeaking(true);

    const tick = () => {
      indexRef.current += 1;
      setDisplayedText(message.slice(0, indexRef.current));
      if (indexRef.current < message.length) {
        timerRef.current = setTimeout(tick, 30);
      } else {
        setSpeaking(false);
        onComplete?.();
      }
    };

    timerRef.current = setTimeout(tick, 30);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, typewriter]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Animated.View style={[styles.dot, dotStyle]} />
        <Text style={styles.label}>AIRA</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.text}>{displayedText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.cyan,
  },
  bubble: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.cyan,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    // 1.6x line height — relaxed, readable, and matches the app's calm tone
    lineHeight: 26,
  },
});
