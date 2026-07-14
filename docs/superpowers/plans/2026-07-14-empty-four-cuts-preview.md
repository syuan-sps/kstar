# Empty Four Cuts Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty homepage’s sparse four-cuts prompt with a responsive fan-ID preview containing four anonymous silhouettes and the existing picker CTA.

**Architecture:** `EmptyFourCutsPreview` is a self-contained presentational component that receives one `onStart` callback. `MyFourCuts` continues to own localStorage and wizard navigation, and renders the preview only when fewer than four saved IDs resolve to artists.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Node `assert` source verifier.

## Global Constraints

- Use CSS-only silhouettes: exactly two feminine and two masculine; no real faces, images, idol names, or `示意` text.
- Keep the populated `FourCuts` state and saved preference schema unchanged.
- Keep `repick()` as the sole navigation implementation, preserving saved partial picks.
- The preview is display-only and must not add download or share behavior.
- Do not alter the unrelated untracked `* 2.*` files.

---

### Task 1: Build the isolated empty-state fan-ID preview

**Files:**

- Create: `src/components/EmptyFourCutsPreview.tsx`
- Create: `scripts/verify-empty-four-cuts-preview.ts`

**Interfaces:**

- Consumes: `onStart: () => void` supplied by `MyFourCuts`.
- Produces: `EmptyFourCutsPreview({ onStart, className? })`, a responsive display-only presentation and semantic start button.

- [ ] **Step 1: Write the failing source-contract verifier**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("src/components/EmptyFourCutsPreview.tsx", "utf8");
assert.match(source, /export default function EmptyFourCutsPreview/);
assert.match(source, /const silhouettes = \["feminine", "masculine", "feminine", "masculine"\]/);
assert.match(source, /aria-hidden="true"/);
assert.match(source, />你的追星型別</);
assert.match(source, />等待判定</);
assert.match(source, />開始建立追星檔案</);
assert.doesNotMatch(source, /示意/);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/tsx/dist/cli.mjs scripts/verify-empty-four-cuts-preview.ts`

Expected: failure because `src/components/EmptyFourCutsPreview.tsx` does not exist.

- [ ] **Step 3: Write the minimal preview component**

```tsx
"use client";
const silhouettes = ["feminine", "masculine", "feminine", "masculine"] as const;
export default function EmptyFourCutsPreview({ onStart, className = "" }: { onStart: () => void; className?: string }) {
  return <section className={`flex flex-col items-center ${className}`}><p>KStar 發證中心</p><div>{silhouettes.map((variant, index) => <Silhouette key={index} variant={variant} lead={index === 0} />)}<p>你的追星型別</p><strong>等待判定</strong></div><button type="button" onClick={onStart}>開始建立追星檔案</button></section>;
}
```

Add a private `Silhouette` helper with `aria-hidden="true"`, neutral CSS head/hair/shoulder shapes, one large lead tile, and three smaller tiles. Add subdued decorative barcode, QR-style, and frequency elements. Do not introduce image assets.

- [ ] **Step 4: Run the verifier to verify it passes**

Run: `/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/tsx/dist/cli.mjs scripts/verify-empty-four-cuts-preview.ts`

Expected: exit code 0 and `empty four cuts preview contract verified`.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/components/EmptyFourCutsPreview.tsx scripts/verify-empty-four-cuts-preview.ts
git commit -m "feat(home): add empty four cuts preview"
```

### Task 2: Replace the sparse state while preserving navigation

**Files:**

- Modify: `src/components/MyFourCuts.tsx:8,89-103`
- Modify: `scripts/verify-empty-four-cuts-preview.ts`

**Interfaces:**

- Consumes: `EmptyFourCutsPreview({ onStart, className? })` from Task 1.
- Produces: `MyFourCuts` renders the preview only if `artists.length !== 4`, passing `repick` unchanged.

- [ ] **Step 1: Extend the failing verifier for integration**

```ts
const myFourCuts = fs.readFileSync("src/components/MyFourCuts.tsx", "utf8");
assert.match(myFourCuts, /import EmptyFourCutsPreview from "@\/components\/EmptyFourCutsPreview"/);
assert.match(myFourCuts, /if \(artists\.length !== 4\)[\s\S]*<EmptyFourCutsPreview onStart={repick} className={className} \/>/);
assert.doesNotMatch(myFourCuts, /還沒選出你的 TOP 4/);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/tsx/dist/cli.mjs scripts/verify-empty-four-cuts-preview.ts`

Expected: integration assertion failure because `MyFourCuts` has not imported or rendered the preview.

- [ ] **Step 3: Make the minimal integration change**

```tsx
import EmptyFourCutsPreview from "@/components/EmptyFourCutsPreview";
if (artists.length !== 4) return <EmptyFourCutsPreview onStart={repick} className={className} />;
```

Remove only the old empty-state heading, helper copy, and direct button. Keep `repick()` unchanged.

- [ ] **Step 4: Run the complete verification suite**

```bash
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/tsx/dist/cli.mjs scripts/verify-empty-four-cuts-preview.ts
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/work/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Expected: verifier and TypeScript exit 0; production build completes successfully.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/MyFourCuts.tsx scripts/verify-empty-four-cuts-preview.ts
git commit -m "feat(home): replace empty four cuts prompt"
```
