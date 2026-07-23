# Fan ID Custom Sticker Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a fan choose any of nine Fan ID editions, then place up to eight small, cleanly cut custom decals anywhere on the live card and exported PNG.

**Architecture:** Keep the existing theme sleeve as a background-only layer. Define each edition and its 20-item transparent decal catalogue in one typed data module. A reusable DOM overlay renders the saved card-relative transforms inside `FanIdCard`; an editor overlay adds native pointer drag, resize, rotate, and delete controls only while customizing. The wizard persists transforms alongside existing local photo records, so the rendered/exported card receives the same pure data.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, html-to-image, browser Pointer Events, IndexedDB local photo storage, generated transparent PNG assets.

## Global Constraints

- Keep all existing decorated sleeves strictly behind live card content; do not restore legacy foreground sticker overlays.
- Ship nine selectable editions: Chrome, Dreamy, Kawaii, Mono Cute, Ribbon Diary, Cherry Picnic, Blue Angel, Jelly Aquarium, and Dark Cherry.
- Every pack contains exactly 20 clean transparent PNG decals; the original four packs include their existing three curated decals and seventeen additional decals.
- A newly placed decal must be visually about 40% of the former foreground charms: its default on-card width is 13% of card width and it may be resized from 7% to 26%.
- A card supports at most eight placed decals. Decals may overlap every part of the card intentionally, including faces, text, and QR code.
- The sticker shelf defaults to the selected edition but permits choosing any other pack without changing the card edition.
- Placed decals must support click-to-add, drag, resize, rotate, and removal; the exact transforms must appear in downloaded and shared PNGs.
- User-provided idol pictures remain local-only, replace only the primary idol portrait, and retain existing crop/reposition controls. Do not create photo stickers.
- Do not add a dependency for drag/transform behaviour. Use native Pointer Events and existing React state.
- Preserve unrelated working-tree changes; stage only files that belong to this feature.

---

## File Structure

- `src/lib/fanIdThemes.ts` — nine visual edition presets.
- `src/lib/fanIdCustomStickers.ts` — typed asset catalogue, pack aliases, placement validation and defaults.
- `src/components/FanIdCustomStickerLayer.tsx` — export-safe transform renderer.
- `src/components/FanIdStickerEditor.tsx` — accessible shelf plus pointer gesture controls.
- `src/components/FanIdCard.tsx` — mounts the pure custom decal layer above the card's live content.
- `src/components/wizard/StepIssue.tsx` — saves sticker state, opens the shelf, and passes edit callbacks to the preview.
- `src/lib/wizardState.ts` — persists validated transforms in `kstar:wizard` and completed preferences.
- `src/components/FanIdDecorationFrame.tsx` — supports sleeves only where a composed background exists.
- `scripts/test-fanid-custom-stickers.ts` — catalogue and placement validation regression coverage.
- `scripts/test-fanid-stickers.ts` — adapt old sleeve checks so new surface-only editions are valid.
- `public/fanid-themes/<pack>/custom/*.png` — 20 alpha PNGs per pack.

### Task 1: Theme and sticker domain model

**Files:**
- Modify: `src/lib/fanIdThemes.ts`
- Create: `src/lib/fanIdCustomStickers.ts`
- Modify: `src/lib/wizardState.ts`
- Create: `scripts/test-fanid-custom-stickers.ts`

**Interfaces:**
- Produces `CustomStickerPackId`, `CustomStickerAsset`, `PlacedCustomSticker`, `CUSTOM_STICKER_PACKS`, `MAX_CUSTOM_STICKERS`, `makePlacedSticker()`, `normalizePlacedStickers()`.
- `PlacedCustomSticker` is `{ id: string; assetId: string; packId: CustomStickerPackId; x: number; y: number; scale: number; rotation: number }`, where x/y are percentage center coordinates.

- [ ] **Step 1: Write failing catalogue and normalization assertions**

