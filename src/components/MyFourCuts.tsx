"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import FourCuts from "@/components/FourCuts";

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
      <h2 className="font-orbitron text-sm font-bold tracking-widest text-[#ff00cc]/80 uppercase">
        你的人生四格 ✦
      </h2>
      <div key={ids.join(",")} className="fourcuts-pop">
        <FourCuts artists={artists} className={frameClassName} linked />
      </div>
      <button
        onClick={repick}
        className="text-xs text-pink-300/70 hover:text-pink-200 transition"
      >
        重新挑選 ✎
      </button>
    </section>
  );
}
