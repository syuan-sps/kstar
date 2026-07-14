// Smoke test for the 追星靈魂 engine — runs getArchetype + the adaptive
// questionnaire helpers on real picks (coherent group vs diverse set) and prints
// the derived code, archetype, hidden face and discovery loop.
//
//   npx tsx scripts/smoke-soul.ts

import catalogJson from "../src/data/catalog.json";
import { similarArtists } from "../src/lib/similarity";
import { SCORE_LAYERS, type Artist, type LayerScores, type PickSummary, type ScoreLayer } from "../src/lib/types";
import { getArchetype, soulmateCodes, expandCode, wallClimbType, ARCHETYPES, LAYER_ZH } from "../src/lib/archetypes";
import { rankToWeights, selectQuestionIds, agreedToken, agreedMood, energyOutlier, dominantMood } from "../src/lib/questionnaire";

const artists = (catalogJson as { artists: Artist[] }).artists;
const byId = new Map(artists.map((a) => [a.id, a]));

function summariesFor(ids: string[]): PickSummary[] {
  const picks = ids.map((id) => byId.get(id)).filter((a): a is Artist => Boolean(a));
  return picks.map((pick) => {
    const others = picks.filter((o) => o.id !== pick.id);
    const sims = others.length ? similarArtists(pick, others, undefined, others.length) : [];
    const n = sims.length || 1;
    const acc = { aesthetic: 0, personality: 0, performance: 0, content: 0 };
    for (const s of sims) {
      acc.aesthetic += s.layerScores.aesthetic; acc.personality += s.layerScores.personality;
      acc.performance += s.layerScores.performance; acc.content += s.layerScores.content;
    }
    const layerScores: LayerScores = { aesthetic: acc.aesthetic / n, personality: acc.personality / n, performance: acc.performance / n, content: acc.content / n };
    const p = pick.profile;
    return {
      id: pick.id, layerScores,
      tokens: {
        energy_type: p?.personality?.energy_type, fan_interaction: p?.personality?.fan_interaction,
        dance_style: p?.performance?.dance_style, content_tone: p?.content?.content_tone,
        lifestyle_topics: p?.content?.lifestyle_topics ?? [], value_topics: p?.content?.value_topics ?? [],
        style_tags: [...(p?.aesthetic?.style_tags ?? []), ...(p?.aesthetic?.official?.style_tags ?? []), ...(p?.aesthetic?.personal?.style_tags ?? [])],
        color_palette: p?.aesthetic?.color_palette ?? [],
      },
    };
  });
}

function firstGroupOf(n: number): string[] {
  const groups = new Map<string, string[]>();
  for (const a of artists) if (a.group && a.profile) {
    const arr = groups.get(a.group) ?? []; arr.push(a.id); groups.set(a.group, arr);
  }
  for (const [, ids] of groups) if (ids.length >= n) return ids.slice(0, n);
  return artists.slice(0, n).map((a) => a.id);
}

function report(label: string, ids: string[], rank: ScoreLayer[]) {
  const sums = summariesFor(ids);
  const weights = rankToWeights(rank);
  const r = getArchetype(sums, weights);
  console.log(`\n=== ${label} ===`);
  console.log(`picks: ${ids.join(", ")}`);
  console.log(`names: ${ids.map((id) => byId.get(id)?.name).join(", ")}`);
  console.log(`rank: ${rank.map((L) => LAYER_ZH[L]).join(" > ")}`);
  console.log(`layerScores(mean): ${SCORE_LAYERS.map((L) => `${LAYER_ZH[L]} ${(sums.reduce((s, p) => s + p.layerScores[L], 0) / sums.length).toFixed(3)}`).join("  ")}`);
  console.log(`scores: ${SCORE_LAYERS.map((L) => `${LAYER_ZH[L]} ${r.scores[L].toFixed(0)}`).join("  ")}`);
  console.log(`CODE = ${r.code}  → ${r.archetype.zhName} (${r.archetype.enName})  [${r.highCount}-high]`);
  console.log(`tagline: ${r.archetype.tagline}`);
  console.log(`隱藏面: ${LAYER_ZH[r.hiddenLayer]} — ${r.dualityLine}`);
  console.log(`colourStory: ${r.colorStory.label}`);
  console.log(`最合拍: ${soulmateCodes(r.code).map((c) => ARCHETYPES[c].zhName).join("、")}`);
  console.log(`互補型: ${ARCHETYPES[expandCode(r.code)]?.zhName ?? "—"}`);
  console.log(`爬牆預測: ${wallClimbType(r.hiddenLayer).zhName}`);
  console.log(`adaptive Qs (rank): ${selectQuestionIds(rank).join(", ")}`);
  console.log(`agreed energy: ${agreedToken(sums, "energy_type") ?? "—"} · fan: ${agreedToken(sums, "fan_interaction") ?? "—"} · tone: ${agreedToken(sums, "content_tone") ?? "—"} · mood: ${agreedMood(sums) ?? "—"}`);
  console.log(`per-pick mood: ${sums.map((p) => `${byId.get(p.id)?.name}=${dominantMood(p.tokens)}`).join(", ")}`);
  const out = energyOutlier(sums);
  console.log(`energy outlier: ${out ? `${byId.get(sums[out.index].id)?.name} (${out.energy}) vs ${out.majority}` : "—"}`);
}

const coherent = firstGroupOf(4);
report("Coherent (same group)", coherent, ["aesthetic", "personality", "performance", "content"]);

const diverse = [artists[0].id, artists[100].id, artists[200].id, artists[300].id];
report("Diverse (spread)", diverse, ["content", "performance", "personality", "aesthetic"]);

const jk = ["jungkook", "jimin", "v", "jin"].filter((id) => byId.has(id));
if (jk.length === 4) report("BTS subset", jk, ["personality", "aesthetic", "performance", "content"]);
