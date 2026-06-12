"use client";

import { useEffect, useState, useCallback } from "react";
import type { Artist, SimilarArtist, Weights, LayerFilter } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/types";
import { similarArtists } from "@/lib/similarity";
import { personalReason } from "@/lib/cardMeta";
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
  return (
    <div className="animate-pulse rounded-2xl bg-[#ff00cc]/10 h-64 w-full" />
  );
}

interface Props {
  sourceArtist: Artist;
  allArtists: Artist[];
  // Controlled filter — owned by ProfileExplorer so the pills also drive the analysis cards
  filter: LayerFilter;
  onFilterChange: (f: LayerFilter) => void;
}

export default function SimilarSection({ sourceArtist, allArtists, filter, onFilterChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const [topIdols, setTopIdols] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<SimilarArtist[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fallbackNote, setFallbackNote] = useState(false);

  // Score candidates based on current filter
  const score = useCallback((f: LayerFilter, weights?: Weights) => {
    const w = weights ?? filterWeights(f);
    const results = similarArtists(sourceArtist, allArtists, w);

    // If filtering by a single layer and all score 0, fall back
    if (f !== "all" && results.every((r) => r.score < 0.01)) {
      setFallbackNote(true);
      const fallback = similarArtists(sourceArtist, allArtists, DEFAULT_WEIGHTS);
      setCandidates(fallback.slice(0, 6));
    } else {
      setFallbackNote(false);
      setCandidates(results.slice(0, 6));
    }
  }, [sourceArtist, allArtists]);

  // Fetch AI reasons for displayed candidates
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
        const data = await res.json() as { reason: string };
        return { id: s.artist.id, reason: data.reason };
      })
    );
    const newReasons: Record<string, string> = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        newReasons[r.value.id] = r.value.reason;
      }
    }
    setReasons((prev) => ({ ...prev, ...newReasons }));
    setReasonsLoading(false);
  }, [sourceArtist]);

  // On mount: load prefs, score, fetch reasons
  const init = useCallback(() => {
    setError(false);
    setReasons({});
    try {
      let weights = DEFAULT_WEIGHTS;
      const raw = localStorage.getItem("kstar:prefs");
      if (raw) {
        const prefs = JSON.parse(raw) as { weights: Weights; topIdols?: string[] };
        if (prefs.weights) weights = prefs.weights;
        if (Array.isArray(prefs.topIdols)) setTopIdols(prefs.topIdols);
      }
      const results = similarArtists(sourceArtist, allArtists, weights);
      const top6 = results.slice(0, 6);
      setCandidates(top6);
      fetchReasons(top6, weights);
    } catch {
      setError(true);
    }
  }, [sourceArtist, allArtists, fetchReasons]);

  useEffect(() => {
    setMounted(true);
    init();
  }, [init]);

  // Re-score on filter change (synchronous, instant)
  const handleFilter = (f: LayerFilter) => {
    onFilterChange(f);
    score(f);
    // Fetch new reasons for the re-scored list
    const w = filterWeights(f);
    const results = similarArtists(sourceArtist, allArtists, w);
    const validResults = f !== "all" && results.every((r) => r.score < 0.01)
      ? similarArtists(sourceArtist, allArtists, DEFAULT_WEIGHTS).slice(0, 6)
      : results.slice(0, 6);
    fetchReasons(validResults, w);
  };

  if (!mounted) {
    return (
      <section>
        <div className="mb-4 h-8 w-48 animate-pulse rounded-full bg-[#ff00cc]/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="mb-4 font-orbitron text-lg font-bold text-white">{copy.similarArtistsTitle}</h2>
        <div className="rounded-xl border border-[#ff00cc]/20 bg-[#ff00cc]/5 p-6 text-center">
          <p className="text-white/60 mb-3">無法載入推薦</p>
          <button
            onClick={init}
            className="rounded-full bg-[#ff00cc] px-4 py-1.5 text-sm font-bold text-white hover:brightness-110"
          >
            請重試
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header + filter pills */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-orbitron text-lg font-bold text-white">{copy.similarArtistsTitle}</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === f
                  ? "bg-[#ff00cc] text-white shadow-[0_0_8px_#ff00cc80]"
                  : "border border-[#ff00cc]/30 text-pink-300 hover:bg-[#ff00cc]/10"
              }`}
            >
              {PILL_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {fallbackNote && (
        <p className="mb-3 text-xs text-white/40">此偶像資料不足，顯示綜合推薦</p>
      )}

      {candidates.length === 0 ? (
        <p className="text-white/50">{copy.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {candidates.map((s) => (
            <SimilarIdolCard
              key={s.artist.id}
              similar={s}
              reason={reasons[s.artist.id] ?? null}
              personal={personalReason(s.artist, topIdols, allArtists)}
              loading={!reasons[s.artist.id] && reasonsLoading}
            />
          ))}
        </div>
      )}
    </section>
  );
}
