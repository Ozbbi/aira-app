/* eslint-disable no-console */
/**
 * AIRA brand assets — same character as the in-app AiraMascot, layered up
 * for "Canva-quality" depth: drop shadow → halo → antennae → body main →
 * bottom shading → top highlight cap → left rim light → cheeks → eyes →
 * mouth → signature sparkle.
 *
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'assets');
const BG = '#0A0A0F';

function mascotSvg({ size, scale = 0.74, withWordmark = false, sparkles = false }) {
  const cx = size / 2;
  const cy = withWordmark ? size * 0.42 : size / 2;
  const s = size * scale;
  const half = s / 2;
  // 140-unit mascot grid → canvas
  const u = (n) => (n * s) / 140;
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

  const extraSparkles = sparkles
    ? `
    <path d="M ${X(16)} ${Y(40)} l ${u(2)} ${-u(7)} l ${u(2)} ${u(7)} l ${u(7)} ${u(2)} l ${-u(7)} ${u(2)} l ${-u(2)} ${u(7)} l ${-u(2)} ${-u(7)} l ${-u(7)} ${-u(2)} z" fill="#FFD86B" />
    <path d="M ${X(110)} ${Y(30)} l ${u(1.6)} ${-u(5)} l ${u(1.6)} ${u(5)} l ${u(5)} ${u(1.6)} l ${-u(5)} ${u(1.6)} l ${-u(1.6)} ${u(5)} l ${-u(1.6)} ${-u(5)} l ${-u(5)} ${-u(1.6)} z" fill="#FFE998" />
    <path d="M ${X(24)} ${Y(110)} l ${u(1.4)} ${-u(4)} l ${u(1.4)} ${u(4)} l ${u(4)} ${u(1.4)} l ${-u(4)} ${u(1.4)} l ${-u(1.4)} ${u(4)} l ${-u(1.4)} ${-u(4)} l ${-u(4)} ${-u(1.4)} z" fill="#FFD86B" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Body main: 4-stop vertical gradient -->
    <linearGradient id="bodyMain" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0"    stop-color="#7DD8FF" />
      <stop offset="0.35" stop-color="#6366F1" />
      <stop offset="0.7"  stop-color="#8B5CF6" />
      <stop offset="1"    stop-color="#C4B5FD" />
    </linearGradient>
    <linearGradient id="bottomShade" x1="0.5" y1="0.55" x2="0.5" y2="1">
      <stop offset="0" stop-color="rgba(15,8,40,0)" />
      <stop offset="1" stop-color="rgba(15,8,40,0.32)" />
    </linearGradient>
    <linearGradient id="topCap" x1="0.5" y1="0" x2="0.5" y2="0.55">
      <stop offset="0" stop-color="rgba(255,255,255,0.45)" />
      <stop offset="1" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <linearGradient id="rimLight" x1="0" y1="0.5" x2="1" y2="0.5">
      <stop offset="0" stop-color="rgba(255,255,255,0.55)" />
      <stop offset="0.18" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#B388FF" stop-opacity="0.55" />
      <stop offset="0.55" stop-color="#8B5CF6" stop-opacity="0.18" />
      <stop offset="1" stop-color="#8B5CF6" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="dropShadow" cx="50%" cy="50%" r="50%" fy="50%">
      <stop offset="0" stop-color="rgba(0,0,0,0.45)" />
      <stop offset="1" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#FF8FB1" stop-opacity="0.78" />
      <stop offset="0.55" stop-color="#FF8FB1" stop-opacity="0.28" />
      <stop offset="1" stop-color="#FF8FB1" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sclera" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="#FFFFFF" />
      <stop offset="1" stop-color="#E8ECFA" />
    </linearGradient>
    <linearGradient id="pupil" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="#1A1530" />
      <stop offset="1" stop-color="#0A0814" />
    </linearGradient>
    <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#FFE998" />
      <stop offset="0.55" stop-color="#FFD86B" />
      <stop offset="1" stop-color="rgba(255,216,107,0)" />
    </radialGradient>
    <linearGradient id="wm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF" />
      <stop offset="1" stop-color="#C4B5FD" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${BG}" />

  <!-- Drop shadow -->
  <ellipse cx="${X(70)}" cy="${Y(124)}" rx="${u(38)}" ry="${u(6)}" fill="url(#dropShadow)" />

  <!-- Halo -->
  <circle cx="${X(70)}" cy="${Y(68)}" r="${u(62)}" fill="url(#halo)" />

  <!-- Antennae stems -->
  <path d="M ${X(54)} ${Y(32)} Q ${X(48)} ${Y(18)} ${X(44)} ${Y(10)}"
        stroke="#8B5CF6" stroke-width="${u(3)}" stroke-linecap="round" fill="none" />
  <path d="M ${X(86)} ${Y(32)} Q ${X(92)} ${Y(18)} ${X(96)} ${Y(10)}"
        stroke="#8B5CF6" stroke-width="${u(3)}" stroke-linecap="round" fill="none" />
  <!-- Antenna tips: glow ring + core + highlight -->
  <circle cx="${X(44)}" cy="${Y(10)}" r="${u(9)}" fill="url(#tipGlow)" />
  <circle cx="${X(44)}" cy="${Y(10)}" r="${u(4.4)}" fill="#FFD86B" />
  <circle cx="${X(44)}" cy="${Y(10)}" r="${u(2.6)}" fill="#FFFFFF" />
  <circle cx="${X(96)}" cy="${Y(10)}" r="${u(9)}" fill="url(#tipGlow)" />
  <circle cx="${X(96)}" cy="${Y(10)}" r="${u(4.4)}" fill="#FFD86B" />
  <circle cx="${X(96)}" cy="${Y(10)}" r="${u(2.6)}" fill="#FFFFFF" />

  <!-- Body main -->
  <path d="M ${X(70)} ${Y(28)}
           C ${X(100)} ${Y(28)} ${X(110)} ${Y(42)} ${X(110)} ${Y(70)}
           C ${X(110)} ${Y(98)} ${X(92)} ${Y(110)} ${X(70)} ${Y(110)}
           C ${X(48)} ${Y(110)} ${X(30)} ${Y(98)} ${X(30)} ${Y(70)}
           C ${X(30)} ${Y(42)} ${X(40)} ${Y(28)} ${X(70)} ${Y(28)} Z"
        fill="url(#bodyMain)" />
  <!-- Bottom inner shadow -->
  <path d="M ${X(70)} ${Y(28)}
           C ${X(100)} ${Y(28)} ${X(110)} ${Y(42)} ${X(110)} ${Y(70)}
           C ${X(110)} ${Y(98)} ${X(92)} ${Y(110)} ${X(70)} ${Y(110)}
           C ${X(48)} ${Y(110)} ${X(30)} ${Y(98)} ${X(30)} ${Y(70)}
           C ${X(30)} ${Y(42)} ${X(40)} ${Y(28)} ${X(70)} ${Y(28)} Z"
        fill="url(#bottomShade)" />
  <!-- Top highlight cap -->
  <path d="M ${X(70)} ${Y(28)}
           C ${X(100)} ${Y(28)} ${X(110)} ${Y(42)} ${X(110)} ${Y(70)}
           L ${X(110)} ${Y(50)}
           C ${X(110)} ${Y(36)} ${X(96)} ${Y(28)} ${X(70)} ${Y(28)} Z"
        fill="url(#topCap)" opacity="0.85" />
  <!-- Left rim light -->
  <path d="M ${X(70)} ${Y(28)}
           C ${X(48)} ${Y(28)} ${X(30)} ${Y(42)} ${X(30)} ${Y(70)}
           C ${X(30)} ${Y(98)} ${X(48)} ${Y(110)} ${X(70)} ${Y(110)}
           L ${X(70)} ${Y(28)} Z"
        fill="url(#rimLight)" opacity="0.6" />

  <!-- Cheeks -->
  <circle cx="${X(40)}" cy="${Y(78)}" r="${u(9)}" fill="url(#cheek)" />
  <circle cx="${X(100)}" cy="${Y(78)}" r="${u(9)}" fill="url(#cheek)" />

  <!-- Eyes (calm + bright for icon) -->
  <ellipse cx="${X(54)}" cy="${Y(68)}" rx="${u(8.5)}" ry="${u(9.5)}" fill="url(#sclera)" />
  <ellipse cx="${X(86)}" cy="${Y(68)}" rx="${u(8.5)}" ry="${u(9.5)}" fill="url(#sclera)" />
  <circle cx="${X(55)}" cy="${Y(69)}" r="${u(4.4)}" fill="url(#pupil)" />
  <circle cx="${X(87)}" cy="${Y(69)}" r="${u(4.4)}" fill="url(#pupil)" />
  <circle cx="${X(56.5)}" cy="${Y(66)}" r="${u(1.6)}" fill="#FFFFFF" />
  <circle cx="${X(53.5)}" cy="${Y(71)}" r="${u(0.9)}" fill="#FFFFFF" opacity="0.8" />
  <circle cx="${X(88.5)}" cy="${Y(66)}" r="${u(1.6)}" fill="#FFFFFF" />
  <circle cx="${X(85.5)}" cy="${Y(71)}" r="${u(0.9)}" fill="#FFFFFF" opacity="0.8" />

  <!-- Smile -->
  <path d="M ${X(58)} ${Y(84)} Q ${X(70)} ${Y(92)} ${X(82)} ${Y(84)}"
        stroke="#1A1530" stroke-width="${u(3)}" stroke-linecap="round" fill="none" />

  <!-- Signature sparkle -->
  <path d="M ${X(120)} ${Y(92)} l ${u(2)} ${-u(6)} l ${u(2)} ${u(6)} l ${u(6)} ${u(2)} l ${-u(6)} ${u(2)} l ${-u(2)} ${u(6)} l ${-u(2)} ${-u(6)} l ${-u(6)} ${-u(2)} z" fill="#FFD86B" />

  ${extraSparkles}
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

  await render(mascotSvg({ size: 1024, scale: 0.74 }),
    path.join(OUT, 'icon.png'), 1024, 1024);
  await render(mascotSvg({ size: 1024, scale: 0.58 }),
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
