import type { Locale } from "./i18n/config";
import { copyZh } from "./copy.zh";
import { copyEn } from "./copy.en";

export type Copy = typeof copyZh;

export function getCopy(locale: Locale): Copy {
  return locale === "en" ? copyEn : copyZh;
}
