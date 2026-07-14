import Link from "next/link";
import type { CardArtist } from "@/lib/lite";
import IdolFrame from "./IdolFrame";
import FavoriteButton from "./FavoriteButton";

export default function ArtistCard({
  artist,
  reasons,
}: {
  artist: CardArtist;
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
        <div className="mt-1.5 px-1 text-center text-[11px] leading-relaxed text-[#7c8088]/80">
          {reasons.join(" · ")}
        </div>
      )}
    </Link>
  );
}
