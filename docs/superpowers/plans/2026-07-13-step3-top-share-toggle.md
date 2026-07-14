# Step 3 Top Share Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Step 3 export-format toggle above the result summary, rename it to `完整長圖` / `限動卡`, and remove all selected-idol content from both downloadable cards.

**Architecture:** Keep `StepReveal` as the owner of the `story` / `report` selection and render its accessible tablist before the result summary. Reduce `Step3ShareStudio` to selected-preview rendering, remove the now-unused `picks` data path from Step 3, and preserve the existing `exportNode` actions inside the two export components.

**Tech Stack:** React 19, TypeScript 5, Next.js 16, Tailwind CSS 4, Node `assert`, React server rendering, existing `html-to-image` export helper.

## Global Constraints

- The tab labels, in DOM and visual order, are exactly `完整長圖` then `限動卡`.
- `限動卡` remains selected by default.
- The tablist appears below the wizard stepper and before `你的追星型別`.
- The result summary remains visible and the selected export preview remains below the summary.
- Exactly one export preview is rendered at a time.
- Neither export contains idol portraits, idol names, or replacement idol chips.
- Preserve the current export sizes, filenames, download/share actions, and native-share fallback behavior.
- Do not change Step 4 or the Fan ID card.

---

### Task 1: Reposition the format control and make both exports archetype-only

**Files:**
- Modify: `.superpowers/sdd/step3-share-studio.test.tsx`
- Modify: `src/components/wizard/StepReveal.tsx`
- Modify: `src/components/wizard/StartFlow.tsx`
- Modify: `src/components/SoulStoryCard.tsx`
- Modify: `src/components/SoulReport.tsx`
- Modify: `src/components/TastePortraitCard.tsx`
- Modify: `docs/superpowers/plans/2026-07-13-step3-top-share-toggle.md`

**Interfaces:**
- `StepReveal` consumes `{ result: ArchetypeResult; reportAnswers?: ResultAnswers; onNext?: () => void }`.
- `Step3ShareStudio` consumes `{ result: ArchetypeResult; reportAnswers?: ResultAnswers; view: "story" | "report" }` and renders one export.
- `SoulStoryCard` consumes `{ result: ArchetypeResult }`.
- `SoulReport` consumes `{ result: ArchetypeResult; answers?: ResultAnswers }`.
- `StartFlow` continues to derive `selectedArtists` for Steps 1, 2, and 4 but does not pass them into Step 3.
- `TastePortraitCard` keeps `picks` for its Fan ID view but does not pass them into story or report exports.

- [x] **Step 1: Rewrite the Step 3 render contract for the approved layout**

In `.superpowers/sdd/step3-share-studio.test.tsx`, keep the existing `result`, four-item `picks`, and `reportAnswers` fixtures so the test proves legacy idol input is not rendered. Replace `main()` with:

```tsx
async function main() {
  const defaultMarkup = renderToStaticMarkup(createElement(
    StepReveal as ComponentType<Record<string, unknown>>,
    { result, picks, reportAnswers },
  ));

  const tabsAt = defaultMarkup.indexOf('aria-label="選擇分享內容"');
  const summaryAt = defaultMarkup.indexOf("你的追星型別");
  assert(tabsAt >= 0 && tabsAt < summaryAt, "format tabs render before the result summary");
  assert.match(defaultMarkup, />完整長圖<\/button>/, "long-image tab uses the approved label");
  assert.match(defaultMarkup, />限動卡<\/button>/, "story tab uses the approved label");
  assert.doesNotMatch(defaultMarkup, /完整追星報告|限動卡 9:16/, "superseded labels are removed");
  assert.match(defaultMarkup, /aria-selected="false"[^>]*>\s*完整長圖\s*<\/button>/, "long image is the inactive first tab");
  assert.match(defaultMarkup, /aria-selected="true"[^>]*>\s*限動卡\s*<\/button>/, "story remains selected by default");
  assert.match(defaultMarkup, /下載限動卡/, "story is the default downloadable view");
  assert.doesNotMatch(defaultMarkup, /下載報告長圖/, "inactive report is not stacked below the story");
  assert.equal((defaultMarkup.match(/data-share-idol=/g) ?? []).length, 0, "story contains no idol cards");
  for (const name of ["One", "Two", "Three", "Four"]) assert.doesNotMatch(defaultMarkup, new RegExp(`>${name}<`));

  const revealModule = await import("../../src/components/wizard/StepReveal") as Record<string, unknown>;
  const reportMarkup = renderToStaticMarkup(createElement(
    revealModule.Step3ShareStudio as ComponentType<Record<string, unknown>>,
    { result, picks, reportAnswers, view: "report" },
  ));
  assert.match(reportMarkup, /下載報告長圖/, "report view remains downloadable");
  assert.doesNotMatch(reportMarkup, /下載限動卡/, "report replaces rather than stacks with story");
  assert.equal((reportMarkup.match(/data-share-idol=/g) ?? []).length, 0, "report contains no idol cards");
  for (const name of ["One", "Two", "Three", "Four"]) assert.doesNotMatch(reportMarkup, new RegExp(`>${name}<`));

  console.log("step 3 top share toggle render contract verified");
}
```

