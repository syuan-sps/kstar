"use client";

// 入坑優先序 + adaptive questionnaire + result. Driven by the four picks'
// per-layer cohesion summaries: ranking sets base weights, questions adapt in
// depth, and picks that already agree become confirm-or-refine screens.

import { useRef, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, ScoreLayer, UserPrefs, Weights } from "@/lib/types";
import { SCORE_LAYERS } from "@/lib/types";
import { computeQuizResult, energyText, FRAMING } from "@/lib/questionnaire";
import type { QToken } from "@/lib/questionnaire";
import { buildScreens, confirmLabel, type Screen } from "@/lib/quizScreens";
import { getArchetype, layerLabel, LAYER_COLOR, type ArchetypeResult } from "@/lib/archetypes";
import { displayTrait } from "@/lib/cardMeta";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import TastePortraitCard from "@/components/TastePortraitCard";
import type { ResultAnswers } from "@/components/SoulReport";

export default function SoulQuiz({
  picks, summaries, onPersist, onClose,
}: {
  picks: ArtistLite[];
  summaries: PickSummary[];
  onPersist: (patch: Partial<UserPrefs>) => void;
  onClose: () => void;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const [phase, setPhase] = useState<"rank" | "quiz" | "result">("rank");
  const [rank, setRank] = useState<ScoreLayer[]>([...SCORE_LAYERS]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [idx, setIdx] = useState(0);
  const answersRef = useRef<Record<string, string>>({});
  const [result, setResult] = useState<ArchetypeResult | null>(null);
  const [answers, setAnswers] = useState<ResultAnswers | null>(null);

  const nameById = new Map(picks.map((p) => [p.id, p.name]));
  const topName = picks[0]?.name ?? copy.defaultPickName;

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rank.length) return;
    const next = [...rank];
    [next[i], next[j]] = [next[j], next[i]];
    setRank(next);
  }

  function startQuiz() {
    const sc = buildScreens(summaries, rank);
    answersRef.current = {};
    setScreens(sc);
    setIdx(0);
    setPhase(sc.length ? "quiz" : "result");
    if (!sc.length) finish(sc);
  }

  function answer(key: string, choice: string) {
    answersRef.current[key] = choice;
    if (idx < screens.length - 1) { setIdx(idx + 1); }
    else { finish(screens); }
  }

  function finish(sc: Screen[]) {
    const answers: Record<string, string> = {};
    const extraTokens: QToken[] = [];
    const layerNudges: Partial<Record<ScoreLayer, number>> = {};
    const bump = (L: ScoreLayer, n: number) => { layerNudges[L] = (layerNudges[L] ?? 0) + n; };

    for (const s of sc) {
      const choice = answersRef.current[s.key];
      if (!choice) continue;
      if (s.kind === "question") {
        answers[s.q.id] = choice;
      } else if (s.kind === "confirm") {
        answers[s.key] = choice;
        if (choice === "more") {
          if (s.tokenField) extraTokens.push({ field: s.tokenField, values: [s.token] });
          bump(s.layer, 0.12);
        } else if (s.tokenField) {
          extraTokens.push({ field: "__diverse", values: [s.token] });
        }
      } else if (s.kind === "outlier") {
        answers.outlier = choice;
        if (choice === "yes") { extraTokens.push({ field: "energy_type", values: [s.energy] }); bump("personality", 0.08); }
      }
    }

    const quiz = computeQuizResult({ rank, answers, extraTokens, layerNudges });
    const arche = getArchetype(summaries, quiz.weights);
    const weights: Weights = quiz.weights;

    // Q7 mood (open answer id, or the agreed token on a confirm screen)
    let visualMood: string | null = null;
    for (const s of sc) {
      if (s.kind === "question" && s.q.id === "q7") visualMood = answersRef.current.q7 ?? null;
      if (s.kind === "confirm" && s.field === "mood") visualMood = s.token;
    }
    // top resonant tokens (zh or zh-mappable engine tokens) for the report
    const valueTokens = Object.entries(quiz.tokenPrefs)
      .filter(([t, w]) => w > 0 && (/[一-鿿]/.test(t) || displayTrait("zh", t) !== t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    onPersist({
      weights,
      layerRank: rank,
      tokenPrefs: quiz.tokenPrefs,
      hiddenFace: arche.hiddenLayer,
      archetype: { code: arche.code, hiddenLayer: arche.hiddenLayer },
      contrast: quiz.contrast,
      visualMood,
    });
    setAnswers({ contrast: quiz.contrast, visualMood, valueTokens });
    setResult(arche);
    setPhase("result");
  }

  // ── Rank phase ───────────────────────────────────────────────────────
  if (phase === "rank") {
    return (
      <>
        <p className="font-orbitron text-sm font-bold text-[#1c1e24]">{copy.rankTitle}</p>
        <p className="text-xs text-[#5e636d]">{copy.rankSub}</p>
        <div className="space-y-2.5">
          {rank.map((L, i) => (
            <div key={L} className="flex items-center gap-2 rounded-xl border border-[#c8ccd2]/40 bg-white px-3 py-2">
              <span className="w-4 shrink-0 text-center font-orbitron text-xs font-black text-[#9aa0aa]">#{i + 1}</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: LAYER_COLOR[L] }} />
              <span className="flex-1 text-sm font-bold text-[#1c1e24]">{layerLabel(locale, L)}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="rounded-md px-1.5 text-[#7c8088] hover:bg-[#7c8088]/10 disabled:opacity-25" aria-label={copy.moveUp}>▲</button>
              <button onClick={() => move(i, 1)} disabled={i === rank.length - 1}
                className="rounded-md px-1.5 text-[#7c8088] hover:bg-[#7c8088]/10 disabled:opacity-25" aria-label={copy.moveDown}>▼</button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9aa0aa]">{copy.rankHint}</p>
        <div className="flex justify-between pt-1">
          <button onClick={onClose} className="text-xs text-[#7c8088]/60 hover:text-[#7c8088]">{copy.obSkip}</button>
          <button onClick={startQuiz} className="rounded-full bg-[#b4302b] px-4 py-1.5 text-xs font-bold text-white hover:brightness-110">{copy.nextStep}</button>
        </div>
      </>
    );
  }

  // ── Result phase ─────────────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <div className="space-y-3">
        <p className="text-center font-orbitron text-sm font-bold text-[#1c1e24]">{copy.resultTitle} ✦</p>
        <TastePortraitCard
          result={result}
          picks={picks}
          answers={answers ?? undefined}
          onRestart={() => { setRank([...SCORE_LAYERS]); setResult(null); setAnswers(null); setPhase("rank"); }}
        />
        <div className="flex justify-center pt-1">
          <button onClick={onClose} className="rounded-full border border-[#c8ccd2] px-4 py-1.5 text-xs font-bold text-[#1c1e24] hover:bg-[#7c8088]/10">{copy.doneBtn}</button>
        </div>
      </div>
    );
  }

  // ── Quiz phase ───────────────────────────────────────────────────────
  const screen = screens[idx];
  if (!screen) return null;
  const selected = answersRef.current[screen.key];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#9aa0aa]">{copy.quizProgress(idx + 1, screens.length)}</span>
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} className="text-[10px] text-[#7c8088]/70 hover:text-[#7c8088]">{copy.quizBack}</button>
        )}
      </div>
      {/* progress dots */}
      <div className="flex gap-1">
        {screens.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i <= idx ? "#b4302b" : "#c8ccd2" }} />
        ))}
      </div>

      {screen.kind === "question" && (
        <Choices
          title={screen.q.pickGrounded ? FRAMING[locale].q1(topName) : screen.q.title[locale]}
          options={screen.q.options.map((o) => ({ id: o.id, label: o.label[locale], sub: o.sub?.[locale], group: o.group?.[locale] }))}
          selected={selected}
          onPick={(id) => answer(screen.key, id)}
        />
      )}

      {screen.kind === "confirm" && (
        <Choices
          title={FRAMING[locale].confirmAgree(confirmLabel(locale, screen.field, screen.token))}
          options={[
            { id: "more", label: FRAMING[locale].confirmMore },
            { id: "diverse", label: FRAMING[locale].confirmDiverse },
          ]}
          selected={selected}
          onPick={(id) => answer(screen.key, id)}
        />
      )}

      {screen.kind === "outlier" && (
        <Choices
          title={FRAMING[locale].outlier(
            picks.map((p) => p.name),
            nameById.get(summaries[screen.index]?.id ?? "") ?? copy.defaultOutlierName,
            energyText(locale, screen.energy),
          )}
          options={[
            { id: "yes", label: FRAMING[locale].outlierYes },
            { id: "no", label: FRAMING[locale].outlierNo },
          ]}
          selected={selected}
          onPick={(id) => answer(screen.key, id)}
        />
      )}
    </div>
  );
}

function Choices({
  title, options, selected, onPick,
}: {
  title: string;
  options: { id: string; label: string; sub?: string; group?: string }[];
  selected?: string;
  onPick: (id: string) => void;
}) {
  const grouped = options.some((o) => o.group);
  return (
    <>
      <p className="text-sm font-bold leading-snug text-[#1c1e24]">{title}</p>
      <div className="space-y-1.5">
        {options.map((o, i) => {
          const isSel = selected === o.id;
          const showHeader = grouped && !!o.group && o.group !== options[i - 1]?.group;
          return (
            <div key={o.id} className="space-y-1.5">
              {showHeader && (
                <p className="px-1 pt-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa0aa]">{o.group}</p>
              )}
              <button
                onClick={() => onPick(o.id)}
                className={`block w-full rounded-xl border px-3 py-2 text-left transition ${
                  isSel
                    ? "border-[#b4302b] bg-[#b4302b]/10"
                    : "border-[#c8ccd2]/50 bg-white hover:border-[#56789f] hover:bg-[#56789f]/5"
                }`}
              >
                <span className="text-sm font-semibold text-[#1c1e24]">{o.label}</span>
                {o.sub && <span className="ml-1.5 text-[11px] text-[#9aa0aa]">{o.sub}</span>}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
