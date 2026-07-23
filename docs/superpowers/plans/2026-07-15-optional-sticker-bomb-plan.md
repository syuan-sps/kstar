# Optional Sticker-Bomb Card Decoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, optional, theme-specific SVG sticker-bomb layer to the Fan ID card without covering portraits or card information.

**Architecture:** Keep sticker geometry and theme composition data in a pure `src/lib/fanIdStickers.ts` module, render it through a focused `FanIdStickerLayer` SVG component, and pass the persisted preference/theme/layout state from `WizardState` through `StepIssue` into `FanIdCard`. `FanIdCard` intentionally mounts two controlled SVG roots — an `under-content` pass below protected content and an `over-portrait` pass reserved for approved portrait-edge accents — so all three card layouts share deterministic, export-safe decoration without collapsing protected z-order.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, `tsx` for small pure-module checks, and the existing `html-to-image` export path.

## Global Constraints

- `stickersEnabled` defaults to `false` for older saved wizard state.
- The feature is one automatic on/off control; there is no manual dragging, rotation, randomization, density slider, marketplace, or paid tier.
- The runtime must not depend on the broken raster sticker crops in `public/fanid-themes/`.
- Use inline SVG/React SVG primitives with `aria-hidden="true"`; no rectangular raster crops or white-fringe assets.
- The sticker contract is exactly two named SVG passes in `FanIdCard`; export must preserve their z-order.
- Large pieces may overlap portrait edges by approximately 8–14px, but face, archetype data, score bars, holder identity, barcode, QR code, and issue date are protected.
- Preview and downloaded PNG must use the same static DOM composition.
- Verify desktop and narrow mobile widths, all four themes, and all three card layouts.
- Preserve unrelated dirty worktree changes; only stage files belonging to this feature.

---

### Task 1: Create the pure sticker composition model and red tests

**Files:**
- Create: `src/lib/fanIdStickers.ts`
- Create: `scripts/test-fanid-stickers.ts`

**Interfaces:**
- Produces `type StickerThemeId = "chrome" | "dreamy" | "kawaii" | "monochrome-cute"`.
- Produces `type StickerKind = "heart" | "star" | "bow" | "moon" | "cloud" | "pearl" | "sparkle" | "chain" | "butterfly" | "flower" | "cat" | "ghost" | "safety-pin"`.
- Produces `interface StickerPlacement { id: string; kind: StickerKind; x: number; y: number; size: number; rotate: number; zone: "header" | "portrait-edge" | "archetype-edge" | "certificate-edge"; layer: "under-content" | "over-portrait"; tone?: string }`.
- Produces `const STICKER_COMPOSITIONS: Record<StickerThemeId, StickerPlacement[]>`.
- Produces `function getStickerComposition(themeId?: string | null): StickerPlacement[]`.

- [ ] **Step 1: Write the failing test**

Create a small executable assertion script using Node's built-in `assert` module. It should fail because the module does not exist yet:

```ts
import assert from "node:assert/strict";
import { getStickerComposition, STICKER_THEME_IDS } from "@/lib/fanIdStickers";

for (const themeId of STICKER_THEME_IDS) {
  const placements = getStickerComposition(themeId);
  assert.equal(placements.length >= 10 && placements.length <= 14, true, `${themeId} density`);
  assert.equal(new Set(placements.map((item) => item.id)).size, placements.length, `${themeId} ids`);
  for (const item of placements) {
    assert.equal(item.x >= 0 && item.x <= 100, true, `${themeId}:${item.id} x`);
    assert.equal(item.y >= 0 && item.y <= 100, true, `${themeId}:${item.id} y`);
    assert.equal(item.size > 0 && item.size <= 20, true, `${themeId}:${item.id} size`);
  }
}

assert.deepEqual(getStickerComposition("missing-theme"), getStickerComposition("chrome"));
assert.equal(getStickerComposition(null).length, getStickerComposition("chrome").length);
console.log("fanid sticker composition checks passed");
```

Run: `npx tsx scripts/test-fanid-stickers.ts`

Expected: FAIL because `src/lib/fanIdStickers.ts` has not been created.

- [ ] **Step 2: Add the minimal model and four deterministic compositions**

