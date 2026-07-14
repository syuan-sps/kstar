// Applies researched Instagram handles to catalog.json.
// For each idol missing `instagram`: personal handle if verified, else the
// group's official IG. Existing handles are kept. Run with --write to apply.
//
//   node scripts/apply-ig.mjs        # dry run (report only)
//   node scripts/apply-ig.mjs --write

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WRITE = process.argv.includes("--write");
const catalogPath = path.join(root, "src/data/catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

// ── Merge research files ────────────────────────────────────────────────
const dir = "/tmp/ig-research";
const personal = {};       // idolId -> handle
const groupOfficial = {};  // groupName -> handle
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  Object.assign(personal, j.personal ?? {});
  Object.assign(groupOfficial, j.groupOfficial ?? {});
}

// ── Normalise + validate handles ───────────────────────────────────────
const IG_RE = /^[A-Za-z0-9._]{1,30}$/;
function clean(h) {
  if (typeof h !== "string") return null;
  let s = h.trim();
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  s = s.replace(/^@/, "").replace(/\/+$/, "").trim();
  return IG_RE.test(s) ? s : null;
}
const invalid = [];
for (const [k, v] of Object.entries(personal)) { const c = clean(v); if (c) personal[k] = c; else { invalid.push(`personal ${k}=${v}`); delete personal[k]; } }
for (const [k, v] of Object.entries(groupOfficial)) { const c = clean(v); if (c) groupOfficial[k] = c; else { invalid.push(`group ${k}=${v}`); delete groupOfficial[k]; } }

// ── Assign ──────────────────────────────────────────────────────────────
let setPersonal = 0, setGroup = 0, kept = 0, stillBlank = 0;
const blankIds = [];
for (const a of catalog.artists) {
  if (a.instagram && String(a.instagram).trim()) { kept++; continue; }
  let handle = null, via = null;
  if (personal[a.id]) { handle = personal[a.id]; via = "personal"; }
  else if (a.group && groupOfficial[a.group]) { handle = groupOfficial[a.group]; via = "group"; }
  if (handle) {
    a.instagram = handle;
    if (via === "personal") setPersonal++; else setGroup++;
  } else {
    stillBlank++; blankIds.push(a.id);
  }
}

console.log(`research: ${Object.keys(personal).length} personal handles, ${Object.keys(groupOfficial).length} group officials`);
if (invalid.length) { console.log(`INVALID (skipped): ${invalid.length}`); invalid.forEach((x) => console.log("  ✗ " + x)); }
console.log(`\nassigned → personal: ${setPersonal} | group-fallback: ${setGroup} | kept existing: ${kept} | still blank: ${stillBlank}`);
const withIg = catalog.artists.filter((a) => a.instagram).length;
console.log(`coverage: ${withIg}/${catalog.artists.length}`);
console.log(`still blank ids: ${blankIds.join(", ") || "—"}`);
console.log(`groups WITHOUT an official handle found: ${[...new Set(catalog.artists.filter((a)=>a.group && !groupOfficial[a.group]).map((a)=>a.group))].join(", ") || "—"}`);

if (WRITE) {
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\n✓ written to catalog.json");
} else {
  console.log("\n(dry run — pass --write to apply)");
}
