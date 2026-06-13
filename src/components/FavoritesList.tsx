"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";
import { copy } from "@/lib/copy";
import ArtistCard from "@/components/ArtistCard";
import type { ArtistLite } from "@/lib/lite";

export default function FavoritesList({ allArtists }: { allArtists: ArtistLite[] }) {
  const { list } = useFavorites();
  const byId = new Map(allArtists.map((a) => [a.id, a]));
  const favArtists = list
    .map((id) => byId.get(id))
    .filter((a): a is ArtistLite => Boolean(a));

  return (
    <div className="space-y-8">
      <h1 className="font-orbitron text-xl font-bold text-[#1c1e24]">{copy.myFavorites}</h1>

      <p className="rounded-xl border border-[#c8ccd2]/20 bg-[#7c8088]/5 px-4 py-3 text-xs text-[#9aa0aa]">
        收藏目前儲存在這個瀏覽器中。（設定 Supabase 後可跨裝置同步）
      </p>

      {favArtists.length === 0 && (
        <p className="text-[#9aa0aa]">
          {copy.noFavorites}{" "}
          <Link href="/" className="text-[#1c1e24] hover:underline">
            {copy.backHome}
          </Link>
        </p>
      )}

      {favArtists.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#5e636d]">{copy.artistsSection}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {favArtists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
