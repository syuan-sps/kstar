# Empty Four Cuts Preview Design

## Purpose

Replace the sparse homepage state shown when a visitor has not selected four idols with a clear, editorial preview of the eventual fan-ID experience. The preview should invite selection without implying that any real idol or result has been assigned.

## Scope

- Add a dedicated, display-only empty-state preview used by `MyFourCuts` when there are fewer than four valid saved picks.
- Preserve the existing CTA behavior: choosing the CTA carries any existing picks into Step 1 of `/start`.
- Do not modify the populated four-cut state, share/download flows, or saved preferences.

## Composition

The empty state is a compact `KStar 發證中心` presentation:

1. An editorial heading appears above a slightly tilted white fan-ID preview.
2. The ID preview contains four anonymous portrait tiles: one large feminine silhouette and three smaller silhouettes in masculine, feminine, masculine order. The set is exactly two feminine and two masculine silhouettes.
3. Portrait tiles use CSS-only head, hair, and shoulder shapes with neutral silver gradients. They contain no person, idol name, image, or fallback word such as `示意`.
4. The adjacent identity area is explicitly provisional, using `你的追星型別` and `等待判定` rather than a fabricated archetype result.
5. Supporting ID details (frequency bars, barcode/QR-style decoration, issuer line) remain decorative and are subdued so the CTA is the main action.
6. The label beneath the card explains the value proposition and the existing red CTA reads `開始建立追星檔案`.

## Responsive behavior

- Desktop: the presentation fills the existing central hero position, at a visually useful but non-dominant size.
- Mobile: it remains readable and centered without horizontal clipping; the card tilts less or not at all at narrow widths.
- The card is a single visual unit, not an exported/downloadable asset and not a data-dependent result.

## Accessibility and interaction

- The silhouettes are decorative and hidden from assistive technology.
- The CTA is a semantic button with the existing picker navigation behavior.
- No new animation is required; the preview should respect the existing motion restraint.

## Verification

- A source-level verifier proves the empty state renders the preview, contains four decorative silhouette variants in the required 2/2 split, exposes the pending-state text, and keeps the CTA wired to the existing picker action.
- Typecheck and production build must pass.
