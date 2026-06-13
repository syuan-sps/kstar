"use client";

// 限動卡 — the IG-story share asset (9:16, exports ~1080×1920). Text-light:
// code, hero name, one tagline, four photos, compact bars, and a CTA. No
// discovery loop / 隱藏面 box — that lives in the report.

import { useRef, useState } from "react";
import type { CardArtist } from "@/lib/lite";
import { SCORE_LAYERS } from "@/lib/types";
import { type ArchetypeResult, LAYER_ZH, LAYER_COLOR } from "@/lib/archetypes";
import { copy } from "@/lib/copy";
import { exportNode } from "@/lib/exportImage";
import Thumb from "@/components/Thumb";

const GHOST = "#c8ccd2";

export default function SoulStoryCard({ result, picks }: { result: ArchetypeResult; picks: CardArtist[] }) {
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
      pixelRatio: 4, // 270 × 480 → ~1080 × 1920
      kind,
      shareText: `我是「${archetype.zhName}」(${code}) ✦ 來測你的 →`,
    });
    if (!ok) setFailed(true);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ── The 9:16 card (export target) ───────────────────────────── */}
      <div
        ref={cardRef}
        className="flex w-[270px] flex-col items-center overflow-hidden rounded-[20px]"
        style={{
          aspectRatio: "9 / 16",
          background: "linear-gradient(165deg, #ffffff 0%, #f4f5f7 50%, #e6e9ed 100%)",
          border: `2px solid ${accent}55`,
          boxShadow: "4px 4px 0 rgba(124,128,136,0.28)",
          padding: "20px 18px",
        }}
      >
        <div className="font-orbitron text-[9px] font-bold tracking-[0.3em] text-[#7c8088]">✦ 你的追星靈魂 ✦</div>

        {/* code */}
        <div className="mt-3 flex justify-center gap-1.5 font-orbitron text-[46px] font-black leading-none">
          {code.split("").map((ch, i) => {
            const isHigh = ch === ch.toUpperCase();
            return (
              <span key={i} style={{ color: isHigh ? accent : GHOST, textShadow: isHigh ? "0 1px 0 #fff" : undefined }}>{ch}</span>
            );
          })}
        </div>

        {/* name */}
        <div className="mt-3 text-center">
          <div className="text-[26px] font-black leading-tight tracking-tight text-[#1c1e24]">{archetype.zhName}</div>
          <div className="mt-1 font-orbitron text-[9px] uppercase tracking-[0.22em] text-[#9aa0aa]">{archetype.enName}</div>
        </div>

        {/* one tagline */}
        <p className="mt-2.5 px-1 text-center text-[12px] leading-relaxed text-[#5e636d]">「{archetype.tagline}」</p>

        {/* four photos */}
        <div className="mt-auto w-full">
          <div className="grid grid-cols-4 gap-1.5">
            {picks.slice(0, 4).map((a) => (
              <div key={a.id} className="overflow-hidden rounded-md ring-1 ring-[#c8ccd2]">
                <div className="relative aspect-[3/4]">
                  <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-none" focusY={a.image_focus} />
                </div>
              </div>
            ))}
          </div>

          {/* compact bars */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {SCORE_LAYERS.map((L) => (
              <div key={L}>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#7c8088]/15">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(8, bars[L])}%`, backgroundColor: high[L] ? LAYER_COLOR[L] : "#c8ccd2" }} />
                </div>
                <div className="mt-0.5 text-center text-[8px]" style={{ color: high[L] ? "#1c1e24" : "#9aa0aa", fontWeight: high[L] ? 700 : 400 }}>
                  {LAYER_ZH[L]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div className="mt-3 text-center">
          <div className="font-orbitron text-[11px] font-black tracking-wide" style={{ color: accent }}>{copy.storyCta}</div>
          <div className="mt-1 font-orbitron text-[8px] font-bold tracking-[0.3em] text-[#7c8088]">✦ KSTAR · 2026 ✦</div>
        </div>
      </div>

      {/* ── Actions (not exported) ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => run("download")} disabled={busy}
          className="rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110 disabled:opacity-50">
          {busy ? "處理中…" : copy.shareDownloadStory}
        </button>
        <button onClick={() => run("share")} disabled={busy}
          className="rounded-full border border-[#c8ccd2] bg-white px-4 py-2 text-xs font-bold text-[#1c1e24] transition hover:bg-[#7c8088]/10 disabled:opacity-50">
          {copy.shareShare}
        </button>
      </div>
      {failed && <p className="text-center text-[11px] text-[#b4302b]">圖片匯出失敗 — 直接長按／截圖這張卡分享吧 ✦</p>}
    </div>
  );
}
