"use client";

import { useCallback, useEffect, useState } from "react";
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

  // The camera-flash plays only on a fresh page entry, not on pick swaps
  // (swaps update `ids` without remounting, so `entry` is already false).
  useEffect(() => {
    const t = setTimeout(() => setEntry(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!ids || ids.length !== 4) return null;

  const artists = ids
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];
  if (artists.length !== 4) return null;

  function repick() {
    localStorage.removeItem("kstar:onboarding");
    location.reload();
  }

  return (
    <section className={`flex flex-col items-center gap-3 ${className}`}>
      <h2 className="font-orbitron text-sm font-bold tracking-widest text-[#5e636d] uppercase">
        你的人生四格 ✦
      </h2>
      <div key={ids.join(",")} className={`fourcuts-pop${entry ? " intro-flash" : ""}`}>
        <FourCuts artists={artists} className={frameClassName} linked />
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
