# Soul Story Card Canonical Design

## Goal

Make the light **Soul Story Card — Rebalanced spacing** composition the single canonical design for the Step 3 限動卡 preview, PNG download, and native share export.

## Visual Source of Truth

- Figma file: `iIv1HPSBwm0oZKrj8UfgwO`
- Reference frame: `2:2` — `Soul Story Card — Rebalanced spacing`
- Active Figma proposal: `22:2` — mirrors the reference frame exactly.
- Export size: 270 x 480 (9:16).

## Card Composition

- A light chrome card with a fine red edge, soft shadow, and only the two existing corner stars.
- Header block: soul label, four-letter code, divider, Chinese archetype name, English name, and one-line truth.
- One translucent-white frequency panel containing only its label, four score bars, and their labels.
- Compact red CTA and KSTAR date lockup below the panel.
- No dark navy panel, decorative grid, colour glow, extra metadata row, idol imagery, seal, badge, or free-floating supporting copy.
- Preserve the reference frame's spacing and typography exactly; do not “improve” it independently in any export surface.

## Preview / Download / Share Parity

`src/components/SoulStoryCard.tsx` is the one fixed-size export target. Its same DOM node is visible in Step 3, passed to `exportNode` for PNG download, and passed to the same export pipeline for native share.

- Restyle this single component to match the Figma reference.
- Do not create a separate download-only card, duplicated markup, or alternate export CSS.
- The onscreen story preview, downloaded PNG, and shared image must therefore use identical content, order, dimensions, and spacing.

## Acceptance Criteria

- The 270 x 480 rendered `SoulStoryCard` visually matches Figma frame `2:2`.
- Preview, downloaded PNG, and shared PNG originate from the same card node.
- The download/share controls remain outside the export node.
- The long-report format, filenames, and existing `exportNode` fallback behavior remain unchanged.
