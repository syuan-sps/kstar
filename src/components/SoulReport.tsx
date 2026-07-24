"use client";

// 完整報告 — the text-rich Taste Portrait. Per-layer breakdown, a reflection of
// the user's actual quiz answers, the 隱藏面, and the 追星宇宙. The whole card is
// the export target (a tall downloadable PNG).

import { useRef, useState, type ReactNode } from "react";
import { SCORE_LAYERS } from "@/lib/types";
import {
  type ArchetypeResult, ARCHETYPES, LAYER_COLOR, LAYER_MEANINGS, barLabel, layerLabel,
  soulmateCodes, expandCode, compatibilityPct, wallClimbType,
} from "@/lib/archetypes";
import { MOODS } from "@/lib/questionnaire";
import { displayTrait } from "@/lib/cardMeta";
import { exportNode } from "@/lib/exportImage";
import { CARD_BTN_PRIMARY, CARD_BTN_SECONDARY, CARD_BTN_SECONDARY_STYLE } from "@/lib/cardActionStyles";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { getFanIdTheme, type FanIdThemeId } from "@/lib/fanIdThemes";

const GHOST = "#8a8d93";
// flat, low-contrast brushed-metal tone — no dramatic banding across text
// discovery-row icon colors are semantic (not per-archetype accent): ❤ cherry, ✧ steel, ↗ blue
const DISCOVER_ICON_COLOR: Record<string, string> = { "❤": "#b4302b", "✧": "#7c8088", "↗": "#56789f" };

export interface ResultAnswers {
  contrast?: boolean | null;
  visualMood?: string | null;
  valueTokens?: string[];
}

