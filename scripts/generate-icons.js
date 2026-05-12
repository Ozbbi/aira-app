/* eslint-disable no-console */
/**
 * Brand-asset generator — renders Ara 2.0 (the chubby fox mascot)
 * to PNG at every size the app needs.
 *
 * No external assets required. Pure SVG → PNG via sharp.
 *
 * Outputs:
 *   mascot.png          1024×1024  source-of-truth character (used in-app)
 *   icon.png            1024×1024  app icon (peach-gradient bg + fox)
 *   adaptive-icon.png   1024×1024  Android adaptive (tighter, safe-zone)
 *   splash-icon.png     1024×1024  splash logo
 *   splash.png          1284×2778  full splash with AIRA wordmark
 *   favicon.png         48×48      web
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'assets');

// Soft & Sweet palette — kept in sync with src/theme/colors.ts
const BG_WARM_WHITE = '#FFF9F5';
const PEACH = '#FFB997';
const PEACH_DARK = '#F2A07B';
const PEACH_LIGHT = '#FEE2D4';
const PINK = '#FF6B8A';
const PINK_SOFT = '#FFB8C9';
const WHITE_CREAM = '#FFF3EA';
const EYE_DOT = '#2D2D2D';
const NOSE = '#FF7A8A';
const ORANGE = '#FF8C42';

/**
 * Build the Ara fox as an SVG string. The viewBox is 120x120 (same as
 * the React component) and we scale it to whatever canvas size we
 * need. `withBackground` adds a brand-gradient background + soft halo
 * suitable for icon/splash use; without it the SVG is transparent
 * (for use as the in-app mascot.png).
 */
function foxSvg({ size, withBackground = false, withWordmark = false }) {
  const wordmark = withWordmark
    ? `<text
         x="${size / 2}"
         y="${size * 0.78}"
         text-anchor="middle"
         font-family="Nunito, Inter, system-ui, sans-serif"
         font-weight="800"
         font-size="${Math.round(size * 0.13)}"
         letter-spacing="${(size * 0.012).toFixed(2)}"
         fill="${ORANGE}">AIRA</text>`
    : '';

  const background = withBackground
    ? `
    <rect width="${size}" height="${size}" fill="url(#bgGradient)" />
    <ellipse cx="${size / 2}" cy="${size / 2}" rx="${size * 0.36}" ry="${size * 0.34}" fill="${PEACH_LIGHT}" opacity="0.65" />`
    : `<rect width="${size}" height="${size}" fill="transparent" />`;

  // Fox is drawn within a 120-unit virtual viewBox, scaled to fit
  // the visible area. We use the SVG's own viewBox to handle scaling.
  const verticalShift = withWordmark ? -size * 0.10 : 0;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bgGradient" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="${BG_WARM_WHITE}" />
      <stop offset="100%" stop-color="${PEACH_LIGHT}" />
    </radialGradient>
    <radialGradient id="bodyG" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${PEACH}" />
      <stop offset="80%" stop-color="${PEACH}" />
      <stop offset="100%" stop-color="${PEACH_DARK}" />
    </radialGradient>
    <radialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.18)" />
      <stop offset="1" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>

  ${background}

  <g transform="translate(${size * 0.5 - size * 0.4}, ${size * 0.5 - size * 0.4 + verticalShift}) scale(${size * 0.8 / 120})">
    ${foxBody()}
  </g>

  ${wordmark}
