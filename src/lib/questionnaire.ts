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
import type { Loc, Locale } from "./i18n/config";

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
export interface Mood { id: string; label: Loc; sub: Loc }
export const MOODS: Mood[] = [
  { id: "darkLuxe",      label: { zh: "暗黑高級", en: "Dark luxe" },       sub: { zh: "黑與酒紅、低調奢華", en: "Black & wine red, quiet luxury" } },
  { id: "freshBright",   label: { zh: "清爽亮色", en: "Fresh & bright" },  sub: { zh: "明亮乾淨、天藍嫩黃", en: "Clean and bright, sky blue & soft yellow" } },
  { id: "streetEdge",    label: { zh: "街頭個性", en: "Street edge" },     sub: { zh: "丹寧街頭、颯氣大膽", en: "Denim streetwear, bold and fierce" } },
  { id: "dreamySweet",   label: { zh: "夢幻甜美", en: "Dreamy sweet" },    sub: { zh: "少女柔粉、仙氣薄紫", en: "Soft pinks and fairy lilac" } },
  { id: "retroChic",     label: { zh: "復古時髦", en: "Retro chic" },      sub: { zh: "Y2K古著、米駝橘調", en: "Y2K vintage, beige & camel tones" } },
  { id: "futuristicCool", label: { zh: "未來感酷", en: "Futuristic cool" }, sub: { zh: "金屬銀、電光螢光", en: "Metallic silver, electric neon" } },
  { id: "cleanClassic",  label: { zh: "優雅知性", en: "Elegant classic" }, sub: { zh: "端正知性、典雅乾淨", en: "Polished, refined, and clean" } },
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
  label: Loc;
  sub?: Loc;
  layer?: ScoreLayer;          // fallback layer for token-less options (→ weight nudge)
  tokens?: QToken[];           // controlled-vocab tokens implied (also derive nudge layer)
  derived?: "contrast" | "consistent";
  group?: Loc;                 // presentational cluster header (e.g. Q3's 3 groups)
}
export interface Question {
  id: string;
  title: Loc;
  layer: ScoreLayer | "mixed"; // primary layer (drives adaptive depth)
  options: QOption[];
  pickGrounded?: boolean;      // frame around the user's top pick by name
}

