import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { ScreenContainer } from '../components/ScreenContainer';
import { haptics } from '../utils/haptics';
import { Card } from '../components/Card';
import { GradientButton } from '../components/GradientButton';
import { colors, typography, spacing, radius } from '../theme';
import { useUserStore } from '../store/userStore';
import { createCheckout, getUser, NetworkError } from '../api/client';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
}

const features = [
  'Unlimited daily lessons',
  'Advanced topics and deep dives',
  'Detailed analytics and insights',
  'Priority support',
];

export function PaywallScreen({ navigation }: Props) {
  const userId = useUserStore((s) => s.userId);
  const upgradeTier = useUserStore((s) => s.upgradeTier);
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!userId || loading) return;
    haptics.heavy();
    setLoading(true);
    try {
      const { url } = await createCheckout(userId);
      if (Platform.OS === 'web') {
        // On web, navigate the current tab to Lemon Squeezy. After the user
        // comes back (or returns from the Lemon Squeezy confirmation page),
        // the app reloads and tier sync happens on the dashboard.
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
        return;
      }
      // Native: opens in an in-app browser sheet; returns when dismissed.
      await WebBrowser.openBrowserAsync(url);
      // After dismissal, re-sync tier from backend — webhook may have
      // already flipped the user to Pro.
      try {
        const fresh = await getUser(userId);
        if (fresh.tier === 'pro') {
          upgradeTier();
          haptics.success();
          navigation.goBack();
        }
      } catch {
        // Non-fatal — user can pull-to-refresh on dashboard.
      }
    } catch (err) {
      haptics.error();
      if (err instanceof NetworkError) {
        Alert.alert('Connection error', err.message);
      } else {
        const msg =
          (err as { response?: { data?: { hint?: string; error?: string } } })
            ?.response?.data?.hint ??
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Could not start checkout. Please try again.';
        Alert.alert('Checkout unavailable', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.hero}>
        <LinearGradient
          colors={[...colors.gradientPrimary]}
          style={styles.heroIcon}
        >
          <Text style={styles.heroIconText}>AI</Text>
        </LinearGradient>
        <Text style={styles.heroTitle}>AIRA Pro</Text>
        <Text style={styles.heroSubtitle}>
          Unlock your full AI learning potential
        </Text>
      </View>

      <Card style={styles.featuresCard}>
        {features.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>{'\u2713'}</Text>
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.priceCard}>
        <Text style={styles.priceLabel}>One-time purchase</Text>
        <Text style={styles.price}>$9.99</Text>
        <Text style={styles.priceSubtitle}>Lifetime access. No subscription.</Text>
      </Card>

      <View style={styles.footer}>
        <GradientButton
          title={loading ? 'Opening checkout...' : 'Upgrade Now'}
          onPress={handleUpgrade}
          fullWidth
          haptic="none"
          disabled={loading}
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.laterBtn}
          disabled={loading}
        >
          <Text style={styles.laterText}>Maybe later</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIconText: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
  },
  featureText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  priceCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderColor: colors.purple,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  priceSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  laterText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
