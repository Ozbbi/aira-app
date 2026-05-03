import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LearningMapScreen } from '../screens/LearningMapScreen';
import { JourneyScreen } from '../screens/JourneyScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { haptics } from '../utils/haptics';
import { colors, typography, spacing } from '../theme';
import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

interface AnimIconProps {
  focused: boolean;
  color: string;
  glyph: string;
}

function AnimatedTabIcon({ focused, color, glyph }: AnimIconProps) {
  const scale = useSharedValue(focused ? 1.1 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 14, stiffness: 260 });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 180 });
  }, [focused]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={[styles.tabIcon, { color }]}>{glyph}</Text>
    </Animated.View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.airaCore,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
      screenListeners={{
        tabPress: () => {
          haptics.select();
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} glyph="🏠" />
          ),
        }}
      />
      <Tab.Screen
        name="Lessons"
        component={LearningMapScreen}
        options={{
          tabBarLabel: 'Lessons',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} glyph="📚" />
          ),
        }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarLabel: 'Journey',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} glyph="🗺️" />
          ),
        }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} glyph="💡" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'You',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} glyph="👤" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  tabIcon: {
    fontSize: 20,
  },
});
