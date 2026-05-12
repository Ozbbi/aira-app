import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';

export { colors, typography, spacing, radius };

export const palette = colors;

/**
 * Soft & Sweet gradients.
 * Hero (Sweet Orange → Peach) used for primary CTAs and Home hero.
 */
export const gradients = {
  hero: ['#FF8C42', '#FFB997'] as const,
  heroDark: ['#FFF9F5', '#FEE2D4'] as const, // warm white fade (no actual dark anymore)
  lesson: ['#FFB997', '#FF8C42'] as const,
  celebrate: ['#FF8C42', '#FF6B8A', '#7BC89C'] as const, // orange → pink → mint
  surface: ['#FFFFFF', '#FFF3EA'] as const,
  streak: ['#FF8C42', '#FF6B8A'] as const,
} as const;

/**
 * Light-mode shadows — soft and subtle. Pure black at high opacity looks
 * harsh on a warm-white background, so we cut shadow strength ~5x from
 * the dark theme.
 */
export const elevation = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** Branded glow — kept name for backwards compat; now peach-tinted. */
  cyanGlow: {
    shadowColor: '#FF8C42',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

export const text = typography;

export const space = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
} as const;

export const radii = radius;

export const screen = {
  hPadding: 16,
  tabBarClearance: 100,
  sectionGap: 24,
} as const;

export const touch = {
  minTarget: 48,
} as const;
