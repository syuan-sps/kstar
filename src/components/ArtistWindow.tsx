import Link from "next/link";
import type { Artist } from "@/lib/types";
import OSWindow from "./OSWindow";
import Thumb from "./Thumb";
import FavoriteButton from "./FavoriteButton";
import { copy } from "@/lib/copy";

export default function ArtistWindow({ artist }: { artist: Artist }) {
  const popPct = artist.popularity;

  return (
    <OSWindow title={artist.name} icon="★" className="w-64">
      <div className="flex flex-col gap-3 p-3">
        {/* Avatar */}
        <div className="mx-auto h-24 w-24 overflow-hidden rounded-2xl ring-2 ring-[#ff00cc]/50 ring-offset-2 ring-offset-[#f0e6ff]">
          <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-2xl" />
        </div>

        {/* Name */}
        <div className="text-center">
          <div className="font-orbitron text-base font-black text-[#1a0028]">{artist.name}</div>
          {artist.name_zh && artist.name_zh !== artist.name && (
            <div className="text-xs text-[#660066]">{artist.name_zh}</div>
          )}
          {artist.group && (
            <div className="mt-0.5 text-[10px] font-medium text-[#cc0099]/70 tracking-wide">
              {artist.group}
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap justify-center gap-1">
          {artist.genres.slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-[#ff00cc]/15 px-2 py-0.5 text-[10px] font-semibold text-[#cc0099]">
              {g}
            </span>
          ))}
        </div>

        {/* Popularity bar */}
        <div>
          <div className="mb-0.5 flex justify-between text-[10px] text-[#660066]">
            <span>{copy.popularity}</span>
            <span>{popPct}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0c0e0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff00cc] to-[#9933ff]"
              style={{ width: `${popPct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/artist/${artist.id}`}
            className="flex-1 rounded-md border-2 border-[#9933ff] bg-gradient-to-r from-[#ff00cc] to-[#9933ff] py-1.5 text-center text-xs font-bold text-white shadow-[2px_2px_0_#1a0028] transition hover:brightness-110 active:translate-x-px active:translate-y-px active:shadow-none"
          >
            {copy.discoverSimilar}
          </Link>
          <FavoriteButton id={artist.id} size="sm" />
        </div>
      </div>
    </OSWindow>
  );
}
