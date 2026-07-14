"use client";

// /start orchestrator. step 0 = landing poster; 1–4 = wizard. URL ?step= is
// the source of truth so refresh/mid-flow-exit resumes; state lives in
// kstar:wizard (wizardState.ts). ?claim=1 = existing-user shortcut: hydrate
// picks (+archetype) from kstar:prefs and jump past completed stages.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArtistLite } from "@/lib/lite";
import { copy } from "@/lib/copy";
import type { PickSummary } from "@/lib/types";
import { reconcileStoredArchetype, type ArchetypeResult } from "@/lib/archetypes";
import { acceptWizardUrlStep, ensureIssueIdentity, hydrateClaimWizard, loadWizard, resetWizardForRetake, saveWizard, type WizardState } from "@/lib/wizardState";
import DevelopFourCuts from "@/components/DevelopFourCuts";
import WizardChrome from "@/components/wizard/WizardChrome";
import StepPicker, { canonicalizePicks, heroForPicks } from "@/components/wizard/StepPicker";
import StepQuiz, { deriveQuizResult, deriveReportAnswers } from "@/components/wizard/StepQuiz";
import StepReveal from "@/components/wizard/StepReveal";
import StepIssue from "@/components/wizard/StepIssue";
import FanIdCard from "@/components/FanIdCard";

