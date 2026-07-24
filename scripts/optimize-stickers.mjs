// Sticker art ships as 1254px PNGs (~700KB each, 117MB total) but can never
// render larger than MAX_CUSTOM_STICKER_SCALE (1.3) x the ~306px card surface
// = 398px CSS, i.e. ~796 device pixels on a DPR-2 screen or a 2x export.
//
// 896px therefore has more pixels than the largest sticker the app permits, so
// there is no visible loss at any zoom the UI allows — including pinching a
// sticker to the 1.3 cap. WebP keeps the alpha channel these charms need.
//
//   node scripts/optimize-stickers.mjs          convert what's missing/stale
//   node scripts/optimize-stickers.mjs --force  rebuild everything
//
// Idempotent: a .webp newer than its .png is left alone.

import sharp from "sharp";
import { readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, extname, dirname, relative } from "node:path";

// PNG masters live OUTSIDE public/ so the 140MB never ships or deploys; only
// the generated WebP goes into public/fanid-themes/, mirroring the same tree.
const SRC = "design/sticker-src";
const OUT = "public/fanid-themes";
const EDGE = 896;          // see the reasoning above — do not lower without redoing that maths
const QUALITY = 84;
const ALPHA_QUALITY = 90;
const force = process.argv.includes("--force");

function pngsUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pngsUnder(full));
    else if (extname(entry.name).toLowerCase() === ".png") out.push(full);
  }
  return out;
}

if (!existsSync(SRC)) {
  console.error(`No PNG masters at ${SRC}/ — nothing to convert.`);
  console.error(`They are intentionally outside public/; restore them there to re-run.`);
  process.exit(1);
}

const files = pngsUnder(SRC);
let converted = 0, skipped = 0, pngBytes = 0, webpBytes = 0;

for (const png of files) {
  // mirror design/sticker-src/<...>.png -> public/fanid-themes/<...>.webp
  const webp = join(OUT, relative(SRC, png)).replace(/\.png$/i, ".webp");
  mkdirSync(dirname(webp), { recursive: true });
  const pngStat = statSync(png);
  pngBytes += pngStat.size;

  if (!force && existsSync(webp) && statSync(webp).mtimeMs >= pngStat.mtimeMs) {
    webpBytes += statSync(webp).size;
    skipped++;
    continue;
  }

  // `inside` never enlarges, so art already smaller than EDGE is left at its
  // own resolution rather than being upscaled into a bigger file.
  await sharp(png)
    .resize(EDGE, EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, alphaQuality: ALPHA_QUALITY, effort: 5 })
    .toFile(webp);

  webpBytes += statSync(webp).size;
  converted++;
}

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`converted ${converted}, skipped ${skipped}, of ${files.length} files`);
console.log(`PNG  ${mb(pngBytes)} MB  ->  WebP ${mb(webpBytes)} MB` +
  `  (${(100 - (webpBytes / pngBytes) * 100).toFixed(1)}% smaller)`);
