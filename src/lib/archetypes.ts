// 追星靈魂 — the 16-type archetype engine.
//
// The type is DERIVED from the user's four picks, not a separate quiz: each of
// the four layers (美學/個性/表演/內容) becomes a high/low binary axis, giving a
// 4-letter code (A·P·S·R) that maps to one of 16 archetypes. Score = how
// consistently a layer recurs as a strength across the picks, reinforced by the
// onboarding ranking. All client-side — fed by PickSummary (no catalog).
//
// Calibration constants (SCALE/FLOOR/HIGH_THRESHOLD) come from
// scripts/calibrate-archetypes.ts — re-run it after major catalog changes.

import type { LayerScores, PickSummary, ScoreLayer, Weights } from "./types";
import { SCORE_LAYERS } from "./types";

// ── Tunables (see scripts/calibrate-archetypes.ts) ─────────────────────
// Per-layer p90 of the random-pick cohesion distribution. Normalises the very
// different layer magnitudes (denim aesthetic ~0.12 vs exact-match personality
// ~0.59) so a single HIGH_THRESHOLD is meaningful across all four.
const SCALE: Record<ScoreLayer, number> = {
  aesthetic: 0.118, personality: 0.592, performance: 0.281, content: 0.449,
};
// Per-layer median cohesion — a pick counts toward "recurrence" above this.
const FLOOR: Record<ScoreLayer, number> = {
  aesthetic: 0.062, personality: 0.333, performance: 0.139, content: 0.267,
};
// UPPERCASE (high) cutoff on the 0–~140 score scale. Tuned so 六邊形戰士 (all
// four high) stays rare and the 2-high duality tier stays fat for real,
// coherent pick sets.
export const HIGH_THRESHOLD = 68;

// ── Code letters, fixed order A · P · S · R (美 個 表 內) ───────────────
const CODE_LETTER: Record<ScoreLayer, string> = {
  aesthetic: "A", personality: "P", performance: "S", content: "R",
};
export const LAYER_ZH: Record<ScoreLayer, string> = {
  aesthetic: "美學", personality: "個性", performance: "表演", content: "內容",
};

// ── The 16 archetypes ──────────────────────────────────────────────────
export interface Archetype {
  code: string;          // canonical mixed-case code, e.g. "APsr"
  zhName: string;
  enName: string;
  tagline: string;
  missing?: ScoreLayer;  // the one charming blind spot (3-high types)
}

export const ARCHETYPES: Record<string, Archetype> = {
  // 0 high — the omnivore
  apsr: { code: "apsr", zhName: "雜食型", enName: "Omnivore", tagline: "你什麼都推得下去，雷達全開，沒有不能入的坑。" },
  // 1 high — the purists
  Apsr: { code: "Apsr", zhName: "神顏控", enName: "Visual Purist", tagline: "一眼就淪陷，長相就是一切。" },
  aPsr: { code: "aPsr", zhName: "人格本命派", enName: "Soul Catcher", tagline: "你愛的是那個人，不是那張臉。" },
  apSr: { code: "apSr", zhName: "直拍上癮者", enName: "Fancam Addict", tagline: "直拍循環一百遍，根本停不下來。" },
  apsR: { code: "apsR", zhName: "頻率共鳴控", enName: "Frequency Match", tagline: "他講的每句話，都像在說你。" },
  // 2 high — the dualities (the screenshot tier)
  APsr: { code: "APsr", zhName: "高冷反差控", enName: "Gap Hunter", tagline: "為了那張高冷臉留下，結果被私下的脫線樣收服。" },
  ApSr: { code: "ApSr", zhName: "視覺猛獸派", enName: "Visual Beast", tagline: "畫報級長相＋舞台超狂，直接被雙殺。" },
  ApsR: { code: "ApsR", zhName: "氛圍生活家", enName: "Aesthetic Soul", tagline: "美得有質感，活得有溫度。" },
  aPSr: { code: "aPSr", zhName: "個性炸場王", enName: "Charisma Bomb", tagline: "個性先收你，舞台再補一刀。" },
  aPsR: { code: "aPsR", zhName: "真實共鳴派", enName: "Kindred Spirit", tagline: "頻率對上，個性再補一刀。" },
  apSR: { code: "apSR", zhName: "台上台下控", enName: "On & Off", tagline: "台上為他尖叫，台下被他融化。" },
  // 3 high — the near-perfect (one charming blind spot)
  APSr: { code: "APSr", zhName: "完全巨星型", enName: "Total Star", tagline: "除了沒空陪你聊天，他什麼都有。", missing: "content" },
  APsR: { code: "APsR", zhName: "戀人感本命", enName: "Soulmate Type", tagline: "不用靠舞台，光是站在那裡你就淪陷。", missing: "performance" },
  ApSR: { code: "ApSR", zhName: "神級全才", enName: "Triple Threat", tagline: "顏、舞台、共鳴全包，個性就留點神秘。", missing: "personality" },
  aPSR: { code: "aPSR", zhName: "靈魂全方位", enName: "Soulful All-Rounder", tagline: "你根本不在乎長相，他的一切都對你的胃。", missing: "aesthetic" },
  // 4 high — the legend
  APSR: { code: "APSR", zhName: "六邊形戰士", enName: "Hexagonal Warrior", tagline: "完全沒有死角。能拿到這個結果的人，比你想的還少。" },
};

