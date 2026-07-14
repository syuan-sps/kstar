# Step 3 Share Studio Design

## Goal

Make the Step 3 quiz result useful as a social artifact before the user claims a Fan ID. Keep the immediate result summary, then provide two previewable, downloadable, and shareable views: a 9:16 Instagram story card and a complete taste report.

## Step 3 Layout

- Preserve the existing result summary: type code, archetype, tagline, rarity, hidden layer, score bars, soulmate matches, and complement.
- Add a two-option toggle beneath the summary:
  - `限動卡 9:16`
  - `完整追星報告`
- Default to `限動卡 9:16` on every Step 3 mount.
- Show only the selected artifact and its actions so the two large previews never stack.
- Keep the existing wizard Back and `領取我的追星證` controls outside the share studio and unchanged.
- Do not add a `追星證` tab; Step 4 remains the only Fan ID issuing surface.

## Story View

- Reuse `SoulStoryCard` as the visible 270×480 export preview.
- Include the mixed-case type code, archetype name and tagline, four selected idols, score bars, KStar CTA, and the existing Silvercore treatment.
- Keep its existing `下載限動卡` and `分享 ✦` actions.

## Complete Report View

- Reuse `SoulReport` as the visible complete-report preview.
- Include identity, four selected idols, four-layer analysis, the user's available quiz-answer reflection, hidden layer, discovery universe, and KStar CTA.
- Keep its existing `下載報告長圖` and `分享 ✦` actions.

## Data Flow

- `StartFlow` passes the resolved four `selectedArtists`, the `ArchetypeResult`, and report-answer context into `StepReveal`.
- The report-answer context is derived from the same wizard summaries, ranking, and answers used to compute the displayed result; export views must not recalculate a different archetype.
- `StepReveal` owns only the local `story | report` toggle. The existing artifact components continue to own their refs, busy state, failure state, and export calls.

## Export and Sharing

- Keep using `exportNode`; do not create a second export pipeline.
- Both actions produce PNG files from the visible selected artifact.
- `分享 ✦` invokes native file sharing when `navigator.canShare` supports the PNG, which exposes Instagram and other installed share targets.
- When file sharing is unavailable, the same action downloads the PNG.
- A cancelled native share is not an error. Genuine rendering or sharing failures show the existing screenshot fallback message.

## Accessibility and Interaction

- The toggle is a labelled tab group with two tabs and an active state exposed through `aria-selected`.
- Toggle buttons remain keyboard-operable native buttons.
- Export buttons are disabled and display `處理中…` during work.
- Failure messages remain announced through their existing visible error copy.

## Verification

- Add a render contract covering both toggle labels, the default story view, and the resolved four-idol payload.
- Add an interaction test that switches from the story view to the complete report view without changing the result payload.
- Preserve the existing export helper tests and add no duplicate share implementation.
- Run focused Step 3 tests, final-review regression, TypeScript, and the production build.
- At the reported mobile viewport, verify that only one artifact is visible at a time and that both views expose download and share actions.

## Out of Scope

- Direct posting to an Instagram account or bypassing the operating system share sheet.
- Changing the Step 3 quiz result calculation or copy.
- Changing Step 4 Fan ID customization or exports.
- Adding a third Fan ID tab to Step 3.
