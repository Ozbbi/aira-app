// Typography system aligned to AIRA design spec.
// Keep line heights at ~1.2x for headings, ~1.5x for body so text breathes
// without feeling too airy on small screens.
export const typography = {
  // Marketing/welcome screens
  display: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  // Section heads, hero card titles
  headline: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  // Card titles, lesson titles
  title: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  // Default paragraph text
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyBold: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  // Helper / secondary
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
  // Uppercase eyebrows on cards ("NEXT LESSON", "WELCOME BACK")
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  // --- Aliases kept for backward-compat with components written against the
  // older naming. Remove once those screens are migrated. ---
  h1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
} as const;