// 隱藏面 duality line — keyed by the hidden-face layer (2nd-highest score).
export const DUALITY_LINES: Record<ScoreLayer, string> = {
  aesthetic: "但你嘴上不說 — 那張臉，其實也是你留下來的原因。",
  personality: "私底下你更在意的，是他到底是個怎樣的人。",
  performance: "真正讓你回放一百遍的，是他站上舞台的那一刻。",
  content: "夜深了你還是會點開他的日常 — 那份共鳴騙不了人。",
};

// Colour story — follows the single highest layer (rest stays neutral chrome).
export interface ColorStory { accent: string; soft: string; label: string }
export const COLOR_STORIES: Record<ScoreLayer, ColorStory> = {
  aesthetic:   { accent: "#56789f", soft: "#a7c0dc", label: "丹寧藍 × 鉻銀" },   // cool, editorial
  personality: { accent: "#b4302b", soft: "#e6a6b8", label: "桃紅 × 螢光紫" },   // warm, loud
  performance: { accent: "#2f6fae", soft: "#7fb0dd", label: "青藍 × 鉻銀" },     // electric, sharp
  content:     { accent: "#b0894e", soft: "#e8d6ad", label: "暖金 × 柔白" },     // intimate, cosy
};
// 六邊形戰士 uses the full chrome-rainbow story.
export const LEGEND_STORY: ColorStory = { accent: "#7c8088", soft: "#c8ccd2", label: "全鉻虹彩" };

// Per-layer bar colours (match SimilarIdolCard for consistency).
export const LAYER_COLOR: Record<ScoreLayer, string> = {
  aesthetic: "#4a4f57", personality: "#b4302b", performance: "#56789f", content: "#b9bdc4",
};