- [x] **Step 2: Run the contract and verify RED**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-share-studio.test.tsx
```

Expected: FAIL at `format tabs render before the result summary`, because the current tablist is below the summary.

- [x] **Step 3: Render the accessible format tabs above the summary**

In `StepReveal.tsx`, remove the `CardArtist` import and `picks` prop. Immediately inside the outer `wiz-develop` div, before `你的追星型別`, render:

```tsx
<div role="tablist" aria-label="選擇分享內容" className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5">
  <button
    type="button"
    role="tab"
    aria-selected={shareView === "report"}
    onClick={() => setShareView("report")}
    className={shareView === "report" ? TAB_ACTIVE : TAB_INACTIVE}
  >
    完整長圖
  </button>
  <button
    type="button"
    role="tab"
    aria-selected={shareView === "story"}
    onClick={() => setShareView("story")}
    className={shareView === "story" ? TAB_ACTIVE : TAB_INACTIVE}
  >
    限動卡
  </button>
</div>
```

Keep `useState<ShareView>("story")`. Remove `picks` and `onViewChange` from the `Step3ShareStudio` call and signature. Reduce its returned markup to:

```tsx
<section className="mt-3 flex w-full flex-col items-center gap-4" aria-label="分享追星結果">
  {view === "story"
    ? <SoulStoryCard result={result} />
    : <SoulReport result={result} answers={reportAnswers} />}
</section>
```

- [x] **Step 4: Remove the Step 3 idol-data path**

In `StartFlow.tsx`, update the Step 3 render to omit `picks`:

```tsx
<StepReveal
  result={quizResult}
  reportAnswers={reportAnswers}
/>
```

Do not change the `selectedArtists` derivation or its use in Steps 1, 2, and 4.

In `TastePortraitCard.tsx`, keep its `picks` prop for the Fan ID view, but update the two shared export calls:

```tsx
<SoulStoryCard result={result} />
<SoulReport result={result} answers={answers} />
```

- [x] **Step 5: Remove idol content from the story export and rebalance its middle**

In `SoulStoryCard.tsx`:

- remove `CardArtist`, `Thumb`, `MiniPhotoCard`, and the `picks` prop;
- change the component signature to `SoulStoryCard({ result }: { result: ArchetypeResult })`;
- replace the portrait-grid-plus-bars middle block with this archetype-only frequency panel:

```tsx
<div className="w-full rounded-[18px] border border-[#c8ccd2]/50 bg-white/55 px-3 py-4">
  <div className="text-center font-orbitron text-[9px] font-bold tracking-[0.22em] text-[#7c8088]">你的追星頻率</div>
  <div className="mt-4 grid grid-cols-4 gap-2">
    {SCORE_LAYERS.map((L) => (
      <div key={L}>
        <div className="h-2 overflow-hidden rounded-full bg-[#7c8088]/15">
          <div className="h-full rounded-full" style={{ width: `${Math.max(8, bars[L])}%`, backgroundColor: high[L] ? LAYER_COLOR[L] : "#c8ccd2" }} />
        </div>
        <div className="mt-1.5 text-center text-[9px]" style={{ color: high[L] ? "#1c1e24" : "#9aa0aa", fontWeight: high[L] ? 700 : 400 }}>
          {LAYER_ZH[L]}
        </div>
      </div>
    ))}
  </div>
</div>
```

Keep the 270×480 export target, identity block, CTA, `run`, filename, pixel ratio, and action buttons unchanged.

- [x] **Step 6: Remove idol content from the complete report**

In `SoulReport.tsx`:

- remove the `CardArtist` and `MiniPhotoCard` imports;
- change the component signature to accept only `result` and `answers`;
- delete the `代表偶像` portrait-grid block so `SectionHeader label={copy.reportLayers}` follows the hero tagline directly.

Do not change the analysis sections, `run`, filename, pixel ratio, or action buttons.

- [x] **Step 7: Run focused verification and verify GREEN**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-share-studio.test.tsx
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/step3-report-answers.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/final-review.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
```

Expected: the three scripts print their verification messages and TypeScript exits 0.

- [x] **Step 8: Verify the reported mobile viewport**

At `http://localhost:3100/start?step=3` and 555×779:

- confirm `完整長圖 | 限動卡` appears directly under the stepper and above `你的追星型別`;
- confirm `限動卡` is selected by default;
- confirm the summary remains visible below the toggle;
- confirm the story preview contains no idol portraits or names and remains visually balanced;
- switch to `完整長圖` and confirm it replaces the story, contains no idol portraits or names, and still exposes download/share actions;
- do not activate download/share during verification;
- confirm the browser console has no errors.

- [x] **Step 9: Run the production build**

Run:

```bash
env PATH=/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin /Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Expected: all 13 routes build successfully. If the sandbox blocks Google Fonts, rerun the identical command with network approval.

- [x] **Step 10: Commit the implementation**

```bash
git add src/components/SoulStoryCard.tsx src/components/SoulReport.tsx src/components/TastePortraitCard.tsx src/components/wizard/StepReveal.tsx src/components/wizard/StartFlow.tsx docs/superpowers/plans/2026-07-13-step3-top-share-toggle.md
git add -f .superpowers/sdd/step3-share-studio.test.tsx
git commit -m "fix(wizard): move share toggle above result"
```
