/* eslint-disable no-console */
/**
 * Brand assets — composite the user-supplied mascot.png onto AIRA's
 * warm-black canvas at every size the app needs.
 *
 * Replaces the previous procedural-SVG renderer because the user's
 * mascot is now an artist-drawn PNG that SVG can't approximate.
 *
 * Inputs:
 *   assets/mascot.png   the character (transparent background ideal)
 *
 * Outputs:
 *   icon.png            1024x1024  Android/iOS app icon (75% scale)
 *   adaptive-icon.png   1024x1024  Android adaptive — tighter (60%)
 *   splash-icon.png     1024x1024  expo-splash-screen icon (66%)
 *   splash.png          1284x2778  full splash + AIRA wordmark
 *   favicon.png         48x48      web tab
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'assets');
const MASCOT_SRC = path.resolve(OUT, 'mascot.png');
const BG = '#0A0A0F'; // warm-black brand background
// Splash text colour at the bottom of the splash hero.
const WORDMARK_HEX = '#FFFFFF';

if (!fs.existsSync(MASCOT_SRC)) {
  console.error(`[generate-icons] missing input: ${MASCOT_SRC}`);
  console.error('Drop your mascot art at mobile/assets/mascot.png and re-run.');
  process.exit(1);
}

/**
 * Composite the mascot onto a square brand-coloured canvas.
 *  - canvasSize: edge of the square output (px)
 *  - mascotScale: fraction of canvas the mascot occupies (0..1)
 *  - withWordmark: also stamps an "AIRA" wordmark below the mascot
 */
async function buildSquare({ canvasSize, mascotScale, outFile, withWordmark = false }) {
  const mascotPx = Math.round(canvasSize * mascotScale);
  // Mascot is centred horizontally; vertically shifted up a bit when
  // there's a wordmark beneath it.
  const verticalOffset = withWordmark ? -Math.round(canvasSize * 0.06) : 0;

  // Resize the mascot keeping aspect ratio + transparent background.
  const mascot = await sharp(MASCOT_SRC)
    .resize(mascotPx, mascotPx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Build the layers we'll composite onto the base canvas
  const composites = [
    {
      input: mascot,
      gravity: 'center',
      top: Math.round((canvasSize - mascotPx) / 2 + verticalOffset),
      left: Math.round((canvasSize - mascotPx) / 2),
    },
  ];

  if (withWordmark) {
    // Render an SVG wordmark at the right size, then composite.
    const wordSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${Math.round(canvasSize * 0.16)}">
        <text
          x="${canvasSize / 2}"
          y="${Math.round(canvasSize * 0.12)}"
          text-anchor="middle"
          font-family="Space Grotesk, Inter, system-ui, sans-serif"
          font-weight="700"
          font-size="${Math.round(canvasSize * 0.105)}"
          letter-spacing="${(canvasSize * 0.014).toFixed(2)}"
          fill="${WORDMARK_HEX}">AIRA</text>
      </svg>`;
    const wordPng = await sharp(Buffer.from(wordSvg)).png().toBuffer();
    composites.push({
      input: wordPng,
      top: Math.round(canvasSize * 0.74),
      left: 0,
    });
  }

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: BG,
    },
  })
    .composite(composites)
    .png()
    .toFile(outFile);

  const { size } = fs.statSync(outFile);
  console.log(`  ${path.basename(outFile)}  ${canvasSize}x${canvasSize}  (${(size / 1024).toFixed(1)} kB)`);
}

/**
 * Splash for tall mobile canvases (1284x2778). Mascot centred, wordmark
 * underneath. Same warm-black background.
 */
async function buildSplash({ width, height, mascotScale, outFile }) {
  const mascotPx = Math.round(width * mascotScale);
  const mascot = await sharp(MASCOT_SRC)
    .resize(mascotPx, mascotPx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const wordSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(width * 0.18)}">
      <text
        x="${width / 2}"
        y="${Math.round(width * 0.13)}"
        text-anchor="middle"
        font-family="Space Grotesk, Inter, system-ui, sans-serif"
        font-weight="700"
        font-size="${Math.round(width * 0.115)}"
        letter-spacing="${(width * 0.015).toFixed(2)}"
        fill="${WORDMARK_HEX}">AIRA</text>
    </svg>`;
  const wordPng = await sharp(Buffer.from(wordSvg)).png().toBuffer();

  // Vertically centre the mascot at ~42% of height, wordmark below.
  const mascotTop = Math.round(height * 0.42 - mascotPx / 2);
  const wordTop = Math.round(height * 0.42 + mascotPx / 2 + height * 0.01);

  await sharp({
    create: { width, height, channels: 4, background: BG },
  })
    .composite([
      { input: mascot, top: mascotTop, left: Math.round((width - mascotPx) / 2) },
      { input: wordPng, top: wordTop, left: 0 },
    ])
    .png()
    .toFile(outFile);

  const { size } = fs.statSync(outFile);
  console.log(`  ${path.basename(outFile)}  ${width}x${height}  (${(size / 1024).toFixed(1)} kB)`);
}

(async () => {
  console.log('Compositing AIRA brand assets from assets/mascot.png:');

  await buildSquare({ canvasSize: 1024, mascotScale: 0.78, outFile: path.join(OUT, 'icon.png') });
  await buildSquare({ canvasSize: 1024, mascotScale: 0.62, outFile: path.join(OUT, 'adaptive-icon.png') });
  await buildSquare({ canvasSize: 1024, mascotScale: 0.70, outFile: path.join(OUT, 'splash-icon.png') });
  await buildSplash({ width: 1284, height: 2778, mascotScale: 0.46, outFile: path.join(OUT, 'splash.png') });
  await buildSquare({ canvasSize: 256, mascotScale: 0.86, outFile: path.join(OUT, 'favicon.png') });

  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
