export const typography = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
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
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  codeBold: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 14,
    lineHeight: 20,
  },

  // Legacy aliases
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  bodyEmphasis: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
} as const;
