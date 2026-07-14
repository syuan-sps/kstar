# Fan ID Card Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Balance the Fan ID archetype column and remove the issuing seal so no overlay covers the idol lineup.

**Architecture:** Keep `FanIdCard` as the single fixed-width export component. Change only the archetype presentation classes and remove the global absolute seal; protect both behaviors with static-render assertions in the existing Fan ID contract test.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 4 utility classes, Node `assert`, React server rendering, Next.js 16.

## Global Constraints

- Keep the fixed 328px export node, existing two-column top section, and current hero-image size.
- Preserve current typography, colors, card height, lineup dimensions, and export behavior.
- Remove the `發證中心鋼印` element completely; do not replace it.
- Keep the footer issuer text `KSTAR 發證中心` unchanged.
- Do not change artist selection, archetype calculation, rarity calculation, or export data.

---

### Task 1: Balance the archetype block and remove the seal

**Files:**
- Modify: `.superpowers/sdd/task-8-render.test.tsx:28-48`
- Modify: `src/components/FanIdCard.tsx:137-160,222-231`

**Interfaces:**
- Consumes: `FanIdCardProps` and the existing sample/production render fixtures.
- Produces: a `data-fanid-archetype="true"` layout contract whose class list contains `w-full`, `items-center`, and `text-center`; rendered cards contain no `發證中心鋼印` text.

- [x] **Step 1: Write the failing render assertions**

Replace the existing positive seal assertion and extend the production assertions:

```tsx
assert.doesNotMatch(sampleMarkup, /發證中心鋼印/, "sample mode omits the retired issuing seal");

assert.match(
  productionMarkup,
  /data-fanid-archetype="true" class="[^"]*w-full[^"]*items-center[^"]*text-center[^"]*"/,
  "production mode centers the archetype group across the full right column",
);
assert.doesNotMatch(productionMarkup, /發證中心鋼印/, "production mode omits the retired issuing seal");
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/task-8-render.test.tsx
```

Expected: FAIL because the sample still contains `發證中心鋼印`; after that assertion is reached, the new archetype layout contract would also be absent.

- [x] **Step 3: Implement the minimal card change**

Add a stable layout marker and center the existing archetype group without changing the top grid dimensions:

```tsx
<div
  data-fanid-archetype="true"
  className="flex min-w-0 w-full flex-col items-center justify-center gap-1.5 text-center"
>
  <span className="flex w-full justify-center font-orbitron text-[29px] font-black leading-none tracking-[0.06em]">
    {/* existing mixed-case code rendering */}
  </span>
  <span className="w-full text-[13px] font-black leading-tight">{result.archetype.zhName}</span>
  <span className="w-full font-orbitron text-[7.5px] font-bold leading-tight tracking-[0.08em] text-[#7c8088]">
    {result.archetype.enName}
  </span>
  <span className="max-w-full self-center whitespace-nowrap rounded-full border border-[#a8822f] bg-[#d8b45a]/10 px-2 py-0.5 font-mono text-[8px] font-bold text-[#a8822f]">
    ✦ {rarity.label}
  </span>
</div>
```

Delete the complete absolute `<span aria-label="發證中心鋼印">…</span>` block. Do not change the footer issuer line.

- [x] **Step 4: Run focused and regression tests and verify GREEN**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/task-8-render.test.tsx
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --import tsx .superpowers/sdd/final-review.test.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
```

Expected: both regression scripts print their verification messages and TypeScript exits 0 with no output.

- [x] **Step 5: Run the production build**

Run:

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Expected: Next.js reports a successful production build and exits 0.

- [x] **Step 6: Verify the live preview**

Reload `http://localhost:3100/start`, inspect the issued Fan ID at the active mobile viewport, and confirm:

- the archetype code and all three labels are horizontally balanced within the right column;
- no seal appears on any idol portrait;
- the hero, three lineup portraits, footer issuer text, barcode, and QR remain present.

- [x] **Step 7: Commit**

```bash
git add .superpowers/sdd/task-8-render.test.tsx src/components/FanIdCard.tsx docs/superpowers/plans/2026-07-13-fanid-card-balance.md
git commit -m "fix(fanid): balance archetype card layout"
```
