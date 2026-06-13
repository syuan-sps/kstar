// KStar 入坑問卷 — adaptive, fan-voice questionnaire.
//
// Surface = a feeling / moment / behaviour. Underneath = the same controlled-
// vocab tokens the audit confirmed 100% valid across all 355 idols. The flow
// ADAPTS to the user's four picks + their layer ranking:
//   · pick-grounded framing (questions name the picks)
//   · weight-driven depth (the #1 layer gets the deep question; #4 is inferred)
//   · confirm-or-refine when the picks already agree on a token
//   · outlier → flavour note when one pick breaks from the others
// Rare tokens are IDF-weighted (a match on `mysterious` 17/355 ≫ `真誠待粉` 212/355).

import type { PickSummary, PickTokens, ScoreLayer, Weights } from "./types";
import { SCORE_LAYERS } from "./types";
import { tokenWeight } from "./tokenStats";

// ── Layer ranking → weights ────────────────────────────────────────────
const RANK_WEIGHTS = [0.4, 0.3, 0.2, 0.1]; // #1 → #4, already sums to 1
export function rankToWeights(order: ScoreLayer[]): Weights {
  const w: Weights = { aesthetic: 0.25, personality: 0.25, performance: 0.25, content: 0.25 };
  order.forEach((L, i) => { if (L in w) w[L] = RANK_WEIGHTS[i] ?? 0.1; });
  return normalize(w);
}
function normalize(w: Weights): Weights {
  const sum = SCORE_LAYERS.reduce((s, L) => s + Math.max(0, w[L]), 0) || 1;
  return {
    aesthetic: Math.max(0, w.aesthetic) / sum,
    personality: Math.max(0, w.personality) / sum,
    performance: Math.max(0, w.performance) / sum,
    content: Math.max(0, w.content) / sum,
  };
}

// ── Q7 visual moods (7 — derived from real catalog tokens) ─────────────
export interface Mood { id: string; label: string; sub: string }
export const MOODS: Mood[] = [
  { id: "darkLuxe",      label: "暗黑高級", sub: "黑與酒紅、低調奢華" },
  { id: "freshBright",   label: "清爽亮色", sub: "明亮乾淨、天藍嫩黃" },
  { id: "streetEdge",    label: "街頭個性", sub: "丹寧街頭、颯氣大膽" },
  { id: "dreamySweet",   label: "夢幻甜美", sub: "少女柔粉、仙氣薄紫" },
  { id: "retroChic",     label: "復古時髦", sub: "Y2K古著、米駝橘調" },
  { id: "futuristicCool", label: "未來感酷", sub: "金屬銀、電光螢光" },
  { id: "cleanClassic",  label: "優雅知性", sub: "端正知性、典雅乾淨" },
];

// Base-token (substring) + accent-color sets per mood. 白/黑 are intentionally
// omitted from colours — they're near-universal and don't discriminate.
export const MOOD_TOKENS: Record<string, { style: string[]; color: string[] }> = {
  darkLuxe:      { style: ["暗黑", "高級", "質感", "低調", "沉穩", "氣場", "性感", "奢華", "貴族", "皮衣", "皮革", "冷感"], color: ["酒紅", "古銅", "緋紅", "暗紅", "深紅"] },
  freshBright:   { style: ["明亮", "清新", "清爽", "乾淨", "陽光", "亮眼", "清雅", "純真", "活力", "清透", "亮色", "清澈"], color: ["天藍", "冰藍", "嫩黃", "亮黃", "薄荷", "蜜桃", "珊瑚"] },
  streetEdge:    { style: ["街頭", "個性", "嘻哈", "運動", "古著", "隨性", "自由", "大膽", "颯", "酷感", "都會", "混搭"], color: ["丹寧藍", "牛仔藍", "卡其", "軍綠", "橄欖綠", "大地色", "棕"] },
  dreamySweet:   { style: ["少女", "柔和", "柔美", "柔軟", "俏皮", "溫柔", "親和", "甜美", "仙氣", "夢幻", "公主", "奶油"], color: ["粉", "薄紫", "薰衣草", "玫瑰", "覆盆莓"] },
  retroChic:     { style: ["復古", "古著", "Y2K", "華麗", "膠片", "搖滾", "爵士", "都會復古"], color: ["米", "燕麥", "駝", "咖啡棕", "橘"] },
  futuristicCool: { style: ["未來", "前衛", "酷", "金屬", "實驗", "簡約", "中性"], color: ["銀", "金屬", "電光", "霓虹", "螢光", "霧藍", "珍珠"] },
  cleanClassic:  { style: ["端正", "知性", "典雅", "優雅", "端莊", "乾淨", "清雅", "氛圍", "精緻", "知書", "書卷"], color: ["米白", "奶白", "淺灰", "灰白"] },
};

