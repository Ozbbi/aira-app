/**
 * AIRA — Soft & Sweet theme (light mode).
 *
 * Every key in this file is referenced by some screen somewhere in the
 * app. The previous theme was a warm-black dark mode; this is a warm-
 * white light mode with peach accents.
 *
 * To switch back to dark mode, this is the only file that needs to
 * change — every screen reads from these tokens.
 */
export const colors = {
  // ── Surfaces ──
  bg: '#FFF9F5',          // warm white background
  cardSurface: '#FFFFFF', // primary card surface
  elevated: '#FFFFFF',    // elevated/modal surface
  divider: '#F0E0D6',     // very light peach divider

  // ── Brand accents ──
  /** Sweet Orange — primary CTA, active states, progress bars. */
  cyan: '#FF8C42',                            // renamed semantically but key kept
  cyanGlow: 'rgba(255, 140, 66, 0.18)',
  cyanWash: 'rgba(255, 140, 66, 0.08)',
  /** Blush Pink — hearts, streak flame, secondary highlights. */
  orange: '#FF6B8A',
  orangeGlow: 'rgba(255, 107, 138, 0.18)',

  // ── Semantic ──
  success: '#7BC89C',
  successSoft: 'rgba(123, 200, 156, 0.14)',
  error: '#F27E7E',
  errorSoft: 'rgba(242, 126, 126, 0.14)',

  // ── Text ──
  textPrimary: '#2D2D2D',
  textSecondary: '#8A8A8A',
  textDisabled: '#B8B8B8',

  // ── Track colours (kept warm and pastel) ──
  trackFoundations: '#FF8C42', // sweet orange
  trackCritical:    '#FF6B8A', // blush pink
  trackPower:       '#7BC89C', // soft mint
  trackTools:       '#F5C26B', // warm honey
  trackCode:        '#A78BFA', // soft violet
  trackCreators:    '#FFB997', // peach
  trackMaster:      '#F5A361', // tangerine

  // ── Legacy aliases — every screen that used dark tokens stays working ──
  bgCard:        '#FFFFFF',
  bgCardHover:   '#FFF3EA',
  bgElevated:    '#FFFFFF',
  bgRaised:      '#FFFFFF',
  bgRaised2:     '#FFF3EA',
  border:        '#FEE2D4', // soft peach border
  airaGlow:      '#FF8C42',
  airaCore:      '#FF8C42',
  airaPro:       '#A78BFA',
  brand:         '#FF8C42',
  brandSoft:     'rgba(255, 140, 66, 0.18)',
  purple:        '#A78BFA',
  warning:       '#F5A361',
  danger:        '#F27E7E',
  dangerSoft:    'rgba(242, 126, 126, 0.14)',
  textMuted:     '#B8B8B8',

  // ── Gradients ──
  // hero gradient — peach to blush. Used on Home hero, primary CTAs.
  gradientPrimary: ['#FF8C42', '#FFB997'] as readonly [string, string],
  gradientAccent:  ['#FF8C42', '#FF6B8A'] as readonly [string, string],
  gradientSuccess: ['#7BC89C', '#A8DCBE'] as readonly [string, string],
  gradientLesson:  ['#FFB997', '#FF8C42'] as readonly [string, string],
  gradientXp:      ['#FF8C42', '#F5A361'] as readonly [string, string],
  gradientPro:     ['#A78BFA', '#FF6B8A'] as readonly [string, string],
} as const;
