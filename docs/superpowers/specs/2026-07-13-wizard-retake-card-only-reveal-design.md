# Wizard Retake and Card-Only Reveal

## Goal

Let users restart the completed Step 2 assessment without losing their four selected idols, and simplify Step 3 so its format toggle displays only the selected downloadable card instead of repeating a standalone result summary.

## Step 2 Retake

### Completed State

The existing completed-test state keeps its primary `查看判定結果 →` action and adds a secondary `↻ 重做測驗` action beneath it.

### Reset Behavior

Selecting `↻ 重做測驗`:

- stays on Step 2;
- returns to the priority-ranking screen;
- resets the ranking to the default `SCORE_LAYERS` order;
- clears all saved quiz answers;
- clears the saved archetype and any in-memory quiz result;
- preserves the four selected idol IDs and their order;
- preserves unrelated wizard identity fields, including the hero selection, fan name, song, issue date, and serial.

The retake is immediate. It does not require a confirmation dialog because only derived Step 2 assessment data is removed.

### Ownership

`StartFlow` owns the persisted reset because it already owns `WizardState` and `quizResult`. `StepQuiz` owns the local phase transition back to `rank`. An explicit `onRetake` callback connects the two responsibilities.

## Step 3 Card-Only Reveal

### Toggle

- The visual and DOM order is exactly `限動卡` on the left and `完整長圖` on the right.
- `限動卡` remains selected by default.
- The existing tablist semantics and `aria-selected` state remain intact.

### Content

- Remove the standalone result summary from Step 3, including its archetype heading, rarity badge, hidden-side panel, layer bars, soulmate summary, and complementary-type summary.
- Render only the format toggle followed by the selected downloadable preview and that preview's download/share actions.
- `限動卡` shows only the existing portrait-free 9:16 story card.
- `完整長圖` shows only the existing portrait-free complete report card, including all detailed report content.
- The two previews never stack.
- The Step 3 wizard navigation remains unchanged: Back returns to Step 2 and the primary wizard action continues to Step 4.

### Cleanup

After the standalone summary is removed, delete its unused rarity, compatibility, layer-label, and copy dependencies from `StepReveal`. Keep the `story` / `report` view state and `Step3ShareStudio` preview boundary.

## Verification

- A pure reset-state contract proves default rank, empty answers, absent archetype, Step 2, and preserved picks/identity fields.
- A Step 2 render contract proves both completed-state actions are present.
- A Step 3 render contract proves `限動卡` precedes `完整長圖`, story is the default, the standalone summary is absent, and exactly one downloadable preview is rendered.
- Existing report-answer, wizard-state, final-review, and TypeScript checks pass.
- At the reported mobile viewport, verify the retake returns to priority ranking with the same four idols, and verify each Step 3 toggle displays only its selected card with no repeated summary.
- The production build succeeds for all 13 routes.

## Out of Scope

- Changing the four selected idols during retake.
- Adding a retake confirmation dialog.
- Changing either downloadable card's content, dimensions, filenames, or export behavior.
- Changing Step 4 or the Fan ID card.
