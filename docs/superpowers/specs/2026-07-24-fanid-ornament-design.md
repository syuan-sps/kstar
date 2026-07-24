# Fan ID Ornament — Chrome First Pass

## Goal

Add an optional, static ornament layer to the existing Fan ID card. It lives inside the card's structural rails and plate bands, behind all content panels. The layer is enabled by default and can be turned off in the Style tab.

## Scope

This first pass implements the Chrome theme only. Other themes retain their current appearance until their own motif sets are designed.

## Visual design

The ornament layer borrows the restraint and material language of the prior Chrome collector-frame experiments without recreating a physical holder or changing the card's dimensions:

- slim blue signal lines in the top and bottom plate bands;
- a small chrome starburst in one corner of the structural layer;
- sparse, inset rivet dots along the empty side rails;
- a pale metallic inlay/edge highlight that stays below the content panels.

No ornament may overlap the hero photo, archetype panel, footer, sticker canvas, controls, or export boundary.

## Interaction and state

- Add `showOrnament` to persisted Fan ID wizard state; default it to `true` for new and existing cards that have no saved value.
- Add a single Style-tab switch labeled Ornament.
- The switch only hides/shows the internal ornament layer. It does not affect card theme, stickers, card layout, photo state, or card size.

## Component boundary

- Create a dedicated `FanIdOrnamentLayer` presentation component.
- `FanIdCard` receives a `showOrnament` boolean and renders that layer before the existing content surface and sticker layers.
- The layer is `aria-hidden` and `pointer-events-none`.

## Verification

- Typecheck and production build pass.
- Confirm the toggle changes only the Chrome card's internal rails/bands.
- Confirm card export contains the ornament when on and excludes it when off.
