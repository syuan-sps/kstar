// 偶像小卡 — idol photocard-holder frame with cute themed decorations.
// Styled as a premium collectible: group-coloured gradient edge, inner bevel
// ring, a soft holographic sheen, and group motifs tucked inside the card.

import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import { getGroupBorderStops, tintTowardWhite } from "@/lib/groupColors";
import Thumb from "./Thumb";
import AddPhotoCTA from "./AddPhotoCTA";

// Motifs sit *inside* the card edge. Hanging them outside (negative offsets)
// let them drift into the gap between cards and read as clutter.
const SPOTS: { top: string; left?: string; right?: string; rot: number; s: number }[] = [
  { top: "13%", left: "3.5%", rot: -14, s: 11 },
  { top: "20%", right: "3.5%", rot: 12, s: 9 },
  { top: "62%", left: "2.5%", rot: 7, s: 9 },
  { top: "69%", right: "2.5%", rot: -10, s: 11 },
];

export default function IdolFrame({
  artist,
  className = "",
  showAddCTA = false,
}: {
  artist: CardArtist;
  className?: string;
  showAddCTA?: boolean;
}) {
  const gapCTA = showAddCTA && !artist.image_url;
  // Every accent derives from the group's colour, so the card reads as that
  // group rather than as a random per-idol palette.
  const [borderFrom, borderTo] = getGroupBorderStops(artist.group);
  const bodyTint = tintTowardWhite(borderFrom, 0.07);
  const topLabel = artist.group ?? "✦ SOLO ✦";
  const frameSymbol = getGroupSymbol(artist.group);
  const isLong = frameSymbol.length > 2;

  return (
    <div
      className={`group/card relative rounded-[20px] border-2 p-2.5 pt-5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        // Transparent border + two-layer background paints a rounded gradient
        // edge; one-colour groups get identical stops so it reads as solid.
        borderColor: "transparent",
        background: `linear-gradient(180deg, #ffffff, ${bodyTint}) padding-box, linear-gradient(135deg, ${borderFrom}, ${borderTo}) border-box`,
        // The neutral hairline keeps very pale official colours (EXO's Cosmic
        // Latte, Girls' Generation's Pastel Rose) from vanishing on white.
        boxShadow: `0 0 0 1px rgba(28,30,36,.10), 0 1px 2px rgba(28,30,36,.06), 0 10px 22px -8px ${borderFrom}66`,
      }}
    >
      {/* holographic sheen — the collectible-photocard signature */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[18px] opacity-25 mix-blend-soft-light transition-opacity duration-200 group-hover/card:opacity-45"
        style={{
          background:
            "linear-gradient(115deg, transparent 22%, rgba(255,255,255,.95) 38%, rgba(184,222,255,.65) 46%, rgba(255,198,232,.6) 54%, rgba(255,255,255,.5) 62%, transparent 78%)",
        }}
      />
      {/* inner bevel ring — the toploader sleeve edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[2px] rounded-[16px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.85)]"
      />

      {/* group name banner */}
      <div
        className="absolute inset-x-0 top-1.5 z-10 truncate px-3 text-center font-orbitron text-[9px] font-black uppercase tracking-[0.15em]"
        style={{ color: borderFrom }}
      >
        {topLabel}
      </div>

      {/* scattered group symbols — second colour keeps two-tone groups present */}
      {SPOTS.map((m, i) => (
        <span
          key={i}
          className={`frame-symbol${isLong ? " frame-symbol--long" : ""} pointer-events-none absolute z-10 select-none opacity-50`}
          style={{
            top: m.top,
            left: m.left,
            right: m.right,
            fontSize: isLong ? m.s * 0.65 : m.s,
            transform: `rotate(${m.rot}deg)`,
            color: borderTo,
          }}
        >
          {frameSymbol}
        </span>
      ))}

      {/* photo slot */}
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,.7),0_1px_3px_rgba(28,30,36,.14)]"
        style={{ outline: `1px solid ${borderFrom}44`, outlineOffset: "-1px" }}
      >
        <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-xl" focusY={artist.image_focus} hideInitials={gapCTA} />
        {/* soft gloss across the photo's top corner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ background: "linear-gradient(155deg, rgba(255,255,255,.28) 0%, transparent 34%)" }}
        />
        {gapCTA && (
          <AddPhotoCTA
            idolId={artist.id}
            name={artist.name}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          />
        )}
      </div>

      {/* name */}
      <div className="relative z-10 mt-1.5 px-0.5 text-center">
        <div className="truncate text-[13px] font-black text-[#1c1e24]">{artist.name}</div>
        {artist.name_zh && artist.name_zh !== artist.name && (
          <div className="truncate text-[10px] text-[#7c8088]">{artist.name_zh}</div>
        )}
      </div>
    </div>
  );
}
