"use client";

// Persistent wizard shell: logo, 1–4 stepper with checkmarks, fixed Back/Next.
// Pure presentation — step logic lives in the page.
import { copy } from "@/lib/copy";
import HomeLogoLink from "@/components/HomeLogoLink";

const STEPS = [copy.wizStep1, copy.wizStep2, copy.wizStep3, copy.wizStep4];

export default function WizardChrome({
  step, canNext, onBack, onNext, nextLabel, children,
}: {
  step: 1 | 2 | 3 | 4;
  canNext: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-6">
      <HomeLogoLink className="mb-4 self-center font-orbitron text-lg font-black chrome-text">
        {copy.appName}
      </HomeLogoLink>
      <ol className="mb-6 flex items-center gap-2" aria-label="步驟">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const done = n < step;
          const on = n === step;
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
                {done ? "✓" : n}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-[#c8ccd2]/50" />}
            </li>
          );
        })}
      </ol>
      {children}
      <div className="mt-6 flex gap-3">
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
