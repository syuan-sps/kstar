import catalogJson from "@/data/catalog.json";
import { similarArtists } from "./similarity";
import type { Artist, SimilarArtist, Catalog } from "./types";

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
