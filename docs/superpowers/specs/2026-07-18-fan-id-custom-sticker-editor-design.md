# Fan ID custom sticker editor

## Goal

Add an optional, premium decal-customization layer to the Fan ID card. It complements the existing themed collector sleeve: the sleeve remains behind the card's live content, while users may place their own small decals above the card and export the exact result.

## Scope

- Keep the current four sleeve themes: Chrome, Dreamy, Kawaii, and Mono Cute.
- Add five distinct sticker-pack themes for Taiwanese female K-pop fans aged roughly 15–35:
  1. Ribbon Diary — powder pink, ivory, satin bows, pearls, ballet details.
  2. Cherry Picnic — cherry red, cream, gingham, strawberries, desserts.
  3. Blue Angel — icy blue, silver, stars, wings, crystal hearts.
  4. Jelly Aquarium — aqua, lilac, bubbles, shells, pearl resin.
  5. Dark Cherry — wine red, black, lace, locks, glossy hearts, silver hardware.
- Generate 20 new small, independent, transparent decal assets for each of the nine packs: 180 assets total.
- New decals must be approximately 40% of the visual scale of the earlier oversized foreground charms. They must be isolated, retain their natural aspect ratio, and have clean alpha edges.
- The existing card sleeve stays beneath all live card content. The old full-card foreground pop-out stays disabled.

## Customization flow

The existing Fan ID customization step gains a `Decorate your card` panel.

1. The user selects a card edition/theme as today.
2. They may upload their own idol image to replace the main portrait and reposition/zoom it within that portrait frame. The image stays local to their device.
3. The sticker panel opens the pack matching the selected theme by default.
4. All nine packs remain available in the panel for intentional cross-theme mixing.
5. Clicking a decal adds it to the card at a safe default size and position. The new decal preserves its intrinsic aspect ratio.
6. A selected decal exposes direct manipulation: drag, resize, rotate, and remove. Placed decals may deliberately overlap any card content, including portrait and QR, because this is a creative choice.
7. The editor limits a card to eight placed decals so it remains legible and exportable.
8. The existing download/share export captures the sleeves, uploaded portrait, and decal transforms exactly as shown.

## Technical design

Use a DOM overlay rather than a canvas editor.

- Store each placed decal as `{ id, assetId, packId, x, y, scale, rotation }`, using card-relative coordinates and a single scale factor.
- Render its image with intrinsic aspect ratio (`height: auto` / `object-fit: contain`); never stretch an entire transparent canvas to the card bounds.
- Keep the decal overlay inside the export target so the existing HTML-to-image export includes it without a separate composition pipeline.
- Use pointer events for drag, rotation handle, resize handle, keyboard delete, and touch-friendly hit areas.
- Maintain a dedicated, small editor controller component and a separate immutable asset catalogue so placement mechanics do not depend on the theme/sleeve renderer.
- The card remains usable with no decals; the sleeve renderer is unchanged except that it stays background-only.

## Quality and safeguards

- Every asset is generated on a uniform chroma-key background, converted to alpha, inspected, and saved under its pack directory.
- Assets with white fringes, malformed boundaries, or baked-in canvas margins are rejected/regenerated.
- Existing portrait upload/crop behavior is retained; no uploaded photo is converted into a movable mini-photo decal in v1.
- Test the asset catalogue, selected-pack default, cross-pack selection, eight-decal limit, placement transforms, reset/remove behavior, and export-layer ordering.
- Preserve existing non-customized card layouts and background sleeves.

## Out of scope for v1

- User-uploaded mini-photo stickers.
- Sticker drawing, text stickers, or freehand annotation.
- Cloud storage or sharing of uploaded source images.
- Automatic collision prevention; users may intentionally overlap content.
