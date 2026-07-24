"use client";

// Result wrapper — toggles between the 限動卡 (9:16 share card), the 完整報告
// (detailed text report), and the 追星證, all from the same result.
// Keeps the original export name so SoulQuiz / SoulPortraitButton import it as-is.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import type { FanIdThemeId } from "@/lib/fanIdThemes";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { exportNode } from "@/lib/exportImage";
import { CARD_BTN_PRIMARY, CARD_BTN_SECONDARY, CARD_BTN_SECONDARY_STYLE, CARD_BTN_GHOST, CARD_BTN_DARK } from "@/lib/cardActionStyles";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";
import FanIdCard from "@/components/FanIdCard";
import FanIdDecorateOverlay from "@/components/FanIdDecorateOverlay";
import SoulColorOverlay, { readStoryThemeId } from "@/components/SoulColorOverlay";
import FacePhotoPicker from "@/components/FacePhotoPicker";
import { useFanIdLocalMedia } from "@/hooks/useFanIdLocalMedia";
import type { FanIdCardMode } from "@/lib/types";
import {
  normalizeCardMode,
  normalizeThemeId,
} from "@/lib/wizardState";

type FanIdPrefs = {
  heroId?: string;
  fanName?: string;
  issuedAt?: string;
  serial?: string;
  themeId?: FanIdThemeId;
  cardMode?: FanIdCardMode;
  hideArchetype?: boolean;
};

function boundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

export function normalizeFanIdPrefs(value: unknown): FanIdPrefs {
  const prefs = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    heroId: boundedString(prefs.heroId, 128) ? prefs.heroId : undefined,
    fanName: boundedString(prefs.fanName, 30) ? prefs.fanName : undefined,
    issuedAt: typeof prefs.issuedAt === "string" && /^\d{4}\.\d{2}\.\d{2}$/.test(prefs.issuedAt) ? prefs.issuedAt : undefined,
    serial: typeof prefs.serial === "string" && /^[A-Za-z0-9-]{1,32}$/.test(prefs.serial) ? prefs.serial : undefined,
    themeId: normalizeThemeId(prefs.themeId),
    cardMode: normalizeCardMode(prefs.cardMode),
    hideArchetype: prefs.hideArchetype === true,
  };
}

