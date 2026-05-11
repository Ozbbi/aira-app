import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../navigation/RootNavigator';
import { AiraOrb } from './AiraOrb';
import { fetchExistingUser } from '../services/userService';
import { checkHealth } from '../api/client';
import { useUserStore } from '../store/userStore';
import { colors } from '../theme';

export function AppBootstrap() {
  const [ready, setReady] = useState(false);
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    // STEP 1: Wait for zustand-persist to finish rehydrating from AsyncStorage
    // before we let RootNavigator read userId. Without this, initialRouteName
    // is computed against the empty initial state and every cold-start lands
    // back on Onboarding even when there's a saved userId.
    if (!useUserStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsub = useUserStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }

    // STEP 2: Try the backend, but don't block the UI on it. Render's free
    // tier sleeps and a cold start can take 30s. We give it 4 seconds, then
    // fall through using the persisted state.
    const HEALTH_TIMEOUT_MS = 4000;
    const healthy = await Promise.race([
      checkHealth(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), HEALTH_TIMEOUT_MS)),
    ]);
    if (healthy) {
      try {
        const user = await fetchExistingUser();
        if (user) {
          setUser({
            userId: user.userId ?? (user as unknown as { id: string }).id,
            name: user.name,
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            tier: (user.tier as 'free' | 'pro') || 'free',
            totalLessonsCompleted: user.totalLessonsCompleted,
            isOnline: true,
          });
        }
      } catch {
        // Network blip — keep the persisted state, move on.
      }
    }

    setReady(true);
  };

  if (!ready) {
    return (
      <View style={styles.splash}>
        <AiraOrb size={100} intensity="thinking" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});
