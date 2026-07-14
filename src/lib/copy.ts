import type { Locale } from "./i18n/config";
import { copyZh } from "./copy.zh";
import { copyEn } from "./copy.en";

export type Copy = typeof copyZh;

export function getCopy(locale: Locale): Copy {
  return locale === "en" ? copyEn : copyZh;
}

// TEMP migration shim — components still importing `copy` directly get zh.
// Every import site moves to getCopy()/useCopy() during the string migration,
// then this export is deleted.
export const copy = copyZh;
