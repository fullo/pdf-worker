/**
 * Generate PWA icons from SVG.
 * Run: node scripts/generate-icons.mjs
 * Requires: sharp (npm install -D sharp)
 */
import { writeFileSync } from 'fs';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a5f"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <text x="256" y="200" text-anchor="middle" font-size="120" fill="white" opacity="0.9">🔧</text>
  <text x="256" y="320" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="800" fill="white">PDF</text>
  <text x="256" y="400" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="400" fill="#94a3b8">Worker</text>
</svg>`;

const buffer = Buffer.from(svg);

for (const size of [192, 512]) {
    const png = await sharp(buffer).resize(size, size).png().toBuffer();
    writeFileSync(`public/icons/icon-${size}.png`, png);
    console.log(`Created icon-${size}.png`);
}
