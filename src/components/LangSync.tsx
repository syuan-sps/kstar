"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isLocale,
  writeLocaleCookie,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
} from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Applies `?lang=en|zh` deep links, and restores a cleared cookie from the
 *  localStorage mirror. Renders nothing; must sit under a Suspense boundary
 *  (useSearchParams). */
export default function LangSync() {
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  // The value, not the params object: useSearchParams returns a fresh identity
  // every render, so depending on it re-runs this effect constantly.
  const langParam = params.get("lang");

  useEffect(() => {
    const fromQuery = langParam;
    let desired: string | null = null;
    if (isLocale(fromQuery)) {
      desired = fromQuery;
    } else if (!document.cookie.includes(`${LOCALE_COOKIE}=`)) {
      try {
        desired = localStorage.getItem(LOCALE_STORAGE_KEY);
      } catch {
        desired = null;
      }
    }
    if (isLocale(desired) && desired !== locale) {
      writeLocaleCookie(desired);
      router.refresh();
    }
  }, [langParam, locale, router]);

  return null;
}