// IDF-weighted affinity of a pick's aesthetics to a mood (substring on style,
// exact-ish on accent colour). Used to detect when the picks agree visually.
export function moodAffinity(tokens: PickTokens, moodId: string): number {
  const m = MOOD_TOKENS[moodId];
  if (!m) return 0;
  let score = 0;
  for (const tag of tokens.style_tags) {
    for (const base of m.style) {
      if (tag.includes(base)) { score += tokenWeight("style_tags", tag); break; }
    }
  }
  for (const col of tokens.color_palette) {
    for (const base of m.color) {
      if (col.includes(base)) { score += tokenWeight("color_palette", col) * 0.8; break; }
    }
  }
  return score;
}
export function dominantMood(tokens: PickTokens): string {
  let best = MOODS[0].id, bestScore = -1;
  for (const mo of MOODS) {
    const s = moodAffinity(tokens, mo.id);
    if (s > bestScore) { bestScore = s; best = mo.id; }
  }
  return best;
}

// ── Question definitions ───────────────────────────────────────────────
export interface QToken { field: string; values: string[] }
export interface QOption {
  id: string;
  label: string;
  sub?: string;
  layer?: ScoreLayer;          // which layer this answer emphasises (→ weight nudge)
  tokens?: QToken[];           // controlled-vocab tokens implied
  derived?: "contrast" | "consistent";
}
export interface Question {
  id: string;
  title: string;
  layer: ScoreLayer | "mixed"; // primary layer (drives adaptive depth)
  options: QOption[];
  pickGrounded?: boolean;      // frame around the user's top pick by name
}

