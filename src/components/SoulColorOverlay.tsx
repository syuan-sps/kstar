"use client";

// Colour popup for the 限動卡 / 完整報告 (editions only, no stickers). Both cards
// share ONE colour — prefs.storyThemeId — kept separate from the 追星證 edition.
// Two-column like the other decorate popups: the live card on the left, the
// edition swatches on the right. Applying is live (prefs-updated), so the card
// recolours as you pick.
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArchetypeResult } from "@/lib/archetypes";
import { FAN_ID_THEMES, type FanIdThemeId } from "@/lib/fanIdThemes";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";

export function readStoryThemeId(): FanIdThemeId {
  try {
    const p = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}") as Record<string, unknown>;
    const has = (v: unknown): v is FanIdThemeId => typeof v === "string" && Object.prototype.hasOwnProperty.call(FAN_ID_THEMES, v);
    // Default to the Fan ID edition so the cards start matching, then diverge if edited.
    return has(p.storyThemeId) ? p.storyThemeId : has(p.themeId) ? p.themeId : "chrome";
  } catch {
    return "chrome";
  }
}

export default function SoulColorOverlay({ open, onClose, view, result, answers }: {
  open: boolean;
  onClose: () => void;
  view: "story" | "report";
  result: ArchetypeResult;
  answers?: ResultAnswers;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const [themeId, setThemeId] = useState<FanIdThemeId>("chrome");

  useEffect(() => { if (open) setThemeId(readStoryThemeId()); }, [open]);

  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  function pick(id: FanIdThemeId) {
    setThemeId(id);
    try {
      const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}");
      localStorage.setItem("kstar:prefs", JSON.stringify({ ...prefs, storyThemeId: id }));
      window.dispatchEvent(new Event("kstar:prefs-updated"));
    } catch {
      /* keep on-screen selection even if storage is unavailable */
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f4f5f7]/92 backdrop-blur-sm" onClick={close}>
      <div className="mx-auto min-h-full max-w-4xl px-4 py-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-black tracking-wide text-[#1c1e24]">{copy.pickColorTitle}</h2>
          <button type="button" aria-label={copy.fourCutDone} onClick={close} className="grid h-8 w-8 place-items-center rounded-full border border-[#c8ccd2] bg-white text-[#5e636d] hover:bg-[#7c8088]/10">×</button>
        </div>

        <div className="flex flex-col items-center gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
          {/* Live preview — actions hidden so it reads as a preview, not a share card */}
          <div className="w-full shrink-0 lg:sticky lg:top-6 lg:justify-self-center">
            {view === "story"
              ? <SoulStoryCard result={result} themeId={themeId} hideActions />
              : <SoulReport result={result} answers={answers} themeId={themeId} hideActions />}
          </div>

          {/* Edition swatches (no stickers) */}
          <div className="w-full">
            <section className="space-y-4 rounded-2xl border border-[#c8ccd2] bg-white/75 p-4 shadow-sm">
              <p className="text-xs font-bold text-[#5e636d]">{copy.pickColorTitle}</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={copy.pickColorTitle}>
                {Object.values(FAN_ID_THEMES).map((theme) => {
                  const selected = themeId === theme.id;
                  return (
                    <button key={theme.id} type="button" role="radio" aria-checked={selected} onClick={() => pick(theme.id)}
                      className={`rounded-xl border-2 p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "border-[#b4302b] shadow-sm" : "border-transparent hover:border-[#c8ccd2]"}`}>
                      <span className="block h-10 rounded-lg border" style={{ backgroundImage: theme.surface, borderColor: theme.border }} />
                      <span className="mt-1 block truncate text-[10px] font-bold text-[#1c1e24]">{locale === "zh" ? theme.labelZh : theme.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <button type="button" onClick={close} className="mt-3 w-full rounded-xl bg-[#1c1e24] py-3 font-bold text-white">{copy.fourCutDone}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
