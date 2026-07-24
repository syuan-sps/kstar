// 인생네컷 — "Life in 4 Cuts" photobooth strip. Pure presentational.

import Link from "next/link";
import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "@/components/Thumb";

export default function FourCuts({
  artists,
  className = "",
  linked = false,
  developId = null,
  caption,
  photoOverrides,
  collector = false,
}: {
  artists: CardArtist[];
  className?: string;
  linked?: boolean;
  /** id of a cut to play the single-cut re-develop animation on (e.g. after a swap) */
  developId?: string | null;
  /** Overrides the footer stamp text (default "KStar · 2026"). */
  caption?: string;
  /** Per-idol custom photo (from the photo studio) shown instead of the catalog shot. */
  photoOverrides?: Readonly<Record<string, string>>;
  /** Bare photo grid for a production frame overlay. It intentionally omits the
      standalone card shell and footer so no second border appears inside it. */
  collector?: boolean;
}) {
  return (
    <div
      className={collector
        ? `grid grid-cols-2 gap-1.5 ${className}`
        : `relative rounded-[22px] border border-[#8e96a1] bg-[linear-gradient(145deg,rgba(255,255,255,.97),rgba(223,227,232,.96)_48%,rgba(198,204,212,.92))] p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,.95),0_12px_28px_rgba(80,87,98,.14)] ${className}`}
    >
      <div className={collector ? "contents" : "rounded-[16px] border border-white/90 bg-[#eef0f3]/80 p-[3px] shadow-[inset_0_0_0_1px_rgba(124,128,136,.34),inset_0_1px_1px_rgba(255,255,255,.9)]"}>
      <div className={collector ? "contents" : "grid grid-cols-2 gap-1.5"}>
        {artists.map((a) => {
          const sym = getGroupSymbol(a.group);
          const inner = (
            <>
              <Thumb src={photoOverrides?.[a.id] ?? a.image_url} seed={a.id} label={a.name} rounded="rounded-lg" focusY={photoOverrides?.[a.id] ? undefined : a.image_focus} />
              {/* group symbol accent */}
              <span
                className={`frame-symbol${sym.length > 2 ? " frame-symbol--long" : ""} pointer-events-none absolute right-1 top-1 text-white/80 drop-shadow`}
                style={{ fontSize: sym.length > 2 ? 9 : 13 }}
              >
                {sym}
              </span>
              {/* name overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-4 pb-1">
                <div className="truncate font-orbitron text-[11px] font-bold leading-tight text-white">
                  {a.name}
                </div>
                {a.name_zh && a.name_zh !== a.name && (
                  <div className="truncate text-[9px] text-white/70">{a.name_zh}</div>
                )}
              </div>
            </>
          );
          const cutClass =
            "fc-cut group relative block aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-white/10" +
            (developId && a.id === developId ? " fc-redevelop" : "");
          return linked ? (
            <Link
              key={a.id}
              href={`/artist/${a.id}`}
              className={`${cutClass} transition hover:ring-2 hover:ring-[#c8ccd2]`}
            >
              {inner}
            </Link>
          ) : (
            <div key={a.id} className={cutClass}>
              {inner}
            </div>
          );
        })}
      </div>
      </div>
      {!collector && (
        <div className="mx-1 mt-2 flex h-[19px] items-center justify-center gap-1.5 rounded-full border border-white/90 bg-[linear-gradient(180deg,#ffffff,#d9dde2)] px-3 font-orbitron text-[9px] font-bold tracking-[0.25em] text-[#7c8088] shadow-[inset_0_1px_1px_rgba(255,255,255,.95),inset_0_-1px_1px_rgba(124,128,136,.22)]">
          <span>✦</span>
          <span className="max-w-[220px] truncate">{caption || "KStar · 2026"}</span>
          <span>✦</span>
        </div>
      )}
    </div>
  );
}
