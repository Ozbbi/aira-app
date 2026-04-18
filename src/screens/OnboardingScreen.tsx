import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
}

type Step = 0 | 1 | 2 | 3;

const AnimatedText = Animated.createAnimatedComponent(Text);

const TypewriterText = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const words = text.split(' ');
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedWords((prev) => [...prev, words[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 400); // Word by word, not character
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentIndex, words, onComplete]);

  return (
    <Text style={styles.messageText}>
      {displayedWords.join(' ')}
      {currentIndex < words.length && (
        <AnimatedText style={styles.cursor}>|</AnimatedText>
      )}
    </Text>
  );
};

export function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [messageComplete, setMessageComplete] = useState(false);
  const [name, setName] = useState('');
  const [mood, setMood] = useState<'calm' | 'thinking' | 'happy' | 'celebrating' | 'encouraging' | 'proud'>('calm');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleMessageComplete = useCallback(() => {
    setMessageComplete(true);
  }, []);

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessageComplete(false);
    if (step < 3) {
      setStep((step + 1) as Step);
      setMood('calm');
    }
  };

  const handleNameSubmit = async () => {
    if (name.trim().length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem('user_name', name.trim());
      await AsyncStorage.setItem('onboarding_complete', 'true');
      setMood('celebrating');
      setStep(3);
    }
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowConfetti(true);
    setTimeout(() => {
      navigation.replace('MainTabs');
    }, 500);
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return {
          mood: 'calm' as const,
          characterSize: 180,
          message: "Hey. I'm AIRA.",
        };
      case 1:
        return {
          mood: 'thinking' as const,
          characterSize: 140,
          message: "Most apps teach you AI shortcuts. I'll teach you to think with AI.",
        };
      case 2:
        return {
          mood: 'encouraging' as const,
          characterSize: 120,
          message: "Before we start — what should I call you?",
        };
      case 3:
        return {
          mood: 'celebrating' as const,
          characterSize: 140,
          message: `Nice to meet you, ${name || 'friend'}.`,
        };
    }
  };

  const content = getStepContent();

  return (
    <LinearGradient
      colors={colors.gradientHero}
      style={styles.container}
    >
      <View style={styles.gradientOverlay} />
      
      <View style={styles.screen}>
        {/* AIRA Character */}
        <View style={styles.characterContainer}>
          <AiraCharacter mood={content.mood} size={content.characterSize} />
        </View>

        {/* Message Area */}
        <View style={styles.messageArea}>
          <TypewriterText
            text={content.message}
            onComplete={handleMessageComplete}
          />
        </View>

        {/* Step-specific content */}
        {step === 2 && messageComplete && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleNameSubmit}
            />
          </Animated.View>
        )}

        {/* Continue Button */}
        {messageComplete && step !== 2 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.buttonArea}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={step === 3 ? handleFinish : goNext}
            >
              <Text style={styles.buttonText}>
                {step === 3 ? "Let's begin" : 'Continue'}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <MotiView
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
            ]}
            animate={{
              width: i === step ? 24 : 8,
              backgroundColor: i === step ? colors.airaGlow : colors.textMuted,
            }}
            transition={{
              type: 'spring',
              damping: 15,
            }}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 10, 20, 0.85)',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  characterContainer: {
    marginBottom: spacing.xxl,
  },
  messageArea: {
    width: '100%',
    marginBottom: spacing.xl,
    minHeight: 60,
  },
  messageText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  cursor: {
    color: colors.airaGlow,
  },
  inputArea: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  textInput: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.airaCore,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  buttonArea: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.airaCore,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    shadowColor: colors.airaGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
