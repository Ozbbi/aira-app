import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle, Lock, X, Sparkle } from 'phosphor-react-native';
import { AiraMascot } from '../components/AiraMascot';
import { colors, radius, spacing, typography } from '../theme';
import { useUserStore } from '../store/userStore';
import { createCheckout, getUser } from '../api/client';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
}

const PRO_FEATURES = [
  { icon: '∞', title: 'Unlimited lessons', sub: 'Every track, every lesson, no caps.' },
  { icon: '⚡', title: 'AI-powered Sandbox', sub: 'Real-time prompt grading from Claude.' },
  { icon: '🎯', title: 'Advanced tracks', sub: 'Critical Thinking, Power Moves, Tools.' },
  { icon: '📊', title: 'Skill analytics', sub: 'See exactly where you\'re sharpest.' },
  { icon: '🚀', title: 'Code learning', sub: 'Python, Java, HTML — full curriculum.' },
];

export function PaywallScreen({ navigation }: Props) {
  const userId = useUserStore((s) => s.userId);
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!userId || loading) return;
    haptics.heavy();
    setLoading(true);
    try {
      const { url } = await createCheckout(userId);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
        return;
      }
      await WebBrowser.openBrowserAsync(url);
      try {
        const fresh = await getUser(userId);
        if (fresh.tier === 'pro') {
          setUser({ tier: 'pro' });
          haptics.success();
          navigation.goBack();
        }
      } catch {
        // Non-fatal
      }
    } catch (err) {
      haptics.error();
      Alert.alert('Checkout unavailable', 'Could not start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <Pressable
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          hitSlop={12}
          style={styles.closeBtn}
        >
          <X size={22} color="#FFFFFF" weight="bold" />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <AiraMascot size={120} mood="celebrating" />
            <Text style={styles.headline}>Go Pro.</Text>
            <Text style={styles.subhead}>Unlock the full curriculum and become dangerous with AI.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.featuresCard}>
            {PRO_FEATURES.map((f, i) => (
              <View key={f.title} style={[styles.featureRow, i < PRO_FEATURES.length - 1 && styles.featureRowDivider]}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>{f.icon}</Text>
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <CheckCircle size={20} color={colors.cyan} weight="fill" />
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.priceWrap}>
            <LinearGradient
              colors={[colors.cyan, '#00B4D8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.priceCard}
            >
              <Text style={styles.priceLabel}>$9.99</Text>
              <Text style={styles.priceUnit}>one-time · yours forever</Text>
              <Text style={styles.priceSub}>No subscription. No renewals.</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(320)} style={styles.ctaWrap}>
            <Pressable
              onPress={handleUpgrade}
              disabled={loading}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
                loading && styles.ctaDisabled,
              ]}
            >
              <Sparkle size={20} color="#0B0E14" weight="fill" />
              <Text style={styles.ctaText}>
                {loading ? 'Opening checkout…' : 'Upgrade to Pro'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.tap();
                navigation.goBack();
              }}
              disabled={loading}
              hitSlop={8}
            >
              <Text style={styles.laterText}>Maybe later</Text>
            </Pressable>

            <Text style={styles.trustText}>
              <Lock size={11} color={colors.textDisabled} weight="fill" />
              {'  '}Powered by Lemon Squeezy · 14-day refund
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  headline: {
    ...typography.display,
    fontSize: 34,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subhead: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  featuresCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  featureRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.cyanWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: {
    fontSize: 18,
    color: colors.cyan,
    fontFamily: 'Inter_700Bold',
  },
  featureTextCol: { flex: 1, minWidth: 0 },
  featureTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  priceWrap: {
    marginBottom: spacing.xl,
    shadowColor: colors.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  priceCard: {
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: '#0B0E14',
    letterSpacing: -1,
  },
  priceUnit: {
    ...typography.bodyBold,
    color: '#0B0E14',
    marginTop: 4,
  },
  priceSub: {
    ...typography.caption,
    color: 'rgba(11,14,20,0.7)',
    marginTop: spacing.xs,
  },
  ctaWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cyan,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    width: '100%',
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    ...typography.button,
    fontSize: 17,
    color: '#0B0E14',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  laterText: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  trustText: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
