"use client";

// Step 3 判定結果: full-screen reveal and the social discovery invitation.
import { useState } from "react";
import type { ArchetypeResult } from "@/lib/archetypes";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";
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
        themeId={themeId}
      />
    </div>
  );
}

export function Step3ShareStudio({
  result,
  reportAnswers,
  view,
  themeId,
}: {
  result: ArchetypeResult;
  reportAnswers?: ResultAnswers;
  view: ShareView;
  themeId?: FanIdThemeId;
}) {
  const copy = useCopy();
  return (
    <section className="mt-3 flex w-full flex-col items-center gap-4" aria-label={copy.shareStudioAria}>
      {view === "story"
        ? <SoulStoryCard result={result} themeId={themeId} />
        : <SoulReport result={result} answers={reportAnswers} themeId={themeId} />}
    </section>
  );
}
