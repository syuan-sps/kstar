"use client";

// 入坑優先序 + adaptive questionnaire + result. Driven by the four picks'
// per-layer cohesion summaries: ranking sets base weights, questions adapt in
// depth, and picks that already agree become confirm-or-refine screens.

import { useRef, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, ScoreLayer, UserPrefs, Weights } from "@/lib/types";
import { SCORE_LAYERS } from "@/lib/types";
import {
  QUESTION_BY_ID, MOODS, type Question, type QToken,
  selectQuestionIds, agreedToken, agreedMood, energyOutlier, energyZh,
  computeQuizResult, framing,
} from "@/lib/questionnaire";
import { getArchetype, LAYER_ZH, LAYER_COLOR, type ArchetypeResult } from "@/lib/archetypes";
import { zhTrait } from "@/lib/cardMeta";
import { copy } from "@/lib/copy";
import TastePortraitCard from "@/components/TastePortraitCard";
import type { ResultAnswers } from "@/components/SoulReport";

const CONTENT_TONE_ZH: Record<string, string> = {
  intimate: "日常陪伴", hype: "嗨翻舞台", aesthetic: "美感氛圍", comedic: "搞笑名場面",
};

type ConfirmField = "energy_type" | "fan_interaction" | "content_tone" | "mood";
type Screen =
  | { kind: "question"; key: string; q: Question }
  | { kind: "confirm"; key: string; field: ConfirmField; token: string; label: string; tokenField: string | null; layer: ScoreLayer }
  | { kind: "outlier"; key: string; index: number; energy: string };

function confirmLabel(field: ConfirmField, token: string): string {
  if (field === "energy_type") return energyZh(token);
  if (field === "fan_interaction") return zhTrait(token);
  if (field === "content_tone") return CONTENT_TONE_ZH[token] ?? token;
  return MOODS.find((m) => m.id === token)?.label ?? token;
}

function buildScreens(picks: PickSummary[], rank: ScoreLayer[]): Screen[] {
  const ids = selectQuestionIds(rank);
  const screens: Screen[] = [];
  for (const id of ids) {
    if (id === "q2") {
      const ag = agreedToken(picks, "energy_type");
      if (ag) screens.push({ kind: "confirm", key: "confirm:energy_type", field: "energy_type", token: ag, label: confirmLabel("energy_type", ag), tokenField: "energy_type", layer: "personality" });
      else screens.push({ kind: "question", key: "q2", q: QUESTION_BY_ID.q2 });
      const out = energyOutlier(picks);
      if (out) screens.push({ kind: "outlier", key: "outlier", index: out.index, energy: out.energy });
    } else if (id === "q3") {
      const ag = agreedToken(picks, "fan_interaction");
      if (ag) screens.push({ kind: "confirm", key: "confirm:fan_interaction", field: "fan_interaction", token: ag, label: confirmLabel("fan_interaction", ag), tokenField: "fan_interaction", layer: "personality" });
      else screens.push({ kind: "question", key: "q3", q: QUESTION_BY_ID.q3 });
    } else if (id === "q6") {
      const ag = agreedToken(picks, "content_tone");
      if (ag) screens.push({ kind: "confirm", key: "confirm:content_tone", field: "content_tone", token: ag, label: confirmLabel("content_tone", ag), tokenField: "content_tone", layer: "content" });
      else screens.push({ kind: "question", key: "q6", q: QUESTION_BY_ID.q6 });
    } else if (id === "q7") {
      const am = agreedMood(picks);
      if (am) screens.push({ kind: "confirm", key: "confirm:mood", field: "mood", token: am, label: confirmLabel("mood", am), tokenField: null, layer: "aesthetic" });
      else screens.push({ kind: "question", key: "q7", q: QUESTION_BY_ID.q7 });
    } else {
      screens.push({ kind: "question", key: id, q: QUESTION_BY_ID[id] });
    }
  }
  return screens;
}

export default function SoulQuiz({
  picks, summaries, onPersist, onClose,
}: {
  picks: ArtistLite[];
  summaries: PickSummary[];
  onPersist: (patch: Partial<UserPrefs>) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"rank" | "quiz" | "result">("rank");
  const [rank, setRank] = useState<ScoreLayer[]>([...SCORE_LAYERS]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [idx, setIdx] = useState(0);
  const [, force] = useState(0);
  const answersRef = useRef<Record<string, string>>({});
  const [result, setResult] = useState<ArchetypeResult | null>(null);
  const [answers, setAnswers] = useState<ResultAnswers | null>(null);

  const nameById = new Map(picks.map((p) => [p.id, p.name]));
  const topName = picks[0]?.name ?? "他";

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
      .filter(([t, w]) => w > 0 && (/[一-鿿]/.test(t) || zhTrait(t) !== t))
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
              <span className="font-orbitron text-xs font-black text-[#9aa0aa]">#{i + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LAYER_COLOR[L] }} />
              <span className="flex-1 text-sm font-bold text-[#1c1e24]">{LAYER_ZH[L]}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="rounded-md px-1.5 text-[#7c8088] hover:bg-[#7c8088]/10 disabled:opacity-25" aria-label="往上移">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === rank.length - 1}
                className="rounded-md px-1.5 text-[#7c8088] hover:bg-[#7c8088]/10 disabled:opacity-25" aria-label="往下移">▼</button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9aa0aa]">{copy.rankHint}</p>
        <div className="flex justify-between pt-1">
          <button onClick={onClose} className="text-xs text-[#7c8088]/60 hover:text-[#7c8088]">先跳過</button>
          <button onClick={startQuiz} className="rounded-full bg-[#b4302b] px-4 py-1.5 text-xs font-bold text-white hover:brightness-110">下一步 →</button>
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
          <button onClick={onClose} className="rounded-full border border-[#c8ccd2] px-4 py-1.5 text-xs font-bold text-[#1c1e24] hover:bg-[#7c8088]/10">✦ 完成</button>
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
          title={screen.q.pickGrounded ? framing.q1(topName) : screen.q.title}
          options={screen.q.options.map((o) => ({ id: o.id, label: o.label, sub: o.sub }))}
          selected={selected}
          onPick={(id) => answer(screen.key, id)}
        />
      )}

      {screen.kind === "confirm" && (
        <Choices
          title={framing.confirmAgree(screen.label)}
          options={[
            { id: "more", label: framing.confirmMore },
            { id: "diverse", label: framing.confirmDiverse },
          ]}
          selected={selected}
          onPick={(id) => answer(screen.key, id)}
        />
      )}

      {screen.kind === "outlier" && (
        <Choices
          title={framing.outlier(
            picks.map((p) => p.name),
            nameById.get(summaries[screen.index]?.id ?? "") ?? "其中一位",
            energyZh(screen.energy),
          )}
          options={[
            { id: "yes", label: framing.outlierYes },
            { id: "no", label: framing.outlierNo },
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
  options: { id: string; label: string; sub?: string }[];
  selected?: string;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <p className="text-sm font-bold leading-snug text-[#1c1e24]">{title}</p>
      <div className="space-y-1.5">
        {options.map((o) => {
          const isSel = selected === o.id;
          return (
            <button
              key={o.id}
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
          );
        })}
      </div>
    </>
  );
}
