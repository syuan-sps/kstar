# Story Card Spacing Design

**Date:** 2026-07-13  
**Status:** Approved

## Goal

Remove the two large empty bands in the Step 3 Story-card export while preserving its true 9:16 dimensions and lightweight content.

## Scope

This change affects only the `SoulStoryCard` used by the `限動卡` preview, download, and share actions. The `完整長圖` report, result data, export dimensions, and controls remain unchanged.

## Layout

- Preserve the 270 × 480 export canvas.
- Replace the card's `justify-between` composition with a three-row grid: identity, frequency panel, and footer.
- Use fixed, consistent row gaps so content sits directly beside the neighboring section.
- Make the bordered frequency panel the flexible middle row. It absorbs remaining height, with its heading and four frequency bars vertically centered.
- Keep the footer CTA and KSTAR date line together in the final row.
- Do not add idol portraits, names, result prose, or other filler to the Story version.

## Behavior

The same `SoulStoryCard` DOM remains the export target, so preview, PNG download, and Web Share behavior continue to use identical artwork. No state or data-flow changes are required.

## Verification

- Add a focused structural test that rejects `justify-between` and verifies the three-row flexible layout.
- Run the existing Step 3 share-studio and report tests.
- Run TypeScript validation and the production build.
- Visually inspect the Step 3 Story preview at mobile and desktop viewport sizes, confirming both annotated empty bands are gone and the card remains 9:16.
- Exercise the download path and confirm the generated image matches the onscreen composition.

## Out of Scope

- Shortening or changing the export aspect ratio.
- Adding content to fill space.
- Modifying the full-length report.
- Reworking the Step 3 page layout outside the Story card.
