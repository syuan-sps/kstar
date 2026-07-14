# Step 3 Share Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-view Step 3 share studio containing a downloadable/shareable 9:16 story card and a downloadable/shareable complete report.

**Architecture:** Preserve the existing Step 3 summary and compose the already-proven `SoulStoryCard` and `SoulReport` below it through a small controlled `Step3ShareStudio`. Derive optional report-answer context from the same wizard inputs used by `deriveQuizResult`, while leaving both artifact components and the shared `exportNode` pipeline unchanged.

**Tech Stack:** React 19, TypeScript 5, Next.js 16, Tailwind CSS 4, Node `assert`, React server rendering, existing `html-to-image` export helper.

## Global Constraints

- Preserve the existing Step 3 result summary and Step 4 issuing flow.
- Toggle labels are exactly `限動卡 9:16` and `完整追星報告`; story is the default.
- Only one artifact preview is visible at a time.
- Both views reuse their current download/share actions and `exportNode`; do not duplicate export logic.
- Native file sharing may expose Instagram; unsupported devices download the PNG instead.
- Do not add direct Instagram authentication/posting or a Step 3 Fan ID tab.

---

### Task 1: Derive report-answer context from wizard answers

**Files:**
- Create: `.superpowers/sdd/step3-report-answers.test.ts`
- Modify: `src/components/wizard/StepQuiz.tsx:18-72`

**Interfaces:**
- Consumes: `summaries: PickSummary[]`, `rank: ScoreLayer[]`, `answers: Record<string, string>`.
- Produces: `deriveReportAnswers(...): ResultAnswers`, using the same adaptive screens and quiz fold as `deriveQuizResult`.

- [x] **Step 1: Write the failing unit test**

Create a four-summary fixture with complete empty token arrays, then dynamically inspect `StepQuiz` so the missing export fails as an assertion rather than a module-load error:

```ts
import assert from "node:assert/strict";
import type { PickSummary, ScoreLayer } from "../../src/lib/types";

const emptyTokens = {
  energy_type: "",
  fan_interaction: "",
  content_tone: "",
  lifestyle_topics: [],
  value_topics: [],
  style_tags: [],
  color_palette: [],
};
const summaries = ["one", "two", "three", "four"].map((id) => ({
  id,
  layerScores: { aesthetic: 0.5, personality: 0.5, performance: 0.5, content: 0.5 },
  tokens: { ...emptyTokens },
})) satisfies PickSummary[];
const rank: ScoreLayer[] = ["personality", "aesthetic", "content", "performance"];
const stepQuiz = await import("../../src/components/wizard/StepQuiz") as Record<string, unknown>;
assert.equal(typeof stepQuiz.deriveReportAnswers, "function", "StepQuiz exports report-answer derivation");
const report = (stepQuiz.deriveReportAnswers as Function)(summaries, rank, {
  q4: "contrast",
  "confirm:mood": "more",
});
assert.equal(report.contrast, true);
assert.equal(report.visualMood, "darkLuxe");
assert.deepEqual(report.valueTokens, []);
console.log("step 3 report-answer derivation verified");
```

- [x] **Step 2: Run the unit test and verify RED**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-report-answers.test.ts
```

Expected: FAIL at `StepQuiz exports report-answer derivation` because the function is absent.

- [x] **Step 3: Extract the shared wizard-answer fold and implement the helper**

In `StepQuiz.tsx`, import `ResultAnswers`, move the existing screen loop into an internal helper returning `quiz` and `visualMood`, keep `deriveQuizResult` as a compatibility wrapper, and add:

```ts
export function deriveReportAnswers(
  summaries: PickSummary[],
  rank: ScoreLayer[],
  answers: Record<string, string>,
): ResultAnswers {
  const { quiz, visualMood } = foldWizardAnswers(summaries, rank, answers);
  const valueTokens = Object.entries(quiz.tokenPrefs)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([token]) => token);
  return { contrast: quiz.contrast, visualMood, valueTokens };
}
```

While folding screens, set `visualMood` to a direct `q7` choice, or to a confirmed mood token only when the `confirm:mood` choice is `more`. Preserve every existing extra-token and layer-nudge rule exactly.

- [x] **Step 4: Run the focused and existing regressions and verify GREEN**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-report-answers.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/final-review.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
```

Expected: both scripts print verification messages and TypeScript exits 0.

- [x] **Step 5: Commit Task 1**

```bash
git add src/components/wizard/StepQuiz.tsx
git add -f .superpowers/sdd/step3-report-answers.test.ts
git commit -m "feat(wizard): derive step three report answers"
```

---

### Task 2: Add the Step 3 story/report toggle and wire its data

**Files:**
- Create: `.superpowers/sdd/step3-share-studio.test.tsx`
- Modify: `src/components/wizard/StepReveal.tsx:1-65`
- Modify: `src/components/wizard/StartFlow.tsx:15-17,148-170`
- Modify: `docs/superpowers/plans/2026-07-13-step3-share-studio.md`

**Interfaces:**
- `StepReveal` consumes `picks: CardArtist[]` and `reportAnswers?: ResultAnswers` in addition to `result`.
- `Step3ShareStudio` consumes `{ result, picks, reportAnswers, view, onViewChange }` and renders exactly one artifact.
- `StartFlow` passes the current `quizResult`, `selectedArtists`, and `deriveReportAnswers(summaries, wiz.rank, wiz.answers)` output.

