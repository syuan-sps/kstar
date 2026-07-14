import type { PickSummary, ScoreLayer } from "./types";
import {
  QUESTION_BY_ID, MOODS, type Question,
  selectQuestionIds, agreedToken, agreedMood, energyOutlier, energyText,
} from "./questionnaire";
import { displayTrait } from "./cardMeta";
import type { Loc, Locale } from "./i18n/config";

export const CONTENT_TONE_TEXT: Record<string, Loc> = {
  intimate: { zh: "日常陪伴", en: "everyday company" },
  hype: { zh: "嗨翻舞台", en: "hype stage energy" },
  aesthetic: { zh: "美感氛圍", en: "aesthetic mood" },
  comedic: { zh: "搞笑名場面", en: "comedic moments" },
};

export type ConfirmField = "energy_type" | "fan_interaction" | "content_tone" | "mood";
export type Screen =
  | { kind: "question"; key: string; q: Question }
  | { kind: "confirm"; key: string; field: ConfirmField; token: string; tokenField: string | null; layer: ScoreLayer }
  | { kind: "outlier"; key: string; index: number; energy: string };

export function confirmLabel(locale: Locale, field: ConfirmField, token: string): string {
  if (field === "energy_type") return energyText(locale, token);
  if (field === "fan_interaction") return displayTrait(locale, token) ?? token;
  if (field === "content_tone") return CONTENT_TONE_TEXT[token]?.[locale] ?? token;
  return MOODS.find((m) => m.id === token)?.label[locale] ?? token;
}

export function buildScreens(picks: PickSummary[], rank: ScoreLayer[]): Screen[] {
  const ids = selectQuestionIds(rank);
  const screens: Screen[] = [];
  for (const id of ids) {
    if (id === "q2") {
      const ag = agreedToken(picks, "energy_type");
      if (ag) screens.push({ kind: "confirm", key: "confirm:energy_type", field: "energy_type", token: ag, tokenField: "energy_type", layer: "personality" });
      else screens.push({ kind: "question", key: "q2", q: QUESTION_BY_ID.q2 });
      const out = energyOutlier(picks);
      if (out) screens.push({ kind: "outlier", key: "outlier", index: out.index, energy: out.energy });
    } else if (id === "q3") {
      const ag = agreedToken(picks, "fan_interaction");
      if (ag) screens.push({ kind: "confirm", key: "confirm:fan_interaction", field: "fan_interaction", token: ag, tokenField: "fan_interaction", layer: "personality" });
      else screens.push({ kind: "question", key: "q3", q: QUESTION_BY_ID.q3 });
    } else if (id === "q6") {
      const ag = agreedToken(picks, "content_tone");
      if (ag) screens.push({ kind: "confirm", key: "confirm:content_tone", field: "content_tone", token: ag, tokenField: "content_tone", layer: "content" });
      else screens.push({ kind: "question", key: "q6", q: QUESTION_BY_ID.q6 });
    } else if (id === "q7") {
      const am = agreedMood(picks);
      if (am) screens.push({ kind: "confirm", key: "confirm:mood", field: "mood", token: am, tokenField: null, layer: "aesthetic" });
      else screens.push({ kind: "question", key: "q7", q: QUESTION_BY_ID.q7 });
    } else {
      screens.push({ kind: "question", key: id, q: QUESTION_BY_ID[id] });
    }
  }
  return screens;
}
