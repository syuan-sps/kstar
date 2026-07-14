"use client";

// 限動卡 — the IG-story share asset (9:16, exports transparent ~1080-wide).
// Text-light: code, hero name, one tagline, four mini-photocards, compact bars,
// CTA. Content is distributed top/middle/bottom so there's no empty middle.

import { useRef, useState } from "react";
import type { CardArtist } from "@/lib/lite";
import { SCORE_LAYERS } from "@/lib/types";
import { type ArchetypeResult, layerLabel, LAYER_COLOR } from "@/lib/archetypes";
import { exportNode } from "@/lib/exportImage";
import Thumb from "@/components/Thumb";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";

const GHOST = "#c8ccd2";

// A mini photocard framed like the 圖鑑 cards: rounded colour border, a white
// inner frame, and an offset sticker shadow for a 3D feel.
export function MiniPhotoCard({ a, accent, label }: { a: CardArtist; accent: string; label?: boolean }) {
  return (
    <div
      className="overflow-hidden rounded-[12px] border-2 shadow-[2px_2px_0_rgba(124,128,136,0.28)]"
      style={{ borderColor: `${accent}55`, background: "linear-gradient(180deg,#ffffff,#eceef2)" }}
    >
      <div className="m-[3px] overflow-hidden rounded-[8px]">
        <div className="relative aspect-[3/4]">
          <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-none" focusY={a.image_focus} />
        </div>
      </div>
      {label && <div className="truncate px-0.5 pb-0.5 text-center text-[8px] font-bold text-[#1c1e24]">{a.name}</div>}
    </div>
  );
}

export default function SoulStoryCard({ result, picks }: { result: ArchetypeResult; picks: CardArtist[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { code, archetype, colorStory, bars, high } = result;
  const accent = colorStory.accent;

  async function run(kind: "download" | "share") {
    if (!cardRef.current || busy) return;
    setBusy(true); setFailed(false);
    const { ok } = await exportNode(cardRef.current, {
      fileName: `kstar-${code}.png`,
      pixelRatio: 4,
      kind,
      shareText: copy.shareTextReport(archetype.name[locale], code),
      shareTitle: copy.reshareEntry,
      locale,
    });
    if (!ok) setFailed(true);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* export target — the card itself (fixed size; the known-good export shape) */}
      <div
        ref={cardRef}
        className="relative flex w-[270px] flex-col items-center justify-between overflow-hidden rounded-[24px]"
        style={{
          height: 480, // explicit 9:16 (270×16/9) — html-to-image needs explicit dimensions
          // Silvercore: faint silver grid + chrome sheen over the frost gradient (all inline so html-to-image rasterises it)
          backgroundColor: "#f4f5f7",
          backgroundImage: [
            "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(124,128,136,0.06) 19px, rgba(124,128,136,0.06) 20px)",
            "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(124,128,136,0.06) 19px, rgba(124,128,136,0.06) 20px)",
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.7) 0%, transparent 55%)",
            "radial-gradient(90% 70% at 100% 18%, rgba(167,192,220,0.22) 0%, transparent 55%)",
            `radial-gradient(90% 70% at 0% 90%, ${accent}14 0%, transparent 55%)`,
            "linear-gradient(165deg, #ffffff 0%, #f4f5f7 52%, #e6e9ed 100%)",
          ].join(", "),
          border: `2px solid ${accent}55`,
          // signature hard "sticker" offset shadow (steel + accent) instead of a soft drop
          boxShadow: `3px 4px 0 ${accent}30, 6px 7px 0 rgba(124,128,136,0.14), 0 10px 26px rgba(80,85,95,0.16), inset 0 0 0 1px rgba(255,255,255,0.6)`,
          padding: "22px 18px",
        }}
      >
          {/* corner ✦ stickers — the 圖鑑 card signature (steel TL / cherry BR) */}
          <span className="absolute left-2.5 top-2 text-[11px] leading-none text-[#7c8088]">✦</span>
          <span className="absolute bottom-2 right-2.5 text-[10px] leading-none" style={{ color: accent }}>✦</span>

          {/* top: identity */}
          <div className="flex flex-col items-center">
            <div className="whitespace-nowrap font-orbitron text-[9px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;{copy.resultTitle}&nbsp;✦</div>
            <div className="mt-3 flex justify-center gap-1.5 font-orbitron text-[46px] font-black leading-none">
              {code.split("").map((ch, i) => {
                const isHigh = ch === ch.toUpperCase();
                return <span key={i} style={{ color: isHigh ? accent : GHOST, textShadow: isHigh ? "0 1px 0 #fff" : undefined }}>{ch}</span>;
              })}
            </div>
            {/* chrome divider — mirrored hairline with a clipped ✦ */}
            <div className="mt-2.5 flex w-[120px] items-center gap-1.5">
              <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(124,128,136,0.55), rgba(28,30,36,0.45))" }} />
              <span className="text-[8px] leading-none text-[#7c8088]">✦</span>
              <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(28,30,36,0.45), rgba(124,128,136,0.55), transparent)" }} />
            </div>
            <div className="mt-2 text-center">
              <div className="text-[26px] font-black leading-tight tracking-tight text-[#1c1e24]">{archetype.name[locale]}</div>
              <div className="mt-1 font-orbitron text-[9px] uppercase tracking-[0.22em] text-[#9aa0aa]">
                {locale === "zh" ? archetype.enName : code}
              </div>
            </div>
            <p className="mt-3 px-1 text-center text-[12px] leading-relaxed text-[#5e636d]">「{archetype.tagline[locale]}」</p>
          </div>

          {/* middle: representative idols + layer bars */}
          <div className="w-full">
            <div className="grid grid-cols-4 gap-2">
              {picks.slice(0, 4).map((a) => <MiniPhotoCard key={a.id} a={a} accent={accent} />)}
            </div>
            <div className="mt-3.5 grid grid-cols-4 gap-1.5">
              {SCORE_LAYERS.map((L) => (
                <div key={L}>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#7c8088]/15">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(8, bars[L])}%`, backgroundColor: high[L] ? LAYER_COLOR[L] : "#c8ccd2" }} />
                  </div>
                  <div className="mt-0.5 text-center text-[8px]" style={{ color: high[L] ? "#1c1e24" : "#9aa0aa", fontWeight: high[L] ? 700 : 400 }}>
                    {layerLabel(locale, L)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* bottom: CTA */}
          <div className="text-center">
            <div className="whitespace-nowrap font-orbitron text-[11px] font-black tracking-wide" style={{ color: accent }}>{copy.storyCta}</div>
            <div className="mt-1 whitespace-nowrap font-orbitron text-[8px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;KSTAR&nbsp;·&nbsp;2026&nbsp;✦</div>
          </div>
        </div>

      {/* ── Actions (not exported) ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => run("download")} disabled={busy}
          className="rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110 disabled:opacity-50">
          {busy ? copy.processing : copy.shareDownloadStory}
        </button>
        <button onClick={() => run("share")} disabled={busy}
          className="rounded-full border border-[#c8ccd2] bg-white px-4 py-2 text-xs font-bold text-[#1c1e24] transition hover:bg-[#7c8088]/10 disabled:opacity-50">
          {copy.shareShare}
        </button>
      </div>
      {failed && <p className="text-center text-[11px] text-[#b4302b]">{copy.exportFailedStory}</p>}
    </div>
  );
}
