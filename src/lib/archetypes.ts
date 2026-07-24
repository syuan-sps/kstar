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

import type { LayerScores, PickSummary, ScoreLayer, StoredArchetype, Weights } from "./types";
import { SCORE_LAYERS } from "./types";
import type { Loc, Locale } from "./i18n/config";

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
export const LAYER_TEXT: Record<ScoreLayer, Loc> = {
  aesthetic: { zh: "美學", en: "Aesthetic" },
  personality: { zh: "個性", en: "Personality" },
  performance: { zh: "表演", en: "Performance" },
  content: { zh: "內容", en: "Content" },
};
export const layerLabel = (locale: Locale, L: ScoreLayer) => LAYER_TEXT[L][locale];

// ── The 16 archetypes ──────────────────────────────────────────────────
export interface Archetype {
  code: string;          // canonical mixed-case code, e.g. "APsr"
  enName: string;        // always-English name — the card subtitle in zh mode, the headline in en mode
  name: Loc;             // zh: the zhName; en: enName (decision: EN mode shows no Chinese)
  tagline: Loc;
  missing?: ScoreLayer;  // the one charming blind spot (3-high types)
}

export const ARCHETYPES: Record<string, Archetype> = {
  // 0 high — the omnivore
  apsr: { code: "apsr", enName: "Omnivore", name: { zh: "雜食型", en: "Omnivore" }, tagline: { zh: "你什麼都推得下去，雷達全開，沒有不能入的坑。", en: "You'll fall for anyone. Radar always on, no rabbit hole off-limits." } },
  // 1 high — the purists
  Apsr: { code: "Apsr", enName: "Visual Purist", name: { zh: "神顏控", en: "Visual Purist" }, tagline: { zh: "一眼就淪陷，長相就是一切。", en: "One glance and you're gone. The face is everything." } },
  aPsr: { code: "aPsr", enName: "Soul Catcher", name: { zh: "人格本命派", en: "Soul Catcher" }, tagline: { zh: "你愛的是那個人，不是那張臉。", en: "You love the person, not the face." } },
  apSr: { code: "apSr", enName: "Fancam Addict", name: { zh: "直拍上癮者", en: "Fancam Addict" }, tagline: { zh: "直拍循環一百遍，根本停不下來。", en: "A hundred fancam replays and counting, and you can't stop." } },
  apsR: { code: "apsR", enName: "Frequency Match", name: { zh: "頻率共鳴控", en: "Frequency Match" }, tagline: { zh: "他講的每句話，都像在說你。", en: "Everything they say feels like it's about you." } },
  // 2 high — the dualities (the screenshot tier)
  APsr: { code: "APsr", enName: "Gap Hunter", name: { zh: "高冷反差控", en: "Gap Hunter" }, tagline: { zh: "為了那張高冷臉留下，結果被私下的脫線樣收服。", en: "You stayed for the cool face, then got won over by their goofy side." } },
  ApSr: { code: "ApSr", enName: "Visual Beast", name: { zh: "視覺猛獸派", en: "Visual Beast" }, tagline: { zh: "畫報級長相＋舞台超狂，直接被雙殺。", en: "Magazine-cover looks plus a killer stage: a double knockout." } },
  ApsR: { code: "ApsR", enName: "Aesthetic Soul", name: { zh: "氛圍生活家", en: "Aesthetic Soul" }, tagline: { zh: "美得有質感，活得有溫度。", en: "Beautiful with substance, warm in real life." } },
  aPSr: { code: "aPSr", enName: "Charisma Bomb", name: { zh: "個性炸場王", en: "Charisma Bomb" }, tagline: { zh: "個性先收你，舞台再補一刀。", en: "Their personality gets you first, the stage finishes the job." } },
  aPsR: { code: "aPsR", enName: "Kindred Spirit", name: { zh: "真實共鳴派", en: "Kindred Spirit" }, tagline: { zh: "頻率對上，個性再補一刀。", en: "The frequency matches, then the personality seals it." } },
  apSR: { code: "apSR", enName: "On & Off", name: { zh: "台上台下控", en: "On & Off" }, tagline: { zh: "台上為他尖叫，台下被他融化。", en: "You scream for them on stage, melt for them off it." } },
  // 3 high — the near-perfect (one charming blind spot)
  APSr: { code: "APSr", enName: "Total Star", name: { zh: "完全巨星型", en: "Total Star" }, tagline: { zh: "除了沒空陪你聊天，他什麼都有。", en: "They have everything, except time to chat with you." }, missing: "content" },
  APsR: { code: "APsR", enName: "Soulmate Type", name: { zh: "戀人感本命", en: "Soulmate Type" }, tagline: { zh: "不用靠舞台，光是站在那裡你就淪陷。", en: "No stage needed; you fall just from them standing there." }, missing: "performance" },
  ApSR: { code: "ApSR", enName: "Triple Threat", name: { zh: "神級全才", en: "Triple Threat" }, tagline: { zh: "顏、舞台、共鳴全包，個性就留點神秘。", en: "Face, stage, and resonance all covered, while personality stays a little mysterious." }, missing: "personality" },
  aPSR: { code: "aPSR", enName: "Soulful All-Rounder", name: { zh: "靈魂全方位", en: "Soulful All-Rounder" }, tagline: { zh: "你根本不在乎長相，他的一切都對你的胃。", en: "You don't care about looks; everything else about them is your type." }, missing: "aesthetic" },
  // 4 high — the legend
  APSR: { code: "APSR", enName: "Hexagonal Warrior", name: { zh: "六邊形戰士", en: "Hexagonal Warrior" }, tagline: { zh: "完全沒有死角。能拿到這個結果的人，比你想的還少。", en: "No blind spots at all. Fewer people land this result than you'd think." } },
};

