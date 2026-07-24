"use client";

// Persistent wizard shell: 1–4 stepper with checkmarks, fixed Back/Next.
// The top-nav banner already shows the KStar logo, so this shell doesn't repeat it.
// Pure presentation — step logic lives in the page.
import { useCopy } from "@/lib/i18n/LocaleProvider";

export default function WizardChrome({
  step, canNext, onBack, onNext, nextLabel, children, stickyActions = false, wide = false,
  nodes, activeNode,
}: {
  step: 1 | 2 | 3 | 4;
  canNext: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  children: React.ReactNode;
  /** Float the Back/Next row so it stays above the fold on long steps (e.g. the picker). */
  stickyActions?: boolean;
  /** Widen the shell (max-w-4xl) so a two-column step (the customize editor) has room. */
  wide?: boolean;
  /** Optional custom stepper display (e.g. splitting the quiz into its own node).
      When given, `activeNode` is the 0-based index of the current node. Purely
      visual — it does not change the persisted wizard step. */
  nodes?: string[];
  activeNode?: number;
}) {
  const copy = useCopy();
  const STEPS = nodes ?? [copy.wizStep1, copy.wizStep2, copy.wizStep3, copy.wizStep4];
  const activeIndex = nodes ? (activeNode ?? 0) : step - 1;
  return (
    <div className={`mx-auto flex w-full flex-col px-4 py-6 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
      <ol className="mb-6 flex items-center gap-2" aria-label={copy.wizStepsAria}>
        {STEPS.map((label, i) => {
          const done = i < activeIndex;
          const on = i === activeIndex;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  done ? "border-emerald-500 text-emerald-600" :
                  on ? "border-[#b4302b] bg-[#b4302b] text-white" :
                  "border-[#c8ccd2] text-[#9aa0aa]"
                }`}
                aria-current={on ? "step" : undefined}
                title={label}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-[#c8ccd2]/50" />}
            </li>
          );
        })}
      </ol>
      {children}
      <div
        className={`mt-6 flex gap-3 ${
          stickyActions
            ? "sticky bottom-4 z-30 rounded-2xl border border-[#c8ccd2]/60 bg-white/85 p-2 shadow-[0_8px_24px_-8px_rgba(28,30,36,0.35)] backdrop-blur"
            : ""
        }`}
      >
        {onBack && (
          <button onClick={onBack} className="flex-1 rounded-xl border border-[#c8ccd2] py-3 font-bold">
            {copy.wizBack}
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            disabled={!canNext}
            className="flex-1 rounded-xl bg-[#1c1e24] py-3 font-bold text-white disabled:opacity-40"
          >
            {nextLabel ?? `${copy.wizNext} (${step}/4)`}
          </button>
        )}
      </div>
    </div>
  );
}