export const QUESTIONS: Question[] = [
  {
    id: "q1", title: { zh: "老實說，你是被哪個「瞬間」圈粉的？", en: "Honestly, which moment made you a fan?" }, layer: "mixed", pickGrounded: true,
    options: [
      { id: "stage", label: { zh: "一支直拍／一段舞台", en: "A fancam / a stage" }, sub: { zh: "那個舞台炸到你", en: "That stage blew you away" }, layer: "performance" },
      { id: "visual", label: { zh: "一張照片／一身造型", en: "A photo / a look" }, sub: { zh: "顏值與造型直擊", en: "Face and styling, direct hit" }, layer: "aesthetic" },
      { id: "variety", label: { zh: "一段綜藝或直播的反應", en: "A variety or livestream moment" }, sub: { zh: "反應太可愛", en: "Their reactions are too cute" }, layer: "personality", tokens: [{ field: "content_tone", values: ["comedic"] }] },
      { id: "daily", label: { zh: "一個私下、日常的片刻", en: "A private, everyday moment" }, sub: { zh: "那份真實感", en: "That feeling of realness" }, layer: "content", tokens: [{ field: "content_tone", values: ["intimate"] }, { field: "lifestyle_topics", values: ["居家日常"] }] },
    ],
  },
  {
    id: "q2", title: { zh: "如果他是你的朋友，他是哪一種？", en: "If they were your friend, which kind would they be?" }, layer: "personality",
    options: [
      { id: "calm", label: { zh: "安靜但很穩的那個", en: "The quiet but steady one" }, layer: "personality", tokens: [{ field: "energy_type", values: ["calm"] }] },
      { id: "high", label: { zh: "把氣氛炒起來的那個", en: "The one who hypes up the room" }, layer: "personality", tokens: [{ field: "energy_type", values: ["high energy"] }] },
      { id: "warm", label: { zh: "把你照顧得好好的那個", en: "The one who takes care of you" }, layer: "personality", tokens: [{ field: "energy_type", values: ["warm"] }] },
      { id: "mysterious", label: { zh: "你永遠猜不透的那個", en: "The one you can never figure out" }, layer: "personality", tokens: [{ field: "energy_type", values: ["mysterious"] }] },
    ],
  },
  {
    id: "q3", title: { zh: "你希望本命怎麼對待粉絲？", en: "How do you want your bias to treat fans?" }, layer: "personality",
    options: [
      { id: "formal", label: { zh: "王子／女王感的距離", en: "Prince/queen-like distance" }, group: { zh: "有點距離", en: "A little distance" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["formal"] }] },
      { id: "parasocial-close", label: { zh: "寵粉貼到不行", en: "Spoils fans like crazy" }, group: { zh: "暖到不行", en: "Impossibly warm" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["parasocial-close"] }] },
      { id: "aegyo-forward", label: { zh: "撒嬌可愛攻擊", en: "Aegyo cuteness attack" }, group: { zh: "暖到不行", en: "Impossibly warm" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["aegyo-forward"] }] },
      { id: "mischievous-charming", label: { zh: "調皮愛搗蛋", en: "Mischievous little menace" }, group: { zh: "玩心全開", en: "Full playful mode" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["mischievous-charming"] }] },
      { id: "4D-quirky", label: { zh: "天然呆 4D 笑點", en: "4D quirky humor" }, group: { zh: "玩心全開", en: "Full playful mode" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["4D-quirky"] }] },
      { id: "hype", label: { zh: "嗨翻全場", en: "Hypes up the whole room" }, group: { zh: "玩心全開", en: "Full playful mode" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["hype"] }] },
      { id: "playful", label: { zh: "玩心很重", en: "Seriously playful" }, group: { zh: "玩心全開", en: "Full playful mode" }, layer: "personality", tokens: [{ field: "fan_interaction", values: ["playful"] }] },
    ],
  },
  {
    id: "q4", title: { zh: "你愛的是反差，還是始終如一？", en: "Do you love the duality, or the consistency?" }, layer: "personality",
    options: [
      { id: "contrast", label: { zh: "反差萌", en: "The duality" }, sub: { zh: "台上一個樣、台下另一個樣", en: "One person on stage, another off" }, layer: "personality", derived: "contrast" },
      { id: "consistent", label: { zh: "始終如一", en: "Always the same" }, sub: { zh: "怎麼看都是同一個人", en: "The same person from every angle" }, layer: "personality", derived: "consistent" },
    ],
  },
  {
    id: "q5", title: { zh: "他做什麼的時候，你會突然超驕傲、甚至鼻酸？", en: "What makes you suddenly proud of them, even teary?" }, layer: "content",
    options: [
      { id: "grind", label: { zh: "拼命練習、把舞台做到最好", en: "Practicing relentlessly to perfect the stage" }, layer: "content", tokens: [{ field: "value_topics", values: ["努力哲學", "專業職人精神"] }] },
      { id: "self", label: { zh: "做自己、不管別人眼光", en: "Being themselves, no matter what anyone thinks" }, layer: "content", tokens: [{ field: "value_topics", values: ["自我認同", "自由奔放"] }] },
      { id: "vuln", label: { zh: "講出脆弱、真實的一面", en: "Opening up about their honest, vulnerable side" }, layer: "content", tokens: [{ field: "value_topics", values: ["心理健康倡議", "正向思考"] }] },
      { id: "humor", label: { zh: "自嘲耍笨、超會接梗", en: "Self-deprecating jokes and perfect comebacks" }, layer: "content", tokens: [{ field: "value_topics", values: ["幽默自嘲"] }] },
    ],
  },
  {
    id: "q6", title: { zh: "深夜睡不著，你會點開他的什麼？", en: "Can't sleep at night: what of theirs do you open?" }, layer: "content",
    options: [
      { id: "intimate", label: { zh: "他的 vlog／日常碎念", en: "Their vlog / daily rambles" }, layer: "content", tokens: [{ field: "content_tone", values: ["intimate"] }, { field: "lifestyle_topics", values: ["居家日常"] }] },
      { id: "hype", label: { zh: "他的舞台直拍", en: "Their stage fancams" }, layer: "performance", tokens: [{ field: "content_tone", values: ["hype"] }] },
      { id: "aesthetic", label: { zh: "他的美照、IG 限動", en: "Their photos and IG stories" }, layer: "aesthetic", tokens: [{ field: "content_tone", values: ["aesthetic"] }, { field: "lifestyle_topics", values: ["時尚", "攝影"] }] },
      { id: "comedic", label: { zh: "他的搞笑名場面", en: "Their funniest moments" }, layer: "personality", tokens: [{ field: "content_tone", values: ["comedic"] }] },
    ],
  },
  {
    id: "q7", title: { zh: "第一眼最容易電到你的視覺風格？", en: "Which visual style catches you at first glance?" }, layer: "aesthetic",
    options: MOODS.map((m) => ({ id: m.id, label: m.label, sub: m.sub, layer: "aesthetic" as ScoreLayer })),
  },
  {
    id: "q8", title: { zh: "他的舞台，電到你的是？", en: "On stage, what electrifies you?" }, layer: "performance",
    options: [
      { id: "powerful", label: { zh: "力量瞬間全開", en: "Full power, instantly" }, sub: { zh: "一個抓地、全場氣勢瞬間拉滿", en: "One move and the whole room ignites" }, layer: "performance", tokens: [{ field: "dance_style", values: ["powerful"] }] },
      { id: "fluid", label: { zh: "絲滑到像流水", en: "Silky like water" }, sub: { zh: "動作沒有一格是硬的", en: "Not a single stiff frame" }, layer: "performance", tokens: [{ field: "dance_style", values: ["fluid"] }] },
      { id: "precise", label: { zh: "精準到嚇人", en: "Scarily precise" }, sub: { zh: "每個點都卡在拍子上", en: "Every hit lands right on the beat" }, layer: "performance", tokens: [{ field: "dance_style", values: ["precise"] }] },
      { id: "rhythmic", label: { zh: "跟拍點抓到心跳", en: "Rhythm that syncs your heartbeat" }, sub: { zh: "律動感直接同步你的脈搏", en: "The groove locks onto your pulse" }, layer: "performance", tokens: [{ field: "dance_style", values: ["rhythmic"] }] },
      { id: "theatrical", label: { zh: "戲劇張力拉滿", en: "Maximum theatrical tension" }, sub: { zh: "舞台像在說一個故事", en: "The stage tells a story" }, layer: "performance", tokens: [{ field: "dance_style", values: ["theatrical fluid"] }] },
    ],
  },
  {
    id: "q9", title: { zh: "在團體裡，你的目光通常黏在誰身上？", en: "In a group, who does your eye stick to?" }, layer: "performance",
    options: [
      { id: "leader", label: { zh: "站在最前面、扛團的那個", en: "The one up front carrying the team" }, layer: "performance", tokens: [{ field: "roles", values: ["leader", "center"] }] },
      { id: "mainVocal", label: { zh: "主唱擔當", en: "The main vocalist" }, layer: "performance", tokens: [{ field: "roles", values: ["main vocalist"] }] },
      { id: "mainDancer", label: { zh: "主舞擔當", en: "The main dancer" }, layer: "performance", tokens: [{ field: "roles", values: ["main dancer"] }] },
      { id: "mainRapper", label: { zh: "饒舌擔當", en: "The main rapper" }, layer: "performance", tokens: [{ field: "roles", values: ["main rapper"] }] },
      { id: "maknae", label: { zh: "么弟么妹", en: "The maknae" }, layer: "performance", tokens: [{ field: "roles", values: ["maknae"] }] },
    ],
  },
];
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

