// Sync public/idols/* photo files into catalog.json.
//
// Usage: node scripts/sync-idol-photos.mjs
//
// For each file public/idols/<artist-id>.(jpg|jpeg|png|webp):
//   - sets that artist's image_url to "/idols/<file>"
//   - seeds image_focus: 0.3 if the artist has none (manual tweaks survive re-runs)
// Artists without a file keep image_url: null (gradient-initials fallback).
// Idempotent: drop files in, re-run, done.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalogPath = path.join(root, "src/data/catalog.json");
const idolsDir = path.join(root, "public/idols");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const exts = [".jpg", ".jpeg", ".png", ".webp"];

const files = fs.existsSync(idolsDir)
  ? fs.readdirSync(idolsDir).filter((f) => exts.includes(path.extname(f).toLowerCase()))
  : [];
const byId = new Map(files.map((f) => [path.basename(f, path.extname(f)), f]));

let linked = 0;
const unmatchedFiles = new Set(byId.keys());
for (const artist of catalog.artists) {
  const file = byId.get(artist.id);
  if (file) {
    artist.image_url = `/idols/${file}`;
    if (artist.image_focus == null) artist.image_focus = 0.3;
    unmatchedFiles.delete(artist.id);
    linked++;
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

const missing = catalog.artists.filter((a) => !a.image_url).map((a) => a.id);
console.log(`photos linked: ${linked}/${catalog.artists.length}`);
if (unmatchedFiles.size) {
  console.log(`files with no matching artist id (check spelling): ${[...unmatchedFiles].join(", ")}`);
}
console.log(missing.length ? `still missing (${missing.length}): ${missing.join(", ")}` : "all artists have photos 🎉");