export const QUESTIONS: Question[] = [
  {
    id: "q1", title: "老實說 — 你是被哪個「瞬間」圈粉的？", layer: "mixed", pickGrounded: true,
    options: [
      { id: "stage", label: "一支直拍／一段舞台", sub: "那個舞台炸到你", layer: "performance" },
      { id: "visual", label: "一張照片／一身造型", sub: "顏值與造型直擊", layer: "aesthetic" },
      { id: "variety", label: "一段綜藝或直播的反應", sub: "反應太可愛", layer: "personality", tokens: [{ field: "content_tone", values: ["comedic"] }] },
      { id: "daily", label: "一個私下、日常的片刻", sub: "那份真實感", layer: "content", tokens: [{ field: "content_tone", values: ["intimate"] }, { field: "lifestyle_topics", values: ["居家日常"] }] },
    ],
  },
  {
    id: "q2", title: "如果他是你的朋友，他是哪一種？", layer: "personality",
    options: [
      { id: "calm", label: "安靜但很穩的那個", layer: "personality", tokens: [{ field: "energy_type", values: ["calm"] }] },
      { id: "high", label: "把氣氛炒起來的那個", layer: "personality", tokens: [{ field: "energy_type", values: ["high energy"] }] },
      { id: "warm", label: "把你照顧得好好的那個", layer: "personality", tokens: [{ field: "energy_type", values: ["warm"] }] },
      { id: "mysterious", label: "你永遠猜不透的那個", layer: "personality", tokens: [{ field: "energy_type", values: ["mysterious"] }] },
    ],
  },
  {
    id: "q3", title: "你希望本命怎麼對待粉絲？", layer: "personality",
    options: [
      { id: "formal", label: "王子／女王感的距離", layer: "personality", tokens: [{ field: "fan_interaction", values: ["formal"] }] },
      { id: "parasocial-close", label: "寵粉貼到不行", layer: "personality", tokens: [{ field: "fan_interaction", values: ["parasocial-close"] }] },
      { id: "aegyo-forward", label: "撒嬌可愛攻擊", layer: "personality", tokens: [{ field: "fan_interaction", values: ["aegyo-forward"] }] },
      { id: "mischievous-charming", label: "調皮愛搗蛋", layer: "personality", tokens: [{ field: "fan_interaction", values: ["mischievous-charming"] }] },
      { id: "4D-quirky", label: "天然呆 4D 笑點", layer: "personality", tokens: [{ field: "fan_interaction", values: ["4D-quirky"] }] },
      { id: "hype", label: "嗨翻全場", layer: "personality", tokens: [{ field: "fan_interaction", values: ["hype"] }] },
      { id: "playful", label: "玩心很重", layer: "personality", tokens: [{ field: "fan_interaction", values: ["playful"] }] },
    ],
  },
  {
    id: "q4", title: "你愛的是反差，還是始終如一？", layer: "personality",
    options: [
      { id: "contrast", label: "反差萌", sub: "台上一個樣、台下另一個樣", layer: "personality", derived: "contrast" },
      { id: "consistent", label: "始終如一", sub: "怎麼看都是同一個人", layer: "personality", derived: "consistent" },
    ],
  },
  {
    id: "q5", title: "他做什麼的時候，你會突然超驕傲、甚至鼻酸？", layer: "content",
    options: [
      { id: "grind", label: "拼命練習、把舞台做到最好", layer: "content", tokens: [{ field: "value_topics", values: ["努力哲學", "專業職人精神"] }] },
      { id: "self", label: "做自己、不管別人眼光", layer: "content", tokens: [{ field: "value_topics", values: ["自我認同", "自由奔放"] }] },
      { id: "vuln", label: "講出脆弱、真實的一面", layer: "content", tokens: [{ field: "value_topics", values: ["心理健康倡議", "正向思考"] }] },
      { id: "humor", label: "自嘲耍笨、超會接梗", layer: "content", tokens: [{ field: "value_topics", values: ["幽默自嘲"] }] },
    ],
  },
  {
    id: "q6", title: "深夜睡不著，你會點開他的什麼？", layer: "content",
    options: [
      { id: "intimate", label: "他的 vlog／日常碎念", layer: "content", tokens: [{ field: "content_tone", values: ["intimate"] }, { field: "lifestyle_topics", values: ["居家日常"] }] },
      { id: "hype", label: "他的舞台直拍", layer: "performance", tokens: [{ field: "content_tone", values: ["hype"] }] },
      { id: "aesthetic", label: "他的美照、IG 限動", layer: "aesthetic", tokens: [{ field: "content_tone", values: ["aesthetic"] }, { field: "lifestyle_topics", values: ["時尚", "攝影"] }] },
      { id: "comedic", label: "他的搞笑名場面", layer: "personality", tokens: [{ field: "content_tone", values: ["comedic"] }] },
    ],
  },
  {
    id: "q7", title: "第一眼最容易電到你的視覺風格？", layer: "aesthetic",
    options: MOODS.map((m) => ({ id: m.id, label: m.label, sub: m.sub, layer: "aesthetic" as ScoreLayer })),
  },
];
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

// ── Adaptive depth (Mechanic 2) ────────────────────────────────────────
// Always-on core (entry feeling + the two most-loved personality questions).
// Q5/Q6/Q7 only at full depth when their layer is ranked high enough; otherwise
// they're inferred from the picks and skipped to cut fatigue.
export function selectQuestionIds(rank: ScoreLayer[]): string[] {
  const pos = (L: ScoreLayer) => { const i = rank.indexOf(L); return i === -1 ? 3 : i; };
  const ids = ["q1", "q2", "q3", "q4"];
  if (pos("content") <= 1 || pos("personality") <= 1) ids.push("q5"); // values
  if (pos("content") <= 2) ids.push("q6");                            // content tone
  ids.push("q7");                                                     // visual — always, depth via confirm/refine
  return ids;
}

// ── Confirm-or-refine + outlier detection (Mechanics 3 & 4) ────────────
type SingleField = "energy_type" | "fan_interaction" | "content_tone";

