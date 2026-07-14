// Helpers for the similar-idol recommendation cards:
// emoji vibe tags (from 內容/個性 data) and locally computed
// personalized reasons (from the user's onboarding top idols).
import type { Artist } from "./types";
import type { Locale } from "./i18n/config";

const LIFESTYLE_EMOJI: Record<string, string> = {
  "時尚": "👗", "美食": "🍜", "遊戲": "🎮", "健身": "💪",
  "旅遊": "✈️", "動物": "🐾", "藝術": "🎨", "攝影": "📷",
  "音樂創作": "🎵", "美妝": "💄", "居家日常": "🏠", "戶外活動": "🌿",
};

// Closed-vocab EN labels for the same zh topic keys — hand-authored (not
// AI-translated) since emoji maps and quiz options key off them directly.
const TOPIC_EN: Record<string, string> = {
  "時尚": "Fashion", "美食": "Food", "遊戲": "Gaming", "健身": "Fitness",
  "旅遊": "Travel", "動物": "Pets", "藝術": "Art", "攝影": "Photography",
  "音樂創作": "Music-making", "美妝": "Beauty", "居家日常": "Home life", "戶外活動": "Outdoors",
  "自信表達": "Confidence", "心理健康倡議": "Mental health advocacy", "真誠待粉": "Genuine with fans",
  "家庭觀": "Family values", "努力哲學": "Grind philosophy", "自我認同": "Self-identity",
  "公益環保": "Charity & eco-consciousness", "幽默自嘲": "Self-deprecating humor",
  "專業職人精神": "Professional craftsmanship", "自由奔放": "Free-spirited", "正向思考": "Positive thinking",
};

/** Display label for a closed-vocab zh topic (lifestyle/value) — zh passes through. */
export function topicLabel(locale: Locale, topic: string): string {
  return locale === "en" ? TOPIC_EN[topic] ?? topic : topic;
}

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

// Hand-authored EN prettification for the same engine-token keys as TOKEN_ZH.
const TOKEN_EN: Record<string, string> = {
  "warm": "Warm", "mysterious": "Mysterious", "calm": "Calm", "high energy": "High Energy",
  "parasocial-close": "Fan-Close", "formal": "Formal & Polished", "hype": "Hype",
  "playful": "Playful", "4D-quirky": "4D Quirky", "aegyo-forward": "Aegyo",
  "mischievous-charming": "Mischievous",
  "powerful": "Powerful Dancer", "fluid": "Fluid Dancer", "rhythmic": "Rhythmic Dancer",
  "precise": "Precise Dancer", "theatrical fluid": "Theatrical Dancer",
  "main vocalist": "Main Vocalist", "lead vocalist": "Lead Vocalist", "vocalist": "Vocalist",
  "main dancer": "Main Dancer", "lead dancer": "Lead Dancer", "dancer": "Dancer",
  "main rapper": "Main Rapper", "lead rapper": "Lead Rapper", "rapper": "Rapper",
  "leader": "Leader", "center": "Center", "visual": "Visual", "maknae": "Maknae",
  "face of group": "Face of the Group", "killing part specialist": "Killing Part Specialist",
  "lyricist": "Lyricist", "songwriter": "Songwriter", "actress": "Actress",
};

/** Translate a display trait per locale. In EN mode, an untranslated zh
 *  literal (not yet covered by the catalog translation pass) is hidden
 *  rather than leaking Chinese into the UI. */
export function displayTrait(locale: Locale, token: string): string | null {
  if (locale !== "en") return zhTrait(token);
  if (TOKEN_EN[token]) return TOKEN_EN[token];
  if (TOPIC_EN[token]) return TOPIC_EN[token];
  if (/[一-鿿]/.test(token)) return null;
  return token;
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
  allArtists: Artist[],
  locale: Locale = "zh"
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
    return locale === "en"
      ? `Because ${best.idol.name}, one of your picks, also loves ${topicLabel(locale, best.topics[0])}`
      : `因為你喜歡的${best.idol.name}也愛${best.topics[0]}`;
  }
  if (best && best.values.length > 0) {
    return locale === "en"
      ? `Because ${best.idol.name}, one of your picks, also values ${topicLabel(locale, best.values[0])}`
      : `因為你喜歡的${best.idol.name}也重視${best.values[0]}`;
  }
  if (energyMatch) {
    return locale === "en"
      ? `Has a similar vibe to your pick ${energyMatch.name}`
      : `氣質和你喜歡的${energyMatch.name}很像`;
  }
  return null;
}
