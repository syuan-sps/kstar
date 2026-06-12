import Link from "next/link";
import type { Artist } from "@/lib/types";
import IdolFrame from "./IdolFrame";
import FavoriteButton from "./FavoriteButton";

export default function ArtistCard({
  artist,
  reasons,
}: {
  artist: Artist;
  reasons?: string[];
  variant?: "default" | "sticker";
}) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group relative block transition hover:-translate-y-0.5"
    >
      <IdolFrame artist={artist} />

      {/* favorite button overlay (below the group banner) */}
      <div className="absolute right-2 top-7 z-20">
        <FavoriteButton id={artist.id} size="sm" />
      </div>

      {reasons && reasons.length > 0 && (
        <div className="mt-1.5 px-1 text-center text-[11px] leading-relaxed text-pink-200/80">
          {reasons.join("・")}
        </div>
      )}
    </Link>
  );
}
