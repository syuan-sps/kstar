import catalogJson from "@/data/catalog.json";
import { similarArtists } from "./similarity";
import { SCORE_LAYERS } from "./types";
import { getApprovedPhotos } from "./submissions";
import type {
  Artist, SimilarArtist, Catalog, PickSummary, LayerScores,
  ScoreLayer, Constellation, ConstellationNode, ConstellationEdge,
} from "./types";

const local = catalogJson as unknown as Catalog;
const artistsById = new Map<string, Artist>(local.artists.map((a) => [a.id, a]));

async function withPhotoOverride(artist: Artist): Promise<Artist> {
  const photos = await getApprovedPhotos();
  const o = photos.get(artist.id);
  return o ? { ...artist, image_url: o.url, image_focus: o.focus } : artist;
}

async function applyPhotoOverrides(list: Artist[]): Promise<Artist[]> {
  const photos = await getApprovedPhotos();
  if (photos.size === 0) return list;
  return list.map((a) => {
    const o = photos.get(a.id);
    return o ? { ...a, image_url: o.url, image_focus: o.focus } : a;
  });
}

export async function getArtist(id: string): Promise<Artist | null> {
  const a = artistsById.get(id);
  return a ? withPhotoOverride(a) : null;
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
  return applyPhotoOverrides(local.artists);
}

export async function searchArtists(query: string): Promise<Artist[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return local.artists.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.name_zh ?? "").toLowerCase().includes(q) ||
      (a.group ?? "").toLowerCase().includes(q),
  );
}

export async function getAllArtistsLite(): Promise<import("./lite").ArtistLite[]> {
  const { toLite } = await import("./lite");
  const artists = await applyPhotoOverrides(local.artists);
  return artists.map(toLite);
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

// ── Constellation (星圖) ────────────────────────────────────────────────
// SERVER-ONLY. Builds a force-graph: the 4 picks are anchors (hubs), each
// surrounded by its most-similar idols. Satellites shared by ≥2 picks are
// "bridges" (the shape of the user's taste). Only the lite node/edge data
// crosses to the client — never the catalog.
const SAT_PER_ANCHOR = 8;
const MAX_SATELLITES = 21;

function dominantLayer(ls: LayerScores): ScoreLayer {
  let best: ScoreLayer = "aesthetic";
  let bestV = -Infinity;
  for (const L of SCORE_LAYERS) if (ls[L] > bestV) { bestV = ls[L]; best = L; }
  return best;
}
const toNode = (a: Artist, anchor: boolean): ConstellationNode => ({
  id: a.id, name: a.name, name_zh: a.name_zh ?? null, group: a.group ?? null,
  image_url: a.image_url ?? null, image_focus: a.image_focus ?? null, anchor,
});

export async function getConstellation(pickIds: string[]): Promise<Constellation> {
  const pickSet = new Set(pickIds);
  const anchors = pickIds
    .map((id) => artistsById.get(id))
    .filter((a): a is Artist => Boolean(a));
  if (!anchors.length) return { nodes: [], edges: [] };

  // Per anchor: its top-K similar idols (excluding the other anchors).
  const satEdges = new Map<string, ConstellationEdge[]>();
  const satArtist = new Map<string, Artist>();
  for (const anchor of anchors) {
    const sims = similarArtists(anchor, local.artists, undefined, SAT_PER_ANCHOR + anchors.length);
    let added = 0;
    for (const s of sims) {
      if (pickSet.has(s.artist.id)) continue;
      if (added >= SAT_PER_ANCHOR) break;
      added++;
      satArtist.set(s.artist.id, s.artist);
      const arr = satEdges.get(s.artist.id) ?? [];
      arr.push({
        source: s.artist.id,
        target: anchor.id,
        weight: Math.round(s.score * 1000) / 1000,
        layer: dominantLayer(s.layerScores),
      });
      satEdges.set(s.artist.id, arr);
    }
  }

  // Rank satellites: bridges (more anchor links) first, then total weight.
  const ranked = [...satEdges.entries()]
    .sort((a, b) => {
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      const wa = a[1].reduce((s, e) => s + e.weight, 0);
      const wb = b[1].reduce((s, e) => s + e.weight, 0);
      return wb - wa;
    })
    .slice(0, MAX_SATELLITES);

  const keptSats = ranked.map(([id]) => satArtist.get(id)!);
  const nodes: ConstellationNode[] = [
    ...anchors.map((a) => toNode(a, true)),
    ...keptSats.map((a) => toNode(a, false)),
  ];

  // Satellite↔satellite edges: non-picks also link to each other by 4-layer
  // similarity (up to 2 each, deduped, above a threshold) — the web that makes
  // it feel like a constellation rather than 4 separate spokes.
  const satIds = new Set(keptSats.map((a) => a.id));
  const seen = new Set<string>();
  const satEdgesOut: ConstellationEdge[] = [];
  if (keptSats.length > 1) {
    for (const sat of keptSats) {
      let added = 0;
      for (const s of similarArtists(sat, keptSats, undefined, 4)) {
        if (added >= 2) break;
        if (!satIds.has(s.artist.id) || s.score < 0.14) continue;
        const key = sat.id < s.artist.id ? `${sat.id}|${s.artist.id}` : `${s.artist.id}|${sat.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        added++;
        satEdgesOut.push({
          source: sat.id, target: s.artist.id,
          weight: Math.round(s.score * 1000) / 1000, layer: dominantLayer(s.layerScores),
        });
      }
    }
  }

  const edges: ConstellationEdge[] = [...ranked.flatMap(([, es]) => es), ...satEdgesOut];
  return { nodes, edges };
}
