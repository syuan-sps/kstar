"use client";

import Link from "next/link";
import catalogJson from "@/data/catalog.json";
import { useFavorites } from "@/lib/useFavorites";
import { copy } from "@/lib/copy";
import ArtistCard from "@/components/ArtistCard";
import type { Artist, Catalog } from "@/lib/types";

const catalog = catalogJson as unknown as Catalog;
const artistsById = new Map<string, Artist>(catalog.artists.map((a) => [a.id, a]));

export default function FavoritesPage() {
  const { list } = useFavorites();
  const favArtists = list
    .map((id) => artistsById.get(id))
    .filter((a): a is Artist => Boolean(a));

  return (
    <div className="space-y-8">
      <h1 className="font-orbitron text-xl font-bold text-white">{copy.myFavorites}</h1>

      <p className="rounded-xl border border-[#ff00cc]/20 bg-[#ff00cc]/5 px-4 py-3 text-xs text-white/50">
        收藏目前儲存在這個瀏覽器中。（設定 Supabase 後可跨裝置同步）
      </p>

      {favArtists.length === 0 && (
        <p className="text-white/50">
          {copy.noFavorites}{" "}
          <Link href="/" className="text-[#ff00cc] hover:underline">
            {copy.backHome}
          </Link>
        </p>
      )}

      {favArtists.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#ff00cc]/70">{copy.artistsSection}</h2>
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
