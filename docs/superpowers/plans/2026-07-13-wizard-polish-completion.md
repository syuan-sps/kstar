# Wizard Polish Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the empty bands from the 9:16 Story card and replace the segmented Step 1 camera animation with a smooth, continuous paper-feed transition.

**Architecture:** Keep both existing component interfaces intact. `SoulStoryCard` changes only its internal layout classes; `DevelopFourCuts` gains a printer-mouth wrapper and development overlay while its timing remains CSS-driven and `StartFlow` continues to advance through `onDone`.

**Tech Stack:** React 19, TypeScript 5, Next.js 16, Tailwind CSS 4, scoped CSS keyframes, Node assertions rendered with `tsx`.

## Global Constraints

- Preserve the Story export at exactly 270 × 480 pixels (9:16).
- Do not change the `完整長圖` report or add content to the Story card.
- Keep the camera-print transition near 4.2 seconds.
- Preserve the chrome camera, four real selected-idol images, fallback thumbnails, and `artists` / `onDone` interface.
- Use scoped CSS animations; do not add GSAP, Motion, or another dependency.
- Replace the full-stage flash with a localized, low-opacity printer-mouth exposure effect.
- Do not modify deferred P1/P2 features.

---

## File Structure

- Modify `src/components/SoulStoryCard.tsx`: three-row 9:16 Story-card layout.
- Create `.superpowers/sdd/story-card-spacing.test.tsx`: render-level Story-card layout contract.
- Modify `src/components/DevelopFourCuts.tsx`: printer-mouth clipping and development-overlay markup; 4.2-second completion timer.
- Modify `src/app/globals.css`: continuous feed, progressive development, localized exposure, settle, and fade-out keyframes.
- Create `.superpowers/sdd/smooth-camera-print.test.mjs`: source-level motion and timing contract.

### Task 1: Balance the 9:16 Story Card

**Files:**
- Create: `.superpowers/sdd/story-card-spacing.test.tsx`
- Modify: `src/components/SoulStoryCard.tsx:33-111`

**Interfaces:**
- Consumes: `SoulStoryCard({ result }: { result: ArchetypeResult }): JSX.Element`.
- Produces: the same export target and action controls, with a three-row grid and a flexible middle frequency panel.

- [ ] **Step 1: Write the failing layout contract**

Create `.superpowers/sdd/story-card-spacing.test.tsx`:

```tsx
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SoulStoryCard from "../../src/components/SoulStoryCard";
import { ARCHETYPES, type ArchetypeResult } from "../../src/lib/archetypes";

const result: ArchetypeResult = {
  code: "APsr",
  archetype: ARCHETYPES.APsr,
  leadLayer: "aesthetic",
  hiddenLayer: "personality",
  dualityLine: "test",
  colorStory: { accent: "#56789f", soft: "#a7c0dc", label: "test" },
  scores: { aesthetic: 80, personality: 72, performance: 30, content: 20 },
  bars: { aesthetic: 88, personality: 76, performance: 42, content: 31 },
  high: { aesthetic: true, personality: true, performance: false, content: false },
  highCount: 2,
};

const markup = renderToStaticMarkup(createElement(SoulStoryCard, { result }));
assert.match(markup, /grid-rows-\[auto_minmax\(120px\,1fr\)_auto\]/, "story export uses three explicit rows");
assert.match(markup, /items-stretch gap-4/, "story rows use a fixed compact gap");
assert.match(markup, /h-full[^\"]*justify-center/, "frequency panel absorbs and centers the flexible middle row");
assert.doesNotMatch(markup, /justify-between/, "remaining height is not redistributed into empty bands");
assert.match(markup, /height:480px/, "story export remains exactly 270 by 480");
assert.match(markup, /下載限動卡/, "download behavior remains present");
assert.match(markup, /分享/, "share behavior remains present");

console.log("story card spacing contract verified");
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/story-card-spacing.test.tsx
```

Expected: FAIL at `story export uses three explicit rows`, because the export target still uses flex with `justify-between`.

- [ ] **Step 3: Implement the three-row grid**

In `src/components/SoulStoryCard.tsx`, change the export target class to:

```tsx
className="relative grid w-[270px] grid-rows-[auto_minmax(120px,1fr)_auto] items-stretch gap-4 overflow-hidden rounded-[24px]"
```

Keep the inline `height: 480` and existing padding. Add `justify-self-center` to the top and bottom groups. Change the frequency-panel class to:

```tsx
className="flex h-full w-full flex-col justify-center rounded-[18px] border border-[#c8ccd2]/50 bg-white/55 px-3 py-4"
```

Do not change any content, export code, buttons, dimensions, colors, or the `SoulStoryCard` props.

