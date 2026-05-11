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
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AiraMascot } from '../components/AiraMascot';
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

      setAuthToken(res.token);
      setUser({
        userId,
        name: u.name,
        email: email.trim(),
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        tier: u.tier,
        totalLessonsCompleted: u.totalLessonsCompleted ?? 0,
      });

      if (isSignup) {
        scheduleStreakReminder()
          .then((granted) => setUser({ notificationsEnabled: granted }))
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
    <LinearGradient
      colors={['#0B0E14', '#0A2E3D', '#00B4D8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <AiraMascot size={120} mood="calm" />
              <Text style={styles.title}>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignup
                  ? 'Save your progress across devices.'
                  : 'Pick up where you left off.'}
              </Text>
            </View>

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

            <Animated.View entering={FadeInDown.duration(300)} style={styles.form}>
              {isSignup && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                  placeholderTextColor="rgba(255,255,255,0.4)"
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

              <Pressable
                disabled={!canSubmit || loading}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                  (!canSubmit || loading) && styles.ctaDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#0F0A1F" />
                ) : (
                  <Text style={styles.ctaText}>
                    {isSignup ? 'Create account' : 'Sign in'}
                  </Text>
                )}
              </Pressable>
            </Animated.View>

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
      </SafeAreaView>
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
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: spacing.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabText: {
    ...typography.bodyBold,
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: 'rgba(255,255,255,0.7)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: 'rgba(231,76,60,0.18)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.5)',
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: '#FECACA',
  },
  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
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
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
});
