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
 * Build an SVG of the AIRA mark.
 * @param {object} opts
 * @param {number} opts.size       canvas square edge (px)
 * @param {number} [opts.markScale] mark size as a fraction of canvas (0..1)
 * @param {boolean} [opts.withWordmark] adds "AIRA" text under the mark
 */
function airaSvg({ size, markScale = 0.7, withWordmark = false }) {
  const cx = size / 2;
  // Vertical centre is shifted up when the wordmark is present so the whole
  // composition sits in the optical centre of the canvas.
  const cy = withWordmark ? size * 0.42 : size / 2;

  // Bounding box of the mark
  const markH = size * markScale;
  const markW = markH * 0.95;
  const top = cy - markH / 2;
  const bottom = cy + markH / 2;
  const apexX = cx;
  const apexY = top;

  // Stroke geometry — each leg is a trapezoid.
  // Stroke thickness is ~22% of mark height — bold enough to read at 48 px.
  const strokeT = markH * 0.22;
  const baseHalf = markW / 2;

  // Left stroke trapezoid corners
  const lOuterB = `${apexX - baseHalf},${bottom}`;
  const lInnerB = `${apexX - baseHalf + strokeT},${bottom}`;
  const lInnerT = `${apexX - strokeT * 0.45},${apexY + strokeT * 0.6}`;
  const lOuterT = `${apexX - strokeT * 0.95},${apexY + strokeT * 1.5}`;
  const leftStroke = `${lOuterB} ${lInnerB} ${lInnerT} ${lOuterT}`;

  // Right stroke (mirror)
  const rOuterB = `${apexX + baseHalf},${bottom}`;
  const rInnerB = `${apexX + baseHalf - strokeT},${bottom}`;
  const rInnerT = `${apexX + strokeT * 0.45},${apexY + strokeT * 0.6}`;
  const rOuterT = `${apexX + strokeT * 0.95},${apexY + strokeT * 1.5}`;
  const rightStroke = `${rOuterB} ${rInnerB} ${rInnerT} ${rOuterT}`;

  // The orb sits just above the apex, slightly inset so it visually "caps" the wedge.
  const orbR = strokeT * 0.85;
  const orbCx = apexX;
  const orbCy = apexY + strokeT * 0.2;
  const glowR = orbR * 1.9;

  // Wordmark
  const wordmark = withWordmark
    ? `<text
         x="${cx}"
         y="${size * 0.78}"
         text-anchor="middle"
         font-family="Space Grotesk, Inter, system-ui, sans-serif"
         font-weight="700"
         font-size="${Math.round(size * 0.105)}"
         letter-spacing="${(size * 0.012).toFixed(2)}"
         fill="url(#wordmarkGradient)">AIRA</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Wedge fill: cyan apex → violet base, mirrors orb gradient -->
    <linearGradient id="wedgeGradient" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%"   stop-color="#9FE3FF" />
      <stop offset="35%"  stop-color="#4FC3F7" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <!-- Inner highlight on each stroke for tactile depth -->
    <linearGradient id="strokeHighlight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.18)" />
      <stop offset="40%"  stop-color="rgba(255,255,255,0)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.18)" />
    </linearGradient>
    <!-- Orb: bright core falls to violet edge -->
    <radialGradient id="orbGradient" cx="38%" cy="32%" r="75%">
      <stop offset="0%"   stop-color="#FFFFFF" />
      <stop offset="25%"  stop-color="#9FE3FF" />
      <stop offset="65%"  stop-color="#4FC3F7" />
      <stop offset="100%" stop-color="#B388FF" />
    </radialGradient>
    <!-- Outer halo around the orb -->
    <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#B388FF" stop-opacity="0.55" />
      <stop offset="55%"  stop-color="#8B5CF6" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" />
    </radialGradient>
    <!-- Wordmark gradient (cool white → cool lavender) -->
    <linearGradient id="wordmarkGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#C4B5FD" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${BG}" />

  <!-- Soft ambient glow behind the whole mark -->
  <circle cx="${cx}" cy="${cy}" r="${markH * 0.55}" fill="url(#orbGlow)" opacity="0.4" />

  <!-- Left + right wedge strokes -->
  <polygon points="${leftStroke}"  fill="url(#wedgeGradient)" />
  <polygon points="${leftStroke}"  fill="url(#strokeHighlight)" opacity="0.55" />
  <polygon points="${rightStroke}" fill="url(#wedgeGradient)" />
  <polygon points="${rightStroke}" fill="url(#strokeHighlight)" opacity="0.55" />

  <!-- Orb halo + orb -->
  <circle cx="${orbCx}" cy="${orbCy}" r="${glowR}" fill="url(#orbGlow)" />
  <circle cx="${orbCx}" cy="${orbCy}" r="${orbR}" fill="url(#orbGradient)" />
  <ellipse
    cx="${orbCx - orbR * 0.32}"
    cy="${orbCy - orbR * 0.38}"
    rx="${orbR * 0.28}"
    ry="${orbR * 0.18}"
    fill="rgba(255,255,255,0.65)" />

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
