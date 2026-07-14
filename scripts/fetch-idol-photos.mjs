// Fetch CC-licensed idol photos from Wikimedia Commons into public/idols/.
//
// Usage: node scripts/fetch-idol-photos.mjs [artist-id ...]   (no args = all 44)
//
// Policy: free licenses only (CC0 / CC BY / CC BY-SA / Public domain);
// prefer photos taken after 2025-06, else newest available; portrait and
// "(cropped)" head-shot files get a ranking bonus. Existing files are
// skipped unless --force. Attribution recorded in public/idols/attribution.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEARCH } from "./_idol-search.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const idolsDir = path.join(root, "public/idols");
const attribPath = path.join(idolsDir, "attribution.json");

const UA = "KStarIdolDiscovery/0.1 (personal project; contact: ss7306@columbia.edu)";
const API = "https://commons.wikimedia.org/w/api.php";
const RECENT_CUTOFF = Date.parse("2025-06-01");

// artist-id → Commons search query (disambiguated)
// SEARCH map is shared with the Flickr fetcher.


const FREE_LICENSE = /^(cc0|cc[ -]by(?:[ -]sa)?(?:[ -]\d|\b)|public domain|pd)/i;

const force = process.argv.includes("--force");
const onlyIds = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ids = onlyIds.length ? onlyIds : Object.keys(SEARCH);

const attribution = fs.existsSync(attribPath) ? JSON.parse(fs.readFileSync(attribPath, "utf8")) : {};
fs.mkdirSync(idolsDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function parseDate(md) {
  const raw = md.DateTimeOriginal?.value ?? md.DateTime?.value ?? "";
  const m = String(raw).match(/(\d{4})-(\d{2})-(\d{2})|(\d{4})/);
  if (!m) return 0;
  return Date.parse(m[1] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[4]}-01-01`) || 0;
}

function stripHtml(s) {
  return String(s ?? "").replace(/<[^>]*>/g, "").trim();
}

async function fetchOne(id) {
  const file = path.join(idolsDir, `${id}.jpg`);
  if (fs.existsSync(file) && !force) return { id, status: "exists" };

  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${SEARCH[id]}`,
    gsrnamespace: "6",
    gsrlimit: "25",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "800",
  });

  const pages = Object.values(data.query?.pages ?? {});
  const candidates = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const md = ii.extmetadata ?? {};
    const license = stripHtml(md.LicenseShortName?.value);
    if (!FREE_LICENSE.test(license)) continue;            // hard license gate
    if (!/\.(jpe?g|png|webp)$/i.test(p.title)) continue;
    if (ii.width < 500) continue;
    const date = parseDate(md);
    let score = date / 1e10;                               // newer = better baseline
    if (date >= RECENT_CUTOFF) score += 1000;              // within-a-year strongly preferred
    if (ii.height > ii.width) score += 50;                 // portrait bonus
    if (/cropped/i.test(p.title)) score += 80;             // head-crop bonus
    if (ii.width >= 1000) score += 10;
    candidates.push({ title: p.title, ii, md, license, date, score });
  }
  if (!candidates.length) return { id, status: "no-cc-photo" };

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const url = best.ii.thumburl ?? best.ii.url;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { id, status: `download-failed-${res.status}` };
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));

  attribution[id] = {
    file: best.title,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, "_"))}`,
    author: stripHtml(best.md.Artist?.value).slice(0, 120),
    license: best.license,
    date: best.date ? new Date(best.date).toISOString().slice(0, 10) : "unknown",
  };
  return { id, status: "ok", title: best.title, license: best.license, date: attribution[id].date, recent: best.date >= RECENT_CUTOFF };
}

const results = [];
for (const id of ids) {
  try {
    const r = await fetchOne(id);
    results.push(r);
    const tag = r.status === "ok" ? `✓ ${r.date}${r.recent ? "" : " (older fallback)"} ${r.license} — ${r.title}` : r.status;
    console.log(`${id.padEnd(12)} ${tag}`);
  } catch (e) {
    results.push({ id, status: `error: ${e.message}` });
    console.log(`${id.padEnd(12)} error: ${e.message}`);
  }
  await sleep(700);
}

fs.writeFileSync(attribPath, JSON.stringify(attribution, null, 2) + "\n");
const ok = results.filter((r) => r.status === "ok" || r.status === "exists").length;
const none = results.filter((r) => r.status === "no-cc-photo").map((r) => r.id);
console.log(`\nphotos available: ${ok}/${ids.length}`);
if (none.length) console.log(`no CC photo found: ${none.join(", ")}`);
