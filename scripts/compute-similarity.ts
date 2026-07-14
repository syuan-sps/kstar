/**
 * Precompute artist & track similarity from the Supabase catalog and write
 * them into artist_similarity / track_similarity. Run: `npm run similarity`
 *
 * Uses the exact same scoring as the runtime local fallback (src/lib/similarity.ts).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { similarArtists, similarTracks } from "../src/lib/similarity";
import type { Artist, Track } from "../src/lib/types";

function db() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const supabase = db();

  const { data: artists } = await supabase.from("artists").select("*");
  const { data: rawTracks } = await supabase.from("tracks").select("*");
  if (!artists || !rawTracks) throw new Error("no catalog data — run ingest first");

  const artistsById = new Map<string, Artist>(artists.map((a) => [a.id, a]));
  const tracks: Track[] = rawTracks.map((t) => ({
    ...t,
    artist_name: artistsById.get(t.artist_id)?.name ?? "",
  }));

  // Replace existing similarity.
  await supabase.from("artist_similarity").delete().neq("artist_id", "");
  await supabase.from("track_similarity").delete().neq("track_id", "");

  for (const a of artists as Artist[]) {
    const rows = similarArtists(a, artists as Artist[]).map((s) => ({
      artist_id: a.id,
      similar_artist_id: s.artist.id,
      score: s.score,
      reasons: s.reasons,
    }));
    if (rows.length) await supabase.from("artist_similarity").insert(rows);
  }
  console.log(`✓ artist similarity for ${artists.length} artists`);

  for (const t of tracks) {
    const rows = similarTracks(t, tracks, artistsById).map((s) => ({
      track_id: t.id,
      similar_track_id: s.track.id,
      score: s.score,
      reasons: s.reasons,
    }));
    if (rows.length) await supabase.from("track_similarity").insert(rows);
  }
  console.log(`✓ track similarity for ${tracks.length} tracks`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
