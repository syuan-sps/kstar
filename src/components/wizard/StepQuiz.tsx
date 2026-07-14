"use client";

// Step 2 追星風格測驗: rank the four taste layers, then answer the same
// adaptive screen sequence as SoulQuiz. Pick summaries remain server-derived.
import { useEffect, useMemo, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, ScoreLayer } from "@/lib/types";
import { LAYER_COLOR, LAYER_ZH, getArchetype, type ArchetypeResult } from "@/lib/archetypes";
import { computeQuizResult, energyZh, framing, type QToken } from "@/lib/questionnaire";
import { buildScreens, type Screen } from "@/lib/quizScreens";
import { copy } from "@/lib/copy";
import Thumb from "@/components/Thumb";
import type { ResultAnswers } from "@/components/SoulReport";

export function nextQuizIndex(index: number, length: number): number | null {
  return index < length - 1 ? index + 1 : null;
}

export function restoreQuizProgress(
  screens: readonly Pick<Screen, "key">[],
  answers: Record<string, string>,
): { phase: "rank" | "quiz" | "complete"; index: number } {
  if (Object.keys(answers).length === 0) return { phase: "rank", index: 0 };
  const firstUnanswered = screens.findIndex((screen) => !answers[screen.key]);
  if (screens.length > 0 && firstUnanswered === -1) {
    return { phase: "complete", index: screens.length - 1 };
  }
  return { phase: "quiz", index: Math.max(0, firstUnanswered) };
}

function foldWizardAnswers(
  summaries: PickSummary[],
  rank: ScoreLayer[],
  answers: Record<string, string>,
) {
  const screens = buildScreens(summaries, rank);
  const quizAnswers: Record<string, string> = {};
  const extraTokens: QToken[] = [];
  const layerNudges: Partial<Record<ScoreLayer, number>> = {};
  let visualMood: string | null = null;
  const bump = (layer: ScoreLayer, amount: number) => {
    layerNudges[layer] = (layerNudges[layer] ?? 0) + amount;
  };

  for (const screen of screens) {
    const choice = answers[screen.key];
    if (!choice) continue;
    if (screen.kind === "question") {
      quizAnswers[screen.q.id] = choice;
      if (screen.q.id === "q7") visualMood = choice;
    } else if (screen.kind === "confirm") {
      quizAnswers[screen.key] = choice;
      if (choice === "more") {
        if (screen.tokenField) extraTokens.push({ field: screen.tokenField, values: [screen.token] });
        bump(screen.layer, 0.12);
        if (screen.field === "mood") visualMood = screen.token;
      } else if (screen.tokenField) {
        extraTokens.push({ field: "__diverse", values: [screen.token] });
      }
    } else {
      quizAnswers.outlier = choice;
      if (choice === "yes") {
        extraTokens.push({ field: "energy_type", values: [screen.energy] });
        bump("personality", 0.08);
      }
    }
  }

  const quiz = computeQuizResult({ rank, answers: quizAnswers, extraTokens, layerNudges });
  return { quiz, visualMood };
}

export function deriveQuizResult(
  summaries: PickSummary[],
  rank: ScoreLayer[],
  answers: Record<string, string>,
): ArchetypeResult {
  return getArchetype(summaries, foldWizardAnswers(summaries, rank, answers).quiz.weights);
}

export function deriveReportAnswers(
  summaries: PickSummary[],
  rank: ScoreLayer[],
  answers: Record<string, string>,
): ResultAnswers {
  const { quiz, visualMood } = foldWizardAnswers(summaries, rank, answers);
  const valueTokens = Object.entries(quiz.tokenPrefs)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([token]) => token);
  return { contrast: quiz.contrast, visualMood, valueTokens };
}

