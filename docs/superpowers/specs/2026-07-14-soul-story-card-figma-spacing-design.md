# Soul Story Card Figma Spacing Alignment

## Goal

Make the production `SoulStoryCard` match the approved Figma frame's spacing: a compact, centred frequency panel with balanced whitespace above and below it. The card must remain the sole preview/download/share node.

## Source of truth

- Figma file: `iIv1HPSBwm0oZKrj8UfgwO`
- Approved reference: `SoulStoryCard — Rebalanced spacing` (frame `2:2`)
- Canvas: 270 × 480 pixels

## Layout

The card uses a fixed vertical composition rather than a three-row CSS grid with a flexible middle track:

1. **Identity stack** — top label, code, divider, Chinese and English names, and tagline retain their current typography and compact natural height.
2. **Frequency panel** — centred at 210 × 115 pixels, with a thin chrome border, translucent white fill, a compact heading, and the existing four bars/labels. It must not use `h-full`, `flex-1`, or a grid `1fr` track.
3. **Footer** — CTA and KSTAR issue line sit directly beneath the compact panel. The visual gap from header to panel and panel to footer follows the Figma reference, rather than consuming spare card height.

The measured Figma rhythm is a 50px top inset, 18px side inset, 22px bottom inset, and 30px gap between the three content sections. The card keeps its 24px corners, chrome background, and corner stars.

## Variations

All 16 archetypes continue to use the shared layout. Variation remains restricted to the decoration contract:

- edge color
- small motif
- CTA color
- active score-bar color
- optional 3-high ghost marker

No variation can change panel dimensions, introduce a new row, use a dark panel, add idol imagery, or apply a colored card background.

## Export and responsive behavior

`ref={cardRef}` remains on this single 270 × 480 element. Therefore the screen preview, PNG download, and native share always render the same DOM and spacing. The card itself is fixed-size; surrounding page layout may scale it but must not alter its internal geometry.

## Verification

- Add a source-level contract asserting the card does not contain the flexible `minmax(120px,1fr)` / `h-full` middle layout and does contain the compact 210 × 115 panel dimensions.
- Run the decoration contract, TypeScript check, and Next.js production build.
- Open `/start?step=3` locally and visually compare the result to Figma frame `2:2`: the frequency panel must be compact and the lower white region must be card background, not panel interior.
