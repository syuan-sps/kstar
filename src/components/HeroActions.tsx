"use client";

import { useEffect, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import SoulPortraitButton from "@/components/SoulPortraitButton";

export default function HeroActions({ allArtists }: { allArtists: ArtistLite[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem("kstar:prefs");
        if (!raw) { setReady(false); return; }
        const prefs = JSON.parse(raw) as { topIdols?: string[] };
        setReady(Array.isArray(prefs.topIdols) && prefs.topIdols.length === 4);
      } catch { setReady(false); }
    };
    check();
    window.addEventListener("kstar:prefs-updated", check);
    return () => window.removeEventListener("kstar:prefs-updated", check);
  }, []);

  function repick() {
    window.dispatchEvent(new Event("kstar:open-onboarding"));
  }

  if (!ready) return null;

  return (
    <div className="hero-cta-row">
      <SoulPortraitButton allArtists={allArtists} />
      <button
        onClick={repick}
        className="font-soft text-xs text-[#5e636d]/75 transition hover:text-[#e0456f]"
      >
        重新挑選 ✎
      </button>
    </div>
  );
}
