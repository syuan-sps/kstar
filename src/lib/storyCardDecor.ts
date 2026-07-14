import { COLOR_STORIES, LEGEND_STORY } from "./archetypes";
import type { ScoreLayer } from "./types";

export type StoryCardFamily = "collector" | "signal" | "stage" | "archive" | "orbit";
export type StoryCardMotif = "flare" | "notch" | "spotlights" | "archive-dots" | "orbit-dots" | "orbit-ring";

export interface StoryCardDecor {
  family: StoryCardFamily;
  tier: 0 | 1 | 2 | 3 | 4;
  edgeColor: string;
  softColor: string;
  motif: StoryCardMotif;
  ghostLayer?: ScoreLayer;
}

export function getStoryCardDecor(input: {
  code: string;
  leadLayer: ScoreLayer;
  missing?: ScoreLayer;
}): StoryCardDecor {
  const tier = input.code.split("").filter((letter) => letter === letter.toUpperCase()).length as 0 | 1 | 2 | 3 | 4;
  const isOrbit = tier === 0 || tier >= 3;
  const family: StoryCardFamily = isOrbit
    ? "orbit"
    : input.leadLayer === "aesthetic"
      ? "collector"
      : input.leadLayer === "personality"
        ? "signal"
        : input.leadLayer === "performance"
          ? "stage"
          : "archive";
  const colors = isOrbit ? LEGEND_STORY : COLOR_STORIES[input.leadLayer];
  const motif: StoryCardMotif = tier === 4
    ? "orbit-ring"
    : family === "collector"
      ? "flare"
      : family === "signal"
        ? "notch"
        : family === "stage"
          ? "spotlights"
          : family === "archive"
            ? "archive-dots"
            : "orbit-dots";

  return {
    family,
    tier,
    edgeColor: colors.accent,
    softColor: colors.soft,
    motif,
    ...(tier === 3 && input.missing ? { ghostLayer: input.missing } : {}),
  };
}
