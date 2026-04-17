import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AiraOrb } from '../components/AiraOrb';
import { AiraMessage } from '../components/AiraMessage';
import { GradientButton } from '../components/GradientButton';
import { useUserStore } from '../store/userStore';
import { colors, typography, spacing, radius } from '../theme';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
}

type Step = 0 | 1 | 2 | 3;

export function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [messageComplete, setMessageComplete] = useState(false);
  const [name, setName] = useState('');
  const [orbIntensity, setOrbIntensity] = useState<'calm' | 'thinking' | 'celebrating'>('calm');
  const [error, setError] = useState<string | null>(null);
  const setUser = useUserStore((s) => s.setUser);

  const handleMessageComplete = useCallback(() => {
    setMessageComplete(true);
  }, []);

  const goNext = () => {
    setMessageComplete(false);
    setError(null);
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleNameSubmit = () => {
    if (name.trim().length > 0) {
      setUser({ name: name.trim() });
      setOrbIntensity('celebrating');
      setTimeout(() => setOrbIntensity('calm'), 1200);
      goNext();
    }
  };

  const storedName = useUserStore((s) => s.name);

  // After name is entered, go to Auth screen (which handles signup/login/skip).
  const handleFinish = () => {
    navigation.replace('Auth', { name: storedName });
  };

  return (
    <LinearGradient
      colors={[colors.bg, '#0F0A1A', colors.bg]}
      style={styles.container}
    >
      {step === 0 && (
        <View style={styles.screen} key="step0">
          <View style={styles.orbCenter}>
            <AiraOrb size={180} intensity="calm" />
          </View>
          <View style={styles.messageArea}>
            <AiraMessage
              message="Hey. I'm AIRA. I'm here to help you think better in a world full of AI."
              typewriter
              onComplete={handleMessageComplete}
            />
          </View>
          {messageComplete && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.buttonArea}>
              <GradientButton title="Continue" onPress={goNext} fullWidth />
            </Animated.View>
          )}
        </View>
      )}

      {step === 1 && (
        <View style={styles.screen} key="step1">
          <View style={styles.orbCenter}>
            <AiraOrb size={100} intensity="calm" />
          </View>
          <View style={styles.messageArea}>
            <AiraMessage
              message="Most apps will teach you AI shortcuts. I'll teach you how to think with AI — and when not to."
              typewriter
              onComplete={handleMessageComplete}
            />
          </View>
          {messageComplete && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.buttonArea}>
              <GradientButton title="Continue" onPress={goNext} fullWidth />
            </Animated.View>
          )}
        </View>
      )}

      {step === 2 && (
        <View style={styles.screen} key="step2">
          <View style={styles.orbCenter}>
            <AiraOrb size={100} intensity="calm" />
          </View>
          <View style={styles.messageArea}>
            <AiraMessage
              message="Before we start — what should I call you?"
              typewriter
              onComplete={handleMessageComplete}
            />
          </View>
          {messageComplete && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.inputArea}>
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
              <GradientButton
                title="Continue"
                onPress={handleNameSubmit}
                fullWidth
                disabled={name.trim().length === 0}
              />
            </Animated.View>
          )}
        </View>
      )}

      {step === 3 && (
        <View style={styles.screen} key="step3">
          <View style={styles.orbCenter}>
            <AiraOrb size={120} intensity={orbIntensity} />
          </View>
          <View style={styles.messageArea}>
            {error ? (
              <AiraMessage message={error} />
            ) : (
              <AiraMessage
                message={`Nice to meet you, ${storedName}. Let's begin.`}
                typewriter
                onComplete={handleMessageComplete}
              />
            )}
          </View>
          {(messageComplete || error) && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.buttonArea}>
              <GradientButton
                title="Continue"
                onPress={handleFinish}
                fullWidth
              />
            </Animated.View>
          )}
        </View>
      )}

      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  orbCenter: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  messageArea: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  buttonArea: {
    width: '100%',
  },
  inputArea: {
    width: '100%',
    gap: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
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
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.airaCore,
    width: 24,
  },
});
