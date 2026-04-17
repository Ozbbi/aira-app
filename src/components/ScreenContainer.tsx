import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  /** Optional RefreshControl props for pull-to-refresh on scroll screens. */
  refreshControl?: React.ReactElement<RefreshControlProps, typeof RefreshControl>;
}

/**
 * Shared screen shell.
 *
 * Adds a very subtle radial-ish gradient behind every screen so the dark UI
 * has more depth than a flat black background. Two diagonal linear gradients
 * fake a soft top-left glow (where the AIRA accent lives) — cheaper than
 * a real radial gradient but visually 90% there.
 */
export function ScreenContainer({
  children,
  scroll = false,
  style,
  padded = true,
  refreshControl,
}: ScreenContainerProps) {
  const content = (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.container, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );

  const background = (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(124, 58, 237, 0.08)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0, 0, 0, 0)', 'rgba(59, 130, 246, 0.05)']}
        start={{ x: 0.2, y: 0.4 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );

  if (scroll) {
    return (
      <View style={styles.scroll}>
        {background}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.scroll}>
      {background}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
