"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { copy } from "@/lib/copy";
import type { ArtistLite } from "@/lib/lite";
import type { PickSummary, UserPrefs } from "@/lib/types";
import type { ArchetypeResult } from "@/lib/archetypes";
import { deriveFanIdResult, fanIdEntryAction } from "@/lib/fanIdAccess";
import { zhTrait } from "@/lib/cardMeta";
import SoulQuiz from "@/components/SoulQuiz";
import TastePortraitCard from "@/components/TastePortraitCard";
import type { ResultAnswers } from "@/components/SoulReport";

export function HeaderFanIdButton() {
  return (
    <button
      type="button"
      aria-label={copy.myFanId}
      title={copy.myFanId}
      onClick={() => window.dispatchEvent(new Event("kstar:open-fanid"))}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#c8ccd2]/30 text-sm font-medium text-[#1c1e24] hover:bg-[#7c8088]/10 md:flex md:h-auto md:w-auto md:gap-1 md:px-3 md:py-1.5"
    >
      <span aria-hidden="true">🪪</span><span className="hidden md:inline">{copy.myFanId}</span>
    </button>
  );
}

export default function FanIdEntry({ allArtists }: { allArtists: ArtistLite[] }) {
  const busy = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [picks, setPicks] = useState<ArtistLite[]>([]);
  const [summaries, setSummaries] = useState<PickSummary[]>([]);
  const [result, setResult] = useState<ArchetypeResult | null>(null);
  const [mode, setMode] = useState<"card" | "quiz">("card");
  const [open, setOpen] = useState(false);

  const openFanId = useCallback(async () => {
    if (busy.current) return;
    let next: UserPrefs;
    try {
      next = JSON.parse(localStorage.getItem("kstar:prefs") ?? "null") as UserPrefs;
    } catch {
      window.location.assign("/start");
      return;
    }
    const action = fanIdEntryAction(next);
    if (action === "start") {
      window.location.assign("/start");
      return;
    }
    if (action === "claim") {
      window.location.assign("/start?claim=1");
      return;
    }
    const selected = next.topIdols.map((id) => allArtists.find((artist) => artist.id === id)).filter((artist): artist is ArtistLite => Boolean(artist));
    if (selected.length !== 4) return;
    busy.current = true;
    try {
      const response = await fetch("/api/pick-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickIds: next.topIdols }),
      });
      const data = (await response.json()) as { summaries?: PickSummary[] };
      if (!response.ok || !data.summaries?.length) return;
      setPrefs(next);
      setPicks(selected);
      setSummaries(data.summaries);
      // Rebuild with getArchetype(...) behind the safe legacy-weight boundary,
      // then reconcile the exact persisted issued identity.
      setResult(deriveFanIdResult(data.summaries, next));
      setMode("card");
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    } catch {
      /* keep the global entry quiet when stored data or the score API is unavailable */
    } finally {
      busy.current = false;
    }
  }, [allArtists]);

  const closeModal = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => restoreFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    const onOpen = () => { void openFanId(); };
    window.addEventListener("kstar:open-fanid", onOpen);
    return () => window.removeEventListener("kstar:open-fanid", onOpen);
  }, [openFanId]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeModal, open]);

  function persist(patch: Partial<UserPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem("kstar:prefs", JSON.stringify(next));
    window.dispatchEvent(new Event("kstar:prefs-updated"));
  }

  const answers: ResultAnswers | undefined = prefs ? {
    contrast: prefs.contrast ?? null,
    visualMood: prefs.visualMood ?? null,
    valueTokens: Object.entries(prefs.tokenPrefs ?? {}).filter(([token, weight]) => weight > 0 && (/[一-鿿]/.test(token) || zhTrait(token) !== token)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([token]) => token),
  } : undefined;

  if (!open || !prefs || !result || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={closeModal}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="fanid-dialog-title" className="window-frame w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <div className="title-bar">
          <span className="mr-1.5 text-base">✦</span>
          <span id="fanid-dialog-title" className="flex-1 truncate font-orbitron text-xs font-bold tracking-wide">{mode === "quiz" ? copy.redoQuiz : copy.resultTitle}</span>
          <button ref={closeRef} type="button" aria-label="關閉" className="win-btn win-btn-close" onClick={closeModal}>×</button>
        </div>
        <div className="window-body max-h-[85vh] overflow-y-auto p-5">
          {mode === "quiz"
            ? <SoulQuiz picks={picks} summaries={summaries} onPersist={persist} onClose={closeModal} />
            : <TastePortraitCard result={result} picks={picks} answers={answers} onRestart={() => setMode("quiz")} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}
