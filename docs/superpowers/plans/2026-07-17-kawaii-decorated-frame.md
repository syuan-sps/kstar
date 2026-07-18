# Kawaii Decorated Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the approved cohesive Kawaii photocard sleeve as the Decorations-on background and remove the flat Kawaii SVG stickers.

**Architecture:** Copy the approved generated PNG into the project, render it through one small presentational component, and mount it behind the existing live Fan ID content. The old SVG layer remains for Chrome, Dreamy, and Mono Cute, but is explicitly unavailable for Kawaii.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, current html-to-image exporter, `tsx` static-markup assertions.

## Global Constraints

- Source: `/Users/xxxsw/.codex/generated_images/019f64f3-6511-7e41-b2ac-e312e99eb9c0/exec-b704cf76-c2f1-4960-8d42-8f8061a9c8c8.png`.
- Destination: `public/fanid-themes/kawaii/decorated-frame-v1.png`.
- Render only for `themeId === "kawaii"` and `stickersEnabled === true`.
- Frame stays behind all live card data and photos.
- Kawaii never renders legacy SVG sticker roots.
- Other themes retain existing SVG decoration behavior.
- Preview/export use the identical DOM asset.

---

### Task 1: Asset and frame component

**Files:**
- Create `public/fanid-themes/kawaii/decorated-frame-v1.png`.
- Create `src/components/FanIdDecorationFrame.tsx`.
- Modify `scripts/test-fanid-stickers.ts`.

- [ ] **Step 1: Copy the approved source**

Run `cp /Users/xxxsw/.codex/generated_images/019f64f3-6511-7e41-b2ac-e312e99eb9c0/exec-b704cf76-c2f1-4960-8d42-8f8061a9c8c8.png public/fanid-themes/kawaii/decorated-frame-v1.png` and then `test -s public/fanid-themes/kawaii/decorated-frame-v1.png`.

- [ ] **Step 2: Add a failing static assertion**

Import `FanIdDecorationFrame` and assert rendered enabled Kawaii markup contains `data-fanid-decoration-frame="kawaii-sleeve"` and `decorated-frame-v1.png`. Assert disabled Kawaii and enabled Chrome render as an empty string. Run `npx tsx scripts/test-fanid-stickers.ts`; expect the missing-module failure.

- [ ] **Step 3: Add the component**

Implement the component with this exact behavior: return `null` unless `enabled && themeId === "kawaii"`; otherwise return an empty-alt, non-draggable, `pointer-events-none absolute inset-0 z-0 h-full w-full object-fill` image with `data-fanid-decoration-frame="kawaii-sleeve"` and `src="/fanid-themes/kawaii/decorated-frame-v1.png"`. `object-fill` is intentional because the approved source matches the fixed card ratio; it must not crop the acrylic edge.

- [ ] **Step 4: Verify and commit**

Run `npx tsx scripts/test-fanid-stickers.ts`, `npx tsc --noEmit`, and `git diff --check`; all must exit 0. Commit only the asset, component, and test using `feat: add kawaii decorated fan id frame`.

---

### Task 2: Card integration and legacy SVG exclusion

**Files:**
- Modify `src/components/FanIdCard.tsx`.
- Modify `src/components/FanIdStickerLayer.tsx`.
- Modify `scripts/test-fanid-stickers.ts`.

- [ ] **Step 1: Add a failing Kawaii card assertion**

Render a sample `FanIdCard` inside `LocaleProvider` with Kawaii and Decorations enabled. Assert it contains `data-fanid-decoration-frame="kawaii-sleeve"`, contains zero `data-fanid-sticker-layer` values, and still contains the hero marker, archetype marker, and `qr-start.svg`. Run the focused test and expect it to fail before card integration.

- [ ] **Step 2: Mount the frame below live content**

Import `FanIdDecorationFrame` in `FanIdCard.tsx`. In the existing clipped inner card wrapper, insert `<FanIdDecorationFrame themeId={theme.id} enabled={stickersEnabled === true} />` before the content. Mount the existing under-content and over-portrait `FanIdStickerLayer` nodes only when `theme.id !== "kawaii"`. Do not alter the existing `z-10` header, main, hero, archetype, or footer markup.

- [ ] **Step 3: Guard the SVG component itself**

Resolve the sticker theme at the beginning of `FanIdStickerLayer`. Return `null` if decorations are disabled or the resolved theme is Kawaii. Reuse the resolved theme in the existing paint path. This ensures future callers cannot accidentally stack old Kawaii vectors on the sleeve.

- [ ] **Step 4: Verify and commit**

Run `npx tsx scripts/test-fanid-stickers.ts`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`; all must pass. Commit only the two components and focused test using `feat: use kawaii sleeve for fan id decorations`.

---

### Task 3: Live and export verification

**Files:** No source changes expected.

- [ ] **Step 1: Verify toggle behavior**

At `http://localhost:3100/start?step=4`, select Kawaii. Decorations off: zero frame and zero sticker roots. Decorations on: one `kawaii-sleeve` frame and zero sticker roots.

- [ ] **Step 2: Verify protected content**

With Decorations on, inspect Idol, Idol + User, and User. Confirm hero, owner avatar, archetype, holder/barcode, and QR remain readable above the frame.

- [ ] **Step 3: Verify regressions and export**

Confirm Chrome, Dreamy, and Mono Cute each retain two SVG sticker roots and zero frame nodes when Decorations is on. Export a decorated Kawaii card; it must include the sleeve and no legacy SVG stickers.

- [ ] **Step 4: Commit a fix only if needed**

If verification finds a defect, fix only the decoration component, `FanIdCard`, or `FanIdStickerLayer`, rerun Task 2 checks, and commit as `fix: polish kawaii decorated fan id frame`. Otherwise do not create an empty commit.

## Completion criteria

- Decorations-on Kawaii uses the approved frame and no old Kawaii SVG stickers.
- Decorations-off Kawaii remains clean.
- All three layouts, other themes, and exports preserve their expected behavior.
