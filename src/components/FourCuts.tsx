// 인생네컷 — "Life in 4 Cuts" photobooth strip. Pure presentational.
// Chrome bezel elevates imperfect CC idol photos into a cohesive collectible.

import Link from "next/link";
import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "@/components/Thumb";

export default function FourCuts({
  artists,
  className = "",
  linked = false,
  developId = null,
}: {
  artists: CardArtist[];
  className?: string;
  linked?: boolean;
  /** id of a cut to play the single-cut re-develop animation on (e.g. after a swap) */
  developId?: string | null;
}) {
  return (
    <div className={`fourcuts-chrome ${className}`}>
      <div className="fourcuts-chrome-inner">
        <div className="grid grid-cols-2 gap-1.5">
          {artists.map((a) => {
            const sym = getGroupSymbol(a.group);
            const inner = (
              <>
                <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-lg" focusY={a.image_focus} />
                <span
                  className={`frame-symbol${sym.length > 2 ? " frame-symbol--long" : ""} pointer-events-none absolute right-1 top-1 text-white/80 drop-shadow`}
                  style={{ fontSize: sym.length > 2 ? 9 : 13 }}
                >
                  {sym}
                </span>
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
        <div className="fourcuts-foot">
          <span className="bars" aria-hidden="true">
            <i style={{ height: 4 }} /><i style={{ height: 8 }} /><i style={{ height: 5 }} />
            <i style={{ height: 10 }} /><i style={{ height: 6 }} /><i style={{ height: 9 }} />
            <i style={{ height: 3 }} /><i style={{ height: 7 }} /><i style={{ height: 5 }} />
            <i style={{ height: 8 }} /><i style={{ height: 4 }} /><i style={{ height: 6 }} />
          </span>
          <span className="font-soft tracking-[0.14em]">✦ KSTAR · SOULCUTS ✦</span>
          <span className="font-soft tracking-[0.12em] text-[#9aa0aa]">01/04</span>
        </div>
      </div>
    </div>
  );
}