Implement the exported types, theme IDs, fallback function, and 10–14 placements per theme. Use normalized percentage coordinates. Keep certificate placements at the outer edge only and do not place any large decorative item in the center content area.

Use these composition anchors so the safety intent is encoded in data rather than left to visual guesswork:

```ts
const chrome: StickerPlacement[] = [
  { id: "chrome-heart-top", kind: "heart", x: 7, y: 9, size: 12, rotate: -12, zone: "header", layer: "under-content" },
  { id: "chrome-star-portrait", kind: "star", x: 93, y: 25, size: 16, rotate: 14, zone: "portrait-edge", layer: "over-portrait" },
  { id: "chrome-chain-right", kind: "chain", x: 97, y: 42, size: 11, rotate: 8, zone: "portrait-edge", layer: "over-portrait" },
  { id: "chrome-safety-pin", kind: "safety-pin", x: 4, y: 48, size: 13, rotate: -18, zone: "portrait-edge", layer: "under-content" },
  { id: "chrome-star-bottom", kind: "star", x: 8, y: 66, size: 13, rotate: -8, zone: "portrait-edge", layer: "under-content" },
  { id: "chrome-heart-bottom", kind: "heart", x: 91, y: 68, size: 15, rotate: 10, zone: "portrait-edge", layer: "under-content" },
  { id: "chrome-pearl-a", kind: "pearl", x: 4, y: 78, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
  { id: "chrome-pearl-b", kind: "pearl", x: 96, y: 80, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
  { id: "chrome-sparkle-a", kind: "sparkle", x: 12, y: 87, size: 7, rotate: 0, zone: "certificate-edge", layer: "under-content" },
  { id: "chrome-star-certificate", kind: "star", x: 89, y: 93, size: 10, rotate: 8, zone: "certificate-edge", layer: "under-content" },
];
```

Adapt the anchors for Dreamy, Kawaii, and Mono Cute with the theme vocabularies from the approved spec. Do not add actual SVG rendering in this task.

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx tsx scripts/test-fanid-stickers.ts`

Expected: PASS with `fanid sticker composition checks passed`.

- [ ] **Step 4: Commit the pure model**

```bash
git add src/lib/fanIdStickers.ts scripts/test-fanid-stickers.ts
git commit -m "feat: define deterministic fan id sticker compositions"
```

### Task 2: Add the SVG sticker renderer

**Files:**
- Create: `src/components/FanIdStickerLayer.tsx`
- Modify: `src/lib/fanIdStickers.ts`

**Interfaces:**
- Consumes `getStickerComposition(themeId)` from Task 1.
- Produces `FanIdStickerLayer({ themeId, enabled }: { themeId?: string | null; enabled: boolean })`.
- The component returns `null` when `enabled` is false.

- [ ] **Step 1: Write the failing renderer contract check**

Extend `scripts/test-fanid-stickers.ts` with pure geometry checks that represent the renderer contract:

```ts
for (const themeId of STICKER_THEME_IDS) {
  for (const item of getStickerComposition(themeId)) {
    if (item.layer === "over-portrait") assert.equal(item.zone, "portrait-edge");
    if (item.zone === "certificate-edge") assert.equal(item.layer, "under-content");
    assert.equal(Math.abs(item.rotate) <= 24, true, `${themeId}:${item.id} rotation`);
  }
}
```

Run: `npx tsx scripts/test-fanid-stickers.ts`

Expected: FAIL if any composition violates the protected-layer contract.

- [ ] **Step 2: Implement the SVG primitives**

Create `FanIdStickerLayer.tsx` with one absolute full-card SVG:

```tsx
export default function FanIdStickerLayer({ themeId, enabled }: Props) {
  if (!enabled) return null;
  const placements = getStickerComposition(themeId);
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="fanid-sticker-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0.3" dy="0.8" stdDeviation="0.7" floodColor="#1c1e24" floodOpacity=".28" />
        </filter>
        <linearGradient id="fanid-chrome-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#aeb7c2" />
          <stop offset=".7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#59636f" />
        </linearGradient>
      </defs>
      {placements.map((placement) => (
        <g key={placement.id} transform={`translate(${placement.x} ${placement.y}) rotate(${placement.rotate})`} filter="url(#fanid-sticker-shadow)">
          {renderStickerShape(placement.kind, placement.size, themeId)}
        </g>
      ))}
    </svg>
  );
}
```

Implement `renderStickerShape` as a typed switch using SVG paths and primitives for hearts, stars, bows, moons, clouds, pearls, sparkles, chains, butterflies, flowers, cats, ghosts, and safety pins. Give every sticker a visible silhouette boundary and theme-derived fill; use no `<image>` element. Keep `viewBox="0 0 100 100"` and normalized positions so the component scales with the card.

- [ ] **Step 3: Run the pure checks and type-check**

Run: `npx tsx scripts/test-fanid-stickers.ts && npx tsc --noEmit`

Expected: both commands pass.

- [ ] **Step 4: Commit the renderer**

```bash
git add src/components/FanIdStickerLayer.tsx src/lib/fanIdStickers.ts scripts/test-fanid-stickers.ts
git commit -m "feat: render crisp svg fan id stickers"
```

### Task 3: Thread the preference through wizard state and card rendering

**Files:**
- Modify: `src/lib/wizardState.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/components/FanIdCard.tsx`

**Interfaces:**
- `WizardState` gains `stickersEnabled?: boolean`.
- `FanIdCardCommonProps` gains `stickersEnabled?: boolean`.
- `UserPrefs` gains `stickersEnabled?: boolean` so finished cards can restore the choice.

- [ ] **Step 1: Write the failing state assertions**

Add assertions to `scripts/test-fanid-stickers.ts` for the pure normalization rule exposed from `wizardState.ts`:

```ts
import { normalizeStickersEnabled } from "@/lib/wizardState";

