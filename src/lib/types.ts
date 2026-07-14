// ── Idol profile sub-types ─────────────────────────────────────────────
export interface IdolProfile {
  aesthetic:   {
    style_tags: string[]; color_palette: string[]; vibe: string; analysis?: string;
    official?: { style_tags: string[]; analysis: string };  // 官方造型 (albums, red carpet, brand deals, runway)
    personal?: { style_tags: string[]; analysis: string };  // 私服風格 (IG, airport, vlog off-duty style)
  }
  personality: { energy_type: string; fan_interaction: string; mbti?: string; vibe?: string; trait_tags?: string[]; analysis?: string }
  performance: { dance_style: string; vocal_type: string; stage_persona: string; roles: string[]; vibe?: string; trait_tags?: string[]; analysis?: string }
  content:     { topics: string[]; lifestyle_topics?: string[]; value_topics?: string[]; sns_platform: string[]; content_tone: string; vibe?: string; trait_tags?: string[]; analysis?: string }
  overview?:   { vibe: string; trait_tags: string[]; summary: string }  // 全部 combined card (deep-pass idols only)
}

// Shared filter type — drives both the analysis cards and similarity weighting
export type LayerFilter = "all" | "aesthetic" | "personality" | "performance" | "content";

export interface Weights {
  aesthetic:   number;
  personality: number;
  performance: number;
  content:     number;
}

export const DEFAULT_WEIGHTS: Weights = {
  aesthetic: 0.25, personality: 0.25, performance: 0.25, content: 0.25,
};

export interface LayerScores {
  aesthetic: number; personality: number; performance: number; content: number;
}

// Score-bearing layer keys (excludes "all"), in the canonical A·P·S·R code order.
export type ScoreLayer = "aesthetic" | "personality" | "performance" | "content";
export const SCORE_LAYERS: ScoreLayer[] = ["aesthetic", "personality", "performance", "content"];

// ── Pick summaries (questionnaire / archetype engine) ──────────────────
// Computed server-side from the user's 4 picks and shipped to the client so
// the archetype + questionnaire run WITHOUT importing the catalog.
export interface PickTokens {
  energy_type?: string;
  fan_interaction?: string;
  dance_style?: string;
  content_tone?: string;
  lifestyle_topics: string[];
  value_topics: string[];
  style_tags: string[];     // base + official + personal
  color_palette: string[];
}

export interface PickSummary {
  id: string;
  layerScores: LayerScores;  // mean pairwise similarity vs the OTHER picks, per layer
  tokens: PickTokens;
}

// ── Constellation (星圖) — force-graph of the user's picks + similar idols ──
export interface ConstellationNode {
  id: string;
  name: string;
  name_zh?: string | null;
  group?: string | null;
  image_url?: string | null;
  image_focus?: number | null;
  anchor: boolean;           // true = one of the user's 4 picks (a hub)
}

export interface ConstellationEdge {
  source: string;            // satellite id
  target: string;            // anchor id
  weight: number;            // 0..1 similarity
  layer: ScoreLayer;         // dominant layer for this pair → edge colour
}

export interface Constellation {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
}

// ── Core data types ────────────────────────────────────────────────────
export interface Artist {
  id: string;
  name: string;
  name_zh?: string | null;
  group?: string | null;
  genres: string[];
  generation?: 2 | 3 | 4 | 5;  // idol generation for 圖鑑 browsing
  popularity: number;
  followers?: number | null;
  image_url?: string | null;
  image_focus?: number | null;  // vertical focal point 0..1 for face alignment (default 0.3)
  instagram?: string | null;  // IG handle without @ (only confidently-verified accounts)
  profile?: IdolProfile;  // optional — old entries without profile still valid
}

export interface SimilarArtist {
  artist: Artist;
  score: number;
  layerScores: LayerScores;
  topTraits: string[];  // matching tokens for local fallback reason
  reasons: string[];    // zh-TW (AI-generated or local fallback)
}

export type EntityType = "artist";

export interface Favorite {
  entity_type: EntityType;
  entity_id: string;
}

export interface Catalog {
  artists: Artist[];
}

// ── User preferences (onboarding) ─────────────────────────────────────
// `topIdols` + `weights` are the original contract; the rest are added by
// the adaptive questionnaire and are all OPTIONAL so old prefs keep working.
export interface StoredArchetype {
  code: string;             // 4-letter A·P·S·R code, e.g. "APsr"
  hiddenLayer: ScoreLayer;  // 隱藏面 (2nd-highest layer)
}

export interface UserPrefs {
  topIdols: string[];
  weights: Weights;
  layerRank?: ScoreLayer[];            // user's #1→#4 layer ranking (入坑優先序)
  tokenPrefs?: Record<string, number>; // IDF-weighted desired tokens from Q1–Q7
  hiddenFace?: ScoreLayer | null;      // outlier-derived hidden bias
  archetype?: StoredArchetype | null;  // computed 追星靈魂
  contrast?: boolean | null;           // Q4: 反差萌 (true) vs 始終如一 (false)
  visualMood?: string | null;          // Q7 mood id (for the report's 視覺型)
  fanName?: string;                    // display name printed on the 追星證 (Fan ID)
  joinedAt?: string;                   // YYYY.MM.DD stamped once — 應援卡 "SINCE" date
  issuedAt?: string;                   // YYYY.MM.DD stamped once — 追星證 issue date
  serial?: string;                     // stable 追星證 ID (not a sequence)
}