- [ ] **Step 4: Run focused and existing Step 3 tests**

Run:

```bash
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/story-card-spacing.test.tsx
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/step3-share-studio.test.tsx
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/step3-report-answers.test.ts
```

Expected: all three commands exit 0 and print their verification messages.

- [ ] **Step 5: Commit Task 1**

```bash
git add .superpowers/sdd/story-card-spacing.test.tsx src/components/SoulStoryCard.tsx
git commit -m "fix(wizard): balance story card spacing"
```

### Task 2: Convert the Camera Animation to a Continuous Feed

**Files:**
- Create: `.superpowers/sdd/smooth-camera-print.test.mjs`
- Modify: `src/components/DevelopFourCuts.tsx:11-50`
- Modify: `src/app/globals.css:276-280,354-385`

**Interfaces:**
- Consumes: `DevelopFourCuts({ artists, onDone }: { artists: CardArtist[]; onDone: () => void }): JSX.Element`.
- Produces: the same callback contract, firing after 4,200 milliseconds; markup classes `.dev-output`, `.dev-mouth`, `.dev-develop-sweep`, and `.dev-exposure`; CSS timeline `strip-feed` + `paper-develop`.

- [ ] **Step 1: Write the failing motion contract**

Create `.superpowers/sdd/smooth-camera-print.test.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";

const component = fs.readFileSync("src/components/DevelopFourCuts.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

assert.match(component, /const DONE_MS = 4200;/, "handoff matches the 4.2 second motion timeline");
assert.match(component, /className="dev-output"/, "paper is clipped inside a dedicated printer output");
assert.match(component, /className="dev-mouth"/, "a fixed printer mouth anchors the paper feed");
assert.match(component, /className="dev-develop-sweep"/, "the moving paper carries a development overlay");
assert.match(component, /className="dev-exposure"/, "exposure is localized instead of stage-wide");
assert.doesNotMatch(component, /className="dev-flash"/, "the full-stage flash is removed");

assert.match(css, /@keyframes strip-feed/, "CSS defines one continuous paper feed");
assert.match(css, /@keyframes paper-develop/, "CSS defines progressive image development");
assert.match(css, /@keyframes print-exposure/, "CSS defines localized printer-mouth exposure");
assert.match(css, /@keyframes dev-stage-out/, "the completed print exits without a dead pause");
assert.match(css, /\.dev-output\s*\{[^}]*overflow:\s*hidden/s, "printer output clips the moving strip");
assert.match(css, /\.dev-strip\s*\{[^}]*animation:\s*strip-feed\s+2\.35s/s, "the strip advances as one continuous action");
assert.match(css, /\.dev-develop-sweep\s*\{[^}]*animation:\s*paper-develop/s, "development travels across the paper");
assert.doesNotMatch(css, /\.dev-flash\s*\{/, "obsolete full-stage flash styling is removed");

console.log("smooth camera print contract verified");
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node .superpowers/sdd/smooth-camera-print.test.mjs
```

Expected: FAIL at `handoff matches the 4.2 second motion timeline`, because `DONE_MS` is still 4,400 and continuous-feed markup is absent.

- [ ] **Step 3: Add the printer-output markup and align timing**

In `src/components/DevelopFourCuts.tsx`:

```tsx
const DONE_MS = 4200;
```

Replace the standalone `.dev-strip` and `.dev-flash` siblings with:

```tsx
<div className="dev-output">
  <div className="dev-strip">
    <div className="dev-grid">
      {artists.slice(0, 4).map((a, i) => (
        <div key={a.id} className={`dev-cut dev-cut${i}`}>
          <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-md" focusY={a.image_focus} />
        </div>
      ))}
    </div>
    <div className="dev-cap">✦ KSTAR · 2026 ✦</div>
    <span className="dev-develop-sweep" />
  </div>
</div>
<div className="dev-mouth" />
<div className="dev-exposure" />
```

Keep `.dev-cam` unchanged and update the component comments from 3.5/4.4 seconds to 4.2 seconds.

- [ ] **Step 4: Implement the continuous CSS timeline**

In `src/app/globals.css`, replace `strip-print` with these scoped keyframes:

```css
@keyframes strip-feed {
  0%   { transform: translate(-50%, -188px); }
  82%  { transform: translate(-50%, 2px); }
  100% { transform: translate(-50%, 0); }
}
@keyframes paper-develop {
  0%   { transform: translateY(-115%); opacity: .92; }
  72%  { opacity: .72; }
  100% { transform: translateY(115%); opacity: 0; }
}
@keyframes print-exposure {
  0%,100% { opacity: 0; transform: translateX(-50%) scaleX(.72); }
  42%     { opacity: .58; transform: translateX(-50%) scaleX(1); }
}
@keyframes dev-stage-out {
  0%,86% { opacity: 1; transform: translateY(0); }
  100%   { opacity: 0; transform: translateY(-4px); }
}
```