export default function StartFlow({ allArtists }: { allArtists: ArtistLite[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [wiz, setWiz] = useState<WizardState | null>(null);
  const [developing, setDeveloping] = useState(false);
  const [summaries, setSummaries] = useState<PickSummary[]>([]);
  const [quizResult, setQuizResult] = useState<ArchetypeResult | null>(null);
  const [resultStatus, setResultStatus] = useState<"idle" | "loading" | "error">("idle");
  const validArtistIds = useMemo(() => new Set(allArtists.map((artist) => artist.id)), [allArtists]);
  const rememberSummaries = useCallback((next: PickSummary[]) => setSummaries(next), []);

  useEffect(() => {
    let cancelled = false;
    let s = loadWizard();
    if (params.get("claim") === "1") {
      try {
        const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}");
        // hydrateClaimWizard validates the complete prefs.archetype object,
        // including its mixed-case code, before it can enter saved state.
        s = hydrateClaimWizard(prefs, s);
      } catch { /* fall through to normal flow */ }
    }
    const canonicalPicks = canonicalizePicks(s.picks, validArtistIds);
    const heroId = heroForPicks(s.heroId, canonicalPicks);
    const picksChanged = canonicalPicks.length !== s.picks.length
      || canonicalPicks.some((id, index) => id !== s.picks[index]);
    if (picksChanged || heroId !== s.heroId) {
      s = saveWizard({ picks: canonicalPicks, heroId });
    } else {
      s = { ...s, picks: canonicalPicks };
    }
    const urlStep = Number(params.get("step"));
    if ([1, 2, 3, 4].includes(urlStep) && urlStep <= s.step) {
      s = acceptWizardUrlStep(s, urlStep);
    }
    if (s.step === 4) s = ensureIssueIdentity(s);
    queueMicrotask(() => {
      if (!cancelled) setWiz(s);
    });
    return () => { cancelled = true; };
  }, [params, validArtistIds]);

  useEffect(() => {
    if ((wiz?.step !== 3 && wiz?.step !== 4) || quizResult || !wiz.picks.length) return;
    let cancelled = false;
    async function restoreReveal() {
      setResultStatus("loading");
      try {
        const res = await fetch("/api/pick-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickIds: wiz?.picks ?? [] }),
        });
        const data = (await res.json()) as { summaries?: PickSummary[] };
        if (!res.ok || !data.summaries?.length || !wiz) throw new Error("missing score summaries");
        if (!cancelled) {
          setSummaries(data.summaries);
          const derived = deriveQuizResult(data.summaries, wiz.rank, wiz.answers);
          const stored = wiz.archetype;
          const restored = reconcileStoredArchetype(derived, stored);
          setQuizResult(restored);
          setResultStatus("idle");
        }
      } catch {
        if (!cancelled) setResultStatus("error");
      }
    }
    void restoreReveal();
    return () => { cancelled = true; };
  }, [quizResult, wiz]);

  if (!wiz) return null;

  const go = (step: WizardState["step"]) => {
    const saved = saveWizard({ step });
    const s = step === 4 ? ensureIssueIdentity(saved) : saved;
    if (step <= 2) setQuizResult(null);
    setWiz(s);
    router.replace(step === 0 ? "/start" : `/start?step=${step}`);
  };

  if (wiz.step === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
        <span className="font-orbitron text-2xl font-black chrome-text">{copy.appName} 發證中心</span>
        <div className="fanid-preview-shell fanid-landing-preview">
          <div className="fanid-preview-scale"><FanIdCard sample /></div>
        </div>
        <p className="text-sm text-[#5e636d]">{copy.wizLandingNote}</p>
        <button onClick={() => go(1)} className="w-full rounded-xl bg-[#1c1e24] py-3 font-bold text-white">
          {copy.wizStartCta}
        </button>
        <Link
          href="/#idols"
          onClick={() => localStorage.setItem("kstar:onboarding", "done")}
          className="text-sm text-[#9aa0aa] hover:text-[#5e636d]"
        >
          {copy.wizEscape}
        </Link>
      </div>
    );
  }

  const validPicks = canonicalizePicks(wiz.picks, validArtistIds);
  const selectedArtists = validPicks
    .map((id) => allArtists.find((artist) => artist.id === id))
    .filter((artist): artist is ArtistLite => Boolean(artist));
  const reportAnswers = quizResult
    ? deriveReportAnswers(summaries, wiz.rank, wiz.answers)
    : undefined;

  if (developing) {
    return (
      <DevelopFourCuts
        artists={selectedArtists}
        onDone={() => { setDeveloping(false); go(2); }}
      />
    );
  }

  if (wiz.step === 1) {
    return (
      <WizardChrome
        step={1}
        canNext={validPicks.length === 4}
        onNext={() => setDeveloping(true)}
      >
        <StepPicker
          allArtists={allArtists}
          picks={validPicks}
          onChange={(picks) => {
            const heroId = heroForPicks(wiz.heroId, picks);
            setWiz(saveWizard({ picks, heroId }));
          }}
        />
      </WizardChrome>
    );
  }

  if (wiz.step === 2) {
    return (
      <WizardChrome step={2} canNext={false} onBack={() => go(1)}>
        <StepQuiz
          picks={selectedArtists}
          summaries={summaries}
          rank={wiz.rank}
          onRank={(rank) => {
            setQuizResult(null);
            setWiz(saveWizard({ rank, answers: {}, archetype: undefined }));
          }}
          answers={wiz.answers}
          onAnswer={(answers) => setWiz(saveWizard({ answers }))}
          onSummaries={rememberSummaries}
          onRetake={() => {
            const reset = resetWizardForRetake(wiz);
            setQuizResult(null);
            setWiz(saveWizard(reset));
          }}
          onFinish={(result, answers, rank, nextSummaries) => {
            const next = saveWizard({
              answers,
              rank,
              archetype: { code: result.code, hiddenLayer: result.hiddenLayer },
              step: 3,
            });
            setSummaries(nextSummaries);
            setQuizResult(result);
            setWiz(next);
            router.replace("/start?step=3");
          }}
        />
      </WizardChrome>
    );
  }

  if (wiz.step === 3) {
    return (
      <WizardChrome
        step={3}
        canNext={Boolean(quizResult)}
        onBack={() => go(2)}
        onNext={() => go(4)}
        nextLabel={copy.wizIssueCta}
      >
        {quizResult ? (
          <StepReveal
            result={quizResult}
            reportAnswers={reportAnswers}
          />
        ) : (
          <div className={`grid min-h-64 place-items-center text-center text-sm ${resultStatus === "error" ? "text-[#b4302b]" : "animate-pulse text-[#9aa0aa]"}`}>
            {resultStatus === "error" ? "無法載入判定結果，請返回再試一次。" : "顯影中…"}
          </div>
        )}
      </WizardChrome>
    );
  }

  if (wiz.step === 4) {
    return (
      <WizardChrome step={4} canNext={false} onBack={() => go(3)}>
        {quizResult && wiz.archetype && selectedArtists.length === 4 ? (
          <StepIssue wiz={wiz} picks={selectedArtists} result={quizResult} onWizardChange={setWiz} />
        ) : (
          <div className={`grid min-h-64 place-items-center text-center text-sm ${resultStatus === "error" || selectedArtists.length !== 4 || !wiz.archetype ? "text-[#b4302b]" : "animate-pulse text-[#9aa0aa]"}`}>
            {selectedArtists.length !== 4
              ? "追星證需要四位本命，請返回重新選擇。"
              : !wiz.archetype
                ? "尚未完成追星型別判定，請返回測驗。"
                : resultStatus === "error"
                  ? "無法載入製卡資料，請返回再試一次。"
                  : "準備製卡資料…"}
          </div>
        )}
      </WizardChrome>
    );
  }

  return (
    <WizardChrome
      step={wiz.step as 1 | 2 | 3 | 4}
      canNext
      onBack={wiz.step > 1 ? () => go((wiz.step - 1) as WizardState["step"]) : undefined}
      onNext={wiz.step < 4 ? () => go((wiz.step + 1) as WizardState["step"]) : undefined}
    >
      <div
        className="grid h-64 place-items-center text-[#9aa0aa]"
        data-artist-count={allArtists.length}
      >
        step {wiz.step} — 施工中
      </div>
    </WizardChrome>
  );
}
