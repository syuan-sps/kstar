"use client";

// Two-zone recommendation card: photo on top (~60%), info panel below (~40%).
// L1 name·group / L2 emoji vibe tags / L3 personalized reason / L4 per-layer
// match bars. On touch devices L3+L4 start collapsed: first tap lifts the
// card and reveals them, second tap navigates.

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SimilarArtist, LayerScores } from "@/lib/types";
import { emojiTags, zhTrait } from "@/lib/cardMeta";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "./Thumb";
import FavoriteButton from "./FavoriteButton";

const LAYERS: { key: keyof LayerScores; label: string; color: string }[] = [
  { key: "aesthetic",   label: "美學", color: "#ff00cc" },
  { key: "personality", label: "個性", color: "#9933ff" },
  { key: "performance", label: "表演", color: "#00e5ff" },
  { key: "content",     label: "內容", color: "#ffe14d" },
];

const LIFT = "-translate-y-1 border-[#ff00cc]/70 shadow-[0_0_18px_rgba(255,0,204,0.45)]";

interface Props {
  similar: SimilarArtist;
  reason: string | null;          // AI-generated (or null while loading/absent)
  personal: string | null;        // locally computed from onboarding picks
  loading: boolean;
}

export default function SimilarIdolCard({ similar, reason, personal, loading }: Props) {
  const { artist, layerScores } = similar;
  const [isTouch, setIsTouch] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  const collapsed = isTouch && !expanded;
  const emojis = emojiTags(artist);
  const groupSym = getGroupSymbol(artist.group);
  const fallbackTraits = similar.topTraits.length
    ? `相似特質：${similar.topTraits.slice(0, 2).map(zhTrait).join("、")}`
    : similar.reasons[0] ?? "";
  const reasonText = personal ?? reason ?? (loading ? null : fallbackTraits);

  const handleTap = (e: React.MouseEvent) => {
    if (collapsed) {
      e.preventDefault();
      setExpanded(true);
    }
    // Second tap on touch (or any desktop click) — let Link navigate.
  };

  return (
    <Link
      href={`/artist/${artist.id}`}
      onClick={handleTap}
      className={`group block overflow-hidden rounded-2xl border-2 border-[#ff00cc]/30 bg-[#1f0533]/85 shadow-[3px_3px_0_rgba(204,0,255,0.25)] transition duration-200 hover:-translate-y-1 hover:border-[#ff00cc]/70 hover:shadow-[0_0_18px_rgba(255,0,204,0.45)] ${
        isTouch && expanded ? LIFT : ""
      }`}
    >
      {/* Top zone — photo */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-none" focusY={artist.image_focus} />
        {/* group symbol badge */}
        <span
          className={`frame-symbol${groupSym.length > 2 ? " frame-symbol--long" : ""} pointer-events-none absolute left-1.5 top-1.5 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/40 px-1 text-white drop-shadow backdrop-blur-sm`}
          style={{ fontSize: groupSym.length > 2 ? 9 : 13 }}
        >
          {groupSym}
        </span>
        <div className="absolute right-1.5 top-1.5 z-20">
          <FavoriteButton id={artist.id} size="sm" />
        </div>
      </div>

      {/* Bottom zone — info panel */}
      <div className="space-y-1 bg-[#14021f]/70 p-2 backdrop-blur-sm">
        <div className="truncate text-[12px]">
          <span className="font-black text-white">{artist.name}</span>
          {artist.group && <span className="text-white/45"> · {artist.group}</span>}
        </div>

        <div className="text-[13px] leading-none tracking-wide">{emojis.join(" ")}</div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            collapsed ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
          }`}
        >
          <p className="line-clamp-2 min-h-[1.6em] text-[10px] leading-snug text-pink-200/85">
            {reasonText ?? <span className="animate-pulse text-[#ff66cc]/60">・・・</span>}
          </p>

          <div className="mt-1.5 grid grid-cols-4 gap-1">
            {LAYERS.map(({ key, label, color }) => {
              const pct = Math.max(6, Math.round((layerScores?.[key] ?? 0) * 100));
              return (
                <div key={key}>
                  <div className="h-1 rounded-full bg-white/10">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="mt-0.5 text-center text-[8px] text-white/40">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
