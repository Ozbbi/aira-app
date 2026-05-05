import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import { AiraMascot, MascotMood } from '../components/AiraMascot';
import { colors, radius, spacing, typography } from '../theme';
import { useUserStore } from '../store/userStore';
import { getOrCreateUser } from '../services/userService';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
}

/**
 * Onboarding — 4 colourful steps that introduce AIRA via the mascot.
 *
 * Why this shape (vs. the previous typewriter version):
 *   • Each step has a distinct gradient background — the app's first
 *     impression is "this app is alive with colour".
 *   • Lines fade in instantly + softly (FadeIn 250ms) so users never wait
 *     for words to typewriter onto the screen at 3 fps.
 *   • The mascot does the introducing — its mood shifts step-to-step so
 *     onboarding feels like meeting a character, not reading a slide deck.
 *   • Step 4 actually creates a backend user (or local fallback) and
 *     stores `userId` in the store so the next launch skips this whole
 *     flow. Without this, onboarding loops forever.
 */

interface Step {
  id: number;
  bg: readonly [string, string, ...string[]];
  mood: MascotMood;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
}

const STEPS: Step[] = [
  {
    id: 0,
    bg: ['#1A0B2E', '#3B0764', '#581C87'] as const,
    mood: 'calm',
    eyebrow: 'WELCOME',
    headline: "Hey. I'm AIRA.",
    body: 'Most apps teach you AI shortcuts. I teach you to think with AI.',
    ctaLabel: 'Continue',
  },
  {
    id: 1,
    bg: ['#0F172A', '#1E3A8A', '#4F46E5'] as const,
    mood: 'thinking',
    eyebrow: 'THE PROMISE',
    headline: 'Sharper, in 5 minutes a day.',
    body: 'Real lessons. Real questions. No fluff. By next week you\'ll prompt smarter than 90% of users.',
    ctaLabel: 'I\'m in',
  },
  {
    id: 2,
    bg: ['#831843', '#9D174D', '#C026D3'] as const,
    mood: 'encouraging',
    eyebrow: 'BEFORE WE START',
    headline: 'What should I call you?',
    body: 'Just a first name is fine. We can change it later.',
    ctaLabel: 'Let\'s go',
  },
  {
    id: 3,
    bg: ['#7C2D12', '#B45309', '#F59E0B'] as const,
    mood: 'celebrating',
    eyebrow: 'READY',
    headline: 'Nice to meet you.',
    body: 'Your first lesson is waiting. Three minutes, then you\'ll feel the difference.',
    ctaLabel: 'Begin',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const setUser = useUserStore((s) => s.setUser);

  const step = STEPS[stepIndex];

  const tap = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const goNext = useCallback(() => {
    tap();
    Keyboard.dismiss();
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, tap]);

  const handleFinish = useCallback(async () => {
    if (creating) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setCreating(true);

    const trimmed = (name || 'friend').trim();
    let userId = '';
    try {
      const user = await getOrCreateUser(trimmed);
      userId = user.userId;
      setUser({
        userId,
        name: user.name || trimmed,
        xp: user.xp ?? 0,
        level: user.level ?? 1,
        streak: user.streak ?? 0,
        tier: 'pro',
        totalLessonsCompleted: user.totalLessonsCompleted ?? 0,
      });
    } catch {
      userId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await AsyncStorage.setItem('aira_user_id', userId);
      setUser({ userId, name: trimmed, tier: 'pro' });
    }

    navigation.replace('MainTabs');
  }, [creating, name, navigation, setUser]);

  const isNameStep = stepIndex === 2;
  const ctaDisabled = isNameStep && name.trim().length === 0;

  return (
    <LinearGradient colors={step.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.fill}
        >
          {/* Step indicator */}
          <View style={styles.dots}>
            {STEPS.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.dot,
                  i === stepIndex && styles.dotActive,
                  i < stepIndex && styles.dotPast,
                ]}
              />
            ))}
          </View>

          {/* Hero */}
          <Animated.View
            key={`mascot-${stepIndex}`}
            entering={FadeIn.duration(380)}
            exiting={FadeOut.duration(180)}
            style={styles.mascotWrap}
          >
            <AiraMascot size={180} mood={step.mood} />
          </Animated.View>

          {/* Copy */}
          <Animated.View
            key={`copy-${stepIndex}`}
            entering={FadeInDown.duration(420).delay(80)}
            style={styles.copyWrap}
          >
            <Text style={styles.eyebrow}>{step.eyebrow}</Text>
            <Text style={styles.headline}>{step.headline}</Text>
            <Text style={styles.body}>{step.body}</Text>

            {isNameStep && (
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your first name"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="done"
                  maxLength={24}
                  onSubmitEditing={() => !ctaDisabled && goNext()}
                />
              </View>
            )}
          </Animated.View>

          {/* CTA */}
          <Animated.View
            key={`cta-${stepIndex}`}
            entering={FadeInDown.duration(380).delay(160)}
            style={styles.ctaWrap}
          >
            <Pressable
              disabled={ctaDisabled || creating}
              onPress={stepIndex === STEPS.length - 1 ? handleFinish : goNext}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
                (ctaDisabled || creating) && styles.ctaDisabled,
              ]}
            >
              <Text style={styles.ctaText}>
                {creating ? 'Setting things up…' : step.ctaLabel}
              </Text>
            </Pressable>

            {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
              <Pressable onPress={() => setStepIndex((i) => Math.max(0, i - 1))} hitSlop={8}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  fill: { flex: 1, paddingHorizontal: spacing.lg },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotPast: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },

  mascotWrap: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  copyWrap: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.display,
    fontSize: 34,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.92)',
  },

  inputWrap: {
    width: '100%',
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },

  ctaWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    ...typography.button,
    fontSize: 17,
    color: '#0F0A1F',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  backText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
});
