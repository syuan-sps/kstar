"use client";

// Persistent "我的追星靈魂" entry on the home hero. Once the user has 4 picks it
// always shows: if they've taken the quiz it re-opens the shareable 追星卡; if not
// (e.g. after 重新挑選), it becomes a "測我的追星靈魂" CTA that launches the quiz.

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, UserPrefs } from "@/lib/types";
import { getArchetype, type ArchetypeResult } from "@/lib/archetypes";
import { zhTrait } from "@/lib/cardMeta";
import { copy } from "@/lib/copy";
import TastePortraitCard from "@/components/TastePortraitCard";
import SoulQuiz from "@/components/SoulQuiz";
import type { ResultAnswers } from "@/components/SoulReport";

export default function SoulPortraitButton({ allArtists }: { allArtists: ArtistLite[] }) {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchetypeResult | null>(null);
  const [summaries, setSummaries] = useState<PickSummary[]>([]);
  const [mode, setMode] = useState<"card" | "quiz">("card");

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
    const onUpdate = () => read();
    window.addEventListener("kstar:prefs-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("kstar:prefs-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [read]);

  if (!prefs || !Array.isArray(prefs.topIdols) || prefs.topIdols.length !== 4) return null;

  const picks = prefs.topIdols
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];
  if (picks.length !== 4) return null;

  const hasArchetype = !!prefs.archetype;

  // Rebuild the report's answer-reflection from stored prefs.
  const answers: ResultAnswers = {
    contrast: prefs.contrast ?? null,
    visualMood: prefs.visualMood ?? null,
    valueTokens: Object.entries(prefs.tokenPrefs ?? {})
      .filter(([t, w]) => w > 0 && (/[一-鿿]/.test(t) || zhTrait(t) !== t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t),
  };

  async function loadSummaries(): Promise<PickSummary[]> {
    if (!prefs) return [];
    const res = await fetch("/api/pick-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickIds: prefs.topIdols }),
    });
    const data = (await res.json()) as { summaries?: PickSummary[] };
    return data.summaries ?? [];
  }

  // Existing result → re-open the shareable 追星卡.
  async function openCard() {
    if (loading || !prefs) return;
    setLoading(true);
    try {
      const s = await loadSummaries();
      setSummaries(s);
      setResult(getArchetype(s, prefs.weights));
      setMode("card");
      setOpen(true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // No archetype yet (e.g. after 重新挑選) → launch the quiz directly.
  async function openQuiz() {
    if (loading || !prefs) return;
    setLoading(true);
    try {
      setSummaries(await loadSummaries());
      setMode("quiz");
      setOpen(true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // Persist a redo (keeps topIdols; refreshes the home button via the event).
  function persist(patch: Partial<UserPrefs>) {
    if (!prefs) return;
    const next: UserPrefs = { ...prefs, ...patch };
    localStorage.setItem("kstar:prefs", JSON.stringify(next));
    window.dispatchEvent(new Event("kstar:prefs-updated"));
  }

  return (
    <>
      <button
        onClick={hasArchetype ? openCard : openQuiz}
        disabled={loading}
        className="rounded-full border border-[#56789f]/40 bg-[#56789f]/8 px-4 py-1.5 font-orbitron text-xs font-bold tracking-wide text-[#56789f] transition hover:bg-[#56789f]/15 disabled:opacity-50"
      >
        {loading
          ? "讀取中…"
          : hasArchetype
            ? `✦ ${copy.reshareEntry} · ${prefs.archetype!.code}`
            : `✦ ${copy.takeQuiz}`}
      </button>

      {open && (mode === "quiz" || result) && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="window-frame w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="title-bar">
              <span className="mr-1.5 text-base">✦</span>
              <span className="flex-1 truncate font-orbitron text-xs font-bold tracking-wide">
                {mode === "quiz" ? (hasArchetype ? copy.redoQuiz : copy.resultTitle) : copy.resultTitle}
              </span>
              <span className="win-btn win-btn-close" onClick={() => setOpen(false)} style={{ cursor: "pointer" }}>×</span>
            </div>
            <div className="window-body max-h-[85vh] overflow-y-auto p-5">
              {mode === "quiz" ? (
                <SoulQuiz picks={picks} summaries={summaries} onPersist={persist} onClose={() => setOpen(false)} />
              ) : (
                <TastePortraitCard result={result!} picks={picks} answers={answers} onRestart={() => setMode("quiz")} />
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
