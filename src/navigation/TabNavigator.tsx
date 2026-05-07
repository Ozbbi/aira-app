import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LearningMapScreen } from '../screens/LearningMapScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { haptics } from '../utils/haptics';
import { colors, radius, spacing, typography } from '../theme';
import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

// 4 tabs (per the design-system brief). Journey was redundant with the
// new Learn tab's skill tree; Library content is now folded into the
// Home feed; Progress is split out from Profile to make stats and
// achievements first-class.
const TAB_DEFS = [
  { name: 'Dashboard', label: 'Home',     glyph: '🏠' },
  { name: 'Lessons',   label: 'Learn',    glyph: '📚' },
  { name: 'Progress',  label: 'Progress', glyph: '📈' },
  { name: 'Profile',   label: 'Profile',  glyph: '👤' },
] as const;

/**
 * Floating tab bar with a sliding gradient pill behind the active tab.
 *
 * Indicator alignment: each tab slot reports its on-screen x and width via
 * onLayout. The pill is a single absolute-positioned element that springs
 * to those exact coordinates, which means it's always pixel-perfectly
 * centred no matter what layout/safe-area math the OS gives us.
 *
 * Bottom inset: we add the safe-area inset to the bottom margin so the bar
 * floats above Samsung's gesture pill / iPhone home indicator, instead of
 * being interleaved with them (which was stealing taps on Samsungs).
 */
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Per-slot measured geometry. Stored in a ref so we don't re-render on
  // every layout pass — only the indicator's shared values are reactive.
  const layoutsRef = useRef<{ x: number; width: number }[]>([]);
  const [layoutsReady, setLayoutsReady] = useState(false);

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  // Re-target the indicator whenever the active tab or layouts change.
  useEffect(() => {
    const target = layoutsRef.current[state.index];
    if (!target) return;
    indicatorX.value = withSpring(target.x, { damping: 18, stiffness: 240 });
    indicatorW.value = withTiming(target.width, { duration: 220 });
  }, [state.index, layoutsReady, indicatorX, indicatorW]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const onSlotLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layoutsRef.current[i] = { x, width };
    // Once we've measured every slot, kick the indicator to its current
    // active position (covers first paint).
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
      // Extra-tall bottom on Samsung devices: their gesture pill sits a
      // few px above the screen edge and the OS reserves area below it
      // that React Native's safe-area inset doesn't always account for.
      // Adding a fixed +18 here ensures the floating bar always clears it.
      style={[styles.tabBarHost, { paddingBottom: Math.max(insets.bottom, 12) + 18 }]}
    >
      <View style={styles.tabBar}>
        <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(139,92,246,0.45)', 'rgba(196,181,253,0.18)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.indicatorPill}
          />
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
              <TabIcon glyph={def.glyph} focused={focused} />
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

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  const scale = useSharedValue(focused ? 1.12 : 1);
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

/**
 * Horizontal swipe between sibling tabs.
 *
 * v9 had this and starved touch events. v12 brings it back with much
 * tighter thresholds that let scroll/tap gestures win:
 *
 *   activeOffsetX([-30, 30])  — need 30px of horizontal movement before
 *                                swipe activates (was 25 in v9)
 *   failOffsetY([-12, 12])    — gesture FAILS as soon as vertical motion
 *                                exceeds 12px (was 30 in v9). This is
 *                                the key difference: vertical scrolls
 *                                claim the responder almost immediately.
 *
 * Net effect: only deliberate, mostly-horizontal gestures swipe between
 * tabs. Casual scrolls and taps pass through cleanly.
 */
export function TabNavigator() {
  const swipeRef = useRef<{ navigation: any; index: number } | null>(null);

  const goRelative = (delta: number) => {
    const ctx = swipeRef.current;
    if (!ctx) return;
    const next = ctx.index + delta;
    if (next < 0 || next >= TAB_DEFS.length) return;
    haptics.select();
    ctx.navigation.navigate(TAB_DEFS[next].name);
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      'worklet';
      // Sanity guard: never fire if vertical motion was significant.
      if (Math.abs(e.translationY) > 40) return;
      // Need clearly more horizontal than vertical motion.
      if (Math.abs(e.translationX) < 60) return;
      if (Math.abs(e.translationY) > Math.abs(e.translationX) * 0.6) return;
      if (e.translationX < -60) runOnJS(goRelative)(1);
      else if (e.translationX > 60) runOnJS(goRelative)(-1);
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.fill}>
        <Tab.Navigator
          tabBar={(props) => {
            // Bridge for the swipe handler — fresh tab state every render.
            swipeRef.current = { navigation: props.navigation, index: props.state.index };
            return <FloatingTabBar {...props} />;
          }}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: colors.bg },
          }}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Lessons" component={LearningMapScreen} />
          <Tab.Screen name="Progress" component={ProgressScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabBarHost: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    alignItems: 'stretch',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
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
