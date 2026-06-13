"use client";

// Persistent "我的追星靈魂" entry — re-opens the shareable 追星卡 after
// onboarding (re-fetches pick scores + recomputes the archetype from stored
// weights). Renders nothing until the user has completed the quiz.

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, UserPrefs } from "@/lib/types";
import { getArchetype, type ArchetypeResult } from "@/lib/archetypes";
import { zhTrait } from "@/lib/cardMeta";
import { copy } from "@/lib/copy";
import TastePortraitCard from "@/components/TastePortraitCard";
import type { ResultAnswers } from "@/components/SoulReport";

export default function SoulPortraitButton({ allArtists }: { allArtists: ArtistLite[] }) {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    const onUpdate = () => read();
    window.addEventListener("kstar:prefs-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("kstar:prefs-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [read]);

  if (!prefs?.archetype || !Array.isArray(prefs.topIdols) || prefs.topIdols.length !== 4) return null;

  const picks = prefs.topIdols
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];
  if (picks.length !== 4) return null;

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

  async function openCard() {
    if (loading || !prefs) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pick-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickIds: prefs.topIdols }),
      });
      const data = (await res.json()) as { summaries?: PickSummary[] };
      setResult(getArchetype(data.summaries ?? [], prefs.weights));
      setOpen(true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openCard}
        disabled={loading}
        className="rounded-full border border-[#56789f]/40 bg-[#56789f]/8 px-4 py-1.5 font-orbitron text-xs font-bold tracking-wide text-[#56789f] transition hover:bg-[#56789f]/15 disabled:opacity-50"
      >
        {loading ? "讀取中…" : `✦ ${copy.reshareEntry} · ${prefs.archetype.code}`}
      </button>

      {open && result && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="window-frame w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="title-bar">
              <span className="mr-1.5 text-base">✦</span>
              <span className="flex-1 truncate font-orbitron text-xs font-bold tracking-wide">{copy.resultTitle}</span>
              <span className="win-btn win-btn-close" onClick={() => setOpen(false)} style={{ cursor: "pointer" }}>×</span>
            </div>
            <div className="window-body max-h-[85vh] overflow-y-auto p-5">
              <TastePortraitCard result={result} picks={picks} answers={answers} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
