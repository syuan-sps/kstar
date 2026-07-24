"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtistLite } from "@/lib/lite";
import { saveWizard } from "@/lib/wizardState";
import { homeEntryMotionClass } from "@/lib/motionConsent";
import FourCuts from "@/components/FourCuts";
import { useCopy } from "@/lib/i18n/LocaleProvider";

export default function MyFourCuts({
  allArtists,
  className = "",
  frameClassName = "w-full max-w-[300px]",
}: {
  allArtists: ArtistLite[];
  className?: string;
  frameClassName?: string;
}) {
  const router = useRouter();
  const copy = useCopy();
  const [ids, setIds] = useState<string[] | null>(null);
  const [entry, setEntry] = useState(true); // one-time camera-flash on real page entry
  const [flashOk] = useState(() => typeof window !== "undefined" ? localStorage.getItem("kstar:flashOk") : null);
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
    let mounted = true;
    queueMicrotask(() => { if (mounted) read(); });
    // React to onboarding completion + cross-tab changes without a reload
    const onUpdate = () => read();
    window.addEventListener("kstar:prefs-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      mounted = false;
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

  function repick() {
    let prefs: { topIdols?: string[] } = {};
    try { prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}"); } catch { /* fresh */ }
    saveWizard({ picks: prefs.topIdols ?? [], step: 1 });
    router.push("/start?step=1");
  }

  if (ids === null) return null; // still reading localStorage — render nothing

  const artists = ids
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];

  // No (valid) picks yet — e.g. the user skipped onboarding. Offer a way in.
  if (artists.length !== 4) {
    return (
      <section className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="text-center">
          <h2 className="font-orbitron text-sm font-bold tracking-widest text-[#5e636d] uppercase">
            {copy.fanIdBrandHeading}
          </h2>
          <p className="mt-1 text-xs text-[#5e636d]/80">{copy.fanIdBrandSub}</p>
        </div>
        {/* A newcomer's 人生四格 starts empty. The sample card that used to sit
            here printed a fabricated archetype ("3% 超稀有型別") before anyone had
            done anything — it gave away the reward and was not their data. */}
        <div className="grid w-full max-w-[280px] grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              aria-hidden="true"
              className="grid aspect-[3/4] place-items-center rounded-xl border-2 border-dashed border-[#c8ccd2] bg-white/40 font-orbitron text-lg text-[#c8ccd2]"
            >
              +
            </div>
          ))}
        </div>
        <button
          onClick={repick}
          className="rounded-full bg-[#b4302b] px-5 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110"
        >
          {copy.wizStartCta} →
        </button>
      </section>
    );
  }

  return (
    <section className={`flex flex-col items-center gap-3 ${className}`}>
      <h2 className="font-orbitron text-sm font-bold tracking-widest text-[#5e636d] uppercase">
        {copy.fourCutsTitle} ✦
      </h2>
      <div className={homeEntryMotionClass(flashOk, entry)}>
        <FourCuts artists={artists} className={frameClassName} linked developId={developId} />
      </div>
      <button
        onClick={repick}
        className="text-xs text-[#5e636d]/70 hover:text-[#7c8088] transition"
      >
        {copy.repickBtn}
      </button>
    </section>
  );
}