```ts
assert.equal(Object.keys(CUSTOM_STICKER_PACKS).length, 9);
for (const pack of Object.values(CUSTOM_STICKER_PACKS)) assert.equal(pack.assets.length, 20);
assert.deepEqual(normalizePlacedStickers([{ id: "a", assetId: "chrome-heart", packId: "chrome", x: 50, y: 50, scale: 0.13, rotation: 0 }]).length, 1);
assert.equal(normalizePlacedStickers(Array.from({ length: 9 }, (_, n) => ({ id: String(n), assetId: "chrome-heart", packId: "chrome", x: 50, y: 50, scale: .13, rotation: 0 }))).length, 8);
```

- [ ] **Step 2: Run the new test and verify it fails because the module does not exist**

Run: `npx tsx scripts/test-fanid-custom-stickers.ts`

- [ ] **Step 3: Add all nine `FanIdTheme` presets and the full catalogue**

```ts
export const MAX_CUSTOM_STICKERS = 8;
export function makePlacedSticker(asset: CustomStickerAsset, id: string): PlacedCustomSticker {
  return { id, assetId: asset.id, packId: asset.packId, x: 50, y: 50, scale: 0.13, rotation: 0 };
}
```

The 20 asset subjects per pack are:

| Pack | Decal subjects |
|---|---|
| Chrome | wire heart, compass star, Saturn charm, chrome dice, safety pin, micro chain, silver cassette, star key, crystal bolt, tiny padlock, wing charm, chrome bow, spiked heart, moon disc, tag, gem star, ring pull, lightning, pearl stud, barcode tab |
| Dreamy | cloud pearls, moon star, galaxy locket, sleepy cloud, rainbow charm, bubble cluster, angel wing, blue bow, shooting star, lavender heart, shell, glass droplet, crescent, tiny planet, cloud ribbon, pearl flower, star wand, snowflake, soft key, sparkle gem |
| Kawaii | butterfly, heart locket, strawberry cake, ribbon bow, cherry pair, glossy star, tiny panda, paw heart, candy, flower button, bunny charm, ribbon tag, peach, kitty mug, star cookie, jelly heart, milk carton, mini camera, strawberry, bubble wand |
| Mono Cute | black cat, heart pin, gingham bow, checker star, ghost, ribbon tag, black heart, safety pin, dice, moon, tiny skull bow, white flower, camera, star patch, cat paw, bow key, checker cherry, monochrome bear, barcode charm, lightning heart |
| Ribbon Diary | satin bow, pressed flower, pearl heart, diary tab, ballet shoe, lace rosette, cameo, ribbon tag, perfume bottle, pearl chain, mini envelope, button flower, lipstick charm, tulip, sticker stamp, mirror, tiny tiara, bow clip, heart lock, scallop label |
| Cherry Picnic | strawberry, cherry pair, gingham bow, dessert fork, cake slice, jam jar, picnic basket, clover, cherry pie, red ribbon, tiny teacup, milk bottle, strawberry milk, flower, heart cookie, checker tab, berry charm, sun, gingham heart, picnic ticket |
| Blue Angel | crystal heart, angel wing, blue ribbon, star halo, pearl drop, moon, cloud, silver cross, icy butterfly, locket, angel bow, crystal star, winged key, blue rose, snowflake, tiny crown, ribbon heart, dove, harp, blue gem |
| Jelly Aquarium | bubble, shell, jellyfish, pearl, fish charm, starfish, seahorse, aqua bow, coral, tiny whale, glass heart, mermaid tail, clam locket, water droplet, sea angel, shell flower, bubble wand, aquarium ticket, moonfish, crystal bead |
| Dark Cherry | wine bow, black cherry, lace heart, lock, razor-heart charm, thorn rose, glossy star, red lipstick, gothic ribbon, chain heart, black pearl, dice, key, red cross, tiny bat, heart flame, dark rose, plaid bow, wine glass, black cameo |

- [ ] **Step 4: Validate and persist only safe sticker fields**

```ts
export function normalizePlacedStickers(value: unknown): PlacedCustomSticker[] {
  // retain known asset/pack pairs only; clamp x/y 0..100, scale .07..26 and rotation -180..180; trim to MAX_CUSTOM_STICKERS
}
```

- [ ] **Step 5: Run domain tests and commit**

