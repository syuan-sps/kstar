"use client";

// 完整報告 — the text-rich Taste Portrait. Per-layer breakdown, a reflection of
// the user's actual quiz answers, the 隱藏面, and the 追星宇宙. The whole card is
// the export target (a tall downloadable PNG).

import { useRef, useState } from "react";
import type { CardArtist } from "@/lib/lite";
import { SCORE_LAYERS } from "@/lib/types";
import {
  type ArchetypeResult, ARCHETYPES, LAYER_ZH, LAYER_COLOR, LAYER_MEANINGS, barLabel,
  soulmateCodes, expandCode, compatibilityPct, wallClimbType,
} from "@/lib/archetypes";
import { MOODS } from "@/lib/questionnaire";
import { zhTrait } from "@/lib/cardMeta";
import { copy } from "@/lib/copy";
import { exportNode } from "@/lib/exportImage";
import { MiniPhotoCard } from "@/components/SoulStoryCard";

const GHOST = "#c8ccd2";

export interface ResultAnswers {
  contrast?: boolean | null;
  visualMood?: string | null;
  valueTokens?: string[];
}

export default function SoulReport({
  result, picks, answers,
}: {
  result: ArchetypeResult;
  picks: CardArtist[];
  answers?: ResultAnswers;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { code, archetype, colorStory, dualityLine, hiddenLayer, bars, high } = result;
  const accent = colorStory.accent;

  const soulmate = soulmateCodes(code)[0];
  const soulmateA = soulmate ? ARCHETYPES[soulmate] : null;
  const expand = expandCode(code);
  const expandA = expand !== code ? ARCHETYPES[expand] : null;
  const wall = wallClimbType(hiddenLayer);

  const moodLabel = answers?.visualMood ? MOODS.find((m) => m.id === answers.visualMood)?.label : null;
  const values = answers?.valueTokens?.filter(Boolean) ?? [];
  const hasAnswers = answers?.contrast != null || !!moodLabel || values.length > 0;

  async function run(kind: "download" | "share") {
    if (!reportRef.current || busy) return;
    setBusy(true); setFailed(false);
    const { ok } = await exportNode(reportRef.current, {
      fileName: `kstar-report-${code}.png`,
      pixelRatio: 2,
      kind,
      shareText: `我是「${archetype.zhName}」(${code}) ✦ 來測你的 →`,
    });
    if (!ok) setFailed(true);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* export target — the card itself (the known-good export shape) */}
      <div
        ref={reportRef}
        className="relative w-full max-w-[340px] overflow-hidden rounded-[24px] p-5"
        style={{
          // Silvercore: faint silver grid + chrome sheen over the frost gradient (inline so html-to-image rasterises it)
          backgroundColor: "#f4f5f7",
          backgroundImage: [
            "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(124,128,136,0.06) 19px, rgba(124,128,136,0.06) 20px)",
            "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(124,128,136,0.06) 19px, rgba(124,128,136,0.06) 20px)",
            "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.7) 0%, transparent 45%)",
            "radial-gradient(90% 50% at 100% 12%, rgba(167,192,220,0.20) 0%, transparent 50%)",
            `radial-gradient(90% 50% at 0% 96%, ${accent}12 0%, transparent 50%)`,
            "linear-gradient(175deg, #ffffff 0%, #f4f5f7 60%, #e9ebee 100%)",
          ].join(", "),
          border: `2px solid ${accent}55`,
          // signature hard "sticker" offset shadow (accent + steel echo) instead of a soft drop
          boxShadow: `3px 4px 0 ${accent}30, 6px 7px 0 rgba(124,128,136,0.14), 0 10px 26px rgba(80,85,95,0.16), inset 0 0 0 1px rgba(255,255,255,0.6)`,
        }}
      >
        {/* corner ✦ stickers — the 圖鑑 card signature (steel TL / cherry BR) */}
        <span className="absolute left-3 top-2.5 text-[11px] leading-none text-[#7c8088]">✦</span>
        <span className="absolute bottom-2.5 right-3 text-[10px] leading-none" style={{ color: accent }}>✦</span>

        {/* hero */}
        <div className="whitespace-nowrap text-center font-orbitron text-[9px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;你的追星靈魂&nbsp;✦</div>
        <div className="mt-2 flex justify-center gap-1 font-orbitron text-[30px] font-black leading-none">
          {code.split("").map((ch, i) => {
            const isHigh = ch === ch.toUpperCase();
            return <span key={i} style={{ color: isHigh ? accent : GHOST }}>{ch}</span>;
          })}
        </div>
        <div className="mt-2 text-center">
          <div className="text-xl font-black tracking-tight text-[#1c1e24]">{archetype.zhName}</div>
          <div className="mt-0.5 font-orbitron text-[9px] uppercase tracking-[0.2em] text-[#9aa0aa]">{archetype.enName}</div>
        </div>
        <p className="mx-auto mt-2 max-w-[280px] text-center text-[12px] leading-relaxed text-[#5e636d]">「{archetype.tagline}」</p>

        {/* 代表偶像 */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {picks.slice(0, 4).map((a) => <MiniPhotoCard key={a.id} a={a} accent={accent} label />)}
        </div>

        {/* 四層拆解 */}
        <SectionHeader label={copy.reportLayers} accent={accent} />
        <div className="space-y-2.5">
          {SCORE_LAYERS.map((L) => {
            const isHigh = high[L];
            return (
              <div key={L}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#1c1e24]">{LAYER_ZH[L]}</span>
                  <span className="rounded-full px-1.5 text-[9px] font-bold"
                    style={{ color: isHigh ? "#fff" : "#7c8088", backgroundColor: isHigh ? LAYER_COLOR[L] : "#c8ccd2" }}>
                    {/* a non-defining axis never reads 高, even if its raw bar is long */}
                    {isHigh ? "高 ✦" : barLabel(Math.min(bars[L], 55))}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#7c8088]/15">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(8, bars[L])}%`, backgroundColor: isHigh ? LAYER_COLOR[L] : "#c8ccd2" }} />
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[#5e636d]">{isHigh ? LAYER_MEANINGS[L].high : LAYER_MEANINGS[L].low}</p>
              </div>
            );
          })}
        </div>

        {/* 你的答案 */}
        {hasAnswers && (
          <>
            <SectionHeader label={copy.reportAnswers} accent={accent} />
            <div className="space-y-1.5">
              {answers?.contrast != null && (
                <AnswerLine label={copy.reportContrast}
                  value={answers.contrast ? "反差萌 — 台上台下兩個樣最迷人" : "始終如一 — 怎麼看都是同一個人"} accent={accent} />
              )}
              {moodLabel && <AnswerLine label={copy.reportVisual} value={moodLabel} accent={accent} />}
              {values.length > 0 && <AnswerLine label={copy.reportResonance} value={values.map(zhTrait).join("、")} accent={accent} />}
            </div>
          </>
        )}

        {/* 隱藏面 */}
        <SectionHeader label={`${copy.resultHidden} · ${LAYER_ZH[hiddenLayer]}`} accent={accent} />
        <p className="text-[12px] leading-relaxed text-[#5e636d]">{dualityLine}</p>

        {/* 追星宇宙 */}
        <SectionHeader label={copy.reportUniverse} accent={accent} />
        <div className="space-y-2 text-[12px]">
          {soulmateA && (
            <DiscoverRow icon="❤" label={copy.resultSoulmate}
              value={`${soulmateA.zhName} · 契合 ${compatibilityPct(code, soulmate)}%`} note="你們會一起爬牆" accent={accent} />
          )}
          {expandA && (
            <DiscoverRow icon="✧" label={copy.resultExpand} value={expandA.zhName} note="補上你還沒探索的那一面" accent={accent} />
          )}
          <DiscoverRow icon="↗" label={copy.resultWallClimb} value={`「${wall.zhName}」那一掛`} note="你的下一個本命，可能在這裡" accent={accent} />
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-center gap-1.5 whitespace-nowrap font-orbitron text-[9px] font-bold tracking-[0.28em] text-[#7c8088]">
          <span>✦</span><span>{copy.storyCta}　KSTAR · 2026</span><span>✦</span>
        </div>
      </div>

      {/* ── Actions (not exported) ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => run("download")} disabled={busy}
          className="rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110 disabled:opacity-50">
          {busy ? "處理中…" : copy.shareDownloadReport}
        </button>
        <button onClick={() => run("share")} disabled={busy}
          className="rounded-full border border-[#c8ccd2] bg-white px-4 py-2 text-xs font-bold text-[#1c1e24] transition hover:bg-[#7c8088]/10 disabled:opacity-50">
          {copy.shareShare}
        </button>
      </div>
      {failed && <p className="text-center text-[11px] text-[#b4302b]">圖片匯出失敗 — 直接長按／截圖這份報告分享吧 ✦</p>}
    </div>
  );
}

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.18em] text-[#1c1e24]">{label}</span>
      <span className="h-px flex-1" style={{ backgroundColor: "#c8ccd2" }} />
    </div>
  );
}

function AnswerLine({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-[#c8ccd2]/40 bg-white/70 px-3 py-1.5">
      <span className="text-[10px]" style={{ color: accent }}>{label}：</span>
      <span className="text-[12px] font-bold text-[#1c1e24]">{value}</span>
    </div>
  );
}

function DiscoverRow({ icon, label, value, note, accent }: {
  icon: string; label: string; value: string; note: string; accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#c8ccd2]/40 bg-white/70 px-3 py-2">
      <span className="text-sm" style={{ color: accent }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-[#9aa0aa]">{label}：</span>
        <span className="font-bold text-[#1c1e24]">{value}</span>
        <div className="truncate text-[10px] text-[#9aa0aa]">{note}</div>
      </div>
    </div>
  );
}
