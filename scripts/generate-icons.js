/* eslint-disable no-console */
/**
 * AIRA brand mark — generates all the icon/splash PNGs from a single SVG.
 *
 * Mark anatomy:
 *   • A bold geometric Λ (lambda / peak) — two trapezoidal strokes leaning
 *     inward, NO horizontal crossbar. Distinctive, reads as "A" without
 *     looking like every generic A-letter logo. Hints at ascent, peaks,
 *     thought rising.
 *   • A bright luminous orb seated at the apex, exactly where the eye
 *     wants to land. Cyan-to-violet radial gradient + outer glow ring.
 *   • Wedge fill: vertical gradient cyan → violet matches the orb so
 *     the whole mark feels like a single object, not a clip-art mashup.
 *   • Subtle inner highlight on each stroke for tactile depth at large
 *     sizes; falls away to a flat silhouette at 48 px favicons.
 *
 * Sizes produced:
 *   icon.png            1024×1024  (full bleed, 70% mark)
 *   adaptive-icon.png   1024×1024  (54% mark — Android safe-zone)
 *   splash-icon.png     1024×1024  (60% mark, used by expo-splash-screen)
 *   splash.png          1284×2778  (mark centred + AIRA wordmark)
 *   favicon.png         48×48      (web)
 *
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'assets');
const BG = '#0A0A0F';

/**
 * Build an SVG of the AIRA "A" mark.
 *
 * Anatomy: a bold geometric capital A. Two thick diagonal legs meeting at
 * the apex, a stout horizontal crossbar, no negative-space cleverness. The
 * fill is a vertical brand gradient (cyan → purple → violet) so the letter
 * itself carries the brand colour without needing extra orbs or glyphs.
 * A subtle ambient glow sits behind the letter for depth.
 */
function airaSvg({ size, markScale = 0.7, withWordmark = false }) {
  const cx = size / 2;
  const cy = withWordmark ? size * 0.42 : size / 2;

  // Bounding box of the mark
  const markH = size * markScale;
  const markW = markH * 0.92;
  const top = cy - markH / 2;
  const bottom = cy + markH / 2;
  const apexX = cx;

  // Stroke geometry. Thicker strokes read better at favicon size.
  const legT = markH * 0.20; // diagonal leg thickness
  const baseHalf = markW / 2;
  const apexY = top + legT * 0.45; // tuck apex down slightly so corners aren't sharp at the edge

  // Apex top vertices (small flat top instead of needle-sharp point — looks
  // more like a real geometric letterform, less like a triangle).
  const apexHalf = legT * 0.42;

  // LEFT LEG polygon corners (clockwise from outer-bottom)
  const ll = [
    `${apexX - baseHalf},${bottom}`,                // outer bottom-left
    `${apexX - baseHalf + legT * 1.05},${bottom}`,  // inner bottom-left
    `${apexX - apexHalf * 0.4},${apexY + legT}`,    // inner near top
    `${apexX - apexHalf},${apexY}`,                 // top inner
    `${apexX - apexHalf * 1.4},${apexY}`,           // top outer
  ].join(' ');

  // RIGHT LEG polygon (mirror)
  const rl = [
    `${apexX + baseHalf},${bottom}`,
    `${apexX + baseHalf - legT * 1.05},${bottom}`,
    `${apexX + apexHalf * 0.4},${apexY + legT}`,
    `${apexX + apexHalf},${apexY}`,
    `${apexX + apexHalf * 1.4},${apexY}`,
  ].join(' ');

  // CROSSBAR — full-width box with rounded corners that visually "rests"
  // between the legs at ~62% down.
  const crossY = top + markH * 0.62;
  const crossH = legT * 0.85;
  const crossInsetFromLeg = legT * 0.5;
  const xLeft = apexX - baseHalf + (crossY - apexY) * (baseHalf - apexHalf) / (bottom - apexY) - crossInsetFromLeg;
  const xRight = apexX + baseHalf - (crossY - apexY) * (baseHalf - apexHalf) / (bottom - apexY) + crossInsetFromLeg;
  const crossX = Math.max(apexX - markW * 0.32, xLeft + legT * 0.7);
  const crossW = Math.min(markW * 0.64, xRight - crossX - legT * 0.7);

  const wordmark = withWordmark
    ? `<text
         x="${cx}"
         y="${size * 0.79}"
         text-anchor="middle"
         font-family="Space Grotesk, Inter, system-ui, sans-serif"
         font-weight="700"
         font-size="${Math.round(size * 0.11)}"
         letter-spacing="${(size * 0.014).toFixed(2)}"
         fill="url(#wordmarkGradient)">AIRA</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Brand gradient: cyan top → AIRA core purple → violet bottom -->
    <linearGradient id="aGradient" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%"   stop-color="#4FC3F7" />
      <stop offset="50%"  stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#B388FF" />
    </linearGradient>
    <!-- Subtle inner highlight along the left edge of each leg -->
    <linearGradient id="legShine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.22)" />
      <stop offset="35%"  stop-color="rgba(255,255,255,0)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.20)" />
    </linearGradient>
    <!-- Soft ambient halo behind the letter -->
    <radialGradient id="ambient" cx="50%" cy="50%" r="60%">
      <stop offset="0%"   stop-color="#8B5CF6" stop-opacity="0.30" />
      <stop offset="60%"  stop-color="#8B5CF6" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="wordmarkGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#C4B5FD" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${BG}" />

  <!-- Ambient halo -->
  <ellipse cx="${cx}" cy="${cy}" rx="${markW * 0.65}" ry="${markH * 0.62}" fill="url(#ambient)" />

  <!-- Letter A -->
  <polygon points="${ll}" fill="url(#aGradient)" />
  <polygon points="${ll}" fill="url(#legShine)" opacity="0.6" />

  <polygon points="${rl}" fill="url(#aGradient)" />
  <polygon points="${rl}" fill="url(#legShine)" opacity="0.6" />

  <!-- Crossbar -->
  <rect
    x="${crossX}"
    y="${crossY}"
    width="${crossW}"
    height="${crossH}"
    rx="${crossH * 0.32}"
    ry="${crossH * 0.32}"
    fill="url(#aGradient)" />

  ${wordmark}
</svg>`;
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
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  console.log('Rendering AIRA brand assets:');

  await render(airaSvg({ size: 1024, markScale: 0.70 }),
    path.join(OUT, 'icon.png'), 1024, 1024);
  await render(airaSvg({ size: 1024, markScale: 0.54 }),
    path.join(OUT, 'adaptive-icon.png'), 1024, 1024);
  await render(airaSvg({ size: 1024, markScale: 0.60 }),
    path.join(OUT, 'splash-icon.png'), 1024, 1024);
  await render(airaSvg({ size: 1284, markScale: 0.42, withWordmark: true }),
    path.join(OUT, 'splash.png'), 1284, 2778);
  await render(airaSvg({ size: 256, markScale: 0.78 }),
    path.join(OUT, 'favicon.png'), 48, 48);

  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
