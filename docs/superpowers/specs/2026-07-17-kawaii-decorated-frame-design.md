# Kawaii Decorated Frame Design

## Goal

Replace the current flat SVG Kawaii sticker composition with one polished, generated Kawaii photocard sleeve that appears only when the existing Fan ID **Decorations** control is enabled. The live Fan ID remains fully dynamic and exportable.

## User-approved direction

- Theme: Kawaii only, for the first production frame.
- Density: a middle ground between isolated corner decorations and a fully crowded four-edge sticker wall.
- Art direction: translucent pink acrylic case; layered satin bows, pearl beads, heart charms, clear flower resin, and restrained lavender/iridescent accents.
- The tall regenerated concept at `.codex/generated_images/019f64f3-6511-7e41-b2ac-e312e99eb9c0/exec-9907965a-01af-4715-8446-0eddae0151a6.png` is the source artwork to adapt into the project. It matches the live Fan ID's narrow portrait direction and must not be stretched.
- Decorations toggle behavior: **off** retains the clean Kawaii edition; **on** shows the decorated sleeve.

## Rendering model

1. Export a project-local PNG background derived from the approved source at the Fan ID aspect ratio, with the card silhouette fully contained and a clean central opening.
2. Mount the background as an absolutely positioned, non-interactive, clipped image inside `FanIdCard` when `themeId === "kawaii" && stickersEnabled`.
3. Keep all existing live content above it: header, selected idol/user portrait, archetype panel, score bars, holder, barcode, QR, and issue metadata.
4. Disable the existing Kawaii SVG composition when the generated sleeve is visible; the generated sleeve is a replacement, not an additional layer.
5. Preserve SVG decorations for Chrome, Dreamy, and Mono Cute until those themes receive approved frame assets.

## Layout and safety contract

- The background fills the card without visible seams or aspect-ratio distortion.
- The inner portrait, archetype, and footer panels retain their current z-order and readable contrast.
- No ornament may cover the face, the duo owner avatar, archetype details, barcode, QR code, or issue metadata.
- The asset is decorative only: no baked text, QR code, barcode, photo, user data, or card state.
- The same DOM asset must be visible in the preview and included in `exportNode` output.

## Asset and fallback behavior

- Target path: `public/fanid-themes/kawaii/decorated-frame-v1.png`.
- Asset stays a raster background, not an image map and not independently draggable stickers.
- If the image fails to load, the Kawaii card continues rendering cleanly with no broken-image UI.
- Existing broken raster sticker crops are not used.

## Verification

- Toggle Decorations off/on in Kawaii for Idol, Idol + User, and User layouts.
- Confirm all photo, data, QR, and barcode layers remain readable and are above the sleeve.
- Confirm Chrome, Dreamy, and Mono Cute retain their current behavior.
- Export one decorated Kawaii card and compare it with the preview.
- Run focused sticker checks, TypeScript, build, and whitespace checks.
