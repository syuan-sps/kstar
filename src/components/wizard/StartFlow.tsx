"use client";

// /start orchestrator. step 0 = landing poster; 1–4 = wizard. URL ?step= is
// the source of truth so refresh/mid-flow-exit resumes; state lives in
// kstar:wizard (wizardState.ts). ?claim=1 = existing-user shortcut: hydrate
// picks (+archetype) from kstar:prefs and jump past completed stages.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArtistLite } from "@/lib/lite";
import { useCopy } from "@/lib/i18n/LocaleProvider";
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
  const copy = useCopy();
  const router = useRouter();
  const params = useSearchParams();
  // Depend on the VALUES, not the params object — useSearchParams returns a new
  // identity on every render, so using it as an effect dep re-fires the effect
  // → setWiz(new object) → re-render → infinite loop.
  const claimParam = params.get("claim");
  const stepParam = params.get("step");
  const [wiz, setWiz] = useState<WizardState | null>(null);
  const [developing, setDeveloping] = useState(false);
  const [summaries, setSummaries] = useState<PickSummary[]>([]);
  const [quizResult, setQuizResult] = useState<ArchetypeResult | null>(null);
  const [resultStatus, setResultStatus] = useState<"idle" | "loading" | "error">("idle");
  // Rank vs quiz sub-phase, reported by StepQuiz, only so the stepper can show
  // the 8-question quiz as its own node instead of freezing on "2".
  const [quizPhase, setQuizPhase] = useState<"rank" | "quiz">("rank");
  const [previousQuestion, setPreviousQuestion] = useState<(() => void) | null>(null);
  const validArtistIds = useMemo(() => new Set(allArtists.map((artist) => artist.id)), [allArtists]);
  const rememberSummaries = useCallback((next: PickSummary[]) => setSummaries(next), []);
  // Must be stable: StepQuiz depends on this in an effect, so a fresh inline
  // arrow each render re-fires it → setState → re-render → infinite loop.
  const rememberQuestionBack = useCallback(
    (handler: (() => void) | null) => setPreviousQuestion(() => handler),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let s = loadWizard();
    if (claimParam === "1") {
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
    const urlStep = Number(stepParam);
    if ([1, 2, 3, 4].includes(urlStep) && urlStep <= s.step) {
      s = acceptWizardUrlStep(s, urlStep);
    }
    if (s.step === 4) s = ensureIssueIdentity(s);
    queueMicrotask(() => {
      if (!cancelled) setWiz(s);
    });
    return () => { cancelled = true; };
  }, [claimParam, stepParam, validArtistIds]);

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

  // Mobile starts at the top: forcing a full-viewport box and centring in it
  // stranded this short content in the middle with dead space above and below.
  // Desktop keeps the centred hero, where there is room for it.
  if (wiz.step === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-start gap-4 px-4 text-center md:min-h-[calc(100vh-6rem)] md:justify-center">
        <span className="font-orbitron text-2xl font-black chrome-text">{copy.appName} {copy.wizCenterSuffix}</span>
        {/* Scale the 693px sample down and pin the wrapper to its rendered height
            so the CTA below stays above the fold. Inline styles beat .fanid-preview-scale's
            own transform-origin. 693 × 0.6 ≈ 416. */}
        <div className="fanid-preview-shell flex justify-center" style={{ height: 416 }}>
          <div className="fanid-preview-scale" style={{ transform: "rotate(-4deg) scale(.6)", transformOrigin: "top center" }}>
            <FanIdCard sample />
          </div>
        </div>
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
        onDone={() => { setDeveloping(false); go(4); }}
      />
    );
  }

  // The default path is two nodes (pick → card), so the stepper never advertises
  // work the visitor has not opted into. Taking the quiz expands it to the full
  // five so progress still reads correctly once they are inside it.
  // Full nodes: 0 pick · 1 rank · 2 quiz · 3 result · 4 claim.
  // wiz.archetype, not quizResult: a result is derivable from the picks alone,
  // so quizResult is truthy even for someone who never opened the quiz.
  const inQuizPath = wiz.step === 2 || wiz.step === 3 || Boolean(wiz.archetype);
  const stepperNodes = inQuizPath
    ? [copy.wizStep1, copy.wizNodeRank, copy.wizNodeQuiz, copy.wizStep3, copy.wizStep4]
    : [copy.wizStep1, copy.wizStep4];
  const activeNodeFor = (step: 1 | 2 | 3 | 4) => {
    if (!inQuizPath) return step === 1 ? 0 : 1;
    return step === 1 ? 0 : step === 2 ? (quizPhase === "quiz" ? 2 : 1) : step === 3 ? 3 : 4;
  };

  if (wiz.step === 1) {
    return (
      <WizardChrome
        step={1}
        canNext={validPicks.length === 4}
        onNext={() => setDeveloping(true)}
        stickyActions
        nodes={stepperNodes}
        activeNode={activeNodeFor(1)}
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
      <WizardChrome
        step={2}
        canNext={false}
        onBack={() => go(4)}
        nodes={stepperNodes}
        activeNode={activeNodeFor(2)}
        actionsBeforeBack={previousQuestion ? (
          <button type="button" onClick={previousQuestion} className="flex-1 rounded-xl border border-[#7c8088] bg-transparent py-3 font-bold text-[#1c1e24] hover:bg-white/40">
            {copy.quizBack}
          </button>
        ) : null}
      >
        <StepQuiz
          picks={selectedArtists}
          summaries={summaries}
          rank={wiz.rank}
          onPhase={setQuizPhase}
          onQuestionBackChange={rememberQuestionBack}
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
        nodes={stepperNodes}
        activeNode={activeNodeFor(3)}
      >
        {quizResult ? (
          <StepReveal
            result={quizResult}
            reportAnswers={reportAnswers}
            themeId={wiz.themeId}
          />
        ) : (
          <div className={`grid min-h-64 place-items-center text-center text-sm ${resultStatus === "error" ? "text-[#b4302b]" : "animate-pulse text-[#9aa0aa]"}`}>
            {resultStatus === "error" ? copy.wizResultLoadFailed : copy.wizDeveloping}
          </div>
        )}
      </WizardChrome>
    );
  }

  // The quiz is no longer a gate: four picks are all a card needs. Without a
  // result the card shows its unlock slot and the nudge offers the quiz.
  if (wiz.step === 4) {
    return (
      <WizardChrome step={4} wide canNext={false} onBack={() => go(1)} nodes={stepperNodes} activeNode={activeNodeFor(4)}>
        {selectedArtists.length === 4 ? (
          <StepIssue
            wiz={wiz}
            picks={selectedArtists}
            // An archetype is derivable from the picks alone, so quizResult is
            // populated even when nobody answered anything. wiz.archetype is
            // written only by the quiz's own finish, so it is the honest signal
            // for "this visitor earned a result".
            result={wiz.archetype ? quizResult ?? undefined : undefined}
            onTakeQuiz={() => go(2)}
            onWizardChange={setWiz}
          />
        ) : (
          <div className="grid min-h-64 place-items-center text-center text-sm text-[#b4302b]">
            {copy.wizNeedFourPicks}
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
        step {wiz.step} · {copy.wizUnderConstruction}
      </div>
    </WizardChrome>
  );
}