assert.equal(normalizeStickersEnabled(true), true);
assert.equal(normalizeStickersEnabled(false), false);
assert.equal(normalizeStickersEnabled("true"), false);
assert.equal(normalizeStickersEnabled(undefined), false);
```

Run: `npx tsx scripts/test-fanid-stickers.ts`

Expected: FAIL because the helper and state field do not exist.

- [ ] **Step 2: Add the state field and card prop**

Implement `normalizeStickersEnabled(value: unknown): boolean` as `value === true`. In `loadWizard`, set `stickersEnabled: normalizeStickersEnabled(p.stickersEnabled)`. In `finishWizard`, persist `stickersEnabled: normalizeStickersEnabled(s.stickersEnabled)` alongside `cardMode`.

In `FanIdCard.tsx`, destructure `stickersEnabled = false`, add `stickersEnabled?: boolean` to the common props, and render the layer inside the card shell after the visual shell borders but before the content container. Pass the resolved `theme.id` to the layer. Keep the layer `pointer-events-none` and do not alter existing portrait, archetype, or certificate layout.

- [ ] **Step 3: Run state checks and type-check**

Run: `npx tsx scripts/test-fanid-stickers.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit the state and card integration**

```bash
git add src/lib/wizardState.ts src/lib/types.ts src/components/FanIdCard.tsx scripts/test-fanid-stickers.ts
git commit -m "feat: connect sticker preference to fan id cards"
```

### Task 4: Add the accessible StepIssue control

**Files:**
- Modify: `src/components/wizard/StepIssue.tsx`

**Interfaces:**
- Consumes `wiz.stickersEnabled` and `FanIdCard`'s `stickersEnabled` prop.
- Produces a single accessible button with `aria-pressed` and localized copy.

- [ ] **Step 1: Write the failing UI integration checklist as selectors**

Add stable attributes to the planned control contract before implementation is complete:

```text
[data-sticker-toggle]
[data-sticker-toggle][aria-pressed="false"] when disabled
[data-sticker-toggle][aria-pressed="true"] after one click
[data-card-stickers="false"] when disabled
[data-card-stickers="true"] after one click
```

The browser verification in Task 6 will fail these selectors until the control is wired.

- [ ] **Step 2: Add the local state and card prop**

Initialize `const [stickersEnabled, setStickersEnabled] = useState(wiz.stickersEnabled === true)`. Pass `stickersEnabled` to `FanIdCard`. Add the persisted toggle near the card edition/layout controls:

