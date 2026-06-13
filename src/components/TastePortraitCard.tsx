"use client";

// 追星卡 — the shareable Taste Portrait. The card (ref'd, screenshot target)
// carries the 4-letter code, hero name, tagline, 隱藏面 line, four mini
// photocards and the four layer bars. Below it sit the discovery loop
// (最合拍 / 互補 / 爬牆) and the share/download actions (not screenshotted).

import { useRef, useState } from "react";
import type { CardArtist } from "@/lib/lite";
import { SCORE_LAYERS } from "@/lib/types";
import {
  type ArchetypeResult, ARCHETYPES, LAYER_ZH, LAYER_COLOR,
  soulmateCodes, expandCode, compatibilityPct, wallClimbType,
} from "@/lib/archetypes";
import { copy } from "@/lib/copy";
import Thumb from "@/components/Thumb";

const GHOST = "#c8ccd2";

// Only the computed properties the share card actually renders with — limiting
// the copy set skips Tailwind v4's hundreds of inherited custom properties.
const EXPORT_STYLE_PROPS = [
  "display", "position", "top", "right", "bottom", "left", "box-sizing",
  "width", "height", "min-width", "max-width", "min-height", "max-height",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "flex-grow", "flex-shrink", "flex-basis", "flex-direction", "flex-wrap",
  "align-items", "justify-content", "gap", "column-gap", "row-gap", "grid-template-columns",
  "aspect-ratio", "overflow", "overflow-x", "overflow-y",
  "background-color", "background-image", "background-size", "background-position", "background-repeat",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
  "box-shadow", "opacity", "color",
  "font-family", "font-size", "font-weight", "font-style", "letter-spacing", "line-height",
  "text-align", "text-overflow", "white-space", "text-shadow", "text-transform",
  "object-fit", "object-position", "transform", "transform-origin",
];