</svg>`;
}

function foxBody() {
  // Returns the fox as SVG, anchored to a 120x120 box.
  return `
    <!-- Ground shadow -->
    <ellipse cx="60" cy="108" rx="28" ry="3.5" fill="url(#dropShadow)" />

    <!-- Tail (drawn before body so it sits behind) -->
    <g>
      <path d="M 88 78 C 102 60 118 64 112 80 C 108 92 96 94 88 86 Z"
            fill="${PEACH}" stroke="${PEACH_DARK}" stroke-width="1.5" />
      <path d="M 110 70 C 116 70 118 76 112 80 C 108 80 106 76 110 70 Z" fill="${WHITE_CREAM}" />
    </g>

    <!-- Body -->
    <ellipse cx="60" cy="80" rx="30" ry="22" fill="url(#bodyG)" />
    <ellipse cx="60" cy="88" rx="16" ry="10" fill="${WHITE_CREAM}" />

    <!-- Left ear -->
    <g>
      <path d="M 36 22 L 30 46 L 50 42 Z" fill="${PEACH}" stroke="${PEACH_DARK}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M 38 28 L 36 42 L 46 41 Z" fill="${PINK_SOFT}" />
    </g>

    <!-- Right ear -->
    <g>
      <path d="M 84 22 L 90 46 L 70 42 Z" fill="${PEACH}" stroke="${PEACH_DARK}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M 82 28 L 84 42 L 74 41 Z" fill="${PINK_SOFT}" />
    </g>

    <!-- Head -->
    <ellipse cx="60" cy="52" rx="28" ry="26" fill="url(#bodyG)" stroke="${PEACH_DARK}" stroke-width="1.5" />
    <ellipse cx="48" cy="42" rx="9" ry="5" fill="#FFFFFF" fill-opacity="0.35" />

    <!-- Muzzle -->
    <ellipse cx="60" cy="63" rx="15" ry="10" fill="${WHITE_CREAM}" />

    <!-- Cheek blush -->
    <circle cx="42" cy="60" r="4" fill="${PINK_SOFT}" fill-opacity="0.7" />
    <circle cx="78" cy="60" r="4" fill="${PINK_SOFT}" fill-opacity="0.7" />

    <!-- Eyes (calm/happy) -->
    <circle cx="49" cy="50" r="4.6" fill="#FFFFFF" />
    <circle cx="71" cy="50" r="4.6" fill="#FFFFFF" />
    <circle cx="49" cy="51" r="2" fill="${EYE_DOT}" />
    <circle cx="71" cy="51" r="2" fill="${EYE_DOT}" />
    <circle cx="50.4" cy="49.6" r="0.9" fill="#FFFFFF" />
    <circle cx="72.4" cy="49.6" r="0.9" fill="#FFFFFF" />

    <!-- Nose -->
    <path d="M 56 60 L 64 60 L 60 65 Z" fill="${NOSE}" />

    <!-- Smile -->
    <path d="M 55 68 Q 60 73 65 68" stroke="${EYE_DOT}" stroke-width="2.2" fill="none" stroke-linecap="round" />
  `;
}

async function render(svg, outFile, w, h) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(w, h, { fit: 'cover' })
    .png()
    .toFile(outFile);
  const { size } = fs.statSync(outFile);
  console.log(`  ${path.basename(outFile)}  ${w}×${h}  (${(size / 1024).toFixed(1)} kB)`);
}

(async () => {
  console.log('Rendering Ara 2.0 brand assets:');

  // Transparent mascot.png — used by the in-app <AiraMascot /> only
  // if someone forces an Image fallback. Our component is now full-SVG
  // so this is mostly a brand artefact, but keeping it makes the
  // mascot show up in the legacy AiraOrb / AiraCharacter shims that
  // might still call require('mascot.png').
  await render(foxSvg({ size: 1024, withBackground: false }),
    path.join(OUT, 'mascot.png'), 1024, 1024);

  // App icons + splash — peach-gradient background
  await render(foxSvg({ size: 1024, withBackground: true }),
    path.join(OUT, 'icon.png'), 1024, 1024);
  await render(foxSvg({ size: 1024, withBackground: true }),
    path.join(OUT, 'adaptive-icon.png'), 1024, 1024);
  await render(foxSvg({ size: 1024, withBackground: true }),
    path.join(OUT, 'splash-icon.png'), 1024, 1024);
  await render(foxSvg({ size: 1284, withBackground: true, withWordmark: true }),
    path.join(OUT, 'splash.png'), 1284, 2778);
  await render(foxSvg({ size: 256, withBackground: true }),
    path.join(OUT, 'favicon.png'), 48, 48);

  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