// ── Adaptive depth (Mechanic 2) ────────────────────────────────────────
// Always-on core (entry feeling + the two most-loved personality questions).
// Q5/Q6/Q7 only at full depth when their layer is ranked high enough; otherwise
// they're inferred from the picks and skipped to cut fatigue.
export function selectQuestionIds(rank: ScoreLayer[]): string[] {
  const pos = (L: ScoreLayer) => { const i = rank.indexOf(L); return i === -1 ? 3 : i; };
  // Always-on core — one per layer minimum. q8/q9 give performance the core
  // presence it previously lacked (the root cause of performance under-nudging).
  const ids = ["q1", "q2", "q3", "q4", "q8", "q9"];
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

const ENERGY_TEXT: Record<string, Loc> = {
  warm: { zh: "暖系", en: "warm" },
  "high energy": { zh: "高能量", en: "high energy" },
  calm: { zh: "沉穩系", en: "calm" },
  mysterious: { zh: "神秘高冷", en: "mysterious" },
};
export const energyText = (locale: Locale, e: string) => ENERGY_TEXT[e]?.[locale] ?? e;

// ── Answer accumulation → weights + tokenPrefs ─────────────────────────
// Canonical field → layer map. The nudge layer is derived from which controlled-
// vocab field an option actually writes to (not a hand-tagged `layer`), so a
// cross-layer option like Q6's "他的舞台直拍" (content_tone) nudges the layer its
// vocabulary belongs to. Token-less options (Q4 contrast) fall back to `opt.layer`.
export const FIELD_TO_LAYER: Record<string, ScoreLayer> = {
  energy_type: "personality", fan_interaction: "personality",
  dance_style: "performance", roles: "performance",
  content_tone: "content", lifestyle_topics: "content", value_topics: "content",
  style_tags: "aesthetic", color_palette: "aesthetic",
};

// Which layer an answered option nudges: token-field-derived, else the manual tag.
export function optionLayer(opt: QOption): ScoreLayer | null {
  if (opt.tokens && opt.tokens.length) return FIELD_TO_LAYER[opt.tokens[0].field] ?? opt.layer ?? null;
  return opt.layer ?? null;
}

// Each layer gets the SAME total nudge budget, split across however many
// monochrome questions probe it — so a layer with 3 questions (personality)
// no longer out-nudges one with 2 (performance) just by question count. The
// per-layer total is then capped at the budget so mixed-question spillover
// (Q1) can't push any single layer past the ceiling.
const NUDGE_BUDGET = 0.30;
// Count of monochrome (single-layer) questions per layer, computed from the set.
const LAYER_Q_COUNT: Record<ScoreLayer, number> = (() => {
  const c: Record<ScoreLayer, number> = { aesthetic: 0, personality: 0, performance: 0, content: 0 };
  for (const q of QUESTIONS) {
    if (q.layer === "mixed") continue; // Q1 spans layers — handled per-option, not counted
    const layers = new Set<ScoreLayer>();
    for (const o of q.options) { const L = optionLayer(o); if (L) layers.add(L); }
    if (layers.size === 1) c[[...layers][0] as ScoreLayer] += 1;
  }
  return c;
})();

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

  // Accumulate nudges per layer, then cap each at NUDGE_BUDGET before applying.
  const nudge: Record<ScoreLayer, number> = { aesthetic: 0, personality: 0, performance: 0, content: 0 };

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
    const L = optionLayer(opt);
    if (L) nudge[L] += NUDGE_BUDGET / (LAYER_Q_COUNT[L] || 1);
    for (const t of opt.tokens ?? []) for (const v of t.values) addToken(t.field, v);
    if (opt.derived === "contrast") contrast = true;
    if (opt.derived === "consistent") contrast = false;
  }

  for (const t of state.extraTokens ?? []) {
    for (const v of t.values) addToken(t.field, v, t.field === "__diverse" ? -0.6 : 1.2);
  }

  // Confirm/outlier flavour bumps join the same per-layer accumulator.
  for (const L of SCORE_LAYERS) nudge[L] += state.layerNudges?.[L] ?? 0;

  // Apply, capped at the shared budget so no layer exceeds the ceiling.
  for (const L of SCORE_LAYERS) w[L] += Math.min(nudge[L], NUDGE_BUDGET);

  return { weights: normalize(w), tokenPrefs, contrast };
}

