import React, { useEffect } from 'react';
import { Text, StyleSheet, View, Pressable, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, radius, spacing, typography } from '../theme';
import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

// One source of truth so the bar and the indicator pill stay in lock-step.
const TAB_DEFS = [
  { name: 'Dashboard', label: 'Home', glyph: '🏠' },
  { name: 'Lessons', label: 'Lessons', glyph: '📚' },
  { name: 'Journey', label: 'Journey', glyph: '🗺️' },
  { name: 'Learn', label: 'Learn', glyph: '💡' },
  { name: 'Profile', label: 'You', glyph: '👤' },
] as const;

/**
 * Custom floating tab bar. The active-tab pill is a separately-positioned
 * Animated.View that springs to the tapped tab's slot, so the indicator
 * slides smoothly between tabs instead of flicker-rendering on every press.
 */
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const tabCount = state.routes.length;
  const indicatorX = useSharedValue(state.index);

  useEffect(() => {
    indicatorX.value = withSpring(state.index, { damping: 18, stiffness: 240 });
  }, [state.index, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${indicatorX.value * 100}%` as `${number}%` }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.tabBarHost}>
      <View style={styles.tabBar}>
        {/* Sliding gradient pill behind the active icon */}
        <View style={[styles.indicatorTrack, { width: `${100 / tabCount}%` }]}>
          <Animated.View style={[styles.indicatorMover, indicatorStyle]}>
            <LinearGradient
              colors={['rgba(139,92,246,0.35)', 'rgba(196,181,253,0.18)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicatorPill}
            />
          </Animated.View>
        </View>

        {state.routes.map((route, index) => {
          const def = TAB_DEFS.find((t) => t.name === route.name) ?? TAB_DEFS[0];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptics.select();
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabSlot} accessibilityRole="button">
              <TabIcon glyph={def.glyph} focused={focused} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
                {def.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  const scale = useSharedValue(focused ? 1.1 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.55);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, { damping: 14, stiffness: 260 });
    opacity.value = withTiming(focused ? 1 : 0.55, { duration: 180 });
  }, [focused, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={styles.tabIcon}>{glyph}</Text>
    </Animated.View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Lessons" component={LearningMapScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const BAR_HORIZONTAL_INSET = 12;
const BAR_BOTTOM = Platform.select({ ios: 24, android: 16, default: 16 });

const styles = StyleSheet.create({
  tabBarHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: BAR_BOTTOM,
    paddingHorizontal: BAR_HORIZONTAL_INSET,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    // Soft elevation: shadow on iOS, elevation on Android
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  indicatorTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: spacing.xs,
  },
  indicatorMover: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  indicatorPill: {
    flex: 1,
    borderRadius: radius.full,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
});