// 隱藏面 duality line — keyed by the hidden-face layer (2nd-highest score).
export const DUALITY_LINES: Record<ScoreLayer, Loc> = {
  aesthetic: { zh: "但你嘴上不說：那張臉，其實也是你留下來的原因。", en: "You won't admit it, but that face is part of why you stayed." },
  personality: { zh: "私底下你更在意的，是他到底是個怎樣的人。", en: "Deep down, what you care about most is who they really are." },
  performance: { zh: "真正讓你回放一百遍的，是他站上舞台的那一刻。", en: "What you replay a hundred times is the moment they take the stage." },
  content: { zh: "夜深了你還是會點開他的日常，那份共鳴騙不了人。", en: "Late at night you're still opening their daily posts, because that resonance doesn't lie." },
};

// Colour story — follows the single highest layer (rest stays neutral chrome).
export interface ColorStory { accent: string; soft: string; label: Loc }
export const COLOR_STORIES: Record<ScoreLayer, ColorStory> = {
  aesthetic:   { accent: "#56789f", soft: "#a7c0dc", label: { zh: "丹寧藍 × 鉻銀", en: "Denim Blue × Chrome Silver" } },   // cool, editorial
  personality: { accent: "#b4302b", soft: "#e6a6b8", label: { zh: "桃紅 × 螢光紫", en: "Hot Pink × Neon Violet" } },       // warm, loud
  performance: { accent: "#2f6fae", soft: "#7fb0dd", label: { zh: "青藍 × 鉻銀", en: "Electric Blue × Chrome Silver" } }, // electric, sharp
  content:     { accent: "#b0894e", soft: "#e8d6ad", label: { zh: "暖金 × 柔白", en: "Warm Gold × Soft White" } },        // intimate, cosy
};
// 六邊形戰士 uses the full chrome-rainbow story.
export const LEGEND_STORY: ColorStory = { accent: "#7c8088", soft: "#c8ccd2", label: { zh: "全鉻虹彩", en: "Full Chrome Spectrum" } };

// Per-layer bar colours (match SimilarIdolCard for consistency).
export const LAYER_COLOR: Record<ScoreLayer, string> = {
  aesthetic: "#4a4f57", personality: "#b4302b", performance: "#56789f", content: "#b9bdc4",
};

// Plain-語 meaning of each axis being high vs low — for the detailed report.
export const LAYER_MEANINGS: Record<ScoreLayer, { high: Loc; low: Loc }> = {
  aesthetic:   { high: { zh: "顏值與造型是你入坑的第一道門，你超吃視覺。", en: "Looks and styling are your first door in; you're all about the visual." }, low: { zh: "長相不是重點，你看的是別的東西。", en: "Looks aren't the point; you're drawn to something else." } },
  personality: { high: { zh: "你愛的是「那個人」本身：性格、為人、互動方式。", en: "You love the person themselves: their character, who they are, how they interact." }, low: { zh: "個性怎樣你沒那麼在意。", en: "Their personality isn't something you weigh that heavily." } },
  performance: { high: { zh: "舞台與直拍才是你的命，實力派收割機。", en: "The stage and fancams are your lifeblood: a skill-first stan." }, low: { zh: "舞台強不強，對你不是關鍵。", en: "How strong the stage is isn't the deciding factor for you." } },
  content:     { high: { zh: "日常、共鳴、私下的他：你要的是陪伴感。", en: "Daily life, resonance, who they are off-camera: you want that sense of companionship." }, low: { zh: "他發什麼內容，你比較不執著。", en: "What content they post matters less to you." } },
};

/** Coarse 高/中/低 label from a 0–100 bar value (for the report). */
export function barLabel(locale: Locale, pct: number): string {
  const tier = pct >= 60 ? "high" : pct >= 33 ? "mid" : "low";
  return locale === "en"
    ? { high: "High", mid: "Mid", low: "Low" }[tier]
    : { high: "高", mid: "中", low: "低" }[tier];
}

// ── Scoring ────────────────────────────────────────────────────────────
export interface ArchetypeResult {
  code: string;
  archetype: Archetype;
  leadLayer: ScoreLayer;            // single highest layer → colour story
  hiddenLayer: ScoreLayer;          // 2nd-highest → 隱藏面 / wall-climb seed
  dualityLine: Loc;
  colorStory: ColorStory;
  scores: Record<ScoreLayer, number>;   // 0–~140 score[L]
  bars: Record<ScoreLayer, number>;     // 0–100 scaled strength (for the card bars)
  high: Record<ScoreLayer, boolean>;
  highCount: number;
}

// Reapply the issued identity to freshly-derived score detail. Adaptive quiz
// nudges may change the stored code/hidden face, and every reopening surface
// must display that exact persisted identity while retaining live bars/scores.
export function reconcileStoredArchetype(
  derived: ArchetypeResult,
  stored?: StoredArchetype | null,
): ArchetypeResult {
  if (!stored || !ARCHETYPES[stored.code] || !SCORE_LAYERS.includes(stored.hiddenLayer)) return derived;
  const high = Object.fromEntries(
    SCORE_LAYERS.map((layer, index) => [layer, stored.code[index] === stored.code[index]?.toUpperCase()]),
  ) as ArchetypeResult["high"];
  return {
    ...derived,
    code: stored.code,
    archetype: ARCHETYPES[stored.code],
    hiddenLayer: stored.hiddenLayer,
    dualityLine: DUALITY_LINES[stored.hiddenLayer],
    high,
    highCount: SCORE_LAYERS.filter((layer) => high[layer]).length,
  };
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
