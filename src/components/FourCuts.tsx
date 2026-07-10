// 인생네컷 — photobooth strip with silver-only sticker motifs in the card wash.

import Link from "next/link";
import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "@/components/Thumb";

const MOTIFS = [
  { t: "✦", x: "5%", y: "8%", r: -12, s: 15, o: 0.38 },
  { t: "✧", x: "90%", y: "7%", r: 18, s: 12, o: 0.32 },
  { t: "◎", x: "93%", y: "40%", r: 0, s: 17, o: 0.26 },
  { t: "✦", x: "3%", y: "46%", r: 22, s: 11, o: 0.3 },
  { t: "◇", x: "91%", y: "70%", r: -8, s: 14, o: 0.28 },
  { t: "✧", x: "7%", y: "76%", r: 14, s: 13, o: 0.34 },
  { t: "○", x: "48%", y: "5%", r: 0, s: 10, o: 0.22 },
  { t: "✦", x: "50%", y: "90%", r: -20, s: 12, o: 0.26 },
  { t: "✧", x: "22%", y: "92%", r: 8, s: 10, o: 0.22 },
  { t: "◇", x: "78%", y: "93%", r: -14, s: 11, o: 0.22 },
] as const;

export default function FourCuts({
  artists,
  className = "",
  linked = false,
  developId = null,
}: {
  artists: CardArtist[];
  className?: string;
  linked?: boolean;
  developId?: string | null;
}) {
  return (
    <div className={`fourcuts-chrome ${className}`}>
      <div className="fourcuts-chrome-inner">
        <div className="fc-silver-motifs" aria-hidden="true">
          {MOTIFS.map((m, i) => (
            <span
              key={i}
              className="fc-motif"
              style={{
                left: m.x,
                top: m.y,
                fontSize: m.s,
                opacity: m.o,
                transform: `rotate(${m.r}deg)`,
              }}
            >
              {m.t}
            </span>
          ))}
        </div>

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
          <span className="sticker-chip sticker-chip--mini">SOULCUTS</span>
          <span className="font-soft tracking-[0.12em] text-[#9aa0aa]">01/04</span>
        </div>
      </div>
    </div>
  );
}