export default function StepQuiz({
  picks,
  summaries,
  rank,
  onRank,
  answers,
  onAnswer,
  onSummaries,
  onRetake,
  onFinish,
}: {
  picks: ArtistLite[];
  summaries: PickSummary[];
  rank: ScoreLayer[];
  onRank: (rank: ScoreLayer[]) => void;
  answers: Record<string, string>;
  onAnswer: (answers: Record<string, string>) => void;
  onSummaries?: (summaries: PickSummary[]) => void;
  onRetake: () => void;
  onFinish: (
    result: ArchetypeResult,
    answers: Record<string, string>,
    rank: ScoreLayer[],
    summaries: PickSummary[],
  ) => void;
}) {
  const [activeSummaries, setActiveSummaries] = useState(summaries);
  const [loading, setLoading] = useState(activeSummaries.length === 0);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<"rank" | "quiz">(
    Object.keys(answers).length ? "quiz" : "rank",
  );
  const pickKey = picks.map((pick) => pick.id).join("\u0000");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch("/api/pick-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickIds: pickKey.split("\u0000") }),
        });
        const data = (await res.json()) as { summaries?: PickSummary[] };
        if (!res.ok || !data.summaries?.length) throw new Error("summary request failed");
        if (!cancelled) {
          setActiveSummaries(data.summaries);
          onSummaries?.(data.summaries);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [pickKey, onSummaries]);

  const screens = useMemo(
    () => buildScreens(activeSummaries, rank),
    [activeSummaries, rank],
  );
  const restored = restoreQuizProgress(screens, answers);
  const [requestedIndex, setRequestedIndex] = useState<number | null>(null);
  const idx = requestedIndex ?? restored.index;

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rank.length) return;
    const next = [...rank];
    [next[i], next[j]] = [next[j], next[i]];
    onRank(next);
  }

  function answer(screen: Screen, choice: string) {
    const nextAnswers = { ...answers, [screen.key]: choice };
    onAnswer(nextAnswers);
    const nextIndex = nextQuizIndex(idx, screens.length);
    const nextProgress = restoreQuizProgress(screens, nextAnswers);
    if (nextIndex !== null && nextProgress.phase !== "complete") {
      setRequestedIndex(null);
      return;
    }
    onFinish(
      deriveQuizResult(activeSummaries, rank, nextAnswers),
      nextAnswers,
      rank,
      activeSummaries,
    );
  }

  if (loading) {
    return <div className="grid min-h-64 animate-pulse place-items-center text-sm text-[#9aa0aa]">顯影中…</div>;
  }
  if (failed || activeSummaries.length === 0) {
    return <div className="grid min-h-64 place-items-center text-sm text-[#9aa0aa]">顯影失敗，請返回再試一次。</div>;
  }

  if (phase === "rank") {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4">
        <p className="font-orbitron text-lg font-bold text-[#1c1e24]">{copy.rankTitle}</p>
        <p className="text-sm text-[#5e636d]">{copy.rankSub}</p>
        <div className="space-y-2.5">
          {rank.map((layer, i) => (
            <div key={layer} className="flex items-center gap-3 rounded-xl border border-[#c8ccd2]/40 bg-white px-4 py-3">
              <span className="font-orbitron text-xs font-black text-[#9aa0aa]">#{i + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LAYER_COLOR[layer] }} />
              <span className="flex-1 text-sm font-bold text-[#1c1e24]">{LAYER_ZH[layer]}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="rounded-md px-2 text-[#7c8088] hover:bg-[#7c8088]/10 disabled:opacity-25" aria-label="往上移">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === rank.length - 1}
                className="rounded-md px-2 text-[#7c8088] hover:bg-[#7c8088]/10 disabled:opacity-25" aria-label="往下移">▼</button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9aa0aa]">{copy.rankHint}</p>
        <div className="flex justify-end">
          <button type="button" onClick={() => { onAnswer({}); setRequestedIndex(null); setPhase("quiz"); }}
            className="rounded-xl bg-[#1c1e24] px-6 py-3 text-sm font-bold text-white">
            {copy.wizNext} →
          </button>
        </div>
      </div>
    );
  }

  if (restored.phase === "complete") {
    return (
      <div className="grid min-h-64 place-items-center text-center">
        <div className="space-y-3">
          <p className="font-orbitron text-sm font-bold text-[#1c1e24]">測驗已完成 ✦</p>
          <button
            type="button"
            onClick={() => onFinish(
              deriveQuizResult(activeSummaries, rank, answers),
              answers,
              rank,
              activeSummaries,
            )}
            className="rounded-xl bg-[#1c1e24] px-6 py-3 text-sm font-bold text-white"
          >
            查看判定結果 →
          </button>
          <button
            type="button"
            onClick={() => {
              onRetake();
              setRequestedIndex(null);
              setPhase("rank");
            }}
            className="text-xs font-bold text-[#7c8088] underline-offset-4 hover:text-[#1c1e24] hover:underline"
          >
            ↻ 重做測驗
          </button>
        </div>
      </div>
    );
  }

  const screen = screens[idx];
  if (!screen) return null;
  const nameById = new Map(picks.map((pick) => [pick.id, pick.name]));
  const topName = picks[0]?.name ?? "他";

  return (
    <div className="relative mx-auto w-full max-w-xl pr-16 sm:pr-20">
      <div className="absolute right-0 top-0 grid w-14 grid-cols-2 gap-0.5 overflow-hidden rounded-md border border-[#c8ccd2] bg-white p-0.5 shadow-sm sm:w-16" aria-label="本命欄縮圖">
        {picks.slice(0, 4).map((pick) => (
          <div key={pick.id} className="aspect-square overflow-hidden">
            <Thumb src={pick.image_url} seed={pick.id} label={pick.name} rounded="rounded-sm" focusY={pick.image_focus} />
          </div>
        ))}
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#9aa0aa]">{copy.quizProgress(idx + 1, screens.length)}</span>
        {idx > 0 && (
          <button type="button" onClick={() => setRequestedIndex(idx - 1)} className="text-[10px] text-[#7c8088]/70 hover:text-[#7c8088]">{copy.quizBack}</button>
        )}
      </div>
      <div className="mb-5 flex gap-1" aria-label="問卷進度">
        {screens.map((_, i) => (
          <span key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i <= idx ? "#b4302b" : "#c8ccd2" }} />
        ))}
      </div>
      <div key={screen.key} className="wiz-develop space-y-3">
        {screen.kind === "question" && (
          <Choices
            title={screen.q.pickGrounded ? framing.q1(topName) : screen.q.title}
            options={screen.q.options}
            selected={answers[screen.key]}
            onPick={(choice) => answer(screen, choice)}
          />
        )}
        {screen.kind === "confirm" && (
          <Choices
            title={framing.confirmAgree(screen.label)}
            options={[{ id: "more", label: framing.confirmMore }, { id: "diverse", label: framing.confirmDiverse }]}
            selected={answers[screen.key]}
            onPick={(choice) => answer(screen, choice)}
          />
        )}
        {screen.kind === "outlier" && (
          <Choices
            title={framing.outlier(
              picks.map((pick) => pick.name),
              nameById.get(activeSummaries[screen.index]?.id ?? "") ?? "其中一位",
              energyZh(screen.energy),
            )}
            options={[{ id: "yes", label: framing.outlierYes }, { id: "no", label: framing.outlierNo }]}
            selected={answers[screen.key]}
            onPick={(choice) => answer(screen, choice)}
          />
        )}
      </div>
    </div>
  );
}

function Choices({
  title,
  options,
  selected,
  onPick,
}: {
  title: string;
  options: { id: string; label: string; sub?: string; group?: string }[];
  selected?: string;
  onPick: (id: string) => void;
}) {
  const grouped = options.some((option) => option.group);
  return (
    <>
      <p className="text-base font-bold leading-snug text-[#1c1e24]">{title}</p>
      <div className="space-y-2">
        {options.map((option, i) => {
          const showHeader = grouped && option.group && option.group !== options[i - 1]?.group;
          return (
            <div key={option.id} className="space-y-1.5">
              {showHeader && <p className="px-1 pt-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa0aa]">{option.group}</p>}
              <button type="button" onClick={() => onPick(option.id)}
                className={`block w-full rounded-xl border px-4 py-3 text-left transition ${
                  selected === option.id
                    ? "border-[#b4302b] bg-[#b4302b]/10"
                    : "border-[#c8ccd2]/50 bg-white hover:border-[#56789f] hover:bg-[#56789f]/5"
                }`}>
                <span className="text-sm font-semibold text-[#1c1e24]">{option.label}</span>
                {option.sub && <span className="ml-1.5 text-[11px] text-[#9aa0aa]">{option.sub}</span>}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
