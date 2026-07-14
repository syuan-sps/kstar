// Lightweight artist shapes for client bundles & RSC payloads.
// Full profiles stay server-side; cards/directory/picker only need these.
import type { Artist } from "./types";
import { genderOf, positionsOf, type GenderFilter, type PosFilter } from "./browse";

// Minimal shape every card component needs — both Artist and ArtistLite satisfy it.
export interface CardArtist {
  id: string;
  name: string;
  name_zh?: string | null;
  group?: string | null;
  image_url?: string | null;
  image_focus?: number | null;
}

export interface ArtistLite extends CardArtist {
  genres: string[];
  generation?: number;
  popularity: number;
  instagram?: string | null;
  gender: Exclude<GenderFilter, "全部">;
  positions: Exclude<PosFilter, "全部">[];
}

export function toLite(a: Artist): ArtistLite {
  return {
    id: a.id,
    name: a.name,
    name_zh: a.name_zh ?? null,
    group: a.group ?? null,
    genres: a.genres,
    generation: a.generation,
    popularity: a.popularity,
    image_url: a.image_url ?? null,
    image_focus: a.image_focus ?? null,
    instagram: a.instagram ?? null,
    gender: genderOf(a),
    positions: positionsOf(a),
  };
}
