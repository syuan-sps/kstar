# Fan ID Theme Customization Design

## Goal

Make the Fan ID wizard feel personal and shareable through five curated visual editions. Themes should remain recognizable as the same Fan ID while changing its material, finish, typography, accents, and decorative details. Sticker assets are optional decoration, not a dependency.

## Themes

1. **Y2K Chrome** — reflective silver surface, icy blue/pink highlights, technical labels, and beveled framing.
2. **Gothic Cross** — dark gunmetal surface, engraved-style framing, ivory text, and a restrained burgundy accent.
3. **Cloudy Dreamy** — frosted pearl/glass surface, lavender and sky-blue glow, soft framing, and airy type treatment.
4. **Kawaii** — glossy blush/lilac surface, rounded framing, playful bold type, and candy-colored accents.
5. **Monochrome Cute** — warm-white paper surface, black/gray ink, compact editorial grid, and small rounded details.

## User experience

Theme selection is fused into wizard step 4 above the live card preview. A horizontal strip presents five compact material swatches labeled Chrome, Gothic, Dreamy, Kawaii, and Mono Cute. The selected swatch has a clear outline and selected indicator. The card updates immediately. On mobile, the swatches scroll horizontally. All themes are free and presented equally.

## Component architecture

Create `src/lib/fanIdThemes.ts` as the single source of truth for theme presets. Each preset defines surface, border, accent, text, font treatment, decorative details, and optional sticker assets.

`FanIdCard` receives a `themeId` prop and applies the shared card structure through the selected configuration. `SoulStoryCard` and `SoulReport` receive and reuse the same theme so the generated experience remains visually consistent. The wizard stores the selected theme and passes it through the final generation/share flow. Chrome is the default when no theme is selected.

Sticker failures are non-fatal: missing or unsuitable assets are omitted while the material treatment remains complete.

## Design constraints

- Preserve the existing information hierarchy and card semantics across themes.
- Avoid making the card dependent on sticker placement or transparent-asset quality.
- Keep decoration subordinate to the user’s Fan ID content.
- Use the existing Y2K Chrome treatment as the baseline for shared card structure.
- Keep the first version curated; do not add freeform mix-and-match controls.

## Verification

- Confirm each theme can be selected and immediately appears in the live preview.
- Confirm the selected theme persists through issue, story, report, and share views.
- Confirm the default remains Chrome when no theme is selected.
- Confirm missing sticker paths do not break rendering.
- Run the project’s TypeScript/build checks and verify the responsive picker on mobile widths.
