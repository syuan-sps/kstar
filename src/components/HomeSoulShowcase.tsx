"use client";

// Home-hero companion to the 인생네컷 strip: the user's own 追星證 shown inline,
// with the 限動卡 / 完整報告 / 追星證 switcher above it. Opens on the 追星證.
//
// Renders nothing until the visitor actually has something to show (4 valid
// picks *and* a finished archetype), so a first-time visitor still meets the
// four-cut hero alone rather than an empty slot beside it.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, UserPrefs } from "@/lib/types";
import { getArchetype, type ArchetypeResult } from "@/lib/archetypes";
import { displayTrait } from "@/lib/cardMeta";
import { saveWizard } from "@/lib/wizardState";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import TastePortraitCard from "@/components/TastePortraitCard";
import HomeFourCutStudio from "@/components/HomeFourCutStudio";
import MyFourCuts from "@/components/MyFourCuts";
import type { ResultAnswers } from "@/components/SoulReport";

export default function HomeSoulShowcase({ allArtists }: { allArtists: ArtistLite[] }) {
  const copy = useCopy();
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [result, setResult] = useState<ArchetypeResult | null>(null);

  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem("kstar:prefs");
      setPrefs(raw ? (JSON.parse(raw) as UserPrefs) : null);
    } catch {
      setPrefs(null);
    }
  }, []);

  useEffect(() => {
    read();
    window.addEventListener("kstar:prefs-updated", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("kstar:prefs-updated", read);
      window.removeEventListener("storage", read);
    };
  }, [read]);

  const picks = (prefs?.topIdols ?? [])
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];
  const ready = Boolean(prefs?.archetype) && picks.length === 4;

  // The archetype is recomputed from the same server summaries the quiz used,
  // so the inline card always matches what the wizard would show.
  useEffect(() => {
    if (!ready || !prefs) { setResult(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/pick-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickIds: prefs.topIdols }),
        });
        const data = (await res.json()) as { summaries?: PickSummary[] };
        if (!cancelled && data.summaries?.length) {
          setResult(getArchetype(data.summaries, prefs.weights));
        }
      } catch {
        /* leave the slot empty rather than showing a broken card */
      }
    })();
    return () => { cancelled = true; };
  }, [ready, prefs]);

  // Until the visitor has a finished 追星證 (4 picks + archetype + loaded result),
  // fall back to the standalone four-cut / start-CTA. MyFourCuts renders the
  // landing prompt when there are no picks, and the plain four-cut strip when
  // there are picks but no archetype yet — both correct pre-追星證 states.
  if (!ready || !result || !prefs) {
    return <MyFourCuts allArtists={allArtists} frameClassName="w-full" />;
  }

  const answers: ResultAnswers = {
    contrast: prefs.contrast ?? null,
    visualMood: prefs.visualMood ?? null,
    valueTokens: Object.entries(prefs.tokenPrefs ?? {})
      .filter(([t, w]) => w > 0 && (/[一-鿿]/.test(t) || displayTrait("zh", t) !== t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t),
  };

  // 「重新挑選」 lived in MyFourCuts; the unified card replaced it on the home hero,
  // so re-expose the same entry (seed the wizard at step 1 with the current picks)
  // inside the 人生四格 lead tab — otherwise a returning user has no way to re-pick.
  function repick() {
    saveWizard({ picks: prefs?.topIdols ?? [], step: 1 });
    router.push("/start?step=1");
  }

  // One unified card: the 人生四格 is now the lead tab, so it no longer sits as a
  // separate column beside the 追星證. Opens on the 追星證 per the product call.
  return (
    <div className="w-[360px] max-w-full shrink-0">
      <TastePortraitCard
        result={result}
        picks={picks}
        answers={answers}
        defaultView="pass"
        hidePhotoToggle
        onRedoQuiz={() => router.push("/start?claim=1&step=2")}
        allowDecorate
        leadTab={{
          label: copy.viewFourCut,
          content: <HomeFourCutStudio artists={picks} onRepick={repick} />,
        }}
      />
    </div>
  );
}
