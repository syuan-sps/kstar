// Locale plumbing for the 中/EN toggle.
// The cookie is the single source of truth for SSR; localStorage is a
// restore-only mirror (used when the cookie has been cleared).
// Cookie names can't contain ":", so this one deviates from the kstar:* convention.
export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];
export const LOCALE_COOKIE = "kstar_lang";
export const LOCALE_STORAGE_KEY = "kstar:lang";

/** A single string in both languages. Both fields required — the compiler
 *  keeps zh and en from drifting apart in data-shaped dictionaries. */
export interface Loc {
  zh: string;
  en: string;
}

export const L = (locale: Locale, s: Loc): string => s[locale];

export function normalizeLocale(v: unknown): Locale {
  return v === "en" ? "en" : "zh";
}

export function isLocale(v: unknown): v is Locale {
  return v === "zh" || v === "en";
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // private mode — cookie alone is enough
  }
}