export default function SoulReport({
  result, answers, themeId, hideActions = false, extraActions,
}: {
  result: ArchetypeResult;
  answers?: ResultAnswers;
  themeId?: FanIdThemeId;
  hideActions?: boolean;
  extraActions?: ReactNode;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const reportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { code, archetype, colorStory, dualityLine, hiddenLayer, bars, high } = result;
  const theme = getFanIdTheme(themeId);
  const accent = theme.accent || colorStory.accent;

  const soulmate = soulmateCodes(code)[0];
  const soulmateA = soulmate ? ARCHETYPES[soulmate] : null;
  const expand = expandCode(code);
  const expandA = expand !== code ? ARCHETYPES[expand] : null;
  const wall = wallClimbType(hiddenLayer);

  const moodLabel = answers?.visualMood ? MOODS.find((m) => m.id === answers.visualMood)?.label[locale] : null;
  const values = (answers?.valueTokens ?? []).map((t) => displayTrait(locale, t)).filter((v): v is string => !!v);
  const hasAnswers = answers?.contrast != null || !!moodLabel || values.length > 0;

  async function run(kind: "download" | "share") {
    if (!reportRef.current || busy) return;
    setBusy(true); setFailed(false);
    const { ok } = await exportNode(reportRef.current, {
      fileName: `kstar-report-${code}.png`,
      pixelRatio: 2,
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
      {/* export target — the card itself (the known-good export shape) */}
      <div
        ref={reportRef}
        className="relative w-full max-w-[340px] overflow-hidden rounded-[24px] p-5 text-left"
        style={{
          backgroundImage: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.75), 0 0 0 2px rgba(0,0,0,0.22), 0 24px 48px rgba(0,0,0,0.35)",
        }}
      >
        {/* inset chrome bevel */}
        <div className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.92),inset_0_-1.5px_0_rgba(0,0,0,0.16),inset_1.5px_0_0_rgba(255,255,255,0.55),inset_-1.5px_0_0_rgba(0,0,0,0.1)]" />
        {/* corner ✦ stickers — chrome TL / accent BR */}
        <span className="absolute left-3 top-2.5 text-[11px] leading-none text-[#5a5a5a]">✦</span>
        <span className="absolute bottom-2.5 right-3 text-[10px] leading-none" style={{ color: accent }}>✦</span>

        {/* hero */}
        <div className="whitespace-nowrap text-center font-orbitron text-[9px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;{copy.resultTitle}&nbsp;✦</div>
        <div className="mt-2 flex justify-center gap-1 font-orbitron text-[30px] font-black leading-none">
          {code.split("").map((ch, i) => {
            const isHigh = ch === ch.toUpperCase();
            return <span key={i} style={{ color: isHigh ? accent : GHOST }}>{ch}</span>;
          })}
        </div>
        <div className="mt-2 text-center">
          <div className="text-xl font-black tracking-tight text-[#1c1e24]">{archetype.name[locale]}</div>
          <div className="mt-0.5 font-orbitron text-[9px] uppercase tracking-[0.2em] text-[#9aa0aa]">
            {locale === "zh" ? archetype.enName : code}
          </div>
        </div>
        <p className="mx-auto mt-2 max-w-[280px] text-center text-[12px] leading-relaxed text-[#5e636d]">「{archetype.tagline[locale]}」</p>

        {/* 四層拆解 */}
        <SectionHeader label={copy.reportLayers} accent={accent} />
        <div className="space-y-2.5">
          {SCORE_LAYERS.map((L) => {
            const isHigh = high[L];
            return (
              <div key={L}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#1a1a1a]">{layerLabel(locale, L)}</span>
                  <span className="rounded-full px-1.5 text-[9px] font-bold shadow-[0_1px_0_rgba(0,0,0,0.1)]"
                    style={{ color: isHigh ? "#fff" : "#4a4a4a", backgroundColor: isHigh ? LAYER_COLOR[L] : "rgba(0,0,0,0.12)" }}>
                    {/* a non-defining axis never reads high, even if its raw bar is long */}
                    {isHigh ? `${barLabel(locale, 100)} ✦` : barLabel(locale, Math.min(bars[L], 55))}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(8, bars[L])}%`, backgroundColor: isHigh ? LAYER_COLOR[L] : "#8a8d93", boxShadow: isHigh ? `0 0 6px ${LAYER_COLOR[L]}99` : undefined }}
                  />
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[#3a3a3a]">{isHigh ? LAYER_MEANINGS[L].high[locale] : LAYER_MEANINGS[L].low[locale]}</p>
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
                  value={answers.contrast ? copy.contrastYesLine : copy.contrastNoLine} accent={accent} />
              )}
              {moodLabel && <AnswerLine label={copy.reportVisual} value={moodLabel} accent={accent} />}
              {values.length > 0 && <AnswerLine label={copy.reportResonance} value={values.join(locale === "en" ? ", " : "、")} accent={accent} />}
            </div>
          </>
        )}

        {/* 隱藏面 */}
        <SectionHeader label={`${copy.resultHidden} · ${layerLabel(locale, hiddenLayer)}`} accent={accent} />
        <p className="text-[12px] leading-relaxed text-[#5e636d]">{dualityLine[locale]}</p>

        {/* 追星宇宙 */}
        <SectionHeader label={copy.reportUniverse} accent={accent} />
        <div className="space-y-2 text-[12px]">
          {soulmateA && (
            <DiscoverRow icon="❤" label={copy.resultSoulmate}
              value={`${soulmateA.name[locale]} · ${copy.compatSuffix(compatibilityPct(code, soulmate))}`} note={copy.soulmateNote} accent={accent} />
          )}
          {expandA && (
            <DiscoverRow icon="✧" label={copy.resultExpand} value={expandA.name[locale]} note={copy.expandNote} accent={accent} />
          )}
          <DiscoverRow icon="↗" label={copy.resultWallClimb} value={copy.wallClimbGroupSuffix(wall.name[locale])} note={copy.wallClimbNote} accent={accent} />
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-center gap-1.5 whitespace-nowrap font-orbitron text-[9px] font-bold tracking-[0.28em] text-[#7c8088]">
          <span>✦</span><span>{copy.storyCta}　KStar · 2026</span><span>✦</span>
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
      {!hideActions && failed && <p className="text-center text-[11px] text-[#b4302b]">{copy.exportFailedReport}</p>}
    </div>
  );
}

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2">
      {/* label can never wrap: it truncates instead, and the divider keeps a floor width */}
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      <span className="min-w-0 truncate font-orbitron text-[10px] font-black uppercase tracking-[0.18em] text-[#1c1e24]">{label}</span>
      <span className="h-px min-w-3 flex-1" style={{ backgroundColor: "#c8ccd2" }} />
    </div>
  );
}

function AnswerLine({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-xl border border-white/[0.55] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_0_rgba(0,0,0,0.06)]"
      style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.42), rgba(255,255,255,0.22))" }}
    >
      <span className="text-[10px] text-[#5a5a5a]">{label}：</span>
      <span className="text-[12px] font-bold" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function DiscoverRow({ icon, label, value, note, accent }: {
  icon: string; label: string; value: string; note: string; accent: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-white/[0.55] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_0_rgba(0,0,0,0.06)]"
      style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.42), rgba(255,255,255,0.22))" }}
    >
      <span className="text-sm" style={{ color: DISCOVER_ICON_COLOR[icon] ?? accent }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-[#5a5a5a]">{label}：</span>
        <span className="font-bold text-[#1a1a1a]">{value}</span>
        <div className="truncate text-[10px] text-[#5a5a5a]">{note}</div>
      </div>
    </div>
  );
}
