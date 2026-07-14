# Step 3 Top Share Toggle and Archetype-Only Exports

## Goal

Move the Step 3 downloadable-format toggle into the open area immediately below the wizard stepper and above `你的追星型別`. Keep the redesigned story and long-report exports, but remove the entire selected-idol section from both cards.

## User Experience

- The toggle appears first inside the Step 3 result content, before the result summary.
- Its labels, from left to right, are exactly `完整長圖` and `限動卡`.
- `限動卡` remains selected by default even though it is the right-hand option.
- The result summary remains visible below the toggle in its current order.
- The selected downloadable preview remains below the complete result summary.
- Switching formats replaces the preview; the two exports are never stacked.
- Existing download and share buttons remain attached to the corresponding preview.

## Export Cards

### Story Card

- Reuse the current redesigned Silvercore 9:16 card and its export dimensions.
- Remove the full four-idol portrait grid. Do not replace it with names or chips.
- Rebalance the card's vertical spacing so the archetype identity, layer bars, and call to action fill the composition without a large empty middle.
- Preserve the current archetype code, Chinese and English names, tagline, layer bars, download action, share action, file name, and native-share fallback behavior.

### Complete Long Image

- Reuse the current redesigned Silvercore long-report card.
- Remove the full four-idol portrait grid. Do not replace it with names or chips.
- Let the four-layer analysis follow the hero section directly, using the existing spacing system.
- Preserve the answer reflection, hidden side, discovery universe, download action, share action, file name, and native-share fallback behavior.

## Component Changes

- `StepReveal` owns the current `story` / `report` state and renders the tablist before the summary.
- `StepReveal` renders the tablist directly above the summary, while `Step3ShareStudio` renders only the selected export preview and actions.
- The internal state values remain `story` and `report`; only the visible labels change.
- Remove the `picks` prop from `StepReveal`, `Step3ShareStudio`, `SoulStoryCard`, and `SoulReport`, because Step 3 no longer displays selected idols.
- Remove `MiniPhotoCard` and its `Thumb` dependency after both exports stop rendering idol content.
- The existing shared `exportNode` pipeline is unchanged.

## Accessibility

- Keep `role="tablist"`, `role="tab"`, and accurate `aria-selected` values.
- The visual order and DOM order are both `完整長圖`, then `限動卡`.
- Exactly one selected export preview is present at a time.

## Verification

- A render contract proves the tablist occurs before `你的追星型別`.
- The contract proves the exact two labels and that `限動卡` is selected by default.
- Story and report render contracts prove there are no `data-share-idol` elements and no selected-idol names in either export.
- Existing download/share actions remain present for both views.
- TypeScript and existing Step 3 regressions pass.
- At the reported mobile viewport, visually verify the top toggle placement, default state, balanced story composition, portrait-free long report, and clean format switching.

## Out of Scope

- Changing Step 4 or the Fan ID card.
- Adding direct Instagram authentication or posting.
- Changing export resolution, filenames, or fallback behavior.
- Showing selected-idol names anywhere in the downloadable cards.
