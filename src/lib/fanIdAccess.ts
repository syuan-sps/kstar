import { ARCHETYPES, getArchetype, reconcileStoredArchetype, type ArchetypeResult } from "./archetypes";
import { rankToWeights } from "./questionnaire";
import { isStoredArchetype, validRank, validWeights } from "./wizardState";
import { DEFAULT_WEIGHTS, SCORE_LAYERS, type PickSummary, type ScoreLayer } from "./types";

export type FanIdEntryAction = "start" | "claim" | "card";

export function fanIdEntryAction(value: unknown): FanIdEntryAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "start";
  const prefs = value as Record<string, unknown>;
  const topIdols = prefs.topIdols;
  const archetype = prefs.archetype as { code?: unknown; hiddenLayer?: unknown } | null | undefined;
  const hasLineup = Array.isArray(topIdols)
    && topIdols.length === 4
    && topIdols.every((id) => typeof id === "string" && id.length > 0 && id.length <= 128)
    && new Set(topIdols).size === 4;
  if (!hasLineup) return "start";
  const hasResult = typeof archetype?.code === "string"
    && Boolean(ARCHETYPES[archetype.code])
    && SCORE_LAYERS.includes(archetype.hiddenLayer as ScoreLayer);
  if (!hasResult) return "claim";
  const hasIdentity = prefs.fanIdClaimed === true
    && typeof prefs.issuedAt === "string" && /^\d{4}\.\d{2}\.\d{2}$/.test(prefs.issuedAt)
    && typeof prefs.serial === "string" && prefs.serial.length > 0 && prefs.serial.length <= 32;
  return hasIdentity ? "card" : "claim";
}

export function deriveFanIdResult(summaries: PickSummary[], value: unknown): ArchetypeResult {
  const prefs = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const weights = validWeights(prefs.weights)
    ? prefs.weights
    : validRank(prefs.layerRank)
      ? rankToWeights(prefs.layerRank)
      : DEFAULT_WEIGHTS;
  const stored = isStoredArchetype(prefs.archetype) ? prefs.archetype : undefined;
  return reconcileStoredArchetype(getArchetype(summaries, weights), stored);
}
