import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtist, getAllArtists } from "@/lib/data";
import { copy } from "@/lib/copy";
import Thumb from "@/components/Thumb";
import FavoriteButton from "@/components/FavoriteButton";
import ProfileExplorer from "@/components/ProfileExplorer";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [artist, allArtists] = await Promise.all([getArtist(id), getAllArtists()]);
  if (!artist) notFound();

  return (
    <div className="space-y-10">
      {/* Artist header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-3xl ring-2 ring-[#ff00cc]/40">
          <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-3xl" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-orbitron text-3xl font-black text-white">{artist.name}</span>
            {artist.instagram && (
              <a
                href={`https://instagram.com/${artist.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`@${artist.instagram}`}
                aria-label={`Instagram @${artist.instagram}`}
                className="text-white/40 transition hover:text-[#ff00cc]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
          </div>
          {artist.name_zh && artist.name_zh !== artist.name && (
            <div className="mt-1 text-white/60">{artist.name_zh}</div>
          )}
          {artist.group && (
            <div className="mt-0.5 text-sm text-[#ff99ee]/70">{artist.group}</div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {artist.genres.map((g) => (
              <span key={g} className="rounded-full bg-[#ff00cc]/15 px-2.5 py-0.5 text-xs text-pink-300">
                {g}
              </span>
            ))}
          </div>
          <div className="mt-3 text-sm text-white/50">
            {copy.popularity} {artist.popularity}
            {artist.followers ? ` · ${copy.followers} ${artist.followers.toLocaleString()}` : ""}
          </div>
          <div className="mt-4">
            <FavoriteButton id={artist.id} />
          </div>
        </div>
      </section>

      {/* Analysis cards + similar artists — shared 全部/美學/個性/表演/內容 filter */}
      <ProfileExplorer artist={artist} allArtists={allArtists} />

      <Link href="/" className="inline-block text-sm text-white/50 hover:text-white">
        ← {copy.backHome}
      </Link>
    </div>
  );
}
