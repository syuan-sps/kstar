# Fan ID Local Media and Sticker Customization Design

**Date:** 2026-07-15  
**Status:** Approved design; implementation not started  
**Supersedes at the product level:** `2026-07-15-optional-sticker-bomb-design.md`

## Goal

Turn the Fan ID issue step into a personal photocard studio without making the core card confusing or dependent on damaged image assets. Users can optionally enable a dense, theme-specific sticker treatment, replace any of their four selected idols' Fan ID portraits with photos from their own device, and frame both idol and user photos precisely before export.

All uploaded media is processed and stored in the user's browser. The website does not upload, host, or analyze it. This local-only design reduces the site's handling of user-selected images, but the product must not claim that local processing automatically makes every use copyright-safe. The interface should remind users to choose images they have permission to use.

## Approved decisions

- Sticker decoration is one automatic on/off preference, not a manual sticker editor.
- Sticker mode defaults to off and becomes intentionally maximal when enabled.
- Sticker compositions are theme-specific, deterministic, and made from SVG/CSS vectors.
- Two or three stickers may overlap a portrait edge, but protected content and face regions remain clear.
- Each of the four selected idols can have its own optional local replacement photo.
- Idol replacements affect only Fan ID surfaces and exports, never catalog, search, profile, or discovery images.
- The user's one local source photo supports independent full-portrait and circular-avatar framing.
- Original locally processed sources remain available for readjustment after refresh.
- Large media blobs do not enter `localStorage` or application preferences.

## Scope

### Included

- Four existing card editions: Chrome, Dreamy, Kawaii, and Mono Cute.
- Three existing card layouts: Idol, Idol + User, and User.
- A persistent `Sticker bomb` / `貼紙裝飾` toggle.
- Per-idol `Replace photo`, `Adjust`, and `Use original` actions.
- User-photo upload, removal, and separate portrait/avatar crop presets.
- Drag-to-position, zoom, reset, cancel, and confirm controls.
- Browser-only persistence using IndexedDB.
- Preview and card/story export parity.
- Local-photo removal controls and clear failure messaging.

### Not included

- Dragging, rotating, selecting, purchasing, or unlocking individual stickers.
- User-uploaded sticker graphics.
- Random sticker layouts or a density slider.
- Applying custom idol photos outside Fan ID experiences.
- Uploading media to an API, Supabase, analytics, or any third-party service.
- HEIC/HEIF decoding, filters, retouching, face detection, or AI editing.
- A claim that local processing resolves all copyright or usage-right questions.

## Customization flow

Reorder the StepIssue customization panel into the sequence users naturally decide:

1. **Card edition** — Chrome, Dreamy, Kawaii, or Mono Cute.
2. **Card layout** — Idol, Idol + User, or User.
3. **Featured idol** — choose one of the four selected idols.
4. **Your photos** — manage idol replacements and the user's photo.
5. **Decorations** — turn the curated sticker composition on or off.
6. **Cardholder name and export** — preserve the existing identity and export actions.

The card preview remains above the controls and updates immediately after a confirmed edit. Uploading or cropping never changes the selected theme, layout, featured idol, or sticker preference.

## Your photos section

`Your photos` is a collapsible section so the default issue screen remains manageable. Its collapsed summary states whether the card uses catalog images, custom idol images, a user image, or both.

### Idol replacements

Show the four selected idols as compact tiles. Each tile contains the currently effective thumbnail, idol name, and status:

- `Original` when the catalog image is active.
- `Custom · on this device` when a local replacement exists.

Available actions are:

- `Replace photo` when no custom image exists.
- `Adjust` and `Use original` when a custom image exists.

Selecting a custom tile as the featured idol immediately makes its confirmed replacement the Fan ID hero. Selecting an idol without a replacement falls back to its catalog image. Replacements are keyed by idol ID, so switching the featured idol never assigns one idol's image to another.

### User photo

Store one user source image locally. It can produce two independent confirmed framings:

- `user-portrait`: the full portrait used by the User layout.
- `user-avatar`: the circular badge used by Idol + User.

The active card layout determines which framing the editor opens first. If the other framing already exists, the editor offers a secondary preview tab so users can inspect or adjust it without uploading again. Changing one crop does not alter the other.

The Idol + User and User layouts continue to require the appropriate confirmed user crop before export. A missing user crop does not delete or invalidate idol replacements.

### Privacy copy and removal

Place a concise label in this section:

> Stored only in this browser. Nothing is uploaded.

Add a secondary note near the file chooser:

> Choose a photo you have permission to use.

Provide `Remove photo` at the individual record level and `Remove all local photos` at the section level. The destructive all-media action requires confirmation and clears only Fan ID media for the current card identity. It does not change idol picks, quiz results, themes, layouts, or the sticker preference.