// ── Scoring ────────────────────────────────────────────────────────────
export interface ArchetypeResult {
  code: string;
  archetype: Archetype;
  leadLayer: ScoreLayer;            // single highest layer → colour story
  hiddenLayer: ScoreLayer;          // 2nd-highest → 隱藏面 / wall-climb seed
  dualityLine: string;
  colorStory: ColorStory;
  scores: Record<ScoreLayer, number>;   // 0–~140 score[L]
  bars: Record<ScoreLayer, number>;     // 0–100 scaled strength (for the card bars)
  high: Record<ScoreLayer, boolean>;
  highCount: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const clamp01to100 = (x: number) => Math.max(0, Math.min(100, x));

/**
 * Derive the 追星靈魂 from the four picks' layer-cohesion summaries and the
 * user's onboarding weights (normalised, ~0.1–0.4 each).
 *
 *   score[L] = scaledStrength × recurrence × (1 + onboardingWeight)
 *
 * — overlap-weighted: a trait in 3 of 4 picks defines your taste, a lone
 * outlier is flavour, not signal.
 */
export function getArchetype(picks: PickSummary[], weights: Weights): ArchetypeResult {
  const strengths: LayerScores[] = picks.map((p) => p.layerScores);

  const scores = {} as Record<ScoreLayer, number>;
  const bars = {} as Record<ScoreLayer, number>;
  const high = {} as Record<ScoreLayer, boolean>;

  for (const L of SCORE_LAYERS) {
    const vals = strengths.map((s) => s[L]);
    const m = mean(vals);
    const recurrence = vals.length ? vals.filter((v) => v >= FLOOR[L]).length / vals.length : 0;
    const scaled = clamp01to100((m / SCALE[L]) * 100);
    const onboarding = Number.isFinite(weights[L]) ? weights[L] : 0.25;
    const score = scaled * recurrence * (1 + onboarding);
    scores[L] = score;
    bars[L] = Math.round(scaled);
    high[L] = score >= HIGH_THRESHOLD;
  }

  const code = SCORE_LAYERS.map((L) =>
    high[L] ? CODE_LETTER[L] : CODE_LETTER[L].toLowerCase(),
  ).join("");
  const archetype = ARCHETYPES[code] ?? ARCHETYPES.apsr;

  // lead = highest score; hidden = 2nd-highest (the recurring-but-secondary thread)
  const ranked = [...SCORE_LAYERS].sort((a, b) => scores[b] - scores[a]);
  const leadLayer = ranked[0];
  const hiddenLayer = ranked[1];
  const highCount = SCORE_LAYERS.filter((L) => high[L]).length;
  const colorStory = highCount === 4 ? LEGEND_STORY : COLOR_STORIES[leadLayer];

  return {
    code, archetype, leadLayer, hiddenLayer,
    dualityLine: DUALITY_LINES[hiddenLayer],
    colorStory, scores, bars, high, highCount,
  };
}

// ── Code relationships (the social / discovery loop) ───────────────────
const ALL_CODES = Object.keys(ARCHETYPES);

const isHigh = (code: string, i: number) => code[i] === code[i].toUpperCase();
const hamming = (a: string, b: string) =>
  a.split("").reduce((d, ch, i) => d + (ch.toLowerCase() === b[i].toLowerCase() && ch !== b[i] ? 1 : 0), 0);

/** 最合拍 — same taste family: codes that share 3 of 4 axes (Hamming distance 1). */
export function soulmateCodes(code: string): string[] {
  return ALL_CODES.filter((c) => hamming(code, c) === 1);
}

/** 互補型 — the discovery invitation: high exactly where you're low (full complement). */
export function expandCode(code: string): string {
  return code
    .split("")
    .map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()))
    .join("");
}

/** 契合度 — matching letters / 4, as a percentage. */
export function compatibilityPct(a: string, b: string): number {
  let match = 0;
  for (let i = 0; i < 4; i++) if (a[i] === b[i]) match++;
  return Math.round((match / 4) * 100);
}

/** 爬牆預測 — the hidden face points to the 1-high purist you'll climb the wall for. */
const PURIST_BY_LAYER: Record<ScoreLayer, string> = {
  aesthetic: "Apsr", personality: "aPsr", performance: "apSr", content: "apsR",
};
export function wallClimbType(hiddenLayer: ScoreLayer): Archetype {
  return ARCHETYPES[PURIST_BY_LAYER[hiddenLayer]];
}

/** Recommendation re-weight mask: UPPERCASE layer ×1.5, lowercase ×0.7. */
export function recWeightMask(code: string): Weights {
  const mask = {} as Weights;
  SCORE_LAYERS.forEach((L, i) => {
    mask[L] = isHigh(code, i) ? 1.5 : 0.7;
  });
  return mask;
}
