"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import FourCuts from "@/components/FourCuts";
import SoulPortraitButton from "@/components/SoulPortraitButton";

export default function MyFourCuts({
  allArtists,
  className = "",
  frameClassName = "w-full max-w-[300px]",
}: {
  allArtists: ArtistLite[];
  className?: string;
  frameClassName?: string;
}) {
  const [ids, setIds] = useState<string[] | null>(null);
  const [entry, setEntry] = useState(true); // one-time camera-flash on real page entry
  const [developId, setDevelopId] = useState<string | null>(null); // cut to re-develop after a swap
  const prevIdsRef = useRef<string[] | null>(null);

  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem("kstar:prefs");
      if (raw) {
        const prefs = JSON.parse(raw) as { topIdols?: string[] };
        if (Array.isArray(prefs.topIdols) && prefs.topIdols.length === 4) {
          setIds(prefs.topIdols);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setIds([]);
  }, []);

  useEffect(() => {
    read();
    // React to onboarding completion + cross-tab changes without a reload
    const onUpdate = () => read();
    window.addEventListener("kstar:prefs-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("kstar:prefs-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [read]);

  // The camera-flash plays only on a fresh page entry, not on pick swaps.
  useEffect(() => {
    const t = setTimeout(() => setEntry(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // When exactly one cut's idol changed (an in-place 圖鑑 ＋ swap), re-develop just
  // that cut. First load and full re-picks (0 or >1 changed) don't trigger it.
  useEffect(() => {
    const prev = prevIdsRef.current;
    prevIdsRef.current = ids;
    if (!ids || ids.length !== 4 || !prev || prev.length !== 4) return;
    const changed = ids.filter((id, i) => id !== prev[i]);
    if (changed.length !== 1) return;
    setDevelopId(changed[0]);
    const t = setTimeout(() => setDevelopId(null), 800);
    return () => clearTimeout(t);
  }, [ids]);

  // Re-open the onboarding picker in place (no reload → no intro replay, no flash).
  function repick() {
    window.dispatchEvent(new Event("kstar:open-onboarding"));
  }

  if (ids === null) return null; // still reading localStorage — render nothing

  const artists = ids
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];

  // No (valid) picks yet — fresh visitor or right after 重新開始. Show the empty
  // photobooth strip; tapping any slot opens the picker.
  if (artists.length !== 4) {
    return (
      <section className={`flex flex-col items-center gap-3 ${className}`}>
        <h2 className="font-orbitron text-sm font-bold tracking-widest text-[#5e636d] uppercase">
          你的人生四格 ✦
        </h2>
        <FourCuts artists={[]} onPickEmpty={repick} className={frameClassName} />
      </section>
    );
  }

  return (
    <section className={`flex flex-col items-center gap-3 ${className}`}>
      <h2 className="font-orbitron text-sm font-bold tracking-widest text-[#5e636d] uppercase">
        你的人生四格 ✦
      </h2>
      <div className={entry ? "intro-flash" : undefined}>
        <FourCuts artists={artists} className={frameClassName} linked developId={developId} />
      </div>
      <SoulPortraitButton allArtists={allArtists} />
      <button
        onClick={repick}
        className="text-xs text-[#5e636d]/70 hover:text-[#7c8088] transition"
      >
        重新挑選 ✎
      </button>
    </section>
  );
}
