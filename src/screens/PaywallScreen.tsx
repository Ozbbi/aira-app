import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { AiraCharacter } from '../components/AiraCharacter';
import { colors, radius, spacing } from '../theme';
import { useUserStore } from '../store/userStore';
import { createCheckout, getUser } from '../api/client';
import type { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
}

const tracks = [
  { id: 'foundations', name: 'Foundations', icon: '🌱', unlocked: true },
  { id: 'critical', name: 'Critical Thinking', icon: '🧠', unlocked: false },
  { id: 'power', name: 'Power User', icon: '⚡', unlocked: false },
  { id: 'tools', name: 'Tools & Taste', icon: '🛠️', unlocked: false },
  { id: 'creators', name: 'AI for Creators', icon: '✨', unlocked: false },
  { id: 'master', name: 'The AI Master', icon: '🏆', unlocked: false },
];

export function PaywallScreen({ navigation }: Props) {
  const userId = useUserStore((s) => s.userId);
  const upgradeTier = useUserStore((s) => s.upgradeTier);
  const [loading, setLoading] = useState(false);
  const [unlockedIndex, setUnlockedIndex] = useState(0);

  useEffect(() => {
    // Stagger unlock animation
    const interval = setInterval(() => {
      setUnlockedIndex((prev) => {
        if (prev < tracks.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  async function handleUpgrade() {
    if (!userId || loading) return;
    if (Platform.OS as string !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setLoading(true);
    try {
      const { url } = await createCheckout(userId);
      if (Platform.OS as string === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
        return;
      }
      await WebBrowser.openBrowserAsync(url);
      try {
        const fresh = await getUser(userId);
        if (fresh.tier === 'pro') {
          upgradeTier();
          if (Platform.OS as string !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          navigation.goBack();
        }
      } catch {
        // Non-fatal
      }
    } catch (err) {
      if (Platform.OS as string !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Checkout unavailable', 'Could not start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <AiraCharacter mood="proud" size={140} />
        <Text style={styles.headline}>You're ready for the good stuff.</Text>
        <Text style={styles.subhead}>Demo's over. Let's make you dangerous with AI.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.featuresSection}>
        {tracks.map((track, index) => (
          <Animated.View
            key={track.id}
            entering={FadeInDown.duration(400).delay(300 + index * 100)}
            style={[
              styles.trackCard,
              index <= unlockedIndex && styles.trackCardUnlocked,
            ]}
          >
            <Text style={styles.trackIcon}>{track.icon}</Text>
            <Text style={styles.trackName}>{track.name}</Text>
            {index <= unlockedIndex ? (
              <Text style={styles.trackStatus}>✓ Unlocked</Text>
            ) : (
              <Text style={styles.trackStatus}>🔒 Locked</Text>
            )}
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.priceSection}>
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>$9.99 — one time. Yours forever.</Text>
          <Text style={styles.priceSub}>No subscription. No renewals. Support a solo builder.</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.trustSection}>
        <Text style={styles.trustText}>Powered by Lemon Squeezy · Secure · 14-day refund</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(800)} style={styles.buttonSection}>
        <MotiView
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            loop: true,
            duration: 3000,
          }}
        >
          <Pressable
            style={[styles.upgradeButton, loading && styles.upgradeButtonDisabled]}
            onPress={handleUpgrade}
            disabled={loading}
          >
            <LinearGradient colors={colors.gradientPro} style={styles.upgradeGradient}>
              <Text style={styles.upgradeButtonText}>
                {loading ? 'Opening checkout...' : 'Upgrade to Pro'}
              </Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
        <Pressable
          onPress={() => {
            if (Platform.OS as string !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.goBack();
          }}
          disabled={loading}
        >
          <Text style={styles.laterText}>Maybe later</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subhead: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  featuresSection: {
    padding: spacing.lg,
  },
  trackCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  trackCardUnlocked: {
    borderColor: colors.airaPro,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  trackIcon: {
    fontSize: 32,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.lg,
  },
  trackStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceSection: {
    padding: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  priceSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  trustSection: {
    padding: spacing.lg,
  },
  trustText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  buttonSection: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  upgradeButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    width: '100%',
  },
  upgradeButtonDisabled: {
    opacity: 0.5,
  },
  upgradeGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  laterText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
