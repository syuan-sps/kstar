# Soul Report Left Alignment Design

## Goal

Make explanatory report copy easy to scan by giving each row a consistent left-aligned text column in both the live report and its downloadable long image.

## Scope

The change is limited to the two reusable row primitives in `src/components/SoulReport.tsx`:

- `AnswerLine` renders the three answer rows (contrast, visual, and resonance).
- `DiscoverRow` renders the recommendation cards in the 追星宇宙 section.

## Layout

### Answer rows

Inside each rounded answer row, the muted prompt and bold answer share the row's left content inset. They remain on the first line when space permits and wrap from that same left edge when needed. The row must not centre its text.

### Recommendation rows

The icon remains in its existing left gutter. Immediately after it, the label, bold recommendation, and explanatory note use one left-aligned content column. The note begins at the same left edge as the first line rather than being centred beneath it.

## Export parity

The primitives remain inside `SoulReport`'s existing `reportRef` target. No second download layout is created, so the live report and downloaded long image render the same alignment.

## Verification

- Add source-level checks that `AnswerLine` and the `DiscoverRow` content column declare `text-left`.
- Verify the report continues to use `ref={reportRef}` and `exportNode(reportRef.current, ...)`.
- Run TypeScript and the production build.
- Inspect `/start?step=3` with 完整長圖 selected: all answer/recommendation explanation lines must begin at their shared left text column.