function loadFanIdPrefs(): FanIdPrefs {
  if (typeof window === "undefined") return normalizeFanIdPrefs(undefined);
  try { return normalizeFanIdPrefs(JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}")); }
  catch { return normalizeFanIdPrefs(undefined); }
}

type View = "lead" | "story" | "report" | "pass";

export default function TastePortraitCard({
  result, picks, answers, onRestart, defaultView = "story", leadTab, hidePhotoToggle = false, onRedoQuiz, allowDecorate = false,
}: {
  result: ArchetypeResult;
  picks: CardArtist[];
  answers?: ResultAnswers;
  onRestart?: () => void;
  /** Which tab opens first. The home showcase leads with the 追星證. */
  defaultView?: View;
  /** Optional extra tab prepended before 限動卡 (home uses it for the 人生四格). */
  leadTab?: { label: string; content: ReactNode };
  /** Hide the 本人版/純分享版 photo toggle (the home showcase keeps things minimal). */
  hidePhotoToggle?: boolean;
  /** When set, the 限動卡 / 完整報告 views show a 重新測驗 button (redo the quiz). */
  onRedoQuiz?: () => void;
  /** When true, the 追星證 view shows a 裝飾 button that opens the Fan ID editor popup. */
  allowDecorate?: boolean;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(defaultView);
  const [prefs, setPrefs] = useState<FanIdPrefs>(loadFanIdPrefs);
  const [showFace, setShowFace] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | "download" | "share">(null);
  const [exportFailed, setExportFailed] = useState(false);
  const [decorateOpen, setDecorateOpen] = useState(false);
  const [storyThemeId, setStoryThemeId] = useState(() => (typeof window === "undefined" ? "chrome" : readStoryThemeId()));
  const [colorOpen, setColorOpen] = useState(false);

  async function runFanIdExport(kind: "download" | "share") {
    if (!cardRef.current || exporting) return;
    setExporting(kind);
    setExportFailed(false);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all([...cardRef.current.querySelectorAll("img")].map((im) => im.decode ? im.decode().catch(() => undefined) : Promise.resolve()));
    const { ok } = await exportNode(cardRef.current, { fileName: "kstar-fanid-card.png", kind, locale });
    if (!ok) setExportFailed(true);
    setExporting(null);
  }
  const tabs: [View, string][] = [
    ...(leadTab ? [["lead", leadTab.label] as [View, string]] : []),
    ["story", copy.viewStory], ["report", copy.viewReport], ["pass", copy.viewPass],
  ];

  const readPrefs = useCallback(() => {
    setPrefs(loadFanIdPrefs());
    setStoryThemeId(readStoryThemeId());
  }, []);

  useEffect(() => {
    window.addEventListener("kstar:prefs-updated", readPrefs);
    window.addEventListener("storage", readPrefs);
    return () => {
      window.removeEventListener("kstar:prefs-updated", readPrefs);
      window.removeEventListener("storage", readPrefs);
    };
  }, [readPrefs]);

  const heroId = picks.some((pick) => pick.id === prefs.heroId) ? prefs.heroId! : picks[0]?.id;
  const media = useFanIdLocalMedia({
    cardSerial: prefs.serial ?? null,
    idolIds: picks.map((pick) => pick.id),
  });
  const cardMode = prefs.cardMode ?? "idol-user";
  const requiredSavedUserPhoto = cardMode === "user" ? media.userPortraitSrc : media.userAvatarSrc;
  const showLegacyFacePicker = media.status !== "loading"
    && requiredSavedUserPhoto === null
    && (cardMode !== "idol" || showFace);

  // 選色 + 重新測驗, rendered inside the story/report card's own action row so all
  // the pills (下載 / 分享 / 選色 / 重新測驗) sit on one line.
  const soulExtraActions = (
    <>
      {allowDecorate && <button type="button" onClick={() => setColorOpen(true)} className={CARD_BTN_DARK}>{copy.pickColor}</button>}
      {onRedoQuiz && <button type="button" onClick={onRedoQuiz} className={CARD_BTN_GHOST}>{copy.retakeQuiz}</button>}
    </>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* view toggle */}
      <div className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
        {tabs.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              view === v ? "bg-[#b4302b] text-white" : "text-[#7c8088] hover:bg-[#7c8088]/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "lead" && leadTab ? (
        leadTab.content
      ) : view === "story" ? (
        <SoulStoryCard result={result} themeId={storyThemeId} extraActions={soulExtraActions} />
      ) : view === "report" ? (
        <SoulReport result={result} answers={answers} themeId={storyThemeId} extraActions={soulExtraActions} />
      ) : (
        <div className="flex flex-col items-center gap-3">
          {!hidePhotoToggle && (
            <div className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
              <button type="button" aria-pressed={showFace} onClick={() => setShowFace(true)} className={`rounded-full px-3 py-1 text-xs font-bold ${showFace ? "bg-[#1c1e24] text-white" : "text-[#7c8088]"}`}>{copy.versionWithPhoto}</button>
              <button type="button" aria-pressed={!showFace} onClick={() => setShowFace(false)} className={`rounded-full px-3 py-1 text-xs font-bold ${!showFace ? "bg-[#1c1e24] text-white" : "text-[#7c8088]"}`}>{copy.versionShareOnly}</button>
            </div>
          )}
          {!hidePhotoToggle && showLegacyFacePicker && <FacePhotoPicker value={facePhoto} onChange={setFacePhoto} />}
          {heroId && (
            <FanIdCard
              ref={cardRef}
              picks={picks}
              heroId={heroId}
              result={result}
              fanName={prefs.fanName}
              showFace={showFace}
              facePhoto={facePhoto}
              idolPhoto={media.idolPreviewSources[heroId] ?? null}
              userPortraitPhoto={media.userPortraitSrc}
              userAvatarPhoto={media.userAvatarSrc}
              issuedAt={prefs.issuedAt ?? "----.--.--"}
              serial={prefs.serial ?? "----"}
              themeId={prefs.themeId}
              cardMode={cardMode}
              hideArchetype={prefs.hideArchetype}
            />
          )}
          {/* 裝飾 (opens the full customize editor in a popup) + the same 下載 / 分享 pair. */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {allowDecorate && <button type="button" onClick={() => setDecorateOpen(true)} className={CARD_BTN_DARK}>{copy.decorateFourCut}</button>}
            <button type="button" disabled={Boolean(exporting)} onClick={() => void runFanIdExport("download")} className={CARD_BTN_PRIMARY}>{exporting === "download" ? copy.wizExporting : copy.fourCutDownload}</button>
            <button type="button" disabled={Boolean(exporting)} onClick={() => void runFanIdExport("share")} className={CARD_BTN_SECONDARY} style={CARD_BTN_SECONDARY_STYLE}>{exporting === "share" ? copy.wizExporting : copy.fourCutShare}</button>
          </div>
          {exportFailed && <p role="alert" className="text-center text-[11px] text-[#b4302b]">{copy.wizExportFailedGeneric}</p>}
        </div>
      )}

      {onRestart && (
        <button
          onClick={onRestart}
          className="rounded-full px-3 py-2 text-xs font-medium text-[#7c8088]/70 transition hover:text-[#7c8088]"
        >
          ↻ {copy.redoQuiz}
        </button>
      )}

      {allowDecorate && (
        <FanIdDecorateOverlay open={decorateOpen} onClose={() => setDecorateOpen(false)} picks={picks} result={result} />
      )}
      {allowDecorate && (view === "story" || view === "report") && (
        <SoulColorOverlay open={colorOpen} onClose={() => setColorOpen(false)} view={view} result={result} answers={answers} />
      )}
    </div>
  );
}