Run: `npx tsx scripts/test-fanid-custom-stickers.ts`
Expected: exit code 0.

Commit: `git add src/lib/fanIdThemes.ts src/lib/fanIdCustomStickers.ts src/lib/wizardState.ts scripts/test-fanid-custom-stickers.ts && git commit -m "feat: add Fan ID sticker catalogue"`

### Task 2: Generate the transparent decal library

**Files:**
- Create: `public/fanid-themes/{chrome,cloudy-dreamy,kawaii,monochrome-cute,ribbon-diary,cherry-picnic,blue-angel,jelly-aquarium,dark-cherry}/custom/*.png`

- [ ] **Step 1: Generate each asset individually with a clean chroma matte**

Use this exact prompt contract for each subject: `single isolated <subject>, premium collectible Korean photocard decoration, polished physical charm or resin sticker, compact object, centered with generous empty padding, crisp cut silhouette, no die-cut white border, no text, no person, no card frame, no shadow, flat solid #00ff00 background`.

- [ ] **Step 2: Remove the chroma matte and validate alpha**

Run for every generated source: `python "$HOME/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py" --input SOURCE --out TARGET --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.

- [ ] **Step 3: Verify count and alpha for every pack**

Run: `for d in public/fanid-themes/*/custom; do test $(find "$d" -name '*.png' | wc -l | tr -d ' ') -eq 20; done`

- [ ] **Step 4: Commit generated assets**

Commit: `git add public/fanid-themes/*/custom && git commit -m "feat: add Fan ID custom sticker packs"`

### Task 3: Pure export-safe decal layer

**Files:**
- Create: `src/components/FanIdCustomStickerLayer.tsx`
- Modify: `src/components/FanIdCard.tsx`
- Modify: `src/components/FanIdDecorationFrame.tsx`
- Modify: `scripts/test-fanid-stickers.ts`

**Interfaces:**
- `FanIdCard` gains `customStickers?: readonly PlacedCustomSticker[]`.
- `FanIdCustomStickerLayer({ stickers }: { stickers: readonly PlacedCustomSticker[] })` mounts individual `<img>` elements at `z-20`, absolute transform `translate(-50%, -50%) rotate(...) scale(...)`, and `pointer-events-none`.

- [ ] **Step 1: Add a failing static render assertion**

```ts
assert.match(markup, /data-fanid-custom-sticker="chrome-wire-heart"/);
assert.match(markup, /transform:translate\(-50%, -50%\) rotate\(12deg\) scale\(0.13\)/);
```

- [ ] **Step 2: Render custom decals above live content while retaining existing sleeves behind it**

```tsx
<FanIdDecorationFrame themeId={decorationThemeId} enabled={decorationsEnabled} />
{/* header and main use z-10 */}
<FanIdCustomStickerLayer stickers={customStickers ?? []} />
```

- [ ] **Step 3: Update sleeve assertions so only the original four themes require a composed sleeve**

- [ ] **Step 4: Run static render tests and commit**

Run: `npm run test:fanid-stickers && npx tsx scripts/test-fanid-custom-stickers.ts`

Commit: `git add src/components/FanIdCustomStickerLayer.tsx src/components/FanIdCard.tsx src/components/FanIdDecorationFrame.tsx scripts/test-fanid-stickers.ts && git commit -m "feat: render custom Fan ID decals"`

### Task 4: Interactive decal shelf and controls

**Files:**
- Create: `src/components/FanIdStickerEditor.tsx`
- Modify: `src/components/FanIdCard.tsx`

**Interfaces:**
- `FanIdStickerEditor` props: `{ selectedThemeId: CustomStickerPackId; stickers: readonly PlacedCustomSticker[]; onChange(stickers: PlacedCustomSticker[]): void }`.
- `FanIdCard` gains optional `editableCustomStickers?: { selectedId: string | null; onSelect(id: string): void; onTransform(id: string, patch: Partial<PlacedCustomSticker>): void; onRemove(id: string): void }`.

- [ ] **Step 1: Render a pack selector and a 20-item click-to-add shelf**

```tsx
button onClick={() => onChange([...stickers, makePlacedSticker(asset, crypto.randomUUID())])}
disabled={stickers.length >= MAX_CUSTOM_STICKERS}
```

- [ ] **Step 2: Add Pointer Event drag, resize and rotate math in percentage units**

```ts
const rect = card.getBoundingClientRect();
const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
```

Drag updates x/y. The resize handle maps radial distance from center to scale .07–.26. The rotation handle maps `atan2` to degrees -180–180. Controls must have `touch-action: none`, `setPointerCapture`, visible focus rings, and buttons labelled Remove, Make smaller, Make larger, Rotate left, Rotate right.

- [ ] **Step 3: Ensure only editor controls are interactive**

The export-safe layer remains the canonical renderer. When edit mode is active, use an identical image transform with a focus outline and controls; when inactive it renders only the pure layer. Never use CSS transform scaling that changes image aspect ratio.

- [ ] **Step 4: Add static interaction-level tests**

```ts
assert.equal(MAX_CUSTOM_STICKERS, 8);
assert.equal(normalizePlacedStickers([{ /* bad transform */ }])[0].scale, .07);
```

- [ ] **Step 5: Run tests and commit**

Run: `npx tsx scripts/test-fanid-custom-stickers.ts && npx tsc --noEmit`

Commit: `git add src/components/FanIdStickerEditor.tsx src/components/FanIdCard.tsx scripts/test-fanid-custom-stickers.ts && git commit -m "feat: add Fan ID decal editor"`

### Task 5: Wizard integration, local idol uploads, and export

**Files:**
- Modify: `src/components/wizard/StepIssue.tsx`
- Modify: `src/lib/wizardState.ts`
- Modify: `src/components/FanIdPhotoStudio.tsx` only if the idol upload action lacks clear primary-photo copy.
- Modify: `scripts/test-fanid-custom-stickers.ts`

- [ ] **Step 1: Read initialized sticker state from the wizard and pass it to both printing and customize cards**

```tsx
const [customStickers, setCustomStickers] = useState(wiz.customStickers ?? []);
<FanIdCard customStickers={customStickers} editableCustomStickers={editorProps} />
```

- [ ] **Step 2: Save every editor update through `saveWizard` and show the shelf below the background sleeve switch**

The background sleeve switch remains available and independently controls only the existing sleeve. Add an explicit `Custom stickers` section with pack tabs defaulting to `wiz.themeId`, a visible `0 / 8` counter, and copy saying stickers can cover the card intentionally.

- [ ] **Step 3: Preserve user-selected primary idol uploads**

Use existing `FanIdPhotoStudio` idol records keyed by current `heroId`; it already renders edited/repositioned image previews as `idolPreviewSources[heroId]`. Make its visible action say “Upload your own idol photo” / “上傳自己的偶像照片”, and do not add any photo-as-sticker capability.

- [ ] **Step 4: Exercise export source compatibility**

Ensure every custom decal is an actual `<img>` within `cardRef`, has decoded before `exportNode`, and has no editor handles inside the ref during export. Add `data-fanid-custom-sticker` assertions in the static test.

- [ ] **Step 5: Run all validation, inspect the card locally, and commit**

Run: `npm run test:fanid-stickers && npx tsx scripts/test-fanid-custom-stickers.ts && npx tsc --noEmit && npm run build && git diff --check`

Commit: `git add src/components/wizard/StepIssue.tsx src/lib/wizardState.ts src/components/FanIdPhotoStudio.tsx scripts/test-fanid-custom-stickers.ts && git commit -m "feat: customize Fan ID with decals"`

### Task 6: Whole-feature review

- [ ] **Step 1: Confirm the code has all nine edition tabs and every shelf defaults to current edition.**
- [ ] **Step 2: Confirm exactly 20 readable alpha PNGs per pack and no foreground auto-placement.**
- [ ] **Step 3: Confirm drag, resize, rotate, removal, intentional overlap, 8-item cap, saved state, uploads and export meet the global constraints.**
- [ ] **Step 4: Run `npm run test:fanid-stickers && npx tsx scripts/test-fanid-custom-stickers.ts && npx tsc --noEmit && npm run build && git diff --check` and record exact output.**
