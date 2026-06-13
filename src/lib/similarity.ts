import type { Artist, SimilarArtist, Weights, LayerScores } from "./types";
import { DEFAULT_WEIGHTS } from "./types";

// ── Jaccard similarity on string arrays ───────────────────────────────
function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 && sb.size === 0) return 0;
  let inter = 0;
  for (const g of sa) if (sb.has(g)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function sharedTokens(a: string[], b: string[]): string[] {
  const sb = new Set(b);
  return a.filter((t) => sb.has(t));
}

// ── MBTI dichotomy similarity (0..1 over 4 axes) ───────────────────────
function mbtiScore(a?: string, b?: string): number {
  if (!a || !b || a.length < 4 || b.length < 4) return 0.5; // neutral when unknown
  let match = 0;
  for (let i = 0; i < 4; i++) if (a[i] === b[i]) match++;
  return match / 4;
}

// ── Layer scorers ─────────────────────────────────────────────────────
function aestheticScore(a: Artist, b: Artist): { score: number; traits: string[] } {
  if (!a.profile || !b.profile) return { score: 0, traits: [] };
  const pa = a.profile.aesthetic;
  const pb = b.profile.aesthetic;
  // 官方造型/私服風格 tags (when present) join the token pool
  const extra = (p: typeof pa) => [
    ...(p.official?.style_tags ?? []),
    ...(p.personal?.style_tags ?? []),
  ];
  const tokens_a = [...pa.style_tags, ...pa.color_palette, ...pa.vibe.split(" "), ...extra(pa)];
  const tokens_b = [...pb.style_tags, ...pb.color_palette, ...pb.vibe.split(" "), ...extra(pb)];
  const score = jaccard(tokens_a, tokens_b);
  const traits = sharedTokens(pa.style_tags, pb.style_tags);
  return { score, traits };
}

function personalityScore(a: Artist, b: Artist): { score: number; traits: string[] } {
  if (!a.profile || !b.profile) return { score: 0, traits: [] };
  const pa = a.profile.personality;
  const pb = b.profile.personality;
  const energyMatch = pa.energy_type === pb.energy_type ? 1 : 0;
  const fanMatch    = pa.fan_interaction === pb.fan_interaction ? 1 : 0;
  const mbti        = mbtiScore(pa.mbti, pb.mbti);
  const score = energyMatch * 0.4 + fanMatch * 0.3 + mbti * 0.3;
  const traits: string[] = [];
  if (energyMatch) traits.push(pa.energy_type);
  if (fanMatch) traits.push(pa.fan_interaction);
  return { score, traits };
}

function performanceScore(a: Artist, b: Artist): { score: number; traits: string[] } {
  if (!a.profile || !b.profile) return { score: 0, traits: [] };
  const pa = a.profile.performance;
  const pb = b.profile.performance;
  const tokens_a = [...pa.roles, ...pa.vocal_type.split("-"), ...pa.stage_persona.split(" ")];
  const tokens_b = [...pb.roles, ...pb.vocal_type.split("-"), ...pb.stage_persona.split(" ")];
  const danceBonus = pa.dance_style === pb.dance_style ? 0.15 : 0;
  const score = Math.min(1, jaccard(tokens_a, tokens_b) + danceBonus);
  const traits = sharedTokens(pa.roles, pb.roles);
  if (pa.dance_style === pb.dance_style) traits.unshift(pa.dance_style);
  return { score, traits };
}

function contentScore(a: Artist, b: Artist): { score: number; traits: string[] } {
  if (!a.profile || !b.profile) return { score: 0, traits: [] };
  const pa = a.profile.content;
  const pb = b.profile.content;
  const toneBonus = pa.content_tone === pb.content_tone ? 0.1 : 0;

  // Legacy fallback for entries without the zh-TW pools
  if (!pa.lifestyle_topics || !pb.lifestyle_topics) {
    const tokens_a = [...pa.topics, ...pa.sns_platform];
    const tokens_b = [...pb.topics, ...pb.sns_platform];
    const score = Math.min(1, jaccard(tokens_a, tokens_b) + toneBonus);
    return { score, traits: sharedTokens(pa.topics, pb.topics) };
  }

  // Split-pool scoring: lifestyle topics dominate, values/worldview secondary
  const LIFESTYLE_W = 0.65;
  const VALUE_W = 0.35;
  const lifestyle = jaccard(pa.lifestyle_topics, pb.lifestyle_topics);
  const values = jaccard(pa.value_topics ?? [], pb.value_topics ?? []);
  const score = Math.min(1, lifestyle * LIFESTYLE_W + values * VALUE_W + toneBonus);
  const traits = [
    ...sharedTokens(pa.lifestyle_topics, pb.lifestyle_topics),
    ...sharedTokens(pa.value_topics ?? [], pb.value_topics ?? []),
  ];
  return { score, traits };
}

// ── Genre / popularity fallback (for artists without profiles) ─────────
function genreScore(a: Artist, b: Artist): number {
  return jaccard(a.genres, b.genres);
}
function popularityScore(a: Artist, b: Artist): number {
  return 1 - Math.abs(a.popularity - b.popularity) / 100;
}

// ── Main export ────────────────────────────────────────────────────────
export function similarArtists(
  target: Artist,
  pool: Artist[],
  weights?: Partial<Weights>,
  limit = 12,
): SimilarArtist[] {
  const w: Weights = { ...DEFAULT_WEIGHTS, ...weights };

  return pool
    .filter((a) => a.id !== target.id)
    .map((a) => {
      const hasProfile = Boolean(target.profile && a.profile);

      let score: number;
      let layerScores: LayerScores;
      const allTraits: string[] = [];

      if (hasProfile) {
        const aes  = aestheticScore(target, a);
        const per  = personalityScore(target, a);
        const perf = performanceScore(target, a);
        const con  = contentScore(target, a);

        layerScores = {
          aesthetic:   aes.score,
          personality: per.score,
          performance: perf.score,
          content:     con.score,
        };

        score =
          aes.score  * w.aesthetic +
          per.score  * w.personality +
          perf.score * w.performance +
          con.score  * w.content;

        // Collect traits from layers with decent similarity
        if (aes.score  > 0.3) allTraits.push(...aes.traits);
        if (per.score  > 0.3) allTraits.push(...per.traits);
        if (perf.score > 0.3) allTraits.push(...perf.traits);
        if (con.score  > 0.3) allTraits.push(...con.traits);
      } else {
        // Fallback: genre + popularity
        const gs = genreScore(target, a);
        const ps = popularityScore(target, a);
        score = gs * 0.7 + ps * 0.3;
        layerScores = { aesthetic: 0, personality: 0, performance: 0, content: 0 };

        const shared = target.genres.filter((g) => a.genres.includes(g));
        allTraits.push(...shared.slice(0, 3));
      }

      // Deduplicate and cap topTraits
      const topTraits = [...new Set(allTraits)].slice(0, 3);

      // Local fallback reason
      let reason = "";
      if (topTraits.length > 0) {
        reason = `相似特質：${topTraits.slice(0, 2).join("、")}`;
      } else {
        const shared = target.genres.filter((g) => a.genres.includes(g));
        reason = shared.length ? `相同曲風：${shared[0]}` : "同為人氣偶像";
      }

      // Overall similarity under default weights — used as a tie-break so
      // low/zero scorers on a single layer still rank meaningfully.
      const overall =
        layerScores.aesthetic   * DEFAULT_WEIGHTS.aesthetic +
        layerScores.personality * DEFAULT_WEIGHTS.personality +
        layerScores.performance * DEFAULT_WEIGHTS.performance +
        layerScores.content     * DEFAULT_WEIGHTS.content;

      return { artist: a, score, layerScores, topTraits, reasons: [reason], overall };
    })
    .sort(
      (x, y) =>
        y.score - x.score ||
        y.overall - x.overall ||
        y.artist.popularity - x.artist.popularity ||
        x.artist.id.localeCompare(y.artist.id)
    )
    .slice(0, limit)
    .map(({ overall: _overall, ...rest }) => rest);
}