/** The token ≥3 of 4 picks share on a single-value field, else null. */
export function agreedToken(picks: PickSummary[], field: SingleField): string | null {
  const counts = new Map<string, number>();
  for (const p of picks) {
    const t = p.tokens[field];
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: string | null = null, bestN = 0;
  for (const [t, n] of counts) if (n > bestN) { best = t; bestN = n; }
  return bestN >= 3 ? best : null;
}

/** The mood ≥3 of 4 picks share visually, else null. */
export function agreedMood(picks: PickSummary[]): string | null {
  const counts = new Map<string, number>();
  for (const p of picks) {
    const m = dominantMood(p.tokens);
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  let best: string | null = null, bestN = 0;
  for (const [m, n] of counts) if (n > bestN) { best = m; bestN = n; }
  return bestN >= 3 ? best : null;
}

/** Exactly one pick whose energy breaks from a 3-way-agreed majority. */
export function energyOutlier(picks: PickSummary[]): { index: number; energy: string; majority: string } | null {
  const energies = picks.map((p) => p.tokens.energy_type ?? "");
  const counts = new Map<string, number>();
  for (const e of energies) if (e) counts.set(e, (counts.get(e) ?? 0) + 1);
  let majority: string | null = null, maxN = 0;
  for (const [e, n] of counts) if (n > maxN) { majority = e; maxN = n; }
  if (maxN !== 3 || !majority) return null;
  const index = energies.findIndex((e) => e && e !== majority);
  if (index === -1) return null;
  return { index, energy: energies[index], majority };
}

const ENERGY_ZH: Record<string, string> = { warm: "暖系", "high energy": "高能量", calm: "沉穩系", mysterious: "神秘高冷" };
export const energyZh = (e: string) => ENERGY_ZH[e] ?? e;

// ── Answer accumulation → weights + tokenPrefs ─────────────────────────
const LAYER_NUDGE = 0.12;

export interface QuizResult {
  weights: Weights;
  tokenPrefs: Record<string, number>;  // IDF-weighted desired tokens
  contrast: boolean | null;            // Q4 derived (反差 vs 始終如一)
}

export interface AnswerState {
  rank: ScoreLayer[];
  // questionId | "confirm:<field>" | "outlier" → selected option id
  answers: Record<string, string>;
  // tokens captured directly (confirm token boosts; __diverse de-boosts; outlier token)
  extraTokens?: QToken[];
  // extra per-layer weight nudges from confirm/refine + outlier screens
  layerNudges?: Partial<Record<ScoreLayer, number>>;
}

/**
 * Fold the ranking + all answered options into final weights + tokenPrefs.
 * "更多這種" (confirm) boosts; "換個口味" (refine) spreads; outlier "對超愛"
 * adds the outlier token as a flavour boost.
 */
export function computeQuizResult(state: AnswerState): QuizResult {
  const w = rankToWeights(state.rank);
  const tokenPrefs: Record<string, number> = {};
  let contrast: boolean | null = null;

  const addToken = (field: string, value: string, mult = 1) => {
    tokenPrefs[value] = (tokenPrefs[value] ?? 0) + tokenWeight(field, value) * mult;
  };

  for (const [key, optId] of Object.entries(state.answers)) {
    if (key.startsWith("confirm:")) {
      // optId is "more" | "diverse"; the agreed token rides in extraTokens
      continue;
    }
    if (key === "outlier") continue;
    const q = QUESTION_BY_ID[key];
    if (!q) continue;
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) continue;
    if (opt.layer) w[opt.layer] += LAYER_NUDGE;
    for (const t of opt.tokens ?? []) for (const v of t.values) addToken(t.field, v);
    if (opt.derived === "contrast") contrast = true;
    if (opt.derived === "consistent") contrast = false;
  }

  for (const t of state.extraTokens ?? []) {
    for (const v of t.values) addToken(t.field, v, t.field === "__diverse" ? -0.6 : 1.2);
  }

  for (const L of SCORE_LAYERS) {
    const n = state.layerNudges?.[L];
    if (n) w[L] += n;
  }

  return { weights: normalize(w), tokenPrefs, contrast };
}

// ── Pick-grounded copy builders (component passes real names) ───────────
export const framing = {
  q1: (topName: string) => `先想想 ${topName} — 你是被哪個「瞬間」圈粉的？`,
  confirmAgree: (label: string) => `你選的幾位氣場都偏「${label}」 — 想要更多這種，還是換個口味？`,
  confirmMore: "更多這種",
  confirmDiverse: "換個口味試試",
  outlier: (names: string[], outlierName: string, energyLabel: string) =>
    `你這四位大多走同一掛，只有 ${outlierName} 是${energyLabel} — 那份反差，也是你的菜嗎？`,
  outlierYes: "對，超愛",
  outlierNo: "還好，純屬意外",
};
