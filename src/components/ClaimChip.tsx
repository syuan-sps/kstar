"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCopy } from "@/lib/i18n/LocaleProvider";

type ClaimPrefs = { topIdols?: string[]; fanIdClaimed?: boolean };

function canClaim(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}") as ClaimPrefs;
    return localStorage.getItem("kstar:onboarding") === "done"
      && prefs.topIdols?.length === 4
      && !prefs.fanIdClaimed;
  } catch {
    return false;
  }
}

export default function ClaimChip() {
  const copy = useCopy();
  const [visible, setVisible] = useState(canClaim);
  const refresh = useCallback(() => setVisible(canClaim()), []);

  useEffect(() => {
    window.addEventListener("kstar:prefs-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("kstar:prefs-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  if (!visible) return null;
  return <Link href="/start?claim=1" className="rounded-full border border-[#b4302b]/35 bg-[#b4302b]/8 px-4 py-1.5 text-xs font-bold text-[#b4302b] hover:bg-[#b4302b]/15">🪪 {copy.fanIdClaim}</Link>;
}
