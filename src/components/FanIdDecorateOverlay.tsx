"use client";

// In-place 追星證 decorate popup (parallel to the four-cut's overlay). Instead of
// duplicating the editor, it renders the REAL customize editor (StepIssue) inside
// a modal, seeded from the saved card in prefs. Every edit is mirrored back to
// prefs live, so the home Fan ID reflects the change the moment the popup closes.
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import { SCORE_LAYERS } from "@/lib/types";
import { clearWizard, ensureIssueIdentity, saveWizard, type WizardState } from "@/lib/wizardState";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import StepIssue from "@/components/wizard/StepIssue";

// Build a full wizard state from the saved card so StepIssue opens ON the user's
// existing Fan ID (edition, stickers, name, serial) rather than a blank one.
function seedWizFromPrefs(): WizardState {
  let p: Record<string, unknown> = {};
  try { p = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}"); } catch { /* fresh */ }
  const w = saveWizard({
    step: 4,
    picks: Array.isArray(p.topIdols) ? (p.topIdols as string[]) : [],
    rank: Array.isArray(p.layerRank) ? (p.layerRank as WizardState["rank"]) : [...SCORE_LAYERS],
    answers: {},
    archetype: (p.archetype as WizardState["archetype"]) ?? undefined,
    heroId: typeof p.heroId === "string" ? p.heroId : undefined,
    fanName: typeof p.fanName === "string" ? p.fanName : undefined,
    issuedAt: typeof p.issuedAt === "string" ? p.issuedAt : undefined,
    serial: typeof p.serial === "string" ? p.serial : undefined,
    themeId: p.themeId as WizardState["themeId"],
    cardMode: p.cardMode as WizardState["cardMode"],
    hideArchetype: p.hideArchetype === true,
    customStickers: Array.isArray(p.customStickers) ? (p.customStickers as WizardState["customStickers"]) : undefined,
  });
  return ensureIssueIdentity(w); // keeps the existing serial/date if present
}

function mirrorToPrefs(w: WizardState) {
  try {
    const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}");
    localStorage.setItem("kstar:prefs", JSON.stringify({
      ...prefs,
      themeId: w.themeId ?? prefs.themeId,
      cardMode: w.cardMode ?? prefs.cardMode,
      hideArchetype: w.hideArchetype === true,
      fanName: w.fanName,
      heroId: w.heroId ?? prefs.heroId,
      customStickers: w.customStickers ?? prefs.customStickers,
      serial: w.serial ?? prefs.serial,
      issuedAt: w.issuedAt ?? prefs.issuedAt,
    }));
    window.dispatchEvent(new Event("kstar:prefs-updated"));
  } catch {
    /* keep the on-screen edit even if storage is unavailable */
  }
}

export default function FanIdDecorateOverlay({ open, onClose, picks, result, onTakeQuiz }: {
  open: boolean;
  onClose: () => void;
  picks: CardArtist[];
  /** Absent for a quiz-free card. Decorating must still work without it —
      stickers are the whole point, and gating them on the quiz would put the
      feature back behind the wall this redesign removed. */
  result?: ArchetypeResult;
  onTakeQuiz?: () => void;
}) {
  const copy = useCopy();
  const [wiz, setWiz] = useState<WizardState | null>(null);

  useEffect(() => {
    setWiz(open ? seedWizFromPrefs() : null);
  }, [open]);

  const close = useCallback(() => { clearWizard(); onClose(); }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !wiz || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f4f5f7]/92 backdrop-blur-sm" onClick={close}>
      <div className="mx-auto min-h-full max-w-4xl px-4 py-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-black tracking-wide text-[#1c1e24]">{copy.editFanId}</h2>
          <button type="button" aria-label={copy.fourCutDone} onClick={close} className="grid h-8 w-8 place-items-center rounded-full border border-[#c8ccd2] bg-white text-[#5e636d] hover:bg-[#7c8088]/10">×</button>
        </div>
        <StepIssue
          wiz={wiz}
          picks={picks}
          result={result}
          onTakeQuiz={onTakeQuiz}
          skipIntro
          onWizardChange={(w) => { setWiz(w); mirrorToPrefs(w); }}
          onDone={close}
        />
      </div>
    </div>,
    document.body,
  );
}
