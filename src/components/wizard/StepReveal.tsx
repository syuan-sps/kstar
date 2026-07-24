"use client";

// Step 3 判定結果: full-screen reveal and the social discovery invitation.
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ArchetypeResult } from "@/lib/archetypes";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";
import SoulColorOverlay, { readStoryThemeId } from "@/components/SoulColorOverlay";
import { CARD_BTN_DARK } from "@/lib/cardActionStyles";
import type { FanIdThemeId } from "@/lib/fanIdThemes";

type ShareView = "story" | "report";
const TAB_BASE = "rounded-full px-4 py-1.5 text-xs font-bold transition";
const TAB_ACTIVE = `${TAB_BASE} bg-[#b4302b] text-white`;
const TAB_INACTIVE = `${TAB_BASE} text-[#7c8088] hover:bg-[#7c8088]/10`;

export default function StepReveal({
  result,
  reportAnswers,
  themeId,
}: {
  result: ArchetypeResult;
  reportAnswers?: ResultAnswers;
  themeId?: FanIdThemeId;
}) {
  const copy = useCopy();
  const [shareView, setShareView] = useState<ShareView>("story");
  // 限動卡 + 完整報告 share one colour (storyThemeId), pickable here during the
  // questionnaire just like on the home tabs. Seeds from the incoming edition.
  const [storyThemeId, setStoryThemeId] = useState<FanIdThemeId | undefined>(themeId);
  const [colorOpen, setColorOpen] = useState(false);
  useEffect(() => {
    const sync = () => setStoryThemeId(readStoryThemeId());
    sync();
    window.addEventListener("kstar:prefs-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("kstar:prefs-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <div className="wiz-develop flex flex-col items-center gap-4 py-4 text-center">
      <div role="tablist" aria-label={copy.shareTabsAria} className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
        <button
          type="button"
          role="tab"
          aria-selected={shareView === "story"}
          onClick={() => setShareView("story")}
          className={shareView === "story" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          {copy.viewStory}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={shareView === "report"}
          onClick={() => setShareView("report")}
          className={shareView === "report" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          {copy.shareTabReport}
        </button>
      </div>
      <Step3ShareStudio
        result={result}
        reportAnswers={reportAnswers}
        view={shareView}
        themeId={storyThemeId}
        extraActions={<button type="button" onClick={() => setColorOpen(true)} className={CARD_BTN_DARK}>{copy.pickColor}</button>}
      />
      <Link href="/soul-types" className="text-xs font-bold text-[#7c8088] underline-offset-4 transition hover:text-[#b4302b] hover:underline">
        {copy.soulTypesSeeOthers}
      </Link>
      <SoulColorOverlay open={colorOpen} onClose={() => setColorOpen(false)} view={shareView} result={result} answers={reportAnswers} />
    </div>
  );
}

export function Step3ShareStudio({
  result,
  reportAnswers,
  view,
  themeId,
  extraActions,
}: {
  result: ArchetypeResult;
  reportAnswers?: ResultAnswers;
  view: ShareView;
  themeId?: FanIdThemeId;
  extraActions?: ReactNode;
}) {
  const copy = useCopy();
  return (
    <section className="mt-3 flex w-full flex-col items-center gap-4" aria-label={copy.shareStudioAria}>
      {view === "story"
        ? <SoulStoryCard result={result} themeId={themeId} extraActions={extraActions} />
        : <SoulReport result={result} answers={reportAnswers} themeId={themeId} extraActions={extraActions} />}
    </section>
  );
}
