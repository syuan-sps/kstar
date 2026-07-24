"use client";

// 限動卡 — the IG-story share asset (9:16, exports transparent ~1080-wide).
// Text-light and archetype-only: code, hero name, one tagline, compact bars,
// and CTA. Content is distributed top/middle/bottom so there's no empty middle.

import { useRef, useState, type ReactNode } from "react";
import { SCORE_LAYERS } from "@/lib/types";
import { type ArchetypeResult, layerLabel } from "@/lib/archetypes";
import { exportNode } from "@/lib/exportImage";
import { CARD_BTN_PRIMARY, CARD_BTN_SECONDARY, CARD_BTN_SECONDARY_STYLE } from "@/lib/cardActionStyles";
import { getStoryCardDecor } from "@/lib/storyCardDecor";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { getFanIdTheme, type FanIdThemeId } from "@/lib/fanIdThemes";
import { getCardFrame, type CardFrameTreatmentId } from "@/lib/cardFrameAssets";

const GHOST = "#8a8d93";
// flat, low-contrast brushed-metal tone — no dramatic banding across text

export default function SoulStoryCard({ result, themeId, frameTreatmentId, hideActions = false, extraActions }: { result: ArchetypeResult; themeId?: FanIdThemeId; frameTreatmentId?: CardFrameTreatmentId | null; hideActions?: boolean; extraActions?: ReactNode }) {
  const copy = useCopy();
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { code, archetype, bars, high } = result;
  const decor = getStoryCardDecor({ code, leadLayer: result.leadLayer, missing: archetype.missing });
  const theme = getFanIdTheme(themeId);
  const collectorFrame = getCardFrame(frameTreatmentId, "story");
  const accent = theme.accent;
  const motifGlyph = {
    flare: "✦",
    notch: "⌐",
    spotlights: "◜◝",
    "archive-dots": "···",
    "orbit-dots": "·◦·",
    "orbit-ring": "◎",
  }[decor.motif];

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
        data-story-card-tier={decor.tier}
        data-story-card-motif={decor.motif}
        className="relative flex w-[270px] flex-col items-center gap-[30px] overflow-hidden rounded-[24px]"
        style={{
          height: 480, // explicit 9:16 (270×16/9) — html-to-image needs explicit dimensions
          backgroundImage: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.75), 0 0 0 2px rgba(0,0,0,0.22), 0 24px 48px rgba(0,0,0,0.35)",
          padding: "50px 18px 22px",
        }}
      >
          {/* inset chrome bevel */}
          <div className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.92),inset_0_-1.5px_0_rgba(0,0,0,0.16),inset_1.5px_0_0_rgba(255,255,255,0.55),inset_-1.5px_0_0_rgba(0,0,0,0.1)]" />
          {collectorFrame && (
            <img
              src={collectorFrame}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 h-full w-full select-none"
            />
          )}
          {/* corner ✦ stickers — chrome TL / accent BR */}
          <span className="absolute left-2.5 top-2 text-[11px] leading-none text-[#5a5a5a]">✦</span>
          <span className="absolute bottom-2 right-2.5 text-[10px] leading-none" style={{ color: accent }}>✦</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[62px] right-3 font-orbitron text-[11px] leading-none"
            style={{ color: accent, opacity: 0.72 }}
          >
            {motifGlyph}
          </span>
          {decor.ghostLayer && (
            <span
              aria-hidden="true"
              data-ghost-layer={decor.ghostLayer}
              className="pointer-events-none absolute right-3 top-[58%] h-1.5 w-1.5 rounded-full bg-[#c8ccd2]"
            />
          )}

          {/* top: identity */}
          <div className="flex shrink-0 flex-col items-center">
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

          {/* middle: archetype-only frequency panel */}
          <div
            className="flex h-[115px] w-[210px] shrink-0 flex-col justify-center rounded-[18px] border border-white/[0.55] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_0_rgba(0,0,0,0.06)]"
            style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.42), rgba(255,255,255,0.22))" }}
          >
            <div className="text-center font-orbitron text-[9px] font-bold tracking-[0.22em] text-[#5a5a5a]">{copy.storyFrequency}</div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {SCORE_LAYERS.map((L) => (
                <div key={L}>
                  <div className="h-2 overflow-hidden rounded-full bg-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(8, bars[L])}%`, backgroundColor: high[L] ? accent : "#8a8d93", boxShadow: high[L] ? `0 0 4px ${accent}99` : undefined }}
                    />
                  </div>
                  <div className="mt-0.5 text-center text-[8px]" style={{ color: high[L] ? "#1a1a1a" : "#6a6a6a", fontWeight: high[L] ? 700 : 400 }}>
                    {layerLabel(locale, L)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* bottom: CTA. The "測你的追星靈魂 →" invite is for whoever receives the
              shared PNG, so it's export-only (hidden on the owner's own screen). */}
          <div className="shrink-0 text-center">
            <div data-export-only className="whitespace-nowrap font-orbitron text-[11px] font-black tracking-wide" style={{ color: accent, display: "none" }}>{copy.storyCta}</div>
            <div className="mt-1 whitespace-nowrap font-orbitron text-[8px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;KStar&nbsp;·&nbsp;2026&nbsp;✦</div>
          </div>
        </div>

      {/* ── Actions (not exported) ──────────────────────────────────── */}
      {!hideActions && (
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button onClick={() => run("download")} disabled={busy} className={CARD_BTN_PRIMARY}>
          {busy ? copy.wizExporting : copy.fourCutDownload}
        </button>
        <button onClick={() => run("share")} disabled={busy} className={CARD_BTN_SECONDARY} style={CARD_BTN_SECONDARY_STYLE}>
          {copy.fourCutShare}
        </button>
        {extraActions}
      </div>
      )}
      {!hideActions && failed && <p className="text-center text-[11px] text-[#b4302b]">{copy.exportFailedStory}</p>}
    </div>
  );
}
