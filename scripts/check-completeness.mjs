// Completeness checker — every idol must have full Tier-2 data.
// Photos are reported (缺照清單) but don't fail the check; Tier-1 extras
// (official/personal tracks, long analyses) are informational only.
//
// Usage: node scripts/check-completeness.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalog.json"), "utf8"));

const nonEmpty = (x) => Array.isArray(x) ? x.length > 0 : Boolean(x && String(x).trim());

const hardGaps = [];   // [id, field]
const noPhoto = [];
let tier1 = 0;

for (const a of catalog.artists) {
  const miss = (f) => hardGaps.push(`${a.id}: ${f}`);
  if (!a.image_url) noPhoto.push(a.id);
  if (!a.generation) miss("generation");
  if (!nonEmpty(a.name_zh)) miss("name_zh");
  const p = a.profile;
  if (!p) { miss("profile"); continue; }
  const ae = p.aesthetic ?? {};
  if (!nonEmpty(ae.style_tags)) miss("aesthetic.style_tags");
  if (!nonEmpty(ae.color_palette)) miss("aesthetic.color_palette");
  if (!nonEmpty(ae.vibe)) miss("aesthetic.vibe");
  const pe = p.personality ?? {};
  for (const f of ["energy_type", "fan_interaction", "mbti", "vibe"]) if (!nonEmpty(pe[f])) miss(`personality.${f}`);
  if (!nonEmpty(pe.trait_tags)) miss("personality.trait_tags");
  const pf = p.performance ?? {};
  for (const f of ["dance_style", "vocal_type", "stage_persona", "vibe"]) if (!nonEmpty(pf[f])) miss(`performance.${f}`);
  if (!nonEmpty(pf.roles)) miss("performance.roles");
  if (!nonEmpty(pf.trait_tags)) miss("performance.trait_tags");
  const c = p.content ?? {};
  for (const f of ["content_tone", "vibe"]) if (!nonEmpty(c[f])) miss(`content.${f}`);
  for (const f of ["lifestyle_topics", "value_topics", "sns_platform", "trait_tags"]) if (!nonEmpty(c[f])) miss(`content.${f}`);
  const o = p.overview ?? {};
  if (!nonEmpty(o.vibe) || !nonEmpty(o.trait_tags) || !nonEmpty(o.summary)) miss("overview");
  if (ae.official && ae.personal && ae.analysis) tier1++;
}

console.log(`idols: ${catalog.artists.length} | Tier-1 (dual-track+analysis): ${tier1}`);
console.log(`hard gaps: ${hardGaps.length}`);
if (hardGaps.length) for (const g of hardGaps.slice(0, 30)) console.log("  ✗ " + g);
console.log(`缺照清單 (${noPhoto.length}): ${noPhoto.join(", ") || "—"}`);
process.exit(hardGaps.length ? 1 : 0);
