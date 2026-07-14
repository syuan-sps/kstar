"use client";

// Owns the shared 全部/美學/個性/表演/內容 filter state.
// The pills (rendered inside SimilarSection) drive BOTH which analysis card
// shows above AND the similarity weighting below.
//   全部   → one combined overview card (deep-pass idols), else falls back to
//            the individual cards that exist
//   layer  → only that layer's full card

import { useState } from "react";
import type { Artist, SimilarArtist, LayerFilter } from "@/lib/types";
import AestheticSection from "./AestheticSection";
import PersonalitySection from "./PersonalitySection";
import AnalysisCard from "./AnalysisCard";
import SimilarSection from "./SimilarSection";

export default function ProfileExplorer({
  artist,
  recsByLayer,
  personalBySrc,
}: {
  artist: Artist;
  recsByLayer: Record<LayerFilter, SimilarArtist[]>;
  personalBySrc: Record<string, string | null>;
}) {
  const [filter, setFilter] = useState<LayerFilter>("all");
  const profile = artist.profile;
  const perf = profile?.performance;
  const cont = profile?.content;
  const overview = profile?.overview;

  return (
    <>
      {filter === "all" &&
        (overview ? (
          <AnalysisCard
            title="偶像分析"
            vibe={overview.vibe}
            tags={overview.trait_tags}
            analysis={overview.summary}
          />
        ) : (
          <>
            <AestheticSection artist={artist} />
            <PersonalitySection artist={artist} />
          </>
        ))}

      {filter === "aesthetic" && <AestheticSection artist={artist} />}
      {filter === "personality" && <PersonalitySection artist={artist} />}
      {filter === "performance" && perf?.vibe && (
        <AnalysisCard
          title="表演分析"
          vibe={perf.vibe}
          tags={perf.trait_tags}
          analysis={perf.analysis}
        />
      )}
      {filter === "content" && cont?.vibe && (
        <AnalysisCard
          title="內容分析"
          vibe={cont.vibe}
          tags={cont.trait_tags}
          analysis={cont.analysis}
        />
      )}

      <SimilarSection
        sourceArtist={artist}
        recsByLayer={recsByLayer}
        personalBySrc={personalBySrc}
        filter={filter}
        onFilterChange={setFilter}
      />
    </>
  );
}
