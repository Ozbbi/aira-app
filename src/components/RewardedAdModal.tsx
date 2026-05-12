import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  registerAdRequestListener,
  unregisterAdRequestListener,
  AD_COUNTDOWN_SECONDS,
  type AdResult,
  type AdReward,
} from '../services/adService';
import { palette, radii, space, text, elevation, gradients } from '../theme/system';
import { Button } from './Button';
import { AiraMascot } from './AiraMascot';

/**
 * Mock rewarded ad screen.
 *
 * Mounted once at the root of the app (in AppBootstrap below the
 * navigator). Subscribes to the ad-service event bus. When the service
 * fires `showRewardedAd()`, this modal renders, counts down 15 seconds,
 * lets the user close early (no reward) or wait the full duration and
 * tap "Claim Reward". Either way the modal resolves the service's
 * pending promise.
 *
 * The 5-second early-close grace gives users a "skip" path without
 * being abusive — past 5 s the close button appears and tapping it
 * dismisses with rewarded=false, reason='user_closed'.
 */
export function RewardedAdModal() {
  const [visible, setVisible] = useState(false);
  const [reward, setReward] = useState<AdReward | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AD_COUNTDOWN_SECONDS);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const resolveRef = useRef<((r: AdResult) => void) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(0);

  // Subscribe to ad requests
  useEffect(() => {
    registerAdRequestListener((req) => {
      setReward(req.reward);
      setSecondsLeft(AD_COUNTDOWN_SECONDS);
      setShowCloseBtn(false);
      setShowClaim(false);
      resolveRef.current = req.resolve;
      setVisible(true);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: AD_COUNTDOWN_SECONDS * 1000,
        easing: Easing.linear,
      });
    });
    return () => unregisterAdRequestListener();
  }, [progress]);

  // Countdown ticker
  useEffect(() => {
    if (!visible) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setShowClaim(true);
          return 0;
        }
        if (s <= AD_COUNTDOWN_SECONDS - 5) setShowCloseBtn(true);
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  // Android hardware-back blocks during ad (forces use of the close button
  // after the 5s grace, mirroring how real ad SDKs behave).
  useEffect(() => {
    if (!visible) return;
    const handler = () => {
      if (showCloseBtn) closeWithoutReward();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [visible, showCloseBtn]);

  const resolveAndClose = useCallback((result: AdResult) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setVisible(false);
  }, []);

  const closeWithoutReward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    resolveAndClose({ rewarded: false, reason: 'user_closed' });
  }, [resolveAndClose]);

  const claimReward = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    resolveAndClose({ rewarded: true, reward: reward ?? { type: 'heart', amount: 1 } });
  }, [resolveAndClose, reward]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as `${number}%` }));

  if (!visible || !reward) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(220)} style={[styles.card, elevation.lg]}>
          <Text style={styles.eyebrow}>SPONSORED</Text>
          <Text style={styles.headline}>
            Earn {reward.amount} {reward.type === 'heart' ? 'heart' : reward.type}
          </Text>
          <Text style={styles.sub}>Watch a short ad to top up.</Text>

          {/* Mascot reacts */}
          <View style={styles.mascotWrap}>
            <AiraMascot size={120} mood="thinking" />
          </View>

          {/* Countdown */}
          <View style={styles.countdownRow}>
            <Text style={styles.countdownText}>
              {showClaim ? 'Ready' : `${secondsLeft}s`}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, fillStyle]}>
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {showClaim ? (
              <Button
                label="Claim reward"
                onPress={claimReward}
                variant="primary"
                size="lg"
                fullWidth
                trailingIcon="check"
                hapticOnPress="success"
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Hold tight…</Text>
              </View>
            )}

            {showCloseBtn ? (
              <Pressable onPress={closeWithoutReward} hitSlop={8} style={styles.skipBtn}>
                <Text style={styles.skipText}>Close (no reward)</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    paddingHorizontal: space['5'],
  },
  card: {
    backgroundColor: palette.bgRaised,
    borderRadius: radii.xl,
    borderColor: palette.border,
    borderWidth: 1,
    padding: space['6'],
    alignItems: 'center',
  },
  eyebrow: { ...text.label, color: palette.textMuted, marginBottom: space['2'] },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    ...text.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: space['1'],
  },
  mascotWrap: { marginVertical: space['5'] },
  countdownRow: { alignItems: 'center', marginBottom: space['2'] },
  countdownText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: palette.brandSoft,
    letterSpacing: -0.5,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radii.full,
    backgroundColor: palette.bgRaised2,
    overflow: 'hidden',
    marginBottom: space['5'],
  },
  progressFill: { height: '100%', borderRadius: radii.full, overflow: 'hidden' },
  actions: { width: '100%', alignItems: 'center', gap: space['3'] },
  placeholder: {
    height: 56,
    borderRadius: radii.md,
    backgroundColor: palette.bgRaised2,
    borderColor: palette.border,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { ...text.button, color: palette.textMuted },
  skipBtn: { paddingVertical: space['2'] },
  skipText: { ...text.caption, color: palette.textMuted },
});