// ── Pick-grounded copy builders (component passes real names) ───────────
export const FRAMING: Record<Locale, {
  q1: (topName: string) => string;
  confirmAgree: (label: string) => string;
  confirmMore: string;
  confirmDiverse: string;
  outlier: (names: string[], outlierName: string, energyLabel: string) => string;
  outlierYes: string;
  outlierNo: string;
}> = {
  zh: {
    q1: (topName) => `先想想 ${topName}，你是被哪個「瞬間」圈粉的？`,
    confirmAgree: (label) => `你選的幾位氣場都偏「${label}」，想要更多這種，還是換個口味？`,
    confirmMore: "更多這種",
    confirmDiverse: "換個口味試試",
    outlier: (_names, outlierName, energyLabel) =>
      `你這四位大多走同一掛，只有 ${outlierName} 是${energyLabel}，那份反差也是你的菜嗎？`,
    outlierYes: "對，超愛",
    outlierNo: "還好，純屬意外",
  },
  en: {
    q1: (topName) => `Think about ${topName} first: which "moment" made you a fan?`,
    confirmAgree: (label) => `Your picks mostly lean "${label}". Want more of that, or a change of pace?`,
    confirmMore: "More of that",
    confirmDiverse: "Mix it up",
    outlier: (_names, outlierName, energyLabel) =>
      `Your four mostly run the same energy, except ${outlierName}, who's ${energyLabel}. Is that contrast your thing too?`,
    outlierYes: "Yes, I love it",
    outlierNo: "Nah, just a coincidence",
  },
};
