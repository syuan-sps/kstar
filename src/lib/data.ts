import catalogJson from "@/data/catalog.json";
import { similarArtists } from "./similarity";
import type { Artist, SimilarArtist, Catalog, PickSummary, LayerScores } from "./types";

const local = catalogJson as unknown as Catalog;
const artistsById = new Map<string, Artist>(local.artists.map((a) => [a.id, a]));

export async function getArtist(id: string): Promise<Artist | null> {
  return artistsById.get(id) ?? null;
}

export async function getPopularArtists(limit = 12): Promise<Artist[]> {
  return [...local.artists].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export async function getSimilarArtists(id: string): Promise<SimilarArtist[]> {
  const target = artistsById.get(id);
  if (!target) return [];
  return similarArtists(target, local.artists);
}

export async function getAllArtists(): Promise<Artist[]> {
  return local.artists;
}

export async function searchArtists(query: string): Promise<Artist[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return local.artists.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.name_zh ?? "").toLowerCase().includes(q),
  );
}

export async function getAllArtistsLite(): Promise<import("./lite").ArtistLite[]> {
  const { toLite } = await import("./lite");
  return local.artists.map(toLite);
}

// ── Pick summaries for the questionnaire / archetype engine ────────────
// SERVER-ONLY. For each pick we compute its mean per-layer similarity to the
// OTHER picks (intra-pick cohesion → your taste's defining axes) plus a tiny
// token summary. Only these summaries cross to the client — never the catalog.
const ZERO: LayerScores = { aesthetic: 0, personality: 0, performance: 0, content: 0 };

export async function getPickSummaries(pickIds: string[]): Promise<PickSummary[]> {
  const picks = pickIds
    .map((id) => artistsById.get(id))
    .filter((a): a is Artist => Boolean(a));

  return picks.map((pick) => {
    const others = picks.filter((o) => o.id !== pick.id);
    let layerScores: LayerScores = { ...ZERO };
    if (others.length) {
      const sims = similarArtists(pick, others, undefined, others.length);
      const sum = sims.reduce(
        (acc, s) => ({
          aesthetic: acc.aesthetic + s.layerScores.aesthetic,
          personality: acc.personality + s.layerScores.personality,
          performance: acc.performance + s.layerScores.performance,
          content: acc.content + s.layerScores.content,
        }),
        { ...ZERO },
      );
      const n = sims.length || 1;
      layerScores = {
        aesthetic: sum.aesthetic / n,
        personality: sum.personality / n,
        performance: sum.performance / n,
        content: sum.content / n,
      };
    }
    const p = pick.profile;
    return {
      id: pick.id,
      layerScores,
      tokens: {
        energy_type: p?.personality?.energy_type,
        fan_interaction: p?.personality?.fan_interaction,
        dance_style: p?.performance?.dance_style,
        content_tone: p?.content?.content_tone,
        lifestyle_topics: p?.content?.lifestyle_topics ?? [],
        value_topics: p?.content?.value_topics ?? [],
        style_tags: [
          ...(p?.aesthetic?.style_tags ?? []),
          ...(p?.aesthetic?.official?.style_tags ?? []),
          ...(p?.aesthetic?.personal?.style_tags ?? []),
        ],
        color_palette: p?.aesthetic?.color_palette ?? [],
      },
    };
  });
}
