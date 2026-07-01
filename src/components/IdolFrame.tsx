// 偶像小卡 — idol photocard-holder frame with cute themed decorations.
// Group name banner on top, scattered motifs around the photo slot.

import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "./Thumb";
import AddPhotoCTA from "./AddPhotoCTA";

type Theme = { motifs: string[]; accent: string; soft: string };

// Muted, low-saturation tints that sit in the same calm grey-white family as the
// home-page 인생네컷 collage (FourCuts: #aeb3bb border / #e9ebee bg / #7c8088 text).
// Each idol still gets a distinct soft hue, just heavily desaturated.
const THEMES: Theme[] = [
  { motifs: ["🍎", "🍏"], accent: "#bf8b96", soft: "#efe8ea" }, // dusty rose
  { motifs: ["🍀", "☘️"], accent: "#8fae93", soft: "#e8efe9" }, // muted sage
  { motifs: ["🍓", "🍓"], accent: "#c294ac", soft: "#f0e9ee" }, // muted pink
  { motifs: ["⭐", "✦"], accent: "#8ca1c0", soft: "#e7ecf2" }, // muted slate blue
  { motifs: ["💎", "✦"], accent: "#9298a8", soft: "#e9ebf0" }, // blue grey
  { motifs: ["🎀", "💗"], accent: "#bf97b6", soft: "#efe9ef" }, // muted orchid
  { motifs: ["🌸", "🌷"], accent: "#c19aa3", soft: "#f0eaec" }, // muted mauve
  { motifs: ["🍒", "❤️"], accent: "#bf9094", soft: "#efe9ea" }, // muted clay
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pickTheme(seed: string) {
  return THEMES[hash(seed) % THEMES.length];
}

// Scatter positions hugging the card edges, around the photo slot.
const SPOTS: { top: string; left?: string; right?: string; rot: number; s: number }[] = [
  { top: "12%", left: "-4%", rot: -14, s: 16 },
  { top: "17%", right: "-4%", rot: 12, s: 14 },
  { top: "41%", left: "-3%", rot: -6, s: 14 },
  { top: "47%", right: "-3%", rot: 9, s: 16 },
  { top: "66%", left: "-1%", rot: 6, s: 13 },
  { top: "70%", right: "-1%", rot: -10, s: 14 },
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
  const theme = pickTheme(artist.id);
  const topLabel = artist.group ?? "✦ SOLO ✦";
  const frameSymbol = getGroupSymbol(artist.group);
  const isLong = frameSymbol.length > 2;

  return (
    <div
      className={`relative rounded-[18px] border-2 p-2.5 pt-5 shadow-[3px_3px_0_rgba(124,128,136,0.3)] ${className}`}
      style={{
        borderColor: theme.accent + "66",
        background: `linear-gradient(180deg, #ffffffe6, ${theme.soft}cc)`,
      }}
    >
      {/* group name banner */}
      <div
        className="absolute inset-x-0 top-1.5 truncate px-3 text-center font-orbitron text-[9px] font-black uppercase tracking-[0.15em]"
        style={{ color: theme.accent }}
      >
        {topLabel}
      </div>

      {/* scattered group symbols */}
      {SPOTS.map((m, i) => (
        <span
          key={i}
          className={`frame-symbol${isLong ? " frame-symbol--long" : ""} pointer-events-none absolute z-10 select-none drop-shadow-sm`}
          style={{
            top: m.top,
            left: m.left,
            right: m.right,
            fontSize: isLong ? m.s * 0.65 : m.s,
            transform: `rotate(${m.rot}deg)`,
            color: theme.accent,
          }}
        >
          {frameSymbol}
        </span>
      ))}

      {/* photo slot */}
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl border"
        style={{ borderColor: theme.accent + "55" }}
      >
        <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-xl" focusY={artist.image_focus} hideInitials={gapCTA} />
        {gapCTA && (
          <AddPhotoCTA
            idolId={artist.id}
            name={artist.name}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          />
        )}
      </div>

      {/* name */}
      <div className="mt-1.5 px-0.5 text-center">
        <div className="truncate text-[13px] font-black text-[#1c1e24]">{artist.name}</div>
        {artist.name_zh && artist.name_zh !== artist.name && (
          <div className="truncate text-[10px] text-[#7c8088]">{artist.name_zh}</div>
        )}
      </div>
    </div>
  );
}
