/* eslint-disable no-console */
/**
 * AIRA brand assets — renders the mascot character to PNG at every size
 * the app needs.
 *
 * The mascot here is the same character users see inside the app
 * (src/components/AiraMascot.tsx) — rounded squircle body in a vertical
 * cyan→purple gradient, big expressive eyes, soft cheek blush, gentle
 * smile, sparkles for the splash variant. Same character on the icon,
 * splash, and inside the app. One brand, one face.
 *
 * Sizes:
 *   icon.png            1024  Android/iOS app icon (full bleed)
 *   adaptive-icon.png   1024  Android adaptive — tighter, safe-zone
 *   splash-icon.png     1024  used by expo-splash-screen
 *   splash.png          1284×2778  full splash with wordmark
 *   favicon.png         48    web tab
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'assets');
const BG = '#0A0A0F';

function mascotSvg({ size, bg = BG, scale = 0.7, withWordmark = false, sparkles = false }) {
  const cx = size / 2;
  const cy = withWordmark ? size * 0.42 : size / 2;
  const s = size * scale; // mascot edge in px
  const half = s / 2;

  // Map 120-unit mascot coords → canvas
  // Each mascot unit = (s / 120) px, offset by (cx-half, cy-half).
  const u = (n) => (n * s) / 120;
  const X = (n) => cx - half + u(n);
  const Y = (n) => cy - half + u(n);

  const wordmark = withWordmark
    ? `<text
         x="${cx}"
         y="${size * 0.80}"
         text-anchor="middle"
         font-family="Space Grotesk, Inter, system-ui, sans-serif"
         font-weight="700"
         font-size="${Math.round(size * 0.108)}"
         letter-spacing="${(size * 0.014).toFixed(2)}"
         fill="url(#wm)">AIRA</text>`
    : '';

  const sparkleSvg = sparkles
    ? `
    <path d="M ${X(20)} ${Y(28)} l ${u(2)} ${-u(6)} l ${u(2)} ${u(6)} l ${u(6)} ${u(2)} l ${-u(6)} ${u(2)} l ${-u(2)} ${u(6)} l ${-u(2)} ${-u(6)} l ${-u(6)} ${-u(2)} z" fill="#FFD86B" />
    <path d="M ${X(96)} ${Y(30)} l ${u(1.4)} ${-u(4)} l ${u(1.4)} ${u(4)} l ${u(4)} ${u(1.4)} l ${-u(4)} ${u(1.4)} l ${-u(1.4)} ${u(4)} l ${-u(1.4)} ${-u(4)} l ${-u(4)} ${-u(1.4)} z" fill="#FFD86B" />
    <path d="M ${X(100)} ${Y(94)} l ${u(1.6)} ${-u(5)} l ${u(1.6)} ${u(5)} l ${u(5)} ${u(1.6)} l ${-u(5)} ${u(1.6)} l ${-u(1.6)} ${u(5)} l ${-u(1.6)} ${-u(5)} l ${-u(5)} ${-u(1.6)} z" fill="#FFD86B" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="body" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%"   stop-color="#6FD4FB" />
      <stop offset="55%"  stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#B388FF" />
    </linearGradient>
    <linearGradient id="shine" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.45)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#B388FF" stop-opacity="0.5" />
      <stop offset="60%"  stop-color="#8B5CF6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FF8FB1" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#FF8FB1" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="wm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#C4B5FD" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${bg}" />

  <!-- Halo -->
  <circle cx="${cx}" cy="${cy}" r="${half * 1.05}" fill="url(#halo)" />

  <!-- Antennae with glowing tips -->
  <path d="M ${X(46)} ${Y(26)} Q ${X(42)} ${Y(14)} ${X(38)} ${Y(8)}"
        stroke="url(#body)" stroke-width="${u(2.6)}" stroke-linecap="round" fill="none" />
  <path d="M ${X(74)} ${Y(26)} Q ${X(78)} ${Y(14)} ${X(82)} ${Y(8)}"
        stroke="url(#body)" stroke-width="${u(2.6)}" stroke-linecap="round" fill="none" />
  <circle cx="${X(38)}" cy="${Y(8)}" r="${u(3.8)}" fill="#FFD86B" />
  <circle cx="${X(38)}" cy="${Y(8)}" r="${u(2.2)}" fill="#FFFFFF" />
  <circle cx="${X(82)}" cy="${Y(8)}" r="${u(3.8)}" fill="#FFD86B" />
  <circle cx="${X(82)}" cy="${Y(8)}" r="${u(2.2)}" fill="#FFFFFF" />

  <!-- Body -->
  <path d="M ${X(60)} ${Y(22)}
           C ${X(88)} ${Y(22)} ${X(96)} ${Y(34)} ${X(96)} ${Y(60)}
           C ${X(96)} ${Y(86)} ${X(82)} ${Y(96)} ${X(60)} ${Y(96)}
           C ${X(38)} ${Y(96)} ${X(24)} ${Y(86)} ${X(24)} ${Y(60)}
           C ${X(24)} ${Y(34)} ${X(32)} ${Y(22)} ${X(60)} ${Y(22)} Z"
        fill="url(#body)" />

  <!-- Top shine -->
  <path d="M ${X(36)} ${Y(32)}
           C ${X(44)} ${Y(26)} ${X(76)} ${Y(26)} ${X(84)} ${Y(32)}
           C ${X(80)} ${Y(38)} ${X(60)} ${Y(40)} ${X(60)} ${Y(40)}
           C ${X(60)} ${Y(40)} ${X(40)} ${Y(38)} ${X(36)} ${Y(32)} Z"
        fill="url(#shine)" opacity="0.55" />

  <!-- Cheeks -->
  <circle cx="${X(36)}" cy="${Y(68)}" r="${u(7)}" fill="url(#cheek)" />
  <circle cx="${X(84)}" cy="${Y(68)}" r="${u(7)}" fill="url(#cheek)" />

  <!-- Eyes (calm/celebrating-style for icon) -->
  <ellipse cx="${X(46)}" cy="${Y(58)}" rx="${u(7)}" ry="${u(8)}" fill="#FFFFFF" />
  <ellipse cx="${X(74)}" cy="${Y(58)}" rx="${u(7)}" ry="${u(8)}" fill="#FFFFFF" />
  <circle cx="${X(47)}" cy="${Y(59)}" r="${u(3.6)}" fill="#0F1020" />
  <circle cx="${X(75)}" cy="${Y(59)}" r="${u(3.6)}" fill="#0F1020" />
  <circle cx="${X(48.5)}" cy="${Y(56)}" r="${u(1.4)}" fill="#FFFFFF" />
  <circle cx="${X(76.5)}" cy="${Y(56)}" r="${u(1.4)}" fill="#FFFFFF" />

  <!-- Smile -->
  <path d="M ${X(48)} ${Y(74)} Q ${X(60)} ${Y(82)} ${X(72)} ${Y(74)}"
        stroke="#0F1020" stroke-width="${u(2.8)}" stroke-linecap="round" fill="none" />

  <!-- Signature sparkle -->
  <path d="M ${X(104)} ${Y(80)} l ${u(1.8)} ${-u(5)} l ${u(1.8)} ${u(5)} l ${u(5)} ${u(1.8)} l ${-u(5)} ${u(1.8)} l ${-u(1.8)} ${u(5)} l ${-u(1.8)} ${-u(5)} l ${-u(5)} ${-u(1.8)} z" fill="#FFD86B" />

  ${sparkleSvg}
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
  console.log('Rendering AIRA mascot brand assets:');

  await render(mascotSvg({ size: 1024, scale: 0.74, sparkles: false }),
    path.join(OUT, 'icon.png'), 1024, 1024);
  await render(mascotSvg({ size: 1024, scale: 0.58, sparkles: false }),
    path.join(OUT, 'adaptive-icon.png'), 1024, 1024);
  await render(mascotSvg({ size: 1024, scale: 0.66, sparkles: true }),
    path.join(OUT, 'splash-icon.png'), 1024, 1024);
  await render(mascotSvg({ size: 1284, scale: 0.46, withWordmark: true, sparkles: true }),
    path.join(OUT, 'splash.png'), 1284, 2778);
  await render(mascotSvg({ size: 256, scale: 0.84 }),
    path.join(OUT, 'favicon.png'), 48, 48);

  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
