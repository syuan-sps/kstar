// Calibrates the 追星靈魂 archetype scorer. Simulates many random 4-pick
// combos, measures the real per-layer cohesion-score distribution, and reports
// how candidate (SCALE, FLOOR, HIGH_THRESHOLD) values fill the 16 buckets.
//
//   npx tsx scripts/calibrate-archetypes.ts
//
// Mirrors getPickSummaries() in src/lib/data.ts exactly (same similarArtists call).

import catalogJson from "../src/data/catalog.json";
import { similarArtists } from "../src/lib/similarity";
import { SCORE_LAYERS, type Artist, type LayerScores, type ScoreLayer } from "../src/lib/types";

const artists = (catalogJson as { artists: Artist[] }).artists.filter((a) => a.profile);

// Seeded PRNG (reproducible)
let seed = 1234567;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick4 = (): Artist[] => {
  const out: Artist[] = [];
  const used = new Set<number>();
  while (out.length < 4) {
    const i = Math.floor(rand() * artists.length);
    if (!used.has(i)) { used.add(i); out.push(artists[i]); }
  }
  return out;
};

// Per-pick layerScores = mean pairwise similarity vs the other 3 picks (== getPickSummaries)
function pickStrengths(group: Artist[]): LayerScores[] {
  return group.map((pick) => {
    const others = group.filter((o) => o.id !== pick.id);
    const sims = similarArtists(pick, others, undefined, others.length);
    const n = sims.length || 1;
    const acc = { aesthetic: 0, personality: 0, performance: 0, content: 0 };
    for (const s of sims) {
      acc.aesthetic += s.layerScores.aesthetic;
      acc.personality += s.layerScores.personality;
      acc.performance += s.layerScores.performance;
      acc.content += s.layerScores.content;
    }
    return {
      aesthetic: acc.aesthetic / n, personality: acc.personality / n,
      performance: acc.performance / n, content: acc.content / n,
    };
  });
}

const T = 4000;
const trials: LayerScores[][] = [];
const perLayerStrength: Record<ScoreLayer, number[]> = {
  aesthetic: [], personality: [], performance: [], content: [],
};
for (let t = 0; t < T; t++) {
  const s = pickStrengths(pick4());
  trials.push(s);
  for (const L of SCORE_LAYERS) for (const ps of s) perLayerStrength[L].push(ps[L]);
}

const pct = (arr: number[], p: number) => {
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.floor((a.length - 1) * p)];
};
const fmt = (n: number) => n.toFixed(4);

console.log(`=== per-pick strength distribution (n=${T * 4}) ===`);
for (const L of SCORE_LAYERS) {
  const a = perLayerStrength[L];
  console.log(`${L.padEnd(12)} p25=${fmt(pct(a,.25))} p50=${fmt(pct(a,.5))} p75=${fmt(pct(a,.75))} p90=${fmt(pct(a,.9))} p97=${fmt(pct(a,.97))} max=${fmt(Math.max(...a))}`);
}

// Candidate calibration: SCALE[L] = p90 strength (→ score 100 before recurrence/onboarding)
//                         FLOOR[L] = p50 strength (median cohesion)
const SCALE: Record<ScoreLayer, number> = { aesthetic: 0, personality: 0, performance: 0, content: 0 };
const FLOOR: Record<ScoreLayer, number> = { aesthetic: 0, personality: 0, performance: 0, content: 0 };
for (const L of SCORE_LAYERS) { SCALE[L] = pct(perLayerStrength[L], 0.90); FLOOR[L] = pct(perLayerStrength[L], 0.50); }

console.log(`\nSCALE (p90):`, Object.fromEntries(SCORE_LAYERS.map((L) => [L, fmt(SCALE[L])])));
console.log(`FLOOR (p50):`, Object.fromEntries(SCORE_LAYERS.map((L) => [L, fmt(FLOOR[L])])));

// Onboarding model: random ranking → weights, normalised
const RANK_WEIGHTS = [0.4, 0.3, 0.2, 0.1];
function randomOnboarding(): Record<ScoreLayer, number> {
  const order = [...SCORE_LAYERS].sort(() => rand() - 0.5);
  const o = {} as Record<ScoreLayer, number>;
  order.forEach((L, i) => (o[L] = RANK_WEIGHTS[i]));
  return o;
}

function scoreLayer(L: ScoreLayer, strengths: LayerScores[], onboarding: number): number {
  const vals = strengths.map((s) => s[L]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const recurrence = vals.filter((v) => v >= FLOOR[L]).length / vals.length;
  const scaled = Math.min(100, (mean / SCALE[L]) * 100);
  return scaled * recurrence * (1 + onboarding);
}

// Distribution of score[L] and bucket fill across HIGH_THRESHOLD candidates
const allScores: number[] = [];
const codesByThreshold: Record<number, Record<number, number>> = {};
const THRESHOLDS = [55, 60, 65, 70, 75, 80];
for (const th of THRESHOLDS) codesByThreshold[th] = {};

for (const s of trials) {
  const onb = randomOnboarding();
  const sc: Record<ScoreLayer, number> = { aesthetic: 0, personality: 0, performance: 0, content: 0 };
  for (const L of SCORE_LAYERS) { sc[L] = scoreLayer(L, s, onb[L]); allScores.push(sc[L]); }
  for (const th of THRESHOLDS) {
    const highs = SCORE_LAYERS.filter((L) => sc[L] >= th).length;
    codesByThreshold[th][highs] = (codesByThreshold[th][highs] ?? 0) + 1;
  }
}

console.log(`\n=== score[L] distribution ===`);
console.log(`p25=${fmt(pct(allScores,.25))} p50=${fmt(pct(allScores,.5))} p75=${fmt(pct(allScores,.75))} p90=${fmt(pct(allScores,.9))} max=${fmt(Math.max(...allScores))}`);

console.log(`\n=== bucket fill by HIGH_THRESHOLD (counts of #high-layers, want rare 4-high, fat 2-high) ===`);
console.log(`thresh   0-high   1-high   2-high   3-high   4-high`);
for (const th of THRESHOLDS) {
  const c = codesByThreshold[th];
  const row = [0, 1, 2, 3, 4].map((k) => String(((c[k] ?? 0) / T * 100).toFixed(1) + "%").padStart(8)).join(" ");
  console.log(`${String(th).padEnd(8)}${row}`);
}
