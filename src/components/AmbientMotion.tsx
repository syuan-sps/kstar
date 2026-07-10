"use client";

// Syncs kstar:flashChoice → <html data-ambient="flash|calm">.
// Flash = full ambient sparkle/float; calm (or unset) = static resting decor.
// IntroSplash writes the choice; this component keeps the attribute in sync
// across first paint, storage events, and in-session re-picks (/?intro).

import { useEffect } from "react";

export type AmbientMode = "flash" | "calm";

function readChoice(): AmbientMode {
  try {
    const v = localStorage.getItem("kstar:flashChoice");
    if (v === "flash") return "flash";
  } catch {
    /* ignore */
  }
  return "calm";
}

function apply(mode: AmbientMode) {
  document.documentElement.dataset.ambient = mode;
}

export function setAmbientMode(mode: AmbientMode) {
  try {
    localStorage.setItem("kstar:flashChoice", mode);
  } catch {
    /* ignore */
  }
  apply(mode);
  window.dispatchEvent(new CustomEvent("kstar:flash-choice", { detail: mode }));
}

export default function AmbientMotion() {
  useEffect(() => {
    apply(readChoice());

    const onChoice = (e: Event) => {
      const detail = (e as CustomEvent<AmbientMode>).detail;
      apply(detail === "flash" ? "flash" : "calm");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "kstar:flashChoice") apply(readChoice());
    };

    window.addEventListener("kstar:flash-choice", onChoice);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("kstar:flash-choice", onChoice);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