## Photo editor

Replace the single-purpose `FacePhotoPicker` interaction with a reusable `LocalPhotoEditor`. Keep `FacePhotoPicker` as a thin compatibility wrapper for existing non-StepIssue callers until those surfaces are migrated separately.

The editor opens as a bottom sheet on narrow mobile screens and as a centered dialog on wider screens. The card preview remains visible or immediately reachable without losing edits.

The editor includes:

- The exact destination shape and aspect ratio.
- Drag-to-position.
- Zoom from 1× to 3×.
- Reset framing.
- `Cancel` and `Use this framing`.
- The destination label: idol portrait, user portrait, or user avatar.
- An original/custom comparison when replacing an existing crop.

Idol and user portrait crops use the Fan ID hero frame's real aspect ratio rather than the current generic 3:4 ratio. Avatar editing uses a circular mask while retaining a square crop output. The confirmed preview must match the card frame exactly.

The editor does not mutate saved media until confirmation. Cancel, decode failure, crop failure, or storage failure preserves the previous confirmed image.

## Media processing and limits

Accept JPEG, PNG, and WebP. Unsupported files receive a specific format message instead of a generic failure.

Before persistence:

1. Validate MIME type and file size.
2. Decode locally and apply browser-supported orientation handling.
3. Reject unreadable images and images beyond a documented decoded-pixel ceiling.
4. Downsample the locally retained source to a maximum 4096px long edge.
5. Re-encode the retained source to remove unnecessary metadata and reduce memory/storage pressure.
6. Generate destination-specific preview blobs only after confirmation.

The limits are 15MB per input file and 40 megapixels before downsampling. These limits accommodate typical modern phone photos while preventing accidental memory exhaustion. Copy must explain how to recover: choose a JPEG, PNG, or WebP under 15MB.

The implementation must never send filenames, image bytes, crop coordinates, or preview blobs to analytics. Local `blob:` and `data:` URL reads used for canvas/export are allowed; network-addressed uploads are not.

## Local persistence architecture

Create a focused `src/lib/fanIdMediaStore.ts` browser module backed by IndexedDB. Use a versioned database and one media object store. Keep all IndexedDB access behind a small typed API so React components do not manipulate transactions directly.

Each record is associated with the existing stable Fan ID serial and a media role:

```ts
type FanIdMediaRole =
  | { kind: "idol"; idolId: string }
  | { kind: "user" };

type FanIdCropKind = "idol-portrait" | "user-portrait" | "user-avatar";

interface FanIdCropPreset {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: { x: number; y: number; width: number; height: number };
}

interface FanIdMediaRecord {
  key: string;
  cardSerial: string;
  role: FanIdMediaRole;
  source: Blob;
  sourceWidth: number;
  sourceHeight: number;
  crops: Partial<Record<FanIdCropKind, FanIdCropPreset>>;
  previews: Partial<Record<FanIdCropKind, Blob>>;
  updatedAt: number;
}
```

The store API provides read, save, remove-one, and remove-all-for-card operations. Keys are derived by one validated helper from card serial, role, and idol ID. Callers never construct raw keys.

`WizardState` and `UserPrefs` continue to hold only lightweight fields. Both persist `stickersEnabled` and the existing card serial; neither contains base64 images, object URLs, raw blobs, or crop pixel data. The serial acts as the link to the local media collection after refresh or wizard completion.

When media is loaded, a dedicated hook or StepIssue coordinator converts confirmed preview blobs to temporary display URLs/data URLs, revokes obsolete URLs, and passes resolved sources to card components. While IndexedDB is loading, the card uses catalog imagery and a neutral user-photo loading state rather than flashing a broken image.

## Card image resolution rules

Image choice is deterministic:

### Idol layout

1. Use the featured idol's confirmed `idol-portrait` preview when present.
2. Otherwise use the featured idol's catalog image and catalog focus.

### Idol + User layout

1. Use the same idol resolution rule for the hero.
2. Use the confirmed `user-avatar` preview for the circular badge.
3. Disable export until `user-avatar` exists.

### User layout

1. Use the confirmed `user-portrait` preview as the hero.
2. Disable export until `user-portrait` exists.

These replacements affect only `FanIdCard` presentations and Fan ID exports. Other components continue using catalog `ArtistLite.image_url` values.

## Sticker decoration

Preserve the approved automatic sticker-bomb direction:

- Add `stickersEnabled?: boolean`, normalized to `false` for older state.
- Use one accessible toggle with localized label and supporting copy.
- Render 10–14 deterministic vector charms per theme.
- Keep the runtime independent of damaged raster crops under `public/fanid-themes/`.
- Use existing reference sheets only for silhouette, material, and palette direction.

Theme vocabulary:

- **Chrome:** liquid-metal hearts, orbital stars, chain links, a safety-pin charm, chrome sparkles, and reflective beads.
- **Dreamy:** pearlescent moons, clouds, translucent stars, bubbles, and pastel sparkles.
- **Kawaii:** resin bows, candy hearts, pearls, butterflies, flowers, and glossy stars.
- **Mono Cute:** black hearts, gingham bows, cats, ghosts, black chrome stars, and white pearls.

The layer uses a normalized SVG coordinate system and explicit placement data. It is `pointer-events: none`, `aria-hidden`, clipped to the downloadable card canvas, and rendered in the same DOM tree used by the export path.

### Protected zones

- Header title and serial.
- Central face-safe region in the hero image.
- User-avatar circle in Idol + User.
- Archetype heading and score module.
- Holder identity, barcode, QR code, and issue date.

Large edge charms may overlap the portrait frame by approximately 8–14px. Small fillers occupy rails and corners. No sticker may create a rectangular crop, white fringe, or export-edge clipping.

## Component boundaries

- `FanIdStickerLayer`: renders only the vector decoration from `themeId`, `cardMode`, and `enabled`.
- `LocalPhotoEditor`: edits one source and one destination crop without persistence knowledge.
- `fanIdMediaStore`: owns IndexedDB schema, record validation, and media CRUD.
- `useFanIdLocalMedia`: loads records, manages temporary URLs, invokes local processing, and exposes resolved photos/actions.
- `StepIssue`: arranges controls and passes resolved state into the card.
- `FanIdCard`: remains presentational; it receives resolved idol/user image sources and renders no file picker or storage logic.

Changing storage internals must not require changing `FanIdCard`. Changing vector sticker shapes must not affect media storage or cropping.

## Error handling

- **Unsupported type:** explain accepted formats.
- **File too large:** state the 15MB limit.
- **Decode failure:** keep the prior confirmed image and invite another file.
- **Crop/canvas failure:** keep the editor open and allow reset or cancellation.
- **IndexedDB unavailable or quota exceeded:** preserve the current card and explain that the browser could not save the photo locally.
- **Stale or invalid record:** ignore it, fall back to the catalog image, and allow replacement.
- **Missing preview with a valid source:** regenerate the preview from the saved source and crop preset.
- **Export failure:** retain the existing generic export fallback; local images must already be decoded before capture.

No failure in optional media or sticker rendering may corrupt quiz results, selected idols, card identity, or wizard navigation.

## Accessibility and responsive behavior

- Every photo action is a real button with visible keyboard focus.
- Status is communicated in text, not color alone.
- The cropper exposes a labeled zoom slider and keyboard-operable controls.
- The circular mask is visual; its accessible label names the avatar destination.
- Dialog/bottom-sheet focus is contained while open and returns to its triggering tile when closed.
- Decorative SVGs are hidden from assistive technology.
- Any decorative motion respects `prefers-reduced-motion` and becomes static during export.
- The photo tile grid, editor, and sticker toggle remain usable at the current narrow mobile preview width.

## Verification strategy

Add small test-first checks using the existing `tsx` tool and Node assertions for pure modules:

- Media key construction rejects unsafe card serials and idol IDs.
- Stored crop values require finite coordinates and zoom within bounds.
- Invalid or stale records normalize to no replacement.
- Image resolution chooses custom hero, custom avatar, or catalog fallback correctly for all three layouts.
- Older wizard state defaults sticker decoration to off.
- Sticker compositions have unique IDs, valid normalized bounds, valid layers, and theme fallback.

Browser verification covers behavior that depends on real canvas and IndexedDB:

- Upload and crop JPEG, PNG, and WebP fixtures.
- Confirm unsupported and oversized files preserve prior media.
- Refresh and reopen each saved original for readjustment.
- Switch among all four idols and verify per-idol replacement isolation.
- Verify independent user portrait and avatar crops.
- Remove one photo and then all photos.
- Toggle stickers in all four themes and all three card layouts.
- Inspect face, text, avatar, barcode, and QR protected zones at desktop and mobile widths.
- Export decorated and undecorated card/story PNGs and compare them with the live preview.
- Observe network activity while choosing and cropping a local photo; no image upload request may occur.
- Confirm no console errors, broken images, white fringes, or cropped outer stickers.

Static gates remain:

- `npx tsc --noEmit`
- `npm run build`
- `npm run lint` for changed files or the repository when existing lint state permits
- `git diff --check`

## Success criteria

The feature is complete when a user can replace any selected idol's Fan ID portrait, precisely adjust that photo, use one user source with independent portrait/avatar framing, refresh without losing confirmed local edits, optionally add an abundant theme-specific sticker perimeter, and export a card that exactly matches the preview. The website must not upload the user's media, the clean card must remain the default, and all protected information must stay readable.
