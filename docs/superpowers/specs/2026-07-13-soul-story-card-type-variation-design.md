# Soul Story Card Type-Variation Design

## Goal

Keep the canonical 270 x 480 Soul Story Card layout identical for every result while giving all 16 archetypes a visible, collectible relationship system.

## Invariant Layout

- Use the exact spacing and hierarchy of Figma frame `2:2` (`Soul Story Card — Rebalanced spacing`).
- The same `SoulStoryCard` DOM remains the onscreen preview, PNG download target, and native-share target.
- Card background stays light chrome. The frequency panel stays translucent white. The card never becomes a dark dashboard.
- Do not add additional data rows, badges, idol imagery, or alternate layouts.

## Lead Families

The leading score layer selects the family accent. This is derived from the existing `result.leadLayer` / `result.colorStory`, so related results use related visual language even when their exact code differs.

| Lead layer | Family | Edge colour | Tiny motif |
| --- | --- | --- | --- |
| Aesthetic | Collector | denim blue | four-point flare |
| Personality | Signal | cherry red | short signal notch |
| Performance | Stage | electric blue | paired spotlight marks |
| Content / resonance | Archive | warm gold | two archive dots |
| Balanced or legend | Orbit | chrome | small orbit ring and four dots |

The family accent controls only the hairline edge, the CTA, the active score-bar emphasis, and the corner motif. It does not recolour the card background or change the shared structure.

## Sixteen-Type Differentiation

Uppercase letters in the existing four-character code define the micro-variation. This provides a unique treatment for each of the 16 codes without creating sixteen separate layouts.

| Code tier | Codes | Edge / motif treatment |
| --- | --- | --- |
| 0 high | `apsr` | neutral silver hairline and quiet Orbit dots |
| 1 high | `Apsr`, `aPsr`, `apSr`, `apsR` | one family-coloured signal rail and one matching motif |
| 2 high | `APsr`, `ApSr`, `ApsR`, `aPSr`, `aPsR`, `apSR` | two subtle, opposing corner signals; primary colour follows the lead family and companion colour follows the second high axis |
| 3 high | `APSr`, `APsR`, `ApSR`, `aPSR` | double hairline plus one muted ghost marker for the `missing` axis |
| 4 high | `APSR` | chrome Orbit edge with a restrained iridescent micro-ring; no rainbow card background |

## Implementation Contract

- Add a small, deterministic card-decoration helper keyed by `result.code`, `result.leadLayer`, and `archetype.missing`.
- The helper returns CSS-safe colours and motif identifiers only; it must not alter result scoring, export dimensions, or export behaviour.
- Render the decoration inside the existing fixed export node so preview, download, and share remain pixel-identical.

## Acceptance Criteria

- All 16 codes produce a recognisably different but structurally identical card.
- Results sharing a lead family visibly belong together.
- A 0-, 1-, 2-, 3-, and 4-high example each demonstrate the intended tier treatment.
- The 270 x 480 preview and exported PNG share the exact same decorative output.
- The light canonical card stays readable at native export size.
