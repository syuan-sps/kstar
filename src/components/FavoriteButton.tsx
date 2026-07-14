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
          ? "border-[#b4302b]/70 bg-[#b4302b]/20 text-[#b4302b]"
          : "border-[#9aa0aa]/40 text-[#9aa0aa] hover:border-[#b4302b]/50 hover:text-[#b4302b]"
      }`}
    >
      <span>{active ? "♥" : "♡"}</span>
      {size === "md" && <span>{active ? copy.favorited : copy.favorite}</span>}
    </button>
  );
}
