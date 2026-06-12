"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserPrefs } from "./types";
import { DEFAULT_WEIGHTS } from "./types";

const PREFS_KEY     = "kstar:prefs";
const ONBOARD_KEY   = "kstar:onboarding";

function loadPrefs(): UserPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as UserPrefs) : null;
  } catch { return null; }
}

function loadDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARD_KEY) === "done";
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setOnboardingDone(loadDone());
  }, []);

  const savePrefs = useCallback((p: UserPrefs) => {
    setPrefs(p);
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  }, []);

  const markOnboardingDone = useCallback(() => {
    setOnboardingDone(true);
    localStorage.setItem(ONBOARD_KEY, "done");
  }, []);

  return { prefs, savePrefs, onboardingDone, markOnboardingDone };
}

export { DEFAULT_WEIGHTS };