```tsx
<button
  type="button"
  data-sticker-toggle
  aria-pressed={stickersEnabled}
  onClick={() => {
    const next = !stickersEnabled;
    setStickersEnabled(next);
    update({ stickersEnabled: next });
  }}
  className="... focus-visible:outline ..."
>
  <span>{locale === "zh" ? "貼紙裝飾" : "Sticker bomb"}</span>
  <span>{locale === "zh" ? "加入主題貼紙邊框" : "Add a curated decorated edge"}</span>
</button>
```

Give the on state a theme-colored border/background and the off state the existing neutral control treatment. The sticker layer itself exposes `data-card-stickers={enabled ? "true" : "false"}` on its root card for browser verification.

- [ ] **Step 3: Run type-check and build**

Run: `npx tsc --noEmit && npm run build`

Expected: both commands pass.

- [ ] **Step 4: Commit the control**

```bash
git add src/components/wizard/StepIssue.tsx src/components/FanIdCard.tsx
git commit -m "feat: add optional sticker bomb control"
```

### Task 5: Add export-safe and responsive polish

**Files:**
- Modify: `src/components/FanIdStickerLayer.tsx`
- Modify: `src/components/FanIdCard.tsx`
- Modify: `src/app/globals.css` only if a responsive or reduced-motion rule cannot be expressed locally

**Interfaces:**
- Preserves the Task 2 SVG interface and Task 3 card prop.
- Does not add new user-facing controls.

- [ ] **Step 1: Verify the failing visual cases**

In the local browser, enable stickers and inspect the four themes at the existing card preview width. Record any sticker that enters the center face-safe region or the archetype/certificate content panels.

- [ ] **Step 2: Adjust only the composition data or SVG clipping**

Keep all outer decorations inside the card's `overflow-hidden` shell. If a placement needs a larger portrait-edge overlap, adjust its normalized `x`, `y`, or `size` in `fanIdStickers.ts`; do not add ad-hoc per-theme CSS offsets. Ensure the SVG has `overflow-hidden` and remains static during capture.

- [ ] **Step 3: Verify reduced-motion and keyboard behavior**

If an entrance effect is added, wrap it in `@media (prefers-reduced-motion: reduce)` and disable the animation there. Focus the toggle with the keyboard and confirm its focus ring remains visible in both states.

- [ ] **Step 4: Run the full static checks**

Run: `npx tsx scripts/test-fanid-stickers.ts && npx tsc --noEmit && npm run build && git diff --check`

Expected: all commands pass with no TypeScript, build, or whitespace errors.

- [ ] **Step 5: Commit polish**

```bash
git add src/components/FanIdStickerLayer.tsx src/components/FanIdCard.tsx src/lib/fanIdStickers.ts src/app/globals.css
git commit -m "fix: keep fan id stickers export safe"
```

### Task 6: Browser verification across all themes and layouts

**Files:**
- No source changes expected; if a defect is found, fix it in the smallest relevant file and rerun the affected task checks.

**Interfaces:**
- Verifies the delivered `FanIdStickerLayer`, `WizardState`, `StepIssue`, and `FanIdCard` behavior together.

- [ ] **Step 1: Verify the clean default**

Open `http://localhost:3100/start?step=4`. Confirm the initial card has `[data-card-stickers="false"]` and no sticker SVG is visible.

- [ ] **Step 2: Verify the toggle**

Click `[data-sticker-toggle]`. Confirm `aria-pressed="true"`, `[data-card-stickers="true"]`, and that the sticker composition appears without changing the selected theme or card layout.

- [ ] **Step 3: Verify all theme compositions**

Select Chrome, Dreamy, Kawaii, and Mono Cute. For each theme, confirm the stickers match the theme vocabulary and that no sticker is a rectangular image crop or has a white fringe.

- [ ] **Step 4: Verify all three layouts**

Test Idol, Idol + User, and User. Confirm there is never more than one idol portrait, the user-photo requirement still gates export, and the sticker layer does not cover face, result, holder, barcode, or QR content.

- [ ] **Step 5: Verify export and console**

Export one decorated card and one undecorated card. Compare both downloads with their previews. Confirm there are no console errors and that the card's outer sticker bounds remain inside the exported canvas.

- [ ] **Step 6: Commit any final verification fix and report**

If no fixes are needed, leave the source commits intact and report the verified local URL. If a fix is needed, rerun `npx tsc --noEmit`, `npm run build`, and `git diff --check` before committing only the affected file.