- [x] **Step 1: Write the failing render/source contract**

Create a static-render test using the existing archetype fixture and four `CardArtist` records. Render `StepReveal` through a loose component cast so the current component can load before its props expand, then assert:

```tsx
assert.match(defaultMarkup, /限動卡 9:16/, "Step 3 exposes the story tab");
assert.match(defaultMarkup, /完整追星報告/, "Step 3 exposes the complete report tab");
assert.match(defaultMarkup, /下載限動卡/, "story is the default downloadable view");
assert.doesNotMatch(defaultMarkup, /下載報告長圖/, "the inactive report is not stacked below the story");
assert.equal((defaultMarkup.match(/data-share-idol=/g) ?? []).length, 4, "story receives all four selected idols");

const revealModule = await import("../../src/components/wizard/StepReveal") as Record<string, unknown>;
assert.equal(typeof revealModule.Step3ShareStudio, "function", "the controlled share studio is exported for isolated verification");
const reportMarkup = renderToStaticMarkup(createElement(
  revealModule.Step3ShareStudio as ComponentType<Record<string, unknown>>,
  { result, picks, reportAnswers, view: "report", onViewChange: () => undefined },
));
assert.match(reportMarkup, /下載報告長圖/, "report view is downloadable");
assert.doesNotMatch(reportMarkup, /下載限動卡/, "report replaces rather than stacks with story");
```

Add `data-share-idol="true"` to `MiniPhotoCard` so the four-idol payload can be counted in both artifacts.

- [x] **Step 2: Run the render contract and verify RED**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-share-studio.test.tsx
```

Expected: FAIL because `限動卡 9:16` is absent from the current Step 3 markup.

- [x] **Step 3: Implement the controlled share studio**

In `StepReveal.tsx`, import `useState`, `SoulStoryCard`, `SoulReport`, `CardArtist`, and `ResultAnswers`. Add `type ShareView = "story" | "report"`, default local state to `story`, and define these exact tab classes:

```ts
const TAB_BASE = "rounded-full px-4 py-1.5 text-xs font-bold transition";
const TAB_ACTIVE = `${TAB_BASE} bg-[#b4302b] text-white`;
const TAB_INACTIVE = `${TAB_BASE} text-[#7c8088] hover:bg-[#7c8088]/10`;
```

Then export:

```tsx
export function Step3ShareStudio({ result, picks, reportAnswers, view, onViewChange }: {
  result: ArchetypeResult;
  picks: CardArtist[];
  reportAnswers?: ResultAnswers;
  view: ShareView;
  onViewChange: (view: ShareView) => void;
}) {
  return (
    <section className="mt-3 flex w-full flex-col items-center gap-4" aria-label="分享追星結果">
      <div role="tablist" aria-label="選擇分享內容" className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
        <button type="button" role="tab" aria-selected={view === "story"} onClick={() => onViewChange("story")} className={view === "story" ? TAB_ACTIVE : TAB_INACTIVE}>限動卡 9:16</button>
        <button type="button" role="tab" aria-selected={view === "report"} onClick={() => onViewChange("report")} className={view === "report" ? TAB_ACTIVE : TAB_INACTIVE}>完整追星報告</button>
      </div>
      {view === "story"
        ? <SoulStoryCard result={result} picks={picks} />
        : <SoulReport result={result} picks={picks} answers={reportAnswers} />}
    </section>
  );
}
```

Render this section after the soulmate/complement row so the current summary remains intact.

- [x] **Step 4: Wire the existing wizard data**

In `StartFlow.tsx`, import `deriveReportAnswers` beside `deriveQuizResult`; after resolving `selectedArtists`, derive the optional report context only when `quizResult` exists, and pass it with the four artists:

```tsx
const reportAnswers = quizResult
  ? deriveReportAnswers(summaries, wiz.rank, wiz.answers)
  : undefined;

<StepReveal
  result={quizResult}
  picks={selectedArtists}
  reportAnswers={reportAnswers}
/>
```

- [x] **Step 5: Run focused and full verification**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-report-answers.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-share-studio.test.tsx
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/final-review.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
```

Expected: all three scripts print verification messages and TypeScript exits 0.

- [x] **Step 6: Run the production build**

```bash
env PATH=/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin /Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Expected: all 13 routes build successfully.

- [x] **Step 7: Verify the reported mobile viewport**

At `http://localhost:3100/start?step=3` and 555×779:

- confirm the current summary remains above the new toggle;
- confirm story is selected by default and exposes `下載限動卡` plus `分享 ✦`;
- click `完整追星報告` and confirm the report replaces the story and exposes `下載報告長圖` plus `分享 ✦`;
- confirm switching tabs does not change the displayed archetype or four selected idols;
- do not activate the download/share buttons during verification.

- [x] **Step 8: Commit Task 2**

```bash
git add src/components/SoulStoryCard.tsx src/components/wizard/StepReveal.tsx src/components/wizard/StartFlow.tsx docs/superpowers/plans/2026-07-13-step3-share-studio.md
git add -f .superpowers/sdd/step3-share-studio.test.tsx
git commit -m "feat(wizard): add step three share studio"
```
