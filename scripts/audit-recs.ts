// Audit: for every idol × every layer, the recommendation grid must show
// exactly 6 candidates and they must be the 6 highest by layer match value.
// Mirrors SimilarSection logic (filterWeights + slice(0,6) + all-zero fallback).
//
// Usage: npx tsx scripts/audit-recs.ts

import catalogJson from "../src/data/catalog.json";
import { similarArtists } from "../src/lib/similarity";
import { DEFAULT_WEIGHTS, type Artist, type Weights, type LayerScores } from "../src/lib/types";

const artists = (catalogJson as { artists: Artist[] }).artists;
const LAYERS = ["all", "aesthetic", "personality", "performance", "content"] as const;

function filterWeights(f: (typeof LAYERS)[number]): Weights {
  if (f === "all") return DEFAULT_WEIGHTS;
  return { aesthetic: 0, personality: 0, performance: 0, content: 0, [f]: 1 } as Weights;
}

let underCount = 0, orderViolations = 0, notTop6 = 0, boundaryTies = 0, fallbacks = 0;
const issues: string[] = [];

for (const target of artists) {
  for (const layer of LAYERS) {
    const w = filterWeights(layer);
    const results = similarArtists(target, artists, w, 43);

    // Component fallback: single layer + all scores ~0 → DEFAULT_WEIGHTS
    let shown = results;
    if (layer !== "all" && results.every((r) => r.score < 0.01)) {
      shown = similarArtists(target, artists, DEFAULT_WEIGHTS, 43);
      fallbacks++;
    }
    const six = shown.slice(0, 6);

    if (six.length < 6) {
      underCount++;
      issues.push(`UNDER6 ${target.id} × ${layer}: only ${six.length} candidates returned`);
    }

    // Order must be non-increasing
    for (let i = 1; i < shown.length; i++) {
      if (shown[i].score > shown[i - 1].score + 1e-9) {
        orderViolations++;
        issues.push(`ORDER ${target.id} × ${layer}: index ${i} (${shown[i].artist.id}) outranks predecessor`);
        break;
      }
    }

    // The 6 shown must be the global top-6 by this layer's weighted score
    const rescored = artists
      .filter((a) => a.id !== target.id)
      .map((a) => {
        const r = similarArtists(target, [target, a], w, 1)[0];
        return { id: a.id, score: r ? r.score : 0 };
      })
      .sort((x, y) => y.score - x.score);
    const shownIds = new Set(six.map((s) => s.artist.id));
    const top6Floor = rescored[5]?.score ?? 0;
    const mustHave = rescored.filter((r) => r.score > top6Floor + 1e-9); // strictly above the boundary
    for (const m of mustHave) {
      if (!shownIds.has(m.id)) {
        notTop6++;
        issues.push(`NOT-TOP6 ${target.id} × ${layer}: ${m.id} (score ${m.score.toFixed(3)}) missing from shown 6`);
      }
    }
    // Tie crossing the 6/7 boundary (ambiguous without deterministic tie-break)
    if (rescored.length > 6 && Math.abs(rescored[5].score - rescored[6].score) < 1e-9) {
      boundaryTies++;
    }
  }
}

console.log(`audited: ${artists.length} idols × ${LAYERS.length} layers = ${artists.length * LAYERS.length} combos`);
console.log(`under-6 grids: ${underCount}`);
console.log(`order violations: ${orderViolations}`);
console.log(`missing-true-top6: ${notTop6}`);
console.log(`ambiguous 6/7 boundary ties: ${boundaryTies}`);
console.log(`all-zero fallbacks triggered: ${fallbacks}`);
if (issues.length) {
  console.log("\nfirst 20 issues:");
  for (const i of issues.slice(0, 20)) console.log("  " + i);
}
process.exit(underCount + orderViolations + notTop6 > 0 ? 1 : 0);
