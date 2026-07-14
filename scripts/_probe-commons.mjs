// Recovery probe: download the top CC-licensed Commons candidates for one idol
// into /tmp/photo-recovery/<id>/ so an agent can VIEW them and pick the correct
// solo shot. Deterministic fetch; the judgment happens in the agent.
//
//   node scripts/_probe-commons.mjs <id> "<commons search query>"
import fs from "node:fs";
import path from "node:path";

const [, , id, ...q] = process.argv;
const query = q.join(" ");
if (!id || !query) { console.error("usage: _probe-commons.mjs <id> <query>"); process.exit(1); }

const UA = "KStarIdolDiscovery/0.1 (personal project; contact: ss7306@columbia.edu)";
const API = "https://commons.wikimedia.org/w/api.php";
const RECENT_CUTOFF = Date.parse("2025-06-01");
const FREE_LICENSE = /^(cc0|cc[ -]by(?:[ -]sa)?(?:[ -]\d|\b)|public domain|pd)/i;
const outDir = `/tmp/photo-recovery/${id}`;
fs.mkdirSync(outDir, { recursive: true });

const stripHtml = (s) => String(s ?? "").replace(/<[^>]*>/g, "").trim();
function parseDate(md) {
  const raw = md.DateTimeOriginal?.value ?? md.DateTime?.value ?? "";
  const m = String(raw).match(/(\d{4})-(\d{2})-(\d{2})|(\d{4})/);
  if (!m) return 0;
  return Date.parse(m[1] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[4]}-01-01`) || 0;
}

const url = `${API}?${new URLSearchParams({
  format: "json", action: "query", generator: "search",
  gsrsearch: `filetype:bitmap ${query}`, gsrnamespace: "6", gsrlimit: "40",
  prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "800",
})}`;
const res = await fetch(url, { headers: { "User-Agent": UA } });
if (!res.ok) { console.error(`API ${res.status}`); process.exit(1); }
const data = await res.json();

const cands = [];
for (const p of Object.values(data.query?.pages ?? {})) {
  const ii = p.imageinfo?.[0];
  if (!ii) continue;
  const md = ii.extmetadata ?? {};
  const license = stripHtml(md.LicenseShortName?.value);
  if (!FREE_LICENSE.test(license)) continue;
  if (!/\.(jpe?g|png|webp)$/i.test(p.title)) continue;
  if (ii.width < 500) continue;
  const date = parseDate(md);
  let score = date / 1e10;
  if (date >= RECENT_CUTOFF) score += 1000;
  if (ii.height > ii.width) score += 50;           // portrait
  if (/cropped|portrait/i.test(p.title)) score += 80;
  if (ii.width >= 1000) score += 10;
  cands.push({
    title: p.title, author: stripHtml(md.Artist?.value).slice(0, 120),
    license, date: date ? new Date(date).toISOString().slice(0, 10) : "unknown",
    w: ii.width, h: ii.height, portrait: ii.height > ii.width,
    thumburl: ii.thumburl ?? ii.url, score,
  });
}
cands.sort((a, b) => b.score - a.score);
const top = cands.slice(0, 6);

const manifest = [];
for (let i = 0; i < top.length; i++) {
  const c = top[i];
  const file = path.join(outDir, `cand-${i}.jpg`);
  try {
    const r = await fetch(c.thumburl, { headers: { "User-Agent": UA } });
    if (!r.ok) continue;
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    manifest.push({ idx: i, path: file, title: c.title, author: c.author, license: c.license, date: c.date, w: c.w, h: c.h, portrait: c.portrait,
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(c.title.replace(/ /g, "_"))}` });
  } catch { /* skip */ }
  await new Promise((r) => setTimeout(r, 300));
}
fs.writeFileSync(path.join(outDir, "candidates.json"), JSON.stringify(manifest, null, 2));
console.log(`${id}: ${manifest.length} CC candidates downloaded to ${outDir}`);
for (const m of manifest) console.log(`  [${m.idx}] ${m.portrait ? "portrait" : "landscape"} ${m.w}x${m.h} ${m.license} — ${m.title}`);
if (!manifest.length) console.log("  (no CC candidates found)");
