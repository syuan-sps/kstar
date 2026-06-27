// Fetch CC-licensed idol photos from Flickr into public/idols/.
//
// Usage: FLICKR_API_KEY=xxx node scripts/fetch-flickr-photos.mjs [artist-id ...]
//   (no ids = every id in the shared SEARCH map; --force overwrites existing files)
//
// Get a free key at https://www.flickr.com/services/apps/create (any "non-commercial"
// API key works for read calls). Put it in .env.local as FLICKR_API_KEY and run with
//   `node --env-file=.env.local scripts/fetch-flickr-photos.mjs <ids>`.
//
// Policy (mirrors the Commons fetcher): only commercially-usable, no-NC/no-ND licenses
// — CC BY / CC BY-SA / CC0 / Public Domain / US-Gov / "no known restrictions".
// Existing files are skipped unless --force. Attribution recorded in attribution.json.
//
// IMPORTANT: Flickr is a fan-photo firehose with a high wrong-person/group-shot rate,
// same as Commons. Every downloaded file MUST be eyeballed before sync — see the
// "Photo pipeline" section of CLAUDE.md.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEARCH } from "./_idol-search.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const idolsDir = path.join(root, "public/idols");
const attribPath = path.join(idolsDir, "attribution.json");

const UA = "KStarIdolDiscovery/0.1 (personal project; contact: ss7306@columbia.edu)";
const REST = "https://api.flickr.com/services/rest/";
const RECENT_CUTOFF = Date.parse("2025-06-01");

const API_KEY = process.env.FLICKR_API_KEY;
if (!API_KEY) {
  console.error("Missing FLICKR_API_KEY. Get a free key at https://www.flickr.com/services/apps/create");
  console.error("then run: node --env-file=.env.local scripts/fetch-flickr-photos.mjs <ids>");
  process.exit(1);
}

// Flickr license ids → human label. Only the commercially-usable, no-NC/no-ND ones.
const LICENSES = {
  4: "CC BY 2.0",
  5: "CC BY-SA 2.0",
  7: "No known copyright restrictions",
  8: "United States Government Work",
  9: "CC0 1.0",
  10: "Public Domain Mark 1.0",
};
const LICENSE_PARAM = Object.keys(LICENSES).join(",");

const force = process.argv.includes("--force");
const onlyIds = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ids = onlyIds.length ? onlyIds : Object.keys(SEARCH);

const attribution = fs.existsSync(attribPath) ? JSON.parse(fs.readFileSync(attribPath, "utf8")) : {};
fs.mkdirSync(idolsDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, params) {
  const url = `${REST}?${new URLSearchParams({
    method,
    api_key: API_KEY,
    format: "json",
    nojsoncallback: "1",
    ...params,
  })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  if (json.stat !== "ok") throw new Error(json.message || "flickr error");
  return json;
}

function parseDate(p) {
  const raw = p.datetaken || "";
  const m = String(raw).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? Date.parse(`${m[1]}-${m[2]}-${m[3]}`) || 0 : 0;
}

async function fetchOne(id) {
  const file = path.join(idolsDir, `${id}.jpg`);
  if (fs.existsSync(file) && !force) return { id, status: "exists" };
  if (!SEARCH[id]) return { id, status: "no-query" };

  const data = await api("flickr.photos.search", {
    text: SEARCH[id],
    license: LICENSE_PARAM,
    sort: "relevance",
    content_types: "0", // photos only
    media: "photos",
    safe_search: "1",
    per_page: "30",
    extras: "license,date_taken,owner_name,o_dims,url_l,url_c,url_o",
  });

  const photos = data.photos?.photo ?? [];
  const candidates = [];
  for (const p of photos) {
    const w = Number(p.width_l || p.width_o || 0);
    const h = Number(p.height_l || p.height_o || 0);
    const url = p.url_l || p.url_o || p.url_c;
    if (!url || w < 500) continue;
    const date = parseDate(p);
    let score = date / 1e10; // newer = better baseline
    if (date >= RECENT_CUTOFF) score += 1000; // within-a-year strongly preferred
    if (h > w) score += 50; // portrait bonus
    if (w >= 1000) score += 10;
    candidates.push({ p, url, w, h, date, score });
  }
  if (!candidates.length) return { id, status: "no-cc-photo" };

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const res = await fetch(best.url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { id, status: `download-failed-${res.status}` };
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));

  const license = LICENSES[best.p.license] || `license ${best.p.license}`;
  attribution[id] = {
    file: best.p.title || `flickr ${best.p.id}`,
    page: `https://www.flickr.com/photos/${best.p.owner}/${best.p.id}`,
    author: String(best.p.ownername || best.p.owner).slice(0, 120),
    license,
    date: best.date ? new Date(best.date).toISOString().slice(0, 10) : "unknown",
    source: "flickr",
  };
  return { id, status: "ok", title: attribution[id].file, license, date: attribution[id].date, recent: best.date >= RECENT_CUTOFF };
}

const results = [];
for (const id of ids) {
  try {
    const r = await fetchOne(id);
    results.push(r);
    const tag = r.status === "ok" ? `✓ ${r.date}${r.recent ? "" : " (older fallback)"} ${r.license} — ${r.title}` : r.status;
    console.log(`${id.padEnd(14)} ${tag}`);
  } catch (e) {
    results.push({ id, status: `error: ${e.message}` });
    console.log(`${id.padEnd(14)} error: ${e.message}`);
  }
  await sleep(700);
}

fs.writeFileSync(attribPath, JSON.stringify(attribution, null, 2) + "\n");
const ok = results.filter((r) => r.status === "ok" || r.status === "exists").length;
const none = results.filter((r) => r.status === "no-cc-photo").map((r) => r.id);
console.log(`\nphotos available: ${ok}/${ids.length}`);
if (none.length) console.log(`no CC photo found: ${none.join(", ")}`);
console.log("\n⚠️  EYEBALL every new file before sync — Flickr has a high wrong-person/group rate.");
