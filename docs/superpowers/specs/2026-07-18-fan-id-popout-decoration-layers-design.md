# Fan ID pop-out decoration layers design

## Goal

Make every Fan ID theme feel like a premium decorated digital photocard without covering live information. Decorations remain optional and art-directed: each theme has one fixed composition, not user-draggable stickers.

## Approved direction

- Apply this system to Chrome, Dreamy, Kawaii, and Mono Cute.
- Decorations should feel physically present and may enter visually empty regions of the portrait, archetype panel, or footer.
- Decorations must never obscure rendered text, score bars, barcode strokes, the QR code, the owner avatar, or the idol/user face.
- Preserve an undecorated, clean version of every theme when Decorations is off.

## Two-layer model

Each decorated theme has two composited assets inside the clipped Fan ID body:

1. **Sleeve layer** — a full-height raster backing at `z-0`. It supplies the physical holder, edge material, lower tray, shadows, and connected perimeter objects. This is the dominant “collectible object” layer.
2. **Pop-out layer** — a transparent PNG at `z-20`, mounted above live content but restricted to pre-approved open zones. It supplies a very small number of foreground objects with a real cast shadow: for example, a bow or charm crossing a blank panel edge. It never uses standalone SVG stickers.

The existing header/main content remains at `z-10`. The pop-out layer itself contains only pre-composed artwork; it is not a user interaction surface.

## Protected and permitted zones

Protected at every viewport and all three card layouts:

- Portrait face and duo owner-avatar circle.
- Portrait name and edition label.
- Archetype heading, code, name, rarity, signal bars, and complement line.
- Footer holder/bias/issue text, barcode strokes, and QR code.

Permitted pop-out zones:

- Portrait outer corners and frame lip.
- Left/right gutters.
- Wide blank margins around the archetype card.
- Footer corner regions outside the barcode/QR safe rectangles.

## Theme art direction

### Chrome

Brushed silver polycarbonate collector sleeve, beveled technical corner plates, a small chrome star clip and chain detail, thin cobalt iridescent glint. Foreground: one metallic star or hinged hardware piece touching a portrait corner. No scattered stars and no cyberpunk HUD clutter.

### Dreamy

Pale blue-lilac translucent sleeve, puffy cloud edge, frosted bubble beads, pearl crescent, and a soft prism ribbon. Foreground: one opaque pearlescent moon/cloud charm in an open side gap. Avoid flat cartoon clouds and avoid mist over text.

### Kawaii

Retain the approved pink/lavender acrylic sleeve with bows, pearls, hearts, and glass details. Add a restrained foreground charm cluster only if it improves depth: a satin bow and heart charm crossing an empty outer edge, never the card copy.

### Mono Cute

Black/ivory soft-plush and smoked-chrome sleeve, gingham fabric rail, one glossy black bow, and one sculptural black cat or star charm. Foreground: a single black bow or paw charm with believable shadow near an open portrait/footer corner. No pasted vector mascots or dense cartoon icons.

## Asset contract

- Background sleeve: `public/fanid-themes/<theme>/decorated-sleeve-v1.png`.
- Foreground pop-out: `public/fanid-themes/<theme>/decorated-popout-v1.png` with alpha transparency.
- No baked live data, text, idols, barcode, QR, or panel copy in either asset.
- Foreground assets use opaque ornaments only; chroma-key removal is acceptable because they avoid fragile translucent glass edges.
- Asset geometry follows the live Fan ID’s tall portrait ratio. The sleeve may be stretched only minimally; source art is generated tall enough to avoid visible distortion.

## Code contract

- `FanIdDecorationFrame` selects both assets by the four valid `FanIdThemeId` values and returns nothing if disabled.
- `FanIdCard` uses `data-card-sticker-architecture="two-layer-frame"` for a decorated theme and renders no legacy `FanIdStickerLayer` markup for those themes.
- Foreground art is clipped within the card and has `pointer-events: none`.
- The existing export path captures both layers.

## Verification

- Every theme toggles clean/decorated correctly in Idol, Idol + User, and User modes.
- Tests assert the two raster decoration nodes, their z-order, no legacy SVG overlays, and all four source paths.
- Inspect browser preview at the narrow desktop/mobile card scale for no overlap with protected zones.
- Run sticker checks, media checks, TypeScript, production build, and whitespace checks.
