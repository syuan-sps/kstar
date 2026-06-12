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

// ── Core data types ────────────────────────────────────────────────────
export interface Artist {
  id: string;
  name: string;
  name_zh?: string | null;
  group?: string | null;
  genres: string[];
  popularity: number;
  followers?: number | null;
  image_url?: string | null;
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
export interface UserPrefs {
  topIdols: string[];
  weights: Weights;
}
