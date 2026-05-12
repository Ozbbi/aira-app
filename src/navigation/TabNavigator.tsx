import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Compass, ChartBar, UserCircle } from 'phosphor-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { haptics } from '../utils/haptics';
import { colors, typography, spacing, radius } from '../theme';
import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_DEFS = [
  { name: 'Dashboard' as const, label: 'Home', Icon: House },
  { name: 'Lessons' as const, label: 'Learn', Icon: Compass },
  { name: 'Progress' as const, label: 'Progress', Icon: ChartBar },
  { name: 'Profile' as const, label: 'Profile', Icon: UserCircle },
];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layoutsRef = useRef<{ x: number; width: number }[]>([]);
  const [layoutsReady, setLayoutsReady] = useState(false);

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  useEffect(() => {
    const target = layoutsRef.current[state.index];
    if (!target) return;
    indicatorX.value = withSpring(target.x, { damping: 18, stiffness: 240 });
    indicatorW.value = withTiming(target.width, { duration: 220 });
  }, [state.index, layoutsReady]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const onSlotLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layoutsRef.current[i] = { x, width };
    if (layoutsRef.current.filter(Boolean).length === state.routes.length) {
      setLayoutsReady(true);
      const t = layoutsRef.current[state.index];
      if (t) {
        indicatorX.value = t.x;
        indicatorW.value = t.width;
      }
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarHost, { paddingBottom: Math.max(insets.bottom, 12) + 18 }]}
    >
      <View style={styles.tabBar}>
        <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none">
          <View style={styles.indicatorPill} />
        </Animated.View>

        {state.routes.map((route, index) => {
          const def = TAB_DEFS.find((t) => t.name === route.name) ?? TAB_DEFS[0];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              haptics.select();
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLayout={onSlotLayout(index)}
              style={styles.tabSlot}
              accessibilityRole="button"
              accessibilityLabel={def.label}
            >
              <def.Icon
                size={24}
                weight={focused ? 'fill' : 'regular'}
                color={focused ? colors.cyan : colors.textDisabled}
              />
              <Text
                style={[styles.tabLabel, focused && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {def.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
      <Tab.Screen name="Lessons" component={LearnScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarHost: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    alignItems: 'stretch',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: 0,
  },
  indicatorPill: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 229, 229, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 229, 0.15)',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
    minHeight: 48,
  },
  tabLabel: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textDisabled,
  },
  tabLabelActive: {
    color: colors.cyan,
  },
});