Update the scoped motion block to use this structure and timing:

```css
.dev-stage {
  position: relative;
  width: 250px;
  height: 320px;
  animation: dev-stage-out 4.2s var(--ease-soft) both;
}
.dev-output {
  position: absolute;
  left: 50%;
  top: 104px;
  z-index: 1;
  width: 168px;
  height: 216px;
  transform: translateX(-50%);
  overflow: hidden;
}
.dev-strip {
  position: absolute;
  left: 50%;
  top: 2px;
  width: 150px;
  transform: translate(-50%, -188px);
  background: linear-gradient(180deg, #fff, #eef0f3);
  border: 1px solid #d3d7dd;
  border-radius: 0 0 14px 14px;
  padding: 9px 9px 7px;
  box-shadow: 5px 7px 0 rgba(124,128,136,.28), 0 10px 26px rgba(124,128,136,.26);
  animation: strip-feed 2.35s cubic-bezier(.22,.72,.2,1) .55s both;
}
.dev-mouth {
  position: absolute;
  left: 50%;
  top: 101px;
  z-index: 4;
  width: 132px;
  height: 9px;
  transform: translateX(-50%);
  border-radius: 0 0 8px 8px;
  background: linear-gradient(180deg, #5e636d, #1c1e24 55%, #9aa0aa);
  box-shadow: 0 2px 3px rgba(28,30,36,.35), inset 0 1px rgba(255,255,255,.3);
}
.dev-develop-sweep {
  position: absolute;
  inset: -4px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(238,243,249,.82) 42%, rgba(255,255,255,0) 68%);
  mix-blend-mode: screen;
  animation: paper-develop 2.4s cubic-bezier(.3,.1,.2,1) .72s both;
}
.dev-exposure {
  position: absolute;
  left: 50%;
  top: 99px;
  z-index: 5;
  width: 156px;
  height: 20px;
  transform: translateX(-50%);
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(ellipse, rgba(255,255,255,.95), rgba(210,225,242,.32) 52%, transparent 75%);
  animation: print-exposure .62s var(--ease-soft) .48s both;
}
```

Change `.dev-cut` to use overlapping progressive development:

```css
.dev-cut {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
  animation: cut-develop 1.15s var(--ease-out-expo) both;
}
.dev-cut0 { animation-delay: .85s; }
.dev-cut1 { animation-delay: 1.05s; }
.dev-cut2 { animation-delay: 1.35s; }
.dev-cut3 { animation-delay: 1.55s; }
```

Remove the old `.dev-flash` rule and old `strip-print` keyframes. Keep camera entrance, recording light, lens glint, grid, and caption styles.

- [ ] **Step 5: Run motion and wizard tests**

Run:

```bash
node .superpowers/sdd/smooth-camera-print.test.mjs
node .superpowers/sdd/task-6.test.mjs
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/final-review.test.ts
node node_modules/typescript/bin/tsc --noEmit
```

Expected: all commands exit 0; motion contract, picker transition, final review, and TypeScript validation pass.

- [ ] **Step 6: Visually verify real motion and Story export**

At `http://localhost:3100/start?step=1`, preserve four picks and trigger Next. Capture frames around 0.7, 1.4, 2.1, 2.8, and 3.7 seconds. Confirm:

- the camera remains fixed;
- the strip advances continuously from the mouth;
- the exposure remains localized;
- photo development overlaps the feed;
- the complete strip holds briefly, then transitions without a dead pause;
- Step 2 appears after the final development pass.

At `http://localhost:3100/start?step=3`, verify both mobile and desktop previews, download the `限動卡`, and confirm the PNG remains 9:16 with compact top/panel/footer spacing.

- [ ] **Step 7: Run the production build**

Run:

```bash
npm run build
```

Expected: Next.js production build completes successfully with no type or compilation errors.

- [ ] **Step 8: Commit Task 2**

```bash
git add .superpowers/sdd/smooth-camera-print.test.mjs src/components/DevelopFourCuts.tsx src/app/globals.css
git commit -m "feat(wizard): smooth camera print flow"
```

## Final Verification

Run:

```bash
git status --short
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/story-card-spacing.test.tsx
node .superpowers/sdd/smooth-camera-print.test.mjs
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/step3-share-studio.test.tsx
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/step3-report-answers.test.ts
node .superpowers/sdd/task-6.test.mjs
node node_modules/tsx/dist/cli.mjs .superpowers/sdd/final-review.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Expected: clean working tree after the two task commits and every verification command passes.
