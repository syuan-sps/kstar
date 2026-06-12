"use client";

import { useFavorites } from "@/lib/useFavorites";
import { copy } from "@/lib/copy";

export default function FavoriteButton({
  id,
  size = "md",
}: {
  id: string;
  size?: "sm" | "md";
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(id);
  const pad = size === "sm" ? "h-7 w-7 text-sm" : "px-3 py-1.5 text-sm gap-1";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? copy.favorited : copy.favorite}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      className={`inline-flex items-center justify-center rounded-full border transition ${pad} ${
        active
          ? "border-[#ff00cc]/70 bg-[#ff00cc]/20 text-pink-200"
          : "border-white/20 text-white/70 hover:border-[#ff00cc]/50 hover:text-white"
      }`}
    >
      <span>{active ? "♥" : "♡"}</span>
      {size === "md" && <span>{active ? copy.favorited : copy.favorite}</span>}
    </button>
  );
}
