/**
 * Catalog ingestion: resolve seed artists against Spotify, fetch their top
 * tracks, and upsert into Supabase. Run: `npm run ingest`
 *
 * Requires SPOTIFY_CLIENT_ID/SECRET and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * in .env.local. Without them the app still runs on the bundled local catalog.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { searchArtist, getArtistTopTracks } from "../src/lib/spotify";

function db() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const seedPath = join(process.cwd(), "data", "seed-artists.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as { artists: string[] };
  const supabase = db();

  let artistCount = 0;
  let trackCount = 0;

  for (const name of seed.artists) {
    const sa = await searchArtist(name);
    if (!sa) {
      console.warn(`! not found on Spotify: ${name}`);
      continue;
    }
    await supabase.from("artists").upsert({
      id: sa.id,
      name: sa.name,
      genres: sa.genres,
      popularity: sa.popularity,
      followers: sa.followers.total,
      image_url: sa.images[0]?.url ?? null,
    });
    artistCount++;

    const tracks = await getArtistTopTracks(sa.id, "TW");
    for (const t of tracks.slice(0, 10)) {
      await supabase.from("tracks").upsert({
        id: t.id,
        name: t.name,
        artist_id: sa.id,
        album: t.album.name,
        popularity: t.popularity,
        release_year: t.album.release_date
          ? Number(t.album.release_date.slice(0, 4))
          : null,
        image_url: t.album.images[0]?.url ?? null,
        preview_url: t.preview_url,
      });
      trackCount++;
    }
    console.log(`✓ ${sa.name} (+${Math.min(tracks.length, 10)} tracks)`);
  }

  console.log(`\nDone. ${artistCount} artists, ${trackCount} tracks.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