export default function TastePortraitCard({
  result, picks, onRestart,
}: {
  result: ArchetypeResult;
  picks: CardArtist[];
  onRestart?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const { code, archetype, colorStory, dualityLine, hiddenLayer, bars, high } = result;
  const accent = colorStory.accent;

  // Discovery loop (derived from the code — no hand-authoring)
  const soulmate = soulmateCodes(code)[0];
  const soulmateA = soulmate ? ARCHETYPES[soulmate] : null;
  const expand = expandCode(code);
  const expandA = expand !== code ? ARCHETYPES[expand] : null;
  const wall = wallClimbType(hiddenLayer);

  async function render(kind: "download" | "share") {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    setExportFailed(false);
    try {
      const htmlToImage = await import("html-to-image");
      // Two perf fixes for Tailwind v4:
      //  · skipFonts/empty fontEmbedCSS — the full Noto Sans TC face is ~22MB and
      //    stalls rasterisation; text falls back to the system CJK font (≈Noto).
      //  · includeStyleProperties — only copy the properties the card needs, so
      //    we skip the hundreds of inherited --tw-*/@theme custom properties that
      //    otherwise bloat the clone and make export take 10s+.
      const opts = {
        pixelRatio: 2,
        backgroundColor: "#eceef1",
        skipFonts: true,
        fontEmbedCSS: "",
        includeStyleProperties: EXPORT_STYLE_PROPS,
      };
      // Ensure the four photos are decoded before capture, else html-to-image
      // grabs a blank/incomplete frame.
      await Promise.all(
        [...node.querySelectorAll("img")].map((im) =>
          im.complete && im.naturalWidth
            ? Promise.resolve()
            : new Promise<void>((res) => { im.onload = () => res(); im.onerror = () => res(); }),
        ),
      );
      // html-to-image's first render is often incomplete — retry a few times.
      let blob: Blob | null = null;
      for (let attempt = 0; attempt < 3 && !blob; attempt++) {
        try {
          const dataUrl = await Promise.race([
            htmlToImage.toPng(node, opts),
            new Promise<string>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
          ]);
          const b = await (await fetch(dataUrl)).blob();
          if (b && b.size > 5000) blob = b;
        } catch {
          /* retry */
        }
      }
      if (!blob) { setExportFailed(true); return; }
      const file = new File([blob], `kstar-${code}.png`, { type: "image/png" });
      const canShareFiles =
        kind === "share" &&
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [file] });
      if (canShareFiles) {
        await navigator.share({
          files: [file],
          title: "我的追星靈魂",
          text: `我是「${archetype.zhName}」(${code}) ✦ 來測你的 →`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* user cancelled share — silent */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ── The card (screenshot target) ─────────────────────────── */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[340px] overflow-hidden rounded-[22px] p-5"
        style={{
          background: "linear-gradient(170deg, #ffffff 0%, #f4f5f7 55%, #e9ebee 100%)",
          border: `2px solid ${accent}55`,
          boxShadow: "5px 5px 0 rgba(124,128,136,0.28)",
        }}
      >
        {/* header */}
        <div className="mb-1 text-center font-orbitron text-[10px] font-bold tracking-[0.3em] text-[#7c8088]">
          ✦ 你的追星靈魂 ✦
        </div>

        {/* 4-letter code — high axes glow in the lead-layer accent, low ghosted */}
        <div className="flex justify-center gap-1.5 font-orbitron text-[40px] font-black leading-none">
          {code.split("").map((ch, i) => {
            const isHigh = ch === ch.toUpperCase();
            return (
              <span key={i} style={{ color: isHigh ? accent : GHOST, textShadow: isHigh ? `0 1px 0 #fff` : undefined }}>
                {ch}
              </span>
            );
          })}
        </div>

        {/* hero name + EN subtitle */}
        <div className="mt-2 text-center">
          <div className="text-2xl font-black tracking-tight text-[#1c1e24]">{archetype.zhName}</div>
          <div className="mt-0.5 font-orbitron text-[10px] uppercase tracking-[0.2em] text-[#9aa0aa]">
            {archetype.enName}
          </div>
        </div>

        {/* tagline — the screenshot line */}
        <p className="mx-auto mt-2.5 max-w-[280px] text-center text-[12px] leading-relaxed text-[#5e636d]">
          「{archetype.tagline}」
        </p>

        {/* 隱藏面 duality */}
        <div
          className="mx-auto mt-3 rounded-xl px-3 py-2 text-center text-[11px] leading-snug"
          style={{ background: `${accent}12`, color: "#5e636d", border: `1px solid ${accent}33` }}
        >
          <span className="font-bold" style={{ color: accent }}>{copy.resultHidden} · {LAYER_ZH[hiddenLayer]}</span>
          <br />
          {dualityLine}
        </div>

        {/* 代表偶像 — four mini photocards */}
        <div className="mt-3.5">
          <div className="mb-1.5 text-center font-orbitron text-[9px] font-bold tracking-[0.2em] text-[#9aa0aa]">
            {copy.resultRecap}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {picks.slice(0, 4).map((a) => (
              <div key={a.id} className="overflow-hidden rounded-lg ring-1 ring-[#c8ccd2]">
                <div className="relative aspect-[3/4]">
                  <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-none" focusY={a.image_focus} />
                </div>
                <div className="truncate bg-white/80 px-0.5 py-0.5 text-center text-[8px] font-bold text-[#1c1e24]">
                  {a.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* four layer bars — high ones highlighted */}
        <div className="mt-3.5 grid grid-cols-4 gap-2">
          {SCORE_LAYERS.map((L) => {
            const pct = Math.max(8, bars[L]);
            const isHigh = high[L];
            return (
              <div key={L}>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-[#7c8088]/15">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: isHigh ? LAYER_COLOR[L] : "#c8ccd2" }}
                  />
                </div>
                <div className="mt-1 text-center text-[9px]" style={{ color: isHigh ? "#1c1e24" : "#9aa0aa", fontWeight: isHigh ? 700 : 400 }}>
                  {LAYER_ZH[L]}{isHigh ? " ✦" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-center gap-1.5 font-orbitron text-[10px] font-bold tracking-[0.28em] text-[#7c8088]">
          <span>✦</span><span>KSTAR · 2026</span><span>✦</span>
        </div>
      </div>

      {/* ── Discovery loop (below the card, not screenshotted) ─────── */}
      <div className="w-full max-w-[340px] space-y-2 text-[12px]">
        {soulmateA && (
          <DiscoverRow icon="❤" label={copy.resultSoulmate}
            value={`${soulmateA.zhName} · 契合 ${compatibilityPct(code, soulmate)}%`}
            note="你們會一起爬牆" accent={accent} />
        )}
        {expandA && (
          <DiscoverRow icon="✧" label={copy.resultExpand}
            value={expandA.zhName} note="補上你還沒探索的那一面" accent={accent} />
        )}
        <DiscoverRow icon="↗" label={copy.resultWallClimb}
          value={`「${wall.zhName}」那一掛`} note="你的下一個本命，可能在這裡" accent={accent} />
      </div>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex w-full max-w-[340px] flex-wrap items-center justify-center gap-2 pt-1">
        <button
          onClick={() => render("download")}
          disabled={busy}
          className="rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "處理中…" : copy.shareDownload}
        </button>
        <button
          onClick={() => render("share")}
          disabled={busy}
          className="rounded-full border border-[#c8ccd2] bg-white px-4 py-2 text-xs font-bold text-[#1c1e24] transition hover:bg-[#7c8088]/10 disabled:opacity-50"
        >
          {copy.shareShare}
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="rounded-full px-3 py-2 text-xs font-medium text-[#7c8088]/70 transition hover:text-[#7c8088]"
          >
            ↻ 重測
          </button>
        )}
      </div>
      <p className={`text-center text-[11px] ${exportFailed ? "text-[#b4302b]" : "text-[#9aa0aa]"}`}>
        {exportFailed ? "圖片匯出失敗 — 直接長按／截圖這張卡分享吧 ✦" : copy.shareHint}
      </p>
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
