# Wizard Retake and Card-Only Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Step 2 retake that preserves selected idols, and make Step 3 display only the selected downloadable card beneath a story-first format toggle.

**Architecture:** Add a pure `resetWizardForRetake` state transform in `wizardState`, persist it from `StartFlow`, and let `StepQuiz` own only its local return to the ranking phase. Simplify `StepReveal` to a tablist plus `Step3ShareStudio`, relying on the two export cards as the sole presentations of the result.

**Tech Stack:** React 19, TypeScript 5, Next.js 16, Tailwind CSS 4, Node `assert`, React server rendering, existing wizard local-storage state.

## Global Constraints

- Retake starts at the priority-ranking screen with default `SCORE_LAYERS` order.
- Retake clears answers, saved archetype, and in-memory quiz result while preserving all four selected idol IDs and unrelated identity fields.
- Step 2 completion keeps `查看判定結果 →` and adds `↻ 重做測驗` without a confirmation dialog.
- Step 3 toggle order is exactly `限動卡` then `完整長圖`; `限動卡` is selected by default.
- Step 3 renders no standalone result summary and exactly one downloadable card at a time.
- Download/share behavior, Step 4, and the Fan ID card remain unchanged.

---

### Task 1: Reset completed Step 2 for a full retake

**Files:**
- Create: `.superpowers/sdd/step2-retake.test.tsx`
- Modify: `src/lib/wizardState.ts`
- Modify: `src/components/wizard/StepQuiz.tsx`
- Modify: `src/components/wizard/StartFlow.tsx`

**Interfaces:**
- `resetWizardForRetake(state: WizardState): WizardState` returns Step 2 state with canonical default rank, empty answers, and `archetype: undefined` while preserving every other field.
- `StepQuiz` receives `onRetake: () => void` and uses it before changing its local phase to `rank`.
- `StartFlow` persists the reset state and clears `quizResult`.

- [x] **Step 1: Write the failing retake contract**

Create `.superpowers/sdd/step2-retake.test.tsx`:

```tsx
import assert from "node:assert/strict";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StepQuiz from "../../src/components/wizard/StepQuiz";
import { buildScreens } from "../../src/lib/quizScreens";
import { SCORE_LAYERS, type PickSummary } from "../../src/lib/types";

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
const picks = ["one", "two", "three", "four"].map((id) => ({
  id, name: id, genres: [], popularity: 1, gender: "男", positions: [],
}));

async function main() {
  const wizardState = await import("../../src/lib/wizardState") as Record<string, unknown>;
  assert.equal(typeof wizardState.resetWizardForRetake, "function", "wizard state exports the retake reset");
  const current = {
    step: 3,
    picks: ["one", "two", "three", "four"],
    rank: ["content", "performance", "personality", "aesthetic"],
    answers: { q1: "stage" },
    archetype: { code: "aPsr", hiddenLayer: "content" },
    heroId: "two",
    fanName: "小星",
    song: { title: "Test", artist: "Singer", artworkUrl: "https://example.com/a.jpg" },
    issuedAt: "2026.07.13",
    serial: "1234",
  };
  const reset = (wizardState.resetWizardForRetake as Function)(current);
  assert.equal(reset.step, 2);
  assert.deepEqual(reset.rank, SCORE_LAYERS);
  assert.deepEqual(reset.answers, {});
  assert.equal(reset.archetype, undefined);
  assert.deepEqual(reset.picks, current.picks);
  assert.equal(reset.heroId, current.heroId);
  assert.equal(reset.fanName, current.fanName);
  assert.deepEqual(reset.song, current.song);
  assert.equal(reset.issuedAt, current.issuedAt);
  assert.equal(reset.serial, current.serial);

  const screens = buildScreens(summaries, SCORE_LAYERS);
  const answers = Object.fromEntries(screens.map((screen) => [
    screen.key,
    screen.kind === "question" ? screen.q.options[0].id : screen.kind === "confirm" ? "more" : "yes",
  ]));
  const markup = renderToStaticMarkup(createElement(
    StepQuiz as ComponentType<Record<string, unknown>>,
    {
      picks, summaries, rank: SCORE_LAYERS, answers,
      onRank: () => undefined,
      onAnswer: () => undefined,
      onRetake: () => undefined,
      onFinish: () => undefined,
    },
  ));
  assert.match(markup, /查看判定結果 →/, "completed state keeps its result action");
  assert.match(markup, /↻ 重做測驗/, "completed state exposes a retake action");

  console.log("step 2 retake contract verified");
}

void main();
```

- [x] **Step 2: Run the contract and verify RED**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step2-retake.test.tsx
```

Expected: FAIL at `wizard state exports the retake reset` because the helper is absent.

- [x] **Step 3: Implement the pure reset transform**

Add to `src/lib/wizardState.ts` after `saveWizard`:

```ts
export function resetWizardForRetake(state: WizardState): WizardState {
  return {
    ...state,
    step: 2,
    rank: [...SCORE_LAYERS],
    answers: {},
    archetype: undefined,
  };
}
```

Run the focused test again. Expected: it advances past the state assertions and fails because `↻ 重做測驗` is absent.

- [x] **Step 4: Add the completed-state retake action**

Add `onRetake: () => void` to `StepQuiz` props. In its complete-state branch, add a local handler through the secondary button:

```tsx
<button
  type="button"
  onClick={() => {
    onRetake();
    setRequestedIndex(null);
    setPhase("rank");
  }}
  className="text-xs font-bold text-[#7c8088] underline-offset-4 hover:text-[#1c1e24] hover:underline"
>
  ↻ 重做測驗
