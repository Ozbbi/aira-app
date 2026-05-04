/* eslint-disable no-console */
/**
 * Programmatically renders the AIRA brand assets to PNG so we don't ship
 * a placeholder "A" letter to the Play Store.
 *
 *   icon.png            1024x1024  app icon (full bleed orb on warm-black)
 *   adaptive-icon.png   1024x1024  Android adaptive icon foreground
 *                                  (orb shrunk to 66% to stay inside the
 *                                  Android safe-zone — the OS adds a
 *                                  background colour)
 *   favicon.png         48x48      web favicon
 *   splash.png          1284x2778  iPhone Pro Max splash (Expo letterboxes
 *                                  it appropriately on every other device)
 *
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'assets');
const BG = '#0A0A0F';

// Reusable orb SVG. We accept a target size and a scale factor so we can
// reuse it for the full-bleed icon, the adaptive icon's safe area, and the
// splash hero.
function orbSvg({ size, scale = 0.6, withText = false }) {
  const orbR = (size / 2) * scale;
  const cx = size / 2;
  const cy = withText ? size * 0.42 : size / 2;
  // Outer glow: a larger soft ring at ~30% opacity, 1.2x the orb radius.
  const glowR = orbR * 1.2;
  // Highlight: small white circle top-left of orb for 3D feel.
  const hiR = orbR * 0.22;
  const hiCx = cx - orbR * 0.35;
  const hiCy = cy - orbR * 0.35;

  const text = withText
    ? `<text
         x="${cx}"
         y="${size * 0.78}"
         text-anchor="middle"
         font-family="Space Grotesk, Inter, sans-serif"
         font-weight="700"
         font-size="${Math.round(size * 0.11)}"
         letter-spacing="${Math.round(size * 0.011)}"
         fill="url(#textGradient)">AIRA</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="orbGradient" cx="35%" cy="35%" r="75%">
      <stop offset="0%"  stop-color="#9FE3FF" />
      <stop offset="40%" stop-color="#4FC3F7" />
      <stop offset="100%" stop-color="#B388FF" />
    </radialGradient>
    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="#B388FF" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#8B5CF6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="textGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#FAFAFA" />
      <stop offset="100%" stop-color="#C4B5FD" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}" />
  <circle cx="${cx}" cy="${cy}" r="${glowR}" fill="url(#glowGradient)" />
  <circle cx="${cx}" cy="${cy}" r="${orbR}" fill="url(#orbGradient)" />
  <ellipse cx="${hiCx}" cy="${hiCy}" rx="${hiR}" ry="${hiR * 0.7}" fill="rgba(255,255,255,0.45)" />
  ${text}
</svg>`;
}

async function render(svg, outFile, width, height) {
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 384 })
    .resize(width, height, { fit: 'cover' })
    .png()
    .toFile(outFile);
  const { size } = fs.statSync(outFile);
  console.log(`  ${path.basename(outFile)}  ${width}x${height}  (${(size / 1024).toFixed(1)} kB)`);
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  console.log('Generating AIRA brand assets:');

  // App icon: orb fills 60% of canvas
  await render(orbSvg({ size: 1024, scale: 0.6 }),
    path.join(OUT, 'icon.png'), 1024, 1024);

  // Adaptive icon foreground: orb at 66% safe-area scale
  // (Android trims edges, so we keep the orb tighter)
  await render(orbSvg({ size: 1024, scale: 0.5 }),
    path.join(OUT, 'adaptive-icon.png'), 1024, 1024);

  // Splash icon used by expo-splash-screen
  await render(orbSvg({ size: 1024, scale: 0.55 }),
    path.join(OUT, 'splash-icon.png'), 1024, 1024);

  // Full splash (orb + AIRA wordmark)
  await render(orbSvg({ size: 1284, scale: 0.42, withText: true }),
    path.join(OUT, 'splash.png'), 1284, 2778);

  // Favicon
  await render(orbSvg({ size: 256, scale: 0.7 }),
    path.join(OUT, 'favicon.png'), 48, 48);

  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
