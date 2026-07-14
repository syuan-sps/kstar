// Fetch CC-licensed idol photos from Openverse into public/idols/.
//
// Usage: node scripts/fetch-openverse-photos.mjs [artist-id ...]
//   (no ids = every id in the shared SEARCH map; --force overwrites existing files)
//
// Openverse (https://openverse.org) is the Creative Commons image search. Its public
// API needs NO key (anonymous, rate-limited ~100 req/day) and aggregates Flickr CC,
// Wikimedia, museums and more — so it reaches free photos the Commons-only fetcher
// misses. Same free-license policy: only the no-NC/no-ND set (CC BY / CC BY-SA /
// CC0 / Public Domain Mark). Existing files skipped unless --force.
//
// IMPORTANT: still a fan-photo firehose with a high wrong-person/group rate.
// EYEBALL every downloaded file before sync — see CLAUDE.md "Photo pipeline".

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEARCH } from "./_idol-search.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const idolsDir = path.join(root, "public/idols");
const attribPath = path.join(idolsDir, "attribution.json");

const UA = "KStarIdolDiscovery/0.1 (personal project; contact: ss7306@columbia.edu)";
const API = "https://api.openverse.org/v1/images/";
// Optional bearer token (free, no PRO): register via POST /v1/auth_tokens/register/
// then exchange for a token via /v1/auth_tokens/token/. Lifts the harsh anonymous
// throttle (anonymous = ~1 req/min → 401/429). Pass as OPENVERSE_TOKEN.
const TOKEN = process.env.OPENVERSE_TOKEN || "";
const AUTH = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
const LICENSE_PARAM = "by,by-sa,cc0,pdm"; // no-NC / no-ND only

const LABEL = { by: "CC BY", "by-sa": "CC BY-SA", cc0: "CC0", pdm: "Public Domain Mark" };

const force = process.argv.includes("--force");
const onlyIds = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ids = onlyIds.length ? onlyIds : Object.keys(SEARCH);

const attribution = fs.existsSync(attribPath) ? JSON.parse(fs.readFileSync(attribPath, "utf8")) : {};
fs.mkdirSync(idolsDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params, attempt = 0) {
  const url = `${API}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...AUTH } });
  if (res.status === 429 && attempt < 5) {
    const wait = 30000 * (attempt + 1); // anon limit is 20/min — back off and retry
    console.log(`   …429, backing off ${wait / 1000}s`);
    await sleep(wait);
    return api(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function fetchOne(id) {
  const file = path.join(idolsDir, `${id}.jpg`);
  if (fs.existsSync(file) && !force) return { id, status: "exists" };
  if (!SEARCH[id]) return { id, status: "no-query" };

  const data = await api({
    q: SEARCH[id],
    license: LICENSE_PARAM,
    page_size: "30",
    mature: "false",
  });

  const candidates = [];
  for (const r of data.results ?? []) {
    const w = Number(r.width || 0);
    const h = Number(r.height || 0);
    const url = r.url;
    if (!url || w < 500) continue;
    // skip files Commons already serves — those were searched by fetch-idol-photos.mjs
    if (r.source === "wikimedia" && /commons\.wikimedia/.test(r.foreign_landing_url || "")) {
      // still allow them, but de-prioritise (Openverse's value is the *other* sources)
    }
    let score = 0;
    if (h > w) score += 50; // portrait bonus
    if (w >= 1000) score += 10;
    if (r.source !== "wikimedia") score += 5; // mild bias toward Commons-missed sources
    score += Math.min(w, 4000) / 1000; // gentle resolution tiebreak
    candidates.push({ r, url, w, h, score });
  }
  if (!candidates.length) return { id, status: "no-cc-photo" };

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const res = await fetch(best.url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { id, status: `download-failed-${res.status}` };
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));

  const license = `${LABEL[best.r.license] || best.r.license} ${best.r.license_version || ""}`.trim();
  attribution[id] = {
    file: best.r.title || `openverse ${best.r.id}`,
    page: best.r.foreign_landing_url || best.r.url,
    author: String(best.r.creator || "unknown").slice(0, 120),
    license,
    date: "unknown",
    source: `openverse:${best.r.source}`,
  };
  return { id, status: "ok", title: attribution[id].file, license, src: best.r.source, dim: `${best.w}x${best.h}` };
}

const results = [];
for (const id of ids) {
  try {
    const r = await fetchOne(id);
    results.push(r);
    const tag = r.status === "ok" ? `✓ ${r.license} [${r.src} ${r.dim}] — ${r.title}` : r.status;
    console.log(`${id.padEnd(14)} ${tag}`);
  } catch (e) {
    results.push({ id, status: `error: ${e.message}` });
    console.log(`${id.padEnd(14)} error: ${e.message}`);
  }
  await sleep(3500); // stay under the 20-requests/min anonymous burst limit
}

fs.writeFileSync(attribPath, JSON.stringify(attribution, null, 2) + "\n");
const ok = results.filter((r) => r.status === "ok" || r.status === "exists").length;
const none = results.filter((r) => r.status === "no-cc-photo").map((r) => r.id);
console.log(`\nphotos available: ${ok}/${ids.length}`);
if (none.length) console.log(`no CC photo found: ${none.join(", ")}`);
console.log("\n⚠️  EYEBALL every new file before sync — high wrong-person/group rate.");
