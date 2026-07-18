# Fan ID decorated-frame progress — 2026-07-18

## What changed

The Fan ID card moved from an **individual sticker overlay** model to a **composed collectible sleeve** model for Kawaii decorations.

The previous approach placed separate vector-style objects around the live card. It made the stickers feel flat, disconnected from the card, and visually unreliable at the edges. It also competed with the portrait, archetype panel, barcode, and QR code.

The current Kawaii version uses one tall, pre-composed acrylic frame artwork behind the live card content. The live idol image, copy, data panels, barcode, and QR code remain real HTML layers above it.

## Before and after evidence

Reference captures supplied on 2026-07-18:

- `Screenshot 2026-07-18 at 6.08.40 AM.png` — Mono Cute: individual vector-like decorations. The character shapes read as pasted-on graphics and break the premium photocard illusion.
- `Screenshot 2026-07-18 at 6.08.34 AM.png` — Kawaii: a unified pink-and-lavender acrylic sleeve with ribbons, pearls, heart charms, and glass details. This is the desired quality direction.

## Why the Kawaii frame works

1. **One physical object, not many UI stickers.** The artwork reads as a translucent decorated holder enclosing the Fan ID.
2. **A real material language.** Clear acrylic, pearls, ribbon sheen, small metallic accents, and soft shadowing create a collectible-object feel.
3. **Clear hierarchy.** The idol portrait stays dominant. The archetype card stays a calm white data panel. Decoration lives in the gutters and lower tray instead of sitting on top of information.
4. **Intentional density.** The decoration is concentrated in connected clusters: a top flourish, a lower tray, and subtle edge accents. It does not scatter unrelated icons through the card.
5. **Clean rendering.** No cut-out fringe, white die-cut outline, or mismatched vector edge is exposed because the sleeve is rendered as a single composited asset.

## Design rules to preserve

- Decoration is optional. With Decorations off, the Kawaii card is calm and clean.
- A decorated theme should be one coherent frame/sleeve artwork, composited behind the live card content.
- Reserve the portrait interior, archetype copy, labels, barcode, and QR code as protected zones.
- Keep the visual weight to the card perimeter: top corners, vertical gutters, and lower tray are the preferred locations.
- Avoid emoji-like, flat SVG, or individually floating stickers for the premium frame treatment.
- Keep the artwork tall enough for the Fan ID’s portrait ratio so it does not visibly stretch.
- Theme color should support the product UI rather than replace it: Kawaii uses the existing pink/lavender palette; typography and card information remain recognizably KSTAR.

## Implementation decision

Kawaii Decorations use `public/fanid-themes/kawaii/decorated-frame-v1.png` via `FanIdDecorationFrame`. The image is mounted below live content and only when Decorations are enabled. The previous Kawaii sticker layer is deliberately suppressed.

## Next design pass

Use this Kawaii card as the quality bar for the remaining themes:

- Chrome: a restrained silver/chrome collectible sleeve with embossed stars or technical hardware, never loose metal stickers.
- Dreamy: a soft cloud, bubble, pearl, and translucent-glass sleeve with clear protected zones.
- Mono Cute: replace the current pasted vector objects with one black/ivory plush-and-chrome sleeve, using fewer but larger connected accents.

Each new theme should first be reviewed as one full-frame asset over the real live card before it is wired into the site.
