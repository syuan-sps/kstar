"use client";

// Marks the visitor's own archetype card on /soul-types. The page is a static
// server component listing all 16 types; this client add-on reads the persisted
// archetype code, rings the matching [data-soul-code] card, drops a "your type"
// badge, and scrolls it into view — so the page answers "which one am I?".
import { useEffect } from "react";
import { useCopy } from "@/lib/i18n/LocaleProvider";

export default function SoulTypeHighlighter() {
  const copy = useCopy();

  useEffect(() => {
    let code: string | undefined;
    try {
      const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}") as { archetype?: { code?: string } };
      code = prefs.archetype?.code;
    } catch {
      return;
    }
    if (!code) return;
    const card = document.querySelector<HTMLElement>(`[data-soul-code="${code}"]`);
    if (!card) return;

    card.style.borderColor = "#b4302b";
    card.style.boxShadow = "0 0 0 3px rgba(180,48,43,0.18), 2px 2px 0 rgba(124,128,136,0.2)";

    if (!card.querySelector("[data-soul-badge]")) {
      const badge = document.createElement("span");
      badge.setAttribute("data-soul-badge", "");
      badge.textContent = copy.soulTypesYours;
      badge.className = "absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#b4302b] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm";
      card.appendChild(badge);
    }

    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [copy]);

  return null;
}
