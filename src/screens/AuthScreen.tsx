import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AiraOrb } from '../components/AiraOrb';
import { GradientButton } from '../components/GradientButton';
import { authSignup, authLogin } from '../api/client';
import { scheduleStreakReminder } from '../services/notifications';
import { haptics } from '../utils/haptics';
import { useUserStore } from '../store/userStore';
import { colors, typography, spacing, radius } from '../theme';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
  route: RouteProp<RootStackParamList, 'Auth'>;
}

type Tab = 'signup' | 'login';

export function AuthScreen({ navigation, route }: Props) {
  const prefillName = route.params?.name ?? '';

  const setUser = useUserStore((s) => s.setUser);
  const setAuthToken = useUserStore((s) => s.setAuthToken);
  const setNotificationsEnabled = useUserStore((s) => s.setNotificationsEnabled);

  const [tab, setTab] = useState<Tab>('signup');
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = tab === 'signup';

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (!isSignup || name.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    haptics.medium();
    setLoading(true);
    setError(null);

    try {
      const res = isSignup
        ? await authSignup(name.trim(), email.trim(), password)
        : await authLogin(email.trim(), password);

      const u = res.user;
      const userId = u.id ?? (u as any).userId;

      // Persist token + user data
      setAuthToken(res.token);
      setUser({
        userId,
        name: u.name,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        tier: u.tier,
        lessonsCompletedToday: u.lessonsCompletedToday ?? 0,
        totalLessonsCompleted: u.totalLessonsCompleted ?? 0,
      });

      // Schedule streak reminder on first sign-up (fire-and-forget)
      if (isSignup) {
        scheduleStreakReminder()
          .then((granted) => setNotificationsEnabled(granted))
          .catch(() => {});
      }

      haptics.success();
      navigation.replace('MainTabs');
    } catch (err: any) {
      haptics.error();
      const msg =
        err?.response?.data?.error ??
        (isSignup ? 'Could not create account.' : 'Could not sign in.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    haptics.select();
  };

  return (
    <LinearGradient colors={[colors.bg, '#0D0A18', colors.bg]} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <AiraOrb size={64} intensity="calm" />
            <Text style={styles.title}>
              {isSignup ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Your progress is saved across all your devices.'
                : 'Sign in to pick up where you left off.'}
            </Text>
          </View>

          {/* Tab switch */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, tab === 'signup' && styles.tabActive]}
              onPress={() => switchTab('signup')}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Sign up
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'login' && styles.tabActive]}
              onPress={() => switchTab('login')}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                Log in
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.form}>
            {isSignup && (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <GradientButton
              title={
                loading
                  ? isSignup
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isSignup
                  ? 'Create account'
                  : 'Sign in'
              }
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              fullWidth
            />
          </Animated.View>

          {/* Skip */}
          <Pressable
            onPress={() => {
              haptics.tap();
              navigation.replace('MainTabs');
            }}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Continue without account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.bgElevated,
  },
  tabText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    color: colors.textPrimary,
  },
  errorBox: {
    backgroundColor: colors.error + '20',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error + '60',
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
