// Helpers for the similar-idol recommendation cards:
// emoji vibe tags (from 內容/個性 data) and locally computed
// personalized reasons (from the user's onboarding top idols).
import type { Artist } from "./types";

const LIFESTYLE_EMOJI: Record<string, string> = {
  "時尚": "👗", "美食": "🍜", "遊戲": "🎮", "健身": "💪",
  "旅遊": "✈️", "動物": "🐾", "藝術": "🎨", "攝影": "📷",
  "音樂創作": "🎵", "美妝": "💄", "居家日常": "🏠", "戶外活動": "🌿",
};

const ENERGY_EMOJI: Record<string, string> = {
  "warm": "☀️", "mysterious": "🌙", "calm": "🌊", "high energy": "⚡",
};

const VALUE_EMOJI: Record<string, string> = {
  "自信表達": "✨", "心理健康倡議": "🫂", "真誠待粉": "💌", "家庭觀": "🏡",
  "努力哲學": "🔥", "自我認同": "🪞", "公益環保": "🌱", "幽默自嘲": "😆",
  "專業職人精神": "🛠️", "自由奔放": "🕊️", "正向思考": "🌞",
};

/** Up to 3 emojis: 2 lifestyle topics + 1 energy type (value topic as fallback). */
export function emojiTags(artist: Artist): string[] {
  const out: string[] = [];
  const c = artist.profile?.content;
  const p = artist.profile?.personality;
  for (const t of c?.lifestyle_topics ?? []) {
    if (out.length >= 2) break;
    const e = LIFESTYLE_EMOJI[t];
    if (e) out.push(e);
  }
  const energy = p?.energy_type ? ENERGY_EMOJI[p.energy_type] : undefined;
  if (energy) {
    out.push(energy);
  } else {
    const v = (c?.value_topics ?? []).map((t) => VALUE_EMOJI[t]).find(Boolean);
    if (v) out.push(v);
  }
  return out;
}

// English engine tokens (energy_type / fan_interaction / dance_style / roles)
// that can leak into topTraits — display them in zh-TW on the cards.
const TOKEN_ZH: Record<string, string> = {
  "warm": "溫暖系", "mysterious": "神秘系", "calm": "沉穩系", "high energy": "高能量",
  "parasocial-close": "寵粉互動", "formal": "端正禮貌", "hype": "氣氛製造",
  "playful": "愛玩鬧", "4D-quirky": "四次元", "aegyo-forward": "撒嬌系",
  "mischievous-charming": "搗蛋魅力",
  "powerful": "力量型舞風", "fluid": "流線舞風", "rhythmic": "律動舞風",
  "precise": "精準舞風", "theatrical fluid": "劇場舞風",
  "main vocalist": "主唱", "lead vocalist": "領唱", "vocalist": "歌手",
  "main dancer": "主舞", "lead dancer": "領舞", "dancer": "舞者",
  "main rapper": "主饒舌", "lead rapper": "領饒舌", "rapper": "饒舌",
  "leader": "隊長", "center": "C位", "visual": "門面", "maknae": "么弟么妹",
  "face of group": "門面擔當", "killing part specialist": "Killing Part",
  "lyricist": "作詞", "songwriter": "詞曲創作", "actress": "演員",
};

/** Translate engine tokens to zh-TW for display; zh tokens pass through. */
export function zhTrait(token: string): string {
  return TOKEN_ZH[token] ?? token;
}

function overlap(a?: string[], b?: string[]): string[] {
  if (!a || !b) return [];
  const sb = new Set(b);
  return a.filter((t) => sb.has(t));
}

/**
 * 「因為你喜歡的Karina也愛遊戲」— picks the user's top idol with the most
 * lifestyle overlap with the candidate. Falls back to value topics, then
 * energy type. Returns null when there's no usable overlap (caller falls
 * back to the AI/local reason).
 */
export function personalReason(
  candidate: Artist,
  topIdolIds: string[],
  allArtists: Artist[]
): string | null {
  if (!topIdolIds.length) return null;
  const byId = new Map(allArtists.map((a) => [a.id, a]));
  const cc = candidate.profile?.content;
  const cp = candidate.profile?.personality;

  let best: { idol: Artist; topics: string[]; values: string[] } | null = null;
  let energyMatch: Artist | null = null;

  for (const id of topIdolIds) {
    if (id === candidate.id) continue;
    const idol = byId.get(id);
    if (!idol?.profile) continue;
    const topics = overlap(cc?.lifestyle_topics, idol.profile.content?.lifestyle_topics);
    const values = overlap(cc?.value_topics, idol.profile.content?.value_topics);
    const score = topics.length * 2 + values.length;
    const bestScore = best ? best.topics.length * 2 + best.values.length : 0;
    if (score > bestScore) best = { idol, topics, values };
    if (!energyMatch && cp?.energy_type && idol.profile.personality?.energy_type === cp.energy_type) {
      energyMatch = idol;
    }
  }

  if (best && best.topics.length > 0) {
    return `因為你喜歡的${best.idol.name}也愛${best.topics[0]}`;
  }
  if (best && best.values.length > 0) {
    return `因為你喜歡的${best.idol.name}也重視${best.values[0]}`;
  }
  if (energyMatch) {
    return `氣質和你喜歡的${energyMatch.name}很像`;
  }
  return null;
}
