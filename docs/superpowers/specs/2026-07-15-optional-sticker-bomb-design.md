# Optional Sticker-Bomb Card Decoration

## Goal

Add an optional decoration mode to the Fan ID wizard that makes the generated card feel like a digitally decorated collectible photocard. The decoration should be visually abundant when enabled, but the portrait, result data, identity fields, barcode, and QR code must remain legible and unobstructed.

The feature should draw from the existing sticker references in `design/fanid-themes/refs/`, especially the chrome, kawaii, dreamy, and monochrome charm language. The broken raster sticker crops in `public/fanid-themes/` are reference material only and are not a runtime dependency.

## Product behavior

- Add one binary preference: `stickersEnabled`.
- The preference defaults to `false` so the clean collectible card remains the default experience.
- The control appears with the existing card edition and card layout controls in StepIssue.
- When enabled, the preview gains an automatic, theme-specific sticker composition.
- There is no drag-and-drop editor, sticker picker, or density slider in this version. The composition is curated so the result remains coherent and export-safe.
- The preference persists with the wizard state and is restored when the wizard is reopened.
- The existing three card layouts remain unchanged: Idol, Idol + User, and User.
- The sticker layer is decorative and must never change the card's core content or layout selection.

## Visual direction

The card should read as a manufactured acrylic or chrome photocard that has been decorated by a fan. The decoration has a dense perimeter rhythm rather than a random sticker pile:

- 10–14 visible charms per card, scaled across large signature pieces and small filler pieces.
- Large charms anchor portrait corners and side rails.
- Small pearls, sparkles, bubbles, and mini symbols fill gaps in the frame.
- Two or three larger pieces may overlap the portrait edge by approximately 8–14px.
- The face region, archetype heading, score bars, holder name, barcode, and QR code are protected zones.
- Decorations are clipped to the card canvas so the downloaded image never loses a sticker at an outer edge.
- The composition is deterministic: the same theme, layout, and card data produce the same sticker placement in preview and export.

### Theme vocabulary

- Chrome: liquid-metal hearts, orbital stars, chain links, safety-pin charm, chrome sparkles, and small reflective beads.
- Dreamy: pearlescent moons, soft clouds, translucent stars, bubbles, and pastel sparkles.
- Kawaii: resin bows, candy hearts, pearls, butterflies, flowers, and glossy stars.
- Mono Cute: black hearts, gingham bows, cats, ghosts, black chrome stars, and white pearls.

## Rendering architecture

Create a focused `FanIdStickerLayer` presentation component. It receives the selected theme, card layout, and `enabled` state. It renders only when enabled and sits inside the card shell as a pointer-events-none visual layer.

Use inline SVG or React SVG primitives for the sticker silhouettes and effects. This guarantees crisp edges at all preview and export sizes and avoids the white-fringe and accidental-crop problems found in the generated raster sheets. Each charm should have a deliberate silhouette, a theme-derived fill or gradient, a thin highlight, and a soft shadow that matches the acrylic card material.

Sticker definitions should be data-driven. Each theme provides a small vocabulary of charm types and anchor positions; the component maps those definitions to SVG primitives. Positions are expressed relative to the card's normalized coordinate system so all three card layouts share the same safe-zone logic.

The layer must not depend on the broken assets in `public/fanid-themes/`. The existing reference files remain useful for visual direction and can be revisited later if an individually cleaned raster asset becomes valuable.

## Safe zones and composition

The card is divided into four visual bands:

1. Header band: only small charms near the corners; no sticker may obscure the title or serial.
2. Portrait band: large corner/rail accents may overlap the portrait edge, but a reserved face-safe region prevents placement over the central face area.
3. Archetype band: no large charms; only tiny peripheral sparkles outside the text panel.
4. Certificate band: no stickers across holder, barcode, QR, or issue-date content.

The sticker layer should use explicit z-order groups: background fillers below content, edge charms above the card surface but below protected content where possible, and only the approved portrait-edge accents above the portrait frame. This prevents a visually attractive decoration from becoming a usability regression.

## Controls and copy

Add a compact toggle/card control in StepIssue near the existing edition and layout choices:

- English label: `Sticker bomb`
- Chinese label: `貼紙裝飾`
- Supporting text: `Add a curated decorated edge`
- On-state preview: a small card thumbnail showing the perimeter treatment.
- Off-state preview: the current clean card silhouette.

The control must expose an accessible pressed or checked state, keyboard focus styling, and a clear visual difference between enabled and disabled. The export action should not require stickers to be enabled.

## State and export

Add `stickersEnabled?: boolean` to the wizard state and normalize it to `false` when loading older saved state. Include it in the persisted preferences when the wizard is completed.

Pass the preference into `FanIdCard`. The preview and the existing card export path must use the same DOM tree and sticker layer so the exported PNG matches what the user saw. The sticker layer must be static during capture; any hover or decorative motion is optional in the editor but must not alter export output.

## Responsive and accessibility requirements

- The composition must remain inside the card at narrow mobile widths.
- SVGs should include `aria-hidden="true"` because they are decoration, not content.
- The toggle must be operable by keyboard and have a visible focus ring.
- Respect reduced-motion preferences if any entrance animation is added.
- Do not reduce contrast or legibility of the card's Chinese and English data fields.

## Verification

Automated checks:

- TypeScript compilation passes.
- Existing build passes.
- State loading defaults old saved cards to stickers off.
- State persistence round-trips the sticker preference.
- The card renders no sticker layer when disabled and exactly one themed layer when enabled.

Browser checks:

- Toggle on/off in each of the four themes.
- Verify all three layouts: Idol, Idol + User, User.
- Verify stickers never cover the face-safe area, archetype panel, holder identity, barcode, or QR code.
- Verify the card remains visually coherent at the existing desktop and mobile preview widths.
- Export one decorated card and compare its rendered bounds with the preview.
- Confirm no console errors and no visible white fringe or rectangular raster crop.

## Out of scope for this version

- Manual sticker dragging or rotation.
- User-uploaded stickers.
- Randomized compositions.
- Reusing the current broken raster sticker crops.
- A separate sticker marketplace, unlock system, or paid decoration tier.
