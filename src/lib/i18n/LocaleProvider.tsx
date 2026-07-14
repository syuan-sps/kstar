"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import { getCopy, type Copy } from "@/lib/copy";

// The layout reads the locale cookie server-side and passes it down as a prop,
// so server HTML and client hydration always agree — localStorage is never
// consulted for the initial render.
const LocaleContext = createContext<Locale>("zh");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useCopy(): Copy {
  return getCopy(useLocale());
}
