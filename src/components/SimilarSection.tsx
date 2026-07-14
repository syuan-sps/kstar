"use client";

// Recommendation grid — lists are precomputed server-side per layer
// (top 6 by match value). This component only switches between them,
// fetches AI reasons, and decides whether personalized reasons apply
// (only when the page's idol is one of the user's four picks).

import { useEffect, useState, useCallback } from "react";
import type { Artist, SimilarArtist, Weights, LayerFilter } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/types";
import SimilarIdolCard from "./SimilarIdolCard";
import { copy } from "@/lib/copy";

const PILL_LABELS: Record<LayerFilter, string> = {
  all:         "全部",
  aesthetic:   "美學",
  personality: "個性",
  performance: "表演",
  content:     "內容",
};

const FILTERS: LayerFilter[] = ["all", "aesthetic", "personality", "performance", "content"];

function filterWeights(f: LayerFilter): Weights {
  if (f === "all") return DEFAULT_WEIGHTS;
  return { aesthetic: 0, personality: 0, performance: 0, content: 0, [f]: 1 };
}

function SkeletonCard() {
  return <div className="animate-pulse rounded-2xl bg-[#7c8088]/10 h-64 w-full" />;
}

interface Props {
  sourceArtist: Artist;
  recsByLayer: Record<LayerFilter, SimilarArtist[]>;
  personalBySrc: Record<string, string | null>;
  filter: LayerFilter;
  onFilterChange: (f: LayerFilter) => void;
}

export default function SimilarSection({
  sourceArtist,
  recsByLayer,
  personalBySrc,
  filter,
  onFilterChange,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [topIdols, setTopIdols] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonsLoading, setReasonsLoading] = useState(false);

  const candidates = recsByLayer[filter] ?? [];

  const fetchReasons = useCallback(async (artists: SimilarArtist[], weights: Weights) => {
    setReasonsLoading(true);
    const results = await Promise.allSettled(
      artists.map(async (s) => {
        const res = await fetch("/api/similarity-reason", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: sourceArtist,
            candidate: s.artist,
            weights,
            topTraits: s.topTraits,
          }),
        });
        const data = (await res.json()) as { reason: string };
        return { id: s.artist.id, reason: data.reason };
      })
    );
    const newReasons: Record<string, string> = {};
    for (const r of results) {
      if (r.status === "fulfilled") newReasons[r.value.id] = r.value.reason;
    }
    setReasons((prev) => ({ ...prev, ...newReasons }));
    setReasonsLoading(false);
  }, [sourceArtist]);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("kstar:prefs");
      if (raw) {
        const prefs = JSON.parse(raw) as { topIdols?: string[] };
        if (Array.isArray(prefs.topIdols)) setTopIdols(prefs.topIdols);
      }
    } catch { /* ignore */ }
    fetchReasons(recsByLayer.all ?? [], DEFAULT_WEIGHTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceArtist.id]);

  const handleFilter = (f: LayerFilter) => {
    onFilterChange(f);
    const list = recsByLayer[f] ?? [];
    const unfetched = list.filter((s) => !reasons[s.artist.id]);
    if (unfetched.length) fetchReasons(unfetched, filterWeights(f));
  };

  if (!mounted) {
    return (
      <section>
        <div className="mb-4 h-8 w-48 animate-pulse rounded-full bg-[#7c8088]/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  const isBiasPage = topIdols.includes(sourceArtist.id);

  return (
    <section>
      {/* Header + filter pills */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-orbitron text-lg font-bold text-[#1c1e24]">{copy.similarArtistsTitle}</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === f
                  ? "bg-[#b4302b] text-white shadow-[0_0_8px_rgba(180,48,43,0.4)]"
                  : "border border-[#c8ccd2]/30 text-[#7c8088] hover:bg-[#7c8088]/10"
              }`}
            >
              {PILL_LABELS[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="chrome-divider"><span className="chrome-divider-star">✦</span></div>

      {candidates.length === 0 ? (
        <p className="text-[#9aa0aa]">{copy.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {candidates.map((s) => (
            <SimilarIdolCard
              key={s.artist.id}
              similar={s}
              reason={reasons[s.artist.id] ?? null}
              personal={isBiasPage ? personalBySrc[s.artist.id] ?? null : null}
              loading={!reasons[s.artist.id] && reasonsLoading}
            />
          ))}
        </div>
      )}
    </section>
  );
}
