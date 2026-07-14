# Fan ID Card Balance Design

## Goal

Improve the mobile Fan ID preview by removing unused horizontal space in the archetype column and eliminating the issuing seal that overlaps the idol lineup.

## Layout

- Keep the fixed 328px export node, existing two-column top section, and current hero-image size.
- Keep the archetype content vertically centered, but center it horizontally and allow its labels to use the full width of the right column.
- Center the code, Chinese name, English name, and rarity pill as one visual group.
- Preserve current typography, colors, card height, lineup dimensions, and export behavior.

## Seal

- Remove the `發證中心鋼印` element completely in sample and production cards.
- Do not replace it with another badge or watermark.
- Keep the existing footer issuer text (`KSTAR 發證中心`) unchanged.

## Verification

- Add a render regression test that requires the archetype container's centering and full-width layout classes.
- Add a render regression test that rejects `發證中心鋼印` markup.
- Run the focused Fan ID render test, final-review regression test, TypeScript check, and production build.
- Reload the local `/start` preview and visually confirm the archetype group is balanced and no seal covers the lineup.

## Out of Scope

- Changing the card's 328px export dimensions.
- Changing artist selection, archetype calculation, rarity calculation, or export data.
- Redesigning the hero portrait, lineup, scores, complement row, barcode, or QR footer.
