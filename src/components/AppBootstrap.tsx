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
  const setOnline = useUserStore((s) => s.setOnline);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    // Check backend health
    const healthy = await checkHealth();
    setOnline(healthy);

    if (healthy) {
      // Try to fetch existing user from backend
      const user = await fetchExistingUser();
      if (user) {
        setUser({
          userId: user.userId ?? (user as unknown as { id: string }).id,
          name: user.name,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          tier: user.tier,
          lessonsCompletedToday: user.lessonsCompletedToday,
          totalLessonsCompleted: user.totalLessonsCompleted,
        });
      }
    }
    // If not healthy, zustand persist will have last-known values

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
