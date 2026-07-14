"use client";

// Step 3 判定結果: full-screen reveal and the social discovery invitation.
import { useState } from "react";
import type { ArchetypeResult } from "@/lib/archetypes";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";

type ShareView = "story" | "report";
const TAB_BASE = "rounded-full px-4 py-1.5 text-xs font-bold transition";
const TAB_ACTIVE = `${TAB_BASE} bg-[#b4302b] text-white`;
const TAB_INACTIVE = `${TAB_BASE} text-[#7c8088] hover:bg-[#7c8088]/10`;

export default function StepReveal({
  result,
  reportAnswers,
}: {
  result: ArchetypeResult;
  reportAnswers?: ResultAnswers;
}) {
  const [shareView, setShareView] = useState<ShareView>("story");
  return (
    <div className="wiz-develop flex flex-col items-center gap-4 py-4 text-center">
      <div role="tablist" aria-label="選擇分享內容" className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
        <button
          type="button"
          role="tab"
          aria-selected={shareView === "story"}
          onClick={() => setShareView("story")}
          className={shareView === "story" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          限動卡
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={shareView === "report"}
          onClick={() => setShareView("report")}
          className={shareView === "report" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          完整長圖
        </button>
      </div>
      <Step3ShareStudio
        result={result}
        reportAnswers={reportAnswers}
        view={shareView}
      />
    </div>
  );
}

export function Step3ShareStudio({
  result,
  reportAnswers,
  view,
}: {
  result: ArchetypeResult;
  reportAnswers?: ResultAnswers;
  view: ShareView;
}) {
  return (
    <section className="mt-3 flex w-full flex-col items-center gap-4" aria-label="分享追星結果">
      {view === "story"
        ? <SoulStoryCard result={result} />
        : <SoulReport result={result} answers={reportAnswers} />}
    </section>
  );
}
