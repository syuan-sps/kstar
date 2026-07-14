# Soul Story Card Type Variations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 16 archetypes a family-related, code-specific decoration while preserving the light canonical Soul Story Card and its one shared export node.

**Architecture:** A pure helper maps `code`, `leadLayer`, and optional `missing` to a small decoration contract. `SoulStoryCard` renders this result only inside its existing fixed export node, so preview, PNG download, and native share cannot diverge.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, `tsx` verification scripts.

## Global Constraints

- Keep Figma frame `2:2` as the exact 270 x 480 layout source.
- Keep the light chrome card, translucent-white frequency panel, KSTAR typography, and existing export pipeline.
- Do not create a second export card, a dark panel, a coloured background, a new layout row, badges, or idol imagery.
- Restrict variation to edge colour, small motif, CTA, and active score-bar emphasis.

---

### Task 1: Add a pure 16-type decoration helper

**Files:**
- Create: `src/lib/storyCardDecor.ts`
- Create: `scripts/verify-story-card-decor.ts`

**Interfaces:**
- Consumes: `code`, `leadLayer`, and optional `missing` from `ArchetypeResult` / `Archetype`.
- Produces: `getStoryCardDecor(input): StoryCardDecor`.

- [x] **Step 1: Write the failing contract script**

Create `scripts/verify-story-card-decor.ts`:

```ts
import assert from "node:assert/strict";
import { ARCHETYPES } from "../src/lib/archetypes";
import { getStoryCardDecor } from "../src/lib/storyCardDecor";

const cases = [
  ["apsr", "aesthetic", "orbit", 0],
  ["Apsr", "aesthetic", "collector", 1],
  ["aPsr", "personality", "signal", 1],
  ["apSr", "performance", "stage", 1],
  ["apsR", "content", "archive", 1],
  ["APsr", "personality", "signal", 2],
  ["APSr", "personality", "orbit", 3],
  ["APSR", "performance", "orbit", 4],
] as const;

for (const [code, leadLayer, family, tier] of cases) {
  const decor = getStoryCardDecor({ code, leadLayer, missing: ARCHETYPES[code].missing });
  assert.equal(decor.family, family, code);
  assert.equal(decor.tier, tier, code);
  assert.match(decor.edgeColor, /^#[0-9a-f]{6}$/i, code);
}
assert.equal(getStoryCardDecor({ code: "APSr", leadLayer: "personality", missing: "content" }).ghostLayer, "content");
assert.equal(getStoryCardDecor({ code: "APSR", leadLayer: "performance" }).motif, "orbit-ring");
console.log("story-card decoration contract verified");
```

- [x] **Step 2: Verify that it fails**

Run: `env PATH=/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:/usr/bin:/bin pnpm exec tsx scripts/verify-story-card-decor.ts`

Expected: fail because `src/lib/storyCardDecor.ts` does not exist.

- [x] **Step 3: Implement the helper contract**

Create `src/lib/storyCardDecor.ts` exporting:

```ts
export type StoryCardFamily = "collector" | "signal" | "stage" | "archive" | "orbit";
export type StoryCardMotif = "flare" | "notch" | "spotlights" | "archive-dots" | "orbit-dots" | "orbit-ring";
export interface StoryCardDecor {
  family: StoryCardFamily;
  tier: 0 | 1 | 2 | 3 | 4;
  edgeColor: string;
  softColor: string;
  motif: StoryCardMotif;
  ghostLayer?: ScoreLayer;
}
export function getStoryCardDecor(input: { code: string; leadLayer: ScoreLayer; missing?: ScoreLayer }): StoryCardDecor;
```

Import `COLOR_STORIES` and `LEGEND_STORY` from `src/lib/archetypes.ts`. Count uppercase letters: tier 0 and tiers 3/4 use Orbit; tier 1/2 select Collector, Signal, Stage, or Archive from `leadLayer`; only tier 3 returns `ghostLayer`; only tier 4 returns `orbit-ring`.

- [x] **Step 4: Run the helper contract**

Run the Step 2 command. Expected output: `story-card decoration contract verified`.

- [x] **Step 5: Commit**

Run: `git add src/lib/storyCardDecor.ts scripts/verify-story-card-decor.ts && git commit -m "feat(card): add archetype decoration system"`.

### Task 2: Render decoration inside the existing export target

**Files:**
- Modify: `src/components/SoulStoryCard.tsx:8-108`
- Modify: `scripts/verify-story-card-decor.ts`

**Interfaces:**
- Consumes: `getStoryCardDecor({ code, leadLayer: result.leadLayer, missing: archetype.missing })`.
- Produces: family edge and motif variations inside the existing `ref={cardRef}` node.

- [x] **Step 1: Extend the failing render contract**

Append to `scripts/verify-story-card-decor.ts`:

```ts
import fs from "node:fs";
const source = fs.readFileSync("src/components/SoulStoryCard.tsx", "utf8");
assert.match(source, /getStoryCardDecor/);
assert.match(source, /data-story-card-motif/);
assert.match(source, /data-story-card-tier/);
assert.match(source, /ref={cardRef}/);
assert.match(source, /exportNode\(cardRef\.current/);
```

- [x] **Step 2: Verify that the render contract fails**

Run the Task 1 verification command. Expected: it fails because `SoulStoryCard` does not yet import `getStoryCardDecor`.

- [x] **Step 3: Integrate the decoration**

In `src/components/SoulStoryCard.tsx`, import `getStoryCardDecor`, derive it from `code`, `result.leadLayer`, and `archetype.missing`, and put `data-story-card-tier={decor.tier}` plus `data-story-card-motif={decor.motif}` on the existing 270 x 480 `cardRef` node. Use `decor.edgeColor` for the border, CTA, lower-right star, and active score bars. Add one absolute `pointer-events-none` motif in existing lower-right whitespace; use `flare`, `notch`, `spotlights`, `archive-dots`, `orbit-dots`, or `orbit-ring` text glyphs according to `decor.motif`. For tier 3 add one muted dot with `data-ghost-layer={decor.ghostLayer}`. Do not add a new card row.

- [x] **Step 4: Run verification and typecheck**

Run: `env PATH=/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:/usr/bin:/bin pnpm exec tsx scripts/verify-story-card-decor.ts`.

Run: `/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`.

Expected: decoration contract succeeds and TypeScript exits 0.

- [x] **Step 5: Check export parity and commit**

At `/start?step=3`, exercise Download and Share for `限動卡`; the preview and generated PNG must carry the same motif and edge. Then run: `git add src/components/SoulStoryCard.tsx scripts/verify-story-card-decor.ts && git commit -m "feat(card): vary story card by archetype"`.

### Task 3: Build verification and plan record

**Files:**
- Modify: `docs/superpowers/plans/2026-07-13-soul-story-card-type-variations.md`
- Test: Next.js production build

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: a production-checked implementation with no unrelated file changes.

- [x] **Step 1: Run the production build**

Run: `/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build`.

Expected: exit code 0.

- [x] **Step 2: Check scope and commit the plan**

Run: `git status --short && git log -3 --oneline`.

Expected: only this plan and Task 1/2 files are committed; leave all existing `* 2.*` untracked files untouched. Then run: `git add docs/superpowers/plans/2026-07-13-soul-story-card-type-variations.md && git commit -m "docs(plan): implement story card type variations"`.
