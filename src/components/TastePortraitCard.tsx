"use client";

// Result wrapper — toggles between the 限動卡 (9:16 share card), the 完整報告
// (detailed text report), and the 追星證, all from the same result.
// Keeps the original export name so SoulQuiz / SoulPortraitButton import it as-is.

import { useCallback, useEffect, useState } from "react";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import type { FanIdThemeId } from "@/lib/fanIdThemes";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";
import FanIdCard from "@/components/FanIdCard";
import FacePhotoPicker from "@/components/FacePhotoPicker";
import { useFanIdLocalMedia } from "@/hooks/useFanIdLocalMedia";
import type { FanIdCardMode } from "@/lib/types";
import {
  normalizeCardMode,
  normalizeStickersEnabled,
  normalizeThemeId,
} from "@/lib/wizardState";

type FanIdPrefs = {
  heroId?: string;
  fanName?: string;
  issuedAt?: string;
  serial?: string;
  themeId?: FanIdThemeId;
  stickersEnabled?: boolean;
  cardMode?: FanIdCardMode;
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
    stickersEnabled: normalizeStickersEnabled(prefs.stickersEnabled),
    cardMode: normalizeCardMode(prefs.cardMode),
  };
}

function loadFanIdPrefs(): FanIdPrefs {
  if (typeof window === "undefined") return normalizeFanIdPrefs(undefined);
  try { return normalizeFanIdPrefs(JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}")); }
  catch { return normalizeFanIdPrefs(undefined); }
}

type View = "story" | "report" | "pass";

export default function TastePortraitCard({
  result, picks, answers, onRestart,
}: {
  result: ArchetypeResult;
  picks: CardArtist[];
  answers?: ResultAnswers;
  onRestart?: () => void;
}) {
  const copy = useCopy();
  const [view, setView] = useState<View>("story");
  const [prefs, setPrefs] = useState<FanIdPrefs>(loadFanIdPrefs);
  const [showFace, setShowFace] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const tabs: [View, string][] = [["story", copy.viewStory], ["report", copy.viewReport], ["pass", copy.viewPass]];

  const readPrefs = useCallback(() => {
    setPrefs(loadFanIdPrefs());
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
  const hasSavedUserMedia = media.userPortraitSrc !== null || media.userAvatarSrc !== null;

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

      {view === "story" ? (
        <SoulStoryCard result={result} themeId={prefs.themeId} />
      ) : view === "report" ? (
        <SoulReport result={result} answers={answers} themeId={prefs.themeId} />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
            <button type="button" aria-pressed={showFace} onClick={() => setShowFace(true)} className={`rounded-full px-3 py-1 text-xs font-bold ${showFace ? "bg-[#1c1e24] text-white" : "text-[#7c8088]"}`}>{copy.versionWithPhoto}</button>
            <button type="button" aria-pressed={!showFace} onClick={() => setShowFace(false)} className={`rounded-full px-3 py-1 text-xs font-bold ${!showFace ? "bg-[#1c1e24] text-white" : "text-[#7c8088]"}`}>{copy.versionShareOnly}</button>
          </div>
          {showFace && !hasSavedUserMedia && <FacePhotoPicker value={facePhoto} onChange={setFacePhoto} />}
          {heroId && (
            <FanIdCard
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
              stickersEnabled={prefs.stickersEnabled}
              cardMode={prefs.cardMode}
            />
          )}
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
    </div>
  );
}
