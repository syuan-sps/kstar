"use client";

// Result wrapper — toggles between the 限動卡 (9:16 share card), the 完整報告
// (detailed text report), and the 應援卡 (fan pass), all from the same result.
// Keeps the original export name so SoulQuiz / SoulPortraitButton import it as-is.

import { useState } from "react";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";
import FanPassCard from "@/components/FanPassCard";

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
  const tabs: [View, string][] = [["story", copy.viewStory], ["report", copy.viewReport], ["pass", copy.viewPass]];

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
        <SoulStoryCard result={result} picks={picks} />
      ) : view === "report" ? (
        <SoulReport result={result} picks={picks} answers={answers} />
      ) : (
        <FanPassCard result={result} picks={picks} />
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
