import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';

export { colors, typography, spacing, radius };

export const palette = colors;

export const gradients = {
  hero: ['#00B4D8', '#00E5E5'] as const,
  heroDark: ['#0B0E14', '#1A1F2E'] as const,
  lesson: ['#00E5E5', '#0B0E14'] as const,
  celebrate: ['#00E5E5', '#2ECC71', '#FF6B35'] as const,
  surface: ['#1A1F2E', '#242B3D'] as const,
  streak: ['#FF6B35', '#E74C3C'] as const,
} as const;

export const elevation = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cyanGlow: {
    shadowColor: '#00E5E5',
    shadowOpacity: 0.25,
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
