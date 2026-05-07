/**
 * AIRA design system — single source of truth.
 *
 * One file. Every screen pulls tokens from here. No more
 * per-screen color / font / spacing decisions.
 *
 * Built to satisfy the brief's demand for:
 *   - One primary palette (no rainbow chaos)
 *   - Strict typographic scale
 *   - Spacing scale on a 4px base
 *   - Consistent button hierarchy + radii
 *   - Card elevation rules
 *   - Touch-target safety (≥48 px)
 *
 * The legacy `src/theme/colors.ts`, `spacing.ts`, `typography.ts` still
 * exist for backwards compat — new code should import from here.
 */

// ─────────────────────────────────────────────────────────────────────────
// COLOUR PALETTE
// ─────────────────────────────────────────────────────────────────────────

/**
 * Primary palette — single brand colour with a soft glow variant.
 * Replaces the v8-v12 mix of cyan / pink / amber that felt random.
 */
export const palette = {
  // Brand
  brand: '#8B5CF6',         // primary action / focus / level chip
  brandSoft: '#C4B5FD',     // hover / selected / soft accent
  brandDeep: '#5B21B6',     // pressed state / dark surfaces
  brandWash: 'rgba(139, 92, 246, 0.12)', // tinted backgrounds

  // Surfaces (warm-black ladder)
  bg: '#0A0A0F',
  bgRaised: '#15121F',      // cards on top of bg
  bgRaised2: '#1E1B2D',     // cards on top of cards (modal, picker)
  bgPressed: '#26223A',     // momentary press state
  border: '#2A2A38',
  borderStrong: '#3A3A4C',

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#A8A8B8',
  textMuted: '#6B6B7E',
  textInverse: '#0A0A0F',   // text on light surfaces

  // Semantic — used sparingly, only for state feedback
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.14)',
  danger: '#FB7185',
  dangerSoft: 'rgba(251, 113, 133, 0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.14)',

  // Accent — only for celebrate / hero CTAs, never for chrome
  accentWarm: '#F59E0B',
  accentWarmSoft: 'rgba(245, 158, 11, 0.14)',

  // Streak fire (single dedicated colour, used everywhere a flame appears)
  streak: '#FB923C',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// GRADIENTS — only 3 official ones. Pick one.
// ─────────────────────────────────────────────────────────────────────────

export const gradients = {
  /** Primary CTA — replaces the v8 amber→pink→purple rainbow on Home hero. */
  hero: ['#7C3AED', '#A855F7'] as const,
  /** Celebration — confetti, level-up, capstone. */
  celebrate: ['#F59E0B', '#EC4899', '#8B5CF6'] as const,
  /** Soft surface gradient — cards that need a touch of life. */
  surface: ['#15121F', '#1E1B2D'] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// SPACING — 4px base unit
// ─────────────────────────────────────────────────────────────────────────

export const space = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,   // standard horizontal margin on mobile
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,  // minimum touch target
  '16': 64,
  '20': 80,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// RADII
// ─────────────────────────────────────────────────────────────────────────

export const radii = {
  xs: 6,
  sm: 10,
  md: 12,    // standard button + card
  lg: 16,    // hero cards
  xl: 24,
  full: 999,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY — strict scale, one font family per role
// ─────────────────────────────────────────────────────────────────────────

/**
 * Inter is loaded in App.tsx (400/500/600/700). Every text style here
 * uses Inter so there's no font flicker when SpaceGrotesk fails to load.
 *
 * Hierarchy (ratios stay close to 1.2 / 1.5):
 *   display    32 / 38   — onboarding heroes only
 *   headline   24 / 30   — section heads, screen titles
 *   title      18 / 24   — card titles
 *   body       16 / 24   — paragraphs
 *   bodySmall  14 / 20   — secondary paragraphs
 *   caption    13 / 18   — meta / timestamps
 *   label      11 / 14   — uppercase eyebrows (tracking 1.4)
 */
export const text = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyEmphasis: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// ELEVATION — shadow tokens for cards
// ─────────────────────────────────────────────────────────────────────────

export const elevation = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// SCREEN — common screen-level constants
// ─────────────────────────────────────────────────────────────────────────

export const screen = {
  /** Standard horizontal margin per the brief (16 px). */
  hPadding: space['4'],
  /** Bottom clearance for the floating tab bar (96 px tested across devices). */
  tabBarClearance: 96,
  /** Vertical gap between major sections on a screen. */
  sectionGap: space['6'],
} as const;

// ─────────────────────────────────────────────────────────────────────────
// TOUCH — accessibility minimums
// ─────────────────────────────────────────────────────────────────────────

export const touch = {
  /** Brief mandates ≥48px. */
  minTarget: 48,
} as const;
