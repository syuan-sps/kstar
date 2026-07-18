# Fan ID Pop-out Decoration Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Chrome, Dreamy, Kawaii, and Mono Cute fixed two-layer collectible decorations without blocking live card content.

**Architecture:** Each decorated theme receives an opaque tall sleeve at `z-0` and an alpha pop-out ornament at `z-20`; header and main live content remain at `z-10`. `FanIdDecorationFrame` owns a typed asset map, and `FanIdCard` stops mounting legacy SVG stickers for decorated valid themes.

**Tech Stack:** Next.js, React, Tailwind, PNG assets in `public/fanid-themes`, built-in image generation, and `scripts/test-fanid-stickers.ts`.

## Global Constraints

- Decorations off renders neither decoration image.
- Assets contain no people, live text, barcode, QR, or card data.
- The pop-out is `pointer-events-none`, clipped by the inner card, and pre-composed to avoid face, owner avatar, text, bars, barcode, and QR code.
- Preserve unrelated dirty worktree files.

---

### Task 1: Create all sleeve and pop-out asset pairs

**Files:** Create `decorated-sleeve-v1.png` and `decorated-popout-v1.png` under each of `public/fanid-themes/chrome/`, `cloudy-dreamy/`, and `monochrome-cute/`; create `kawaii/decorated-sleeve-v2.png` and `kawaii/decorated-popout-v1.png`.

**Interfaces:** Produces one tall opaque sleeve and one same-ratio alpha foreground image for every `FanIdThemeId`.

- [ ] Write and run four sleeve-generation prompts. Each prompt requires: tall 1:2 collectible photocard sleeve, quiet central opening, no person/card/text/UI/barcode/QR, connected perimeter clusters, premium physical material, no detached clip-art or watermark.
- [ ] Use the approved clauses: Chrome = brushed silver polycarbonate, beveled hardware, cobalt glint; Dreamy = pale blue-lilac sleeve, cloud edge, opaque pearl beads and crescent; Kawaii = pink/lavender acrylic, satin bows, pearls and hearts; Mono = black/ivory plush, smoked chrome, gingham rail and black bow.
- [ ] Inspect each sleeve and copy only accepted outputs to its project path. Reject any asset with a busy center, baked text, person, flat vector appearance, or card content.
- [ ] Generate one opaque foreground cluster per theme on a perfectly flat `#00ff00` field: Chrome hardware/star, Dreamy pearl moon/cloud, Kawaii satin bow/heart, Mono black bow/paw/star. Every prompt requires an empty center, believable shadow, and no text/person/card/UI/watermark.
- [ ] Convert every pop-out to alpha: `python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" --input <generated-popout>.png --out public/fanid-themes/<theme>/decorated-popout-v1.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
- [ ] Verify transparent corners and no green fringe, retrying once with `--edge-contract 1` only if needed.
- [ ] Commit with `git add public/fanid-themes/*/decorated-*.png && git commit -m "feat: add fan id collectible decoration assets"`.

### Task 2: Render both raster layers and disable the SVG system

**Files:** Modify `src/components/FanIdDecorationFrame.tsx`, `src/components/FanIdCard.tsx:143-162`, and `scripts/test-fanid-stickers.ts`.

**Interfaces:** `FanIdDecorationFrame({ themeId, enabled })` returns sleeve and pop-out images for a valid decorated theme, otherwise `null`.

- [ ] Add a failing test loop that renders `FanIdDecorationFrame` for every `Object.keys(FAN_ID_THEMES)` and expects `data-fanid-decoration-frame="<theme>-sleeve"` plus `data-fanid-decoration-popout="<theme>-popout"`.
- [ ] Run `npx tsx scripts/test-fanid-stickers.ts` and confirm it fails because only Kawaii currently renders one raster image.
- [ ] Replace the Kawaii-only branch with `Record<FanIdThemeId, { sleeve: string; popout: string }>` mapping Chrome, Cloudy Dreamy, Kawaii, and Mono Cute to their new paths.
- [ ] Render sleeve as `absolute inset-0 z-0 h-full w-full object-fill` and pop-out as `absolute inset-0 z-20 h-full w-full object-fill`; both require `pointer-events-none` and `draggable={false}`.
- [ ] Set `data-card-sticker-architecture` to `two-layer-frame` when Decorations is enabled and remove `FanIdStickerLayer` output for all valid themes.
- [ ] Run `npx tsx scripts/test-fanid-stickers.ts` and `npx tsc --noEmit`; both must exit 0.
- [ ] Commit with `git add src/components/FanIdDecorationFrame.tsx src/components/FanIdCard.tsx scripts/test-fanid-stickers.ts && git commit -m "feat: render layered fan id decorations"`.

### Task 3: Verify all card layouts and production behavior

**Files:** Modify `scripts/test-fanid-stickers.ts` only if assertion coverage needs expansion.

**Interfaces:** Every Idol, Idol + User, and User sample card receives two image layers and no `data-fanid-sticker-contract` markup when Decorations is enabled.

- [ ] Add rendered-card assertions for every theme/layout pair: `data-card-sticker-architecture="two-layer-frame"`, sleeve node, pop-out node, hero, archetype, QR, and no legacy SVG sticker contract.
- [ ] Run `npx tsx scripts/test-fanid-stickers.ts`, `npx tsx scripts/test-fanid-media.ts`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`; every command must exit 0.
- [ ] Inspect `http://localhost:3100/start?step=4`: toggle Decorations off/on in every theme and three layouts, confirm the foreground reads as physical depth, and confirm protected content remains unobstructed.
