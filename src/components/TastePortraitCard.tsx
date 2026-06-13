"use client";

// Result wrapper — toggles between the 限動卡 (9:16 share card) and the
// 完整報告 (detailed text report), both rendered from the same archetype result.
// Keeps the original export name so SoulQuiz / SoulPortraitButton import it as-is.

import { useState } from "react";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import { copy } from "@/lib/copy";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";

type View = "story" | "report";

export default function TastePortraitCard({
  result, picks, answers, onRestart,
}: {
  result: ArchetypeResult;
  picks: CardArtist[];
  answers?: ResultAnswers;
  onRestart?: () => void;
}) {
  const [view, setView] = useState<View>("story");
  const tabs: [View, string][] = [["story", copy.viewStory], ["report", copy.viewReport]];

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
      ) : (
        <SoulReport result={result} picks={picks} answers={answers} />
      )}

      {onRestart && (
        <button
          onClick={onRestart}
          className="rounded-full px-3 py-2 text-xs font-medium text-[#7c8088]/70 transition hover:text-[#7c8088]"
        >
          ↻ 重測
        </button>
      )}
    </div>
  );
}
