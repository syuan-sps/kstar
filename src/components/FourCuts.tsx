// 인생네컷 — "Life in 4 Cuts" photobooth strip. Pure presentational.

import Link from "next/link";
import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "@/components/Thumb";

export default function FourCuts({
  artists,
  className = "",
  linked = false,
}: {
  artists: CardArtist[];
  className?: string;
  linked?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border-2 border-[#aeb3bb] bg-[#e9ebee] p-3 shadow-[5px_5px_0_rgba(124,128,136,0.3)] ${className}`}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {artists.map((a) => {
          const sym = getGroupSymbol(a.group);
          const inner = (
            <>
              <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-lg" focusY={a.image_focus} />
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
            "fc-cut group relative block aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-white/10";
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
      {/* photobooth footer caption */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 font-orbitron text-[10px] font-bold tracking-[0.25em] text-[#7c8088]">
        <span>✦</span>
        <span>KSTAR · 2026</span>
        <span>✦</span>
      </div>
    </div>
  );
}
