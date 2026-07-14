# Soul Story Card Figma Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the approved Figma Soul Story Card spacing by replacing the stretched middle area with a fixed compact frequency panel.

**Architecture:** Keep the existing one-node `cardRef` export pipeline and 16-type decoration helper. Change only the card's internal vertical layout from a CSS grid with a flexible middle row to a fixed vertical stack whose panel has explicit Figma dimensions.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, `tsx` verification script.

## Global Constraints

- Preserve the 270 × 480 fixed card and `ref={cardRef}` export node.
- Keep preview, PNG download, and native share on this one DOM node.
- Use a centred 210 × 115 compact translucent-white frequency panel.
- Do not use `grid-rows-[auto_minmax(120px,1fr)_auto]`, a flexible `1fr` middle row, or `h-full` on the panel.
- Preserve the approved 16-type decoration behavior; it may not alter card geometry.
- Leave existing unrelated `* 2.*` untracked files untouched.

---

### Task 1: Lock the card to the Figma spacing contract

**Files:**
- Modify: `scripts/verify-story-card-decor.ts:27-34`
- Modify: `src/components/SoulStoryCard.tsx:52-132`

**Interfaces:**
- Consumes: `SoulStoryCard`'s existing `cardRef`, decoration attributes, bars, and CTA.
- Produces: one 270 × 480 export node with a fixed-size 210 × 115 frequency panel and no flexible middle layout.

- [x] **Step 1: Extend the failing source contract**

Append these assertions after the existing export assertions in `scripts/verify-story-card-decor.ts`:

```ts
assert.doesNotMatch(source, /grid-rows-\[auto_minmax\(120px,1fr\)_auto\]/);
assert.doesNotMatch(source, /className="flex h-full w-full flex-col justify-center rounded-\[18px\]/);
assert.match(source, /h-\[115px\] w-\[210px\]/);
assert.match(source, /flex w-\[270px\] flex-col items-center gap-\[30px\]/);
assert.match(source, /padding: "50px 18px 22px"/);
```

- [x] **Step 2: Verify that the layout contract fails**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/tsx/dist/cli.mjs scripts/verify-story-card-decor.ts
```

Expected: assertion failure on the existing flexible `grid-rows-[auto_minmax(120px,1fr)_auto]` layout.

- [x] **Step 3: Implement the fixed vertical composition**

In `src/components/SoulStoryCard.tsx`:

```tsx
className="relative flex w-[270px] flex-col items-center gap-[30px] overflow-hidden rounded-[24px]"
```

Keep the existing inline card style, identity stack, and footer. Set its measured Figma padding to `"50px 18px 22px"`. Replace the middle panel with:

```tsx
<div className="flex h-[115px] w-[210px] shrink-0 flex-col justify-center rounded-[18px] border border-[#c8ccd2]/50 bg-white/55 px-3 py-3">
```

Change the identity stack's `justify-self-center` to its flex-compatible `items-center` form and change the footer's `justify-self-center` to `shrink-0`. Do not alter the motif/ghost attributes, bar data, or export code.

- [x] **Step 4: Run contract and compiler checks**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/tsx/dist/cli.mjs scripts/verify-story-card-decor.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
```

Expected: contract prints `story-card decoration contract verified`; TypeScript exits 0.

- [x] **Step 5: Visually inspect and commit**

Open `http://localhost:3100/start?step=3`. Confirm the frequency panel is compact (not a lower-half white block), the surrounding space is light card background, and the footer sits below it. Then run:

```bash
git add src/components/SoulStoryCard.tsx scripts/verify-story-card-decor.ts
git commit -m "fix(card): match Figma story spacing"
```

### Task 2: Production verification and plan record

**Files:**
- Modify: `docs/superpowers/plans/2026-07-14-soul-story-card-figma-spacing.md`
- Test: Next.js production build

**Interfaces:**
- Consumes: the fixed-layout card.
- Produces: a production-verified implementation record.

- [x] **Step 1: Run production build**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Expected: exit code 0.

- [x] **Step 2: Mark plan complete and commit it**

Replace each task checkbox in this plan with `- [x]`, then run:

```bash
git add docs/superpowers/plans/2026-07-14-soul-story-card-figma-spacing.md
git commit -m "docs(plan): align story card spacing"
```