</button>
```

Place it after the existing `查看判定結果 →` button inside the completed-state `space-y-3` container.

- [x] **Step 5: Persist the reset from StartFlow**

Import `resetWizardForRetake` beside the existing wizard-state helpers. Pass this callback to `StepQuiz`:

```tsx
onRetake={() => {
  const reset = resetWizardForRetake(wiz);
  setQuizResult(null);
  setWiz(saveWizard(reset));
}}
```

Do not modify `picks` or any identity fields directly.

- [x] **Step 6: Verify GREEN and commit Task 1**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step2-retake.test.tsx
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/final-review.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
git add src/lib/wizardState.ts src/components/wizard/StepQuiz.tsx src/components/wizard/StartFlow.tsx docs/superpowers/plans/2026-07-13-wizard-retake-card-only-reveal.md
git add -f .superpowers/sdd/step2-retake.test.tsx
git commit -m "feat(wizard): allow completed quiz retake"
```

Expected: both scripts print verification messages, TypeScript exits 0, and the task commit succeeds.

---

### Task 2: Make Step 3 a story-first card-only reveal

**Files:**
- Modify: `.superpowers/sdd/step3-share-studio.test.tsx`
- Modify: `src/components/wizard/StepReveal.tsx`
- Modify: `docs/superpowers/plans/2026-07-13-wizard-retake-card-only-reveal.md`

**Interfaces:**
- `StepReveal` consumes `{ result: ArchetypeResult; reportAnswers?: ResultAnswers }`.
- `Step3ShareStudio` remains the one-preview boundary for `story` and `report`.
- The story and report export components are unchanged.

- [x] **Step 1: Rewrite the Step 3 contract for card-only rendering**

In `.superpowers/sdd/step3-share-studio.test.tsx`, replace the placement and label assertions after `defaultMarkup` with:

```tsx
const storyTabAt = defaultMarkup.indexOf(">限動卡</button>");
const reportTabAt = defaultMarkup.indexOf(">完整長圖</button>");
assert(storyTabAt >= 0 && storyTabAt < reportTabAt, "story is the left-hand first tab");
assert.match(defaultMarkup, /aria-selected="true"[^>]*>\s*限動卡\s*<\/button>/, "story remains selected by default");
assert.match(defaultMarkup, /aria-selected="false"[^>]*>\s*完整長圖\s*<\/button>/, "long image is the inactive right tab");
assert.doesNotMatch(defaultMarkup, /你的追星型別|速配同擔|互補型/, "standalone result summary is removed");
assert.match(defaultMarkup, /下載限動卡/, "story is the only default preview");
assert.doesNotMatch(defaultMarkup, /下載報告長圖/, "report is not stacked below story");
```

Keep the existing portrait-removal assertions. In the isolated `reportMarkup` assertions, add:

```tsx
assert.match(reportMarkup, /四層拆解/, "long image contains the layer report");
assert.match(reportMarkup, /你的答案/, "long image contains answer context");
assert.match(reportMarkup, /追星宇宙/, "long image contains discovery content");
```

- [x] **Step 2: Run the Step 3 contract and verify RED**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-share-studio.test.tsx
```

Expected: FAIL at `story is the left-hand first tab`, because `完整長圖` is currently first.

- [x] **Step 3: Simplify StepReveal to toggle plus selected card**

Replace `StepReveal.tsx` imports with:

```tsx
import { useState } from "react";
import type { ArchetypeResult } from "@/lib/archetypes";
import SoulStoryCard from "@/components/SoulStoryCard";
import SoulReport, { type ResultAnswers } from "@/components/SoulReport";
```

Remove the `onNext` prop, rarity/compatibility calculations, and the entire standalone summary markup. Keep `useState<ShareView>("story")`, render `限動卡` first and `完整長圖` second, then render `Step3ShareStudio`:

```tsx
return (
  <div className="wiz-develop flex flex-col items-center gap-4 py-4 text-center">
    <div role="tablist" aria-label="選擇分享內容" className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
      <button type="button" role="tab" aria-selected={shareView === "story"}
        onClick={() => setShareView("story")} className={shareView === "story" ? TAB_ACTIVE : TAB_INACTIVE}>
        限動卡
      </button>
      <button type="button" role="tab" aria-selected={shareView === "report"}
        onClick={() => setShareView("report")} className={shareView === "report" ? TAB_ACTIVE : TAB_INACTIVE}>
        完整長圖
      </button>
    </div>
    <Step3ShareStudio result={result} reportAnswers={reportAnswers} view={shareView} />
  </div>
);
```

Keep `Step3ShareStudio` unchanged.

- [x] **Step 4: Run focused and regression verification**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step2-retake.test.tsx
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-share-studio.test.tsx
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-report-answers.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/final-review.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
```

Expected: all four scripts print verification messages and TypeScript exits 0.

- [x] **Step 5: Verify both reported browser states**

At 555×779 with the existing localhost server:

- Step 2 completed state shows both actions;
- activating `↻ 重做測驗` returns to the priority-ranking screen;
- the same four selected idols remain in `kstar:wizard`;
- rank is reset to `SCORE_LAYERS`, answers are empty, and archetype is absent;
- Step 3 shows `限動卡 | 完整長圖`, story selected by default;
- no standalone summary appears;
- switching tabs replaces one portrait-free card with the other;
- download/share buttons remain present and are not activated;
- the browser console has no errors.

- [x] **Step 6: Run the production build**

```bash
env PATH=/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin /Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Expected: all 13 routes build successfully. If the sandbox blocks Google Fonts, rerun the identical command with network approval.

- [x] **Step 7: Commit Task 2**

```bash
git add src/components/wizard/StepReveal.tsx docs/superpowers/plans/2026-07-13-wizard-retake-card-only-reveal.md
git add -f .superpowers/sdd/step3-share-studio.test.tsx
git commit -m "fix(wizard): show selected result card only"
```
