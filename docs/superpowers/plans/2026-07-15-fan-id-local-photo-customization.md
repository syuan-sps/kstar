# Fan ID Local Photo Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users replace each selected idol's Fan ID portrait and frame one user photo independently for portrait and avatar use, with all media processed and persisted only in the browser.

**Architecture:** Keep media validation, keys, crop types, and card-photo selection in a pure module; keep IndexedDB behind a typed store; keep canvas work in a browser-only processor; and expose persisted media through one hook. A focused photo-studio component owns upload/edit UI, while `FanIdCard` remains a presentational consumer of resolved image sources.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript 5, Tailwind CSS 4, `react-easy-crop` 6, IndexedDB, Canvas 2D, `tsx` + Node assertions, `fake-indexeddb` for store tests, and the existing `html-to-image` export path.

## Execution order and current state

Execute the remaining tasks in `docs/superpowers/plans/2026-07-15-optional-sticker-bomb-plan.md` first. At plan-writing time, the sticker composition model, SVG renderer, wizard preference, and `FanIdCard` integration already exist; the StepIssue toggle, visual polish, and final sticker verification remain. This plan assumes `[data-sticker-toggle]` and `stickersEnabled` are present and preserves them while reorganizing StepIssue.

## Global constraints

- Idol replacements affect Fan ID surfaces and exports only; never mutate `ArtistLite.image_url` or catalog data.
- Store source and preview blobs in IndexedDB, never `localStorage`, `UserPrefs`, analytics, Supabase, or a network API.
- Accept JPEG, PNG, and WebP only.
- Reject files over 15MB or decoded images over 40 megapixels before downsampling.
- Downsample retained sources to a maximum 4096px long edge and strip metadata through canvas re-encoding.
- Keep one idol portrait crop per selected idol and independent `user-portrait` and `user-avatar` crops from one user source.
- Use the actual Fan ID hero ratio, `4 / 4.55`, for portrait crops and `1` for the circular avatar crop.
- Cancel, decode failure, crop failure, and storage failure preserve the previous confirmed image.
- The clean/catalog image remains the fallback whenever local media is unavailable or invalid.
- Preview and exported PNG must resolve the same confirmed preview blobs.
- Keep existing sticker decoration, card modes, theme selection, photo export gating, and unrelated dirty worktree changes intact.
- Use stable `data-*` attributes listed below for browser verification.

## File map

- Create `src/lib/fanIdMedia.ts`: pure media types, validation, key generation, and card-photo resolution.
- Create `src/lib/fanIdMediaStore.ts`: versioned IndexedDB CRUD only.
- Create `src/lib/fanIdPhotoProcessing.ts`: browser file validation, decode/downsample, and crop rendering.
- Create `src/hooks/useFanIdLocalMedia.ts`: React loading state, preview data URLs, and store actions.
- Create `src/components/LocalPhotoEditor.tsx`: reusable crop editor UI.
- Create `src/components/FanIdPhotoStudio.tsx`: per-idol and user-photo controls, dialog/sheet state, and privacy actions.
- Modify `src/components/FanIdCard.tsx`: consume resolved idol, user portrait, and user avatar sources.
- Modify `src/components/wizard/StepIssue.tsx`: integrate the hook/studio and reorder customization sections.
- Modify `src/components/TastePortraitCard.tsx`: restore local Fan ID media after wizard completion.
- Modify `src/lib/copy.en.ts` and `src/lib/copy.zh.ts`: localized photo-studio, privacy, validation, and removal copy.
- Create `scripts/test-fanid-media.ts`: executable pure-model and IndexedDB regression checks.
- Modify `package.json` and the lockfile: add `fake-indexeddb` as a development-only dependency.

---

### Task 1: Pure media model and deterministic card-photo resolution

**Files:**
- Create: `src/lib/fanIdMedia.ts`
- Create: `scripts/test-fanid-media.ts`

**Interfaces:**
- Produces `FanIdMediaRole`, `FanIdCropKind`, `FanIdCropPreset`, `FanIdMediaRecord`, and `FanIdCardMode`.
- Produces `makeFanIdMediaKey(cardSerial, role): string`.
- Produces `isFanIdCropPreset(value): value is FanIdCropPreset`.
- Produces `isFanIdMediaRecord(value): value is FanIdMediaRecord`.
- Produces `classifyFanIdStorageError(error): "storage-full" | "storage-unavailable"`.
- Produces `cropAspect(kind): number`.
- Produces `resolveFanIdCardPhotos(input): ResolvedFanIdCardPhotos`.

- [ ] **Step 1: Write the failing pure-model test**

Create `scripts/test-fanid-media.ts` with the exact behavioral contract:

```ts
import assert from "node:assert/strict";
import {
  cropAspect,
  classifyFanIdStorageError,
  isFanIdCropPreset,
  isFanIdMediaRecord,
  makeFanIdMediaKey,
  resolveFanIdCardPhotos,
} from "../src/lib/fanIdMedia";

const preset = {
  crop: { x: -12.5, y: 8 },
  zoom: 1.75,
  croppedAreaPixels: { x: 20, y: 10, width: 800, height: 910 },
};

assert.equal(makeFanIdMediaKey("8730", { kind: "idol", idolId: "kim-taehyung" }), "fanid:8730:idol:kim-taehyung");
assert.equal(makeFanIdMediaKey("8730", { kind: "user" }), "fanid:8730:user");
assert.throws(() => makeFanIdMediaKey("../bad", { kind: "user" }));
assert.throws(() => makeFanIdMediaKey("8730", { kind: "idol", idolId: "" }));
assert.equal(isFanIdCropPreset(preset), true);
assert.equal(isFanIdCropPreset({ ...preset, zoom: 3.1 }), false);
assert.equal(isFanIdCropPreset({ ...preset, crop: { x: Number.NaN, y: 0 } }), false);
assert.equal(cropAspect("idol-portrait"), 4 / 4.55);
assert.equal(cropAspect("user-portrait"), 4 / 4.55);
assert.equal(cropAspect("user-avatar"), 1);
assert.equal(isFanIdMediaRecord({ key: "wrong" }), false);
assert.equal(classifyFanIdStorageError(new DOMException("full", "QuotaExceededError")), "storage-full");
assert.equal(classifyFanIdStorageError(new Error("blocked")), "storage-unavailable");

assert.deepEqual(resolveFanIdCardPhotos({
  mode: "idol",
  catalogIdolSrc: "catalog.jpg",
  idolOverrideSrc: "custom-idol.png",
  userPortraitSrc: null,
  userAvatarSrc: null,
}), { portraitSrc: "custom-idol.png", avatarSrc: null, photoRequired: false });

assert.deepEqual(resolveFanIdCardPhotos({
  mode: "idol-user",
  catalogIdolSrc: "catalog.jpg",
  idolOverrideSrc: null,
  userPortraitSrc: "user-portrait.png",
  userAvatarSrc: null,
}), { portraitSrc: "catalog.jpg", avatarSrc: null, photoRequired: true });

assert.deepEqual(resolveFanIdCardPhotos({
  mode: "user",
  catalogIdolSrc: "catalog.jpg",
  idolOverrideSrc: "custom-idol.png",
  userPortraitSrc: "user-portrait.png",
  userAvatarSrc: "avatar.png",
}), { portraitSrc: "user-portrait.png", avatarSrc: null, photoRequired: false });

console.log("fan id media model checks passed");
```

- [ ] **Step 2: Run the test and verify the correct failure**

Run: `npx tsx scripts/test-fanid-media.ts`

Expected: FAIL with `Cannot find module '../src/lib/fanIdMedia'`.

- [ ] **Step 3: Implement the pure model**

Create `src/lib/fanIdMedia.ts` with these public types and rules:

```ts
export type FanIdCardMode = "idol" | "idol-user" | "user";
export type FanIdMediaRole = { kind: "idol"; idolId: string } | { kind: "user" };
export type FanIdCropKind = "idol-portrait" | "user-portrait" | "user-avatar";

export interface FanIdCropPreset {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: { x: number; y: number; width: number; height: number };
}

export interface FanIdMediaRecord {
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

export interface ResolvedFanIdCardPhotos {
  portraitSrc: string | null;
  avatarSrc: string | null;
  photoRequired: boolean;
}
```

Validate card serials with `/^[A-Za-z0-9-]{1,32}$/` and idol IDs with `/^[A-Za-z0-9-]{1,128}$/`. `isFanIdCropPreset` accepts only finite coordinates, positive integer crop dimensions, and zoom from `1` through `3`. `isFanIdMediaRecord` verifies the key/serial/role relationship, `Blob` source, positive dimensions, valid crop presets, `Blob` previews, and a finite timestamp. `resolveFanIdCardPhotos` follows the three resolution tables from the design spec and never substitutes `userPortraitSrc` for a missing avatar.

- [ ] **Step 4: Run the model test and type-check**

Run: `npx tsx scripts/test-fanid-media.ts && npx tsc --noEmit`

Expected: PASS with `fan id media model checks passed` and no TypeScript output.

- [ ] **Step 5: Commit the model**

```bash
git add src/lib/fanIdMedia.ts scripts/test-fanid-media.ts
git commit -m "feat: define local fan id media model"
```

---

### Task 2: Versioned IndexedDB media store

**Files:**
- Create: `src/lib/fanIdMediaStore.ts`
- Modify: `scripts/test-fanid-media.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes `FanIdMediaRecord`, `FanIdMediaRole`, and `makeFanIdMediaKey` from Task 1.
- Produces `getFanIdMediaRecord`, `putFanIdMediaRecord`, `removeFanIdMediaRecord`, and `removeAllFanIdMediaForCard`.
- Every function accepts an optional `IDBFactory` final argument for deterministic tests.

- [ ] **Step 1: Install the development-only IndexedDB test adapter**

Run: `npm install --save-dev fake-indexeddb`

Expected: `fake-indexeddb` appears under `devDependencies`; no production dependency is added.

- [ ] **Step 2: Extend the test with failing CRUD assertions**

Append this contract to `scripts/test-fanid-media.ts`:

```ts
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import {
  getFanIdMediaRecord,
  putFanIdMediaRecord,
  removeAllFanIdMediaForCard,
  removeFanIdMediaRecord,
} from "../src/lib/fanIdMediaStore";

const idolRole = { kind: "idol", idolId: "idol-a" } as const;
const userRole = { kind: "user" } as const;
const idolRecord = {
  key: makeFanIdMediaKey("8730", idolRole),
  cardSerial: "8730",
  role: idolRole,
  source: new Blob(["idol"], { type: "image/webp" }),
  sourceWidth: 1200,
  sourceHeight: 1600,
  crops: { "idol-portrait": preset },
  previews: { "idol-portrait": new Blob(["preview"], { type: "image/webp" }) },
  updatedAt: 1,
};

await putFanIdMediaRecord(idolRecord, fakeIndexedDB);
assert.equal((await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB))?.sourceWidth, 1200);
await removeFanIdMediaRecord("8730", idolRole, fakeIndexedDB);
assert.equal(await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB), null);

await putFanIdMediaRecord(idolRecord, fakeIndexedDB);
await putFanIdMediaRecord({ ...idolRecord, key: makeFanIdMediaKey("8730", userRole), role: userRole }, fakeIndexedDB);
await removeAllFanIdMediaForCard("8730", fakeIndexedDB);
assert.equal(await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB), null);
assert.equal(await getFanIdMediaRecord("8730", userRole, fakeIndexedDB), null);

const failingFactory = {
  open() { throw new DOMException("blocked", "QuotaExceededError"); },
} as unknown as IDBFactory;
await assert.rejects(
  () => getFanIdMediaRecord("8730", userRole, failingFactory),
  (error: unknown) => error instanceof DOMException && error.name === "QuotaExceededError",
);
```

- [ ] **Step 3: Run the test and verify it fails for the missing store**

Run: `npx tsx scripts/test-fanid-media.ts`

Expected: FAIL with `Cannot find module '../src/lib/fanIdMediaStore'`.

- [ ] **Step 4: Implement the store**

Create `src/lib/fanIdMediaStore.ts` with database name `kstar-fanid-media`, version `1`, object store `media`, and key path `key`. On upgrade, create an index named `cardSerial` with key path `cardSerial` and `unique: false`.

Use this exact public API:

```ts
export async function getFanIdMediaRecord(
  cardSerial: string,
  role: FanIdMediaRole,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<FanIdMediaRecord | null>;

export async function putFanIdMediaRecord(
  record: FanIdMediaRecord,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<void>;

export async function removeFanIdMediaRecord(
  cardSerial: string,
  role: FanIdMediaRole,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<void>;

export async function removeAllFanIdMediaForCard(
  cardSerial: string,
  factory: IDBFactory = globalThis.indexedDB,
): Promise<void>;
```

Resolve/reject each transaction once. Reject with `new Error("Fan ID media storage unavailable")` when no factory exists. Before writes, require `isFanIdMediaRecord(record)` and reject invalid records. After reads, return `null` when `isFanIdMediaRecord` rejects stale or malformed data. `removeAllFanIdMediaForCard` must delete only keys returned by the `cardSerial` index cursor.

- [ ] **Step 5: Run store tests, type-check, and commit**

Run: `npx tsx scripts/test-fanid-media.ts && npx tsc --noEmit && git diff --check`

Expected: all pass.

```bash
git add package.json package-lock.json src/lib/fanIdMediaStore.ts scripts/test-fanid-media.ts
git commit -m "feat: store fan id photos in indexeddb"
```

---

### Task 3: Local image validation, downsampling, and crop rendering

**Files:**
- Create: `src/lib/fanIdPhotoProcessing.ts`
- Modify: `scripts/test-fanid-media.ts`

**Interfaces:**
- Consumes `FanIdCropKind` and `FanIdCropPreset`.
- Produces `validateFanIdPhotoFile`, `prepareFanIdPhotoSource`, `renderFanIdPhotoCrop`, and typed `FanIdPhotoError` codes.

- [ ] **Step 1: Add failing file-validation tests**

Append:

```ts
import {
  MAX_FAN_ID_FILE_BYTES,
  validateFanIdPhotoFile,
} from "../src/lib/fanIdPhotoProcessing";

assert.deepEqual(validateFanIdPhotoFile({ type: "image/jpeg", size: 1024 }), { ok: true });
assert.deepEqual(validateFanIdPhotoFile({ type: "image/heic", size: 1024 }), { ok: false, code: "unsupported-type" });
assert.deepEqual(validateFanIdPhotoFile({ type: "image/png", size: MAX_FAN_ID_FILE_BYTES + 1 }), { ok: false, code: "file-too-large" });
```

Run: `npx tsx scripts/test-fanid-media.ts`

Expected: FAIL because `fanIdPhotoProcessing.ts` does not exist.

- [ ] **Step 2: Implement validation and browser processing**

Use exact constants:

```ts
export const MAX_FAN_ID_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FAN_ID_SOURCE_PIXELS = 40_000_000;
export const MAX_FAN_ID_SOURCE_EDGE = 4096;
export const FAN_ID_OUTPUT_SIZE = {
  "idol-portrait": { width: 1200, height: 1365 },
  "user-portrait": { width: 1200, height: 1365 },
  "user-avatar": { width: 640, height: 640 },
} as const;
```

`validateFanIdPhotoFile` accepts only `image/jpeg`, `image/png`, and `image/webp`. `prepareFanIdPhotoSource(file)` must:

1. validate type/size;
2. decode using `createImageBitmap(file, { imageOrientation: "from-image" })`, with an HTMLImageElement/object-URL fallback;
3. reject `width * height > 40_000_000` with code `decoded-image-too-large`;
4. scale the long edge to at most 4096;
5. draw onto a canvas and encode WebP at quality `0.9`, falling back to JPEG at `0.92` when WebP encoding returns null;
6. return `{ blob, width, height }` and close/revoke temporary resources.

`renderFanIdPhotoCrop(source, preset, kind)` decodes the retained source blob, draws `preset.croppedAreaPixels` into the exact `FAN_ID_OUTPUT_SIZE[kind]`, and returns a WebP blob at quality `0.92`. Throw `FanIdPhotoError` with one of `unsupported-type`, `file-too-large`, `decode-failed`, `decoded-image-too-large`, `canvas-unavailable`, or `encode-failed`.

- [ ] **Step 3: Run pure checks and type-check**

Run: `npx tsx scripts/test-fanid-media.ts && npx tsc --noEmit`

Expected: PASS. Canvas methods are verified in the browser once the editor is wired in Task 6.

- [ ] **Step 4: Commit processing**

```bash
git add src/lib/fanIdPhotoProcessing.ts scripts/test-fanid-media.ts
git commit -m "feat: process fan id photos locally"
```

---

### Task 4: Reusable destination-aware photo editor

**Files:**
- Create: `src/components/LocalPhotoEditor.tsx`
- Modify: `src/components/FacePhotoPicker.tsx`

**Interfaces:**
- Consumes `FanIdCropKind`, `FanIdCropPreset`, and `cropAspect`.
- Produces `LocalPhotoEditor` with no storage knowledge.
- Keeps `FacePhotoPicker`'s existing `{ value, onChange }` API as a compatibility wrapper.

- [ ] **Step 1: Record the failing browser contract**

Before implementation, open StepIssue and confirm these selectors have count `0`:

```text
[data-fanid-photo-editor]
[data-fanid-photo-crop]
[data-fanid-photo-zoom]
[data-fanid-photo-confirm]
```

Expected: all counts are `0`; the new editor does not exist yet.

- [ ] **Step 2: Implement `LocalPhotoEditor`**

Use this public API:

```ts
interface LocalPhotoEditorProps {
  sourceUrl: string;
  cropKind: FanIdCropKind;
  initialPreset?: FanIdCropPreset;
  busy?: boolean;
  label: string;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (preset: FanIdCropPreset) => void;
}
```

Render `react-easy-crop` with `aspect={cropAspect(cropKind)}`, `cropShape={cropKind === "user-avatar" ? "round" : "rect"}`, `showGrid`, zoom min `1`, max `3`, and step `0.05`. Initialize from `initialPreset`, store the latest pixel crop from `onCropComplete`, and disable confirmation until pixel dimensions are positive.

Add stable attributes:

```tsx
<div data-fanid-photo-editor data-crop-kind={cropKind}>…</div>
<div data-fanid-photo-crop>…</div>
<input data-fanid-photo-zoom aria-label={copy.photoZoomAria} type="range" … />
<button data-fanid-photo-reset type="button">…</button>
<button data-fanid-photo-confirm type="button" disabled={busy || !area}>…</button>
```

Use a fixed crop viewport that is 240px wide for portraits and 240px square for avatar mode. Place Reset, Cancel, and Use this framing below the zoom control. Return focus handling to the caller; the component must not write storage or create file inputs.

- [ ] **Step 3: Refactor `FacePhotoPicker` as a compatibility wrapper**

Keep its current `value` and `onChange` props. Let its file chooser create a temporary data URL, render `LocalPhotoEditor` with `cropKind="user-portrait"`, and use the existing canvas crop behavior to call `onChange(dataUrl)` on confirmation. This preserves TastePortraitCard until Task 8 without duplicating crop UI.

- [ ] **Step 4: Type-check and commit**

Run: `npx tsc --noEmit && git diff --check`

Expected: PASS.

```bash
git add src/components/LocalPhotoEditor.tsx src/components/FacePhotoPicker.tsx
git commit -m "feat: add reusable fan id photo editor"
```

---

### Task 5: IndexedDB React coordinator

**Files:**
- Create: `src/hooks/useFanIdLocalMedia.ts`
- Modify: `src/lib/fanIdMedia.ts`
- Modify: `scripts/test-fanid-media.ts`

**Interfaces:**
- Consumes the store and processing APIs from Tasks 1–3.
- Produces `useFanIdLocalMedia({ cardSerial, idolIds })`.
- Produces pure `previewBlobToDataUrl(blob): Promise<string>` for export-safe in-memory sources.

- [ ] **Step 1: Add a failing preview-map helper test**

Add a pure helper to `fanIdMedia.ts` named `collectFanIdPreviewKinds(record)` and test it before implementation:

```ts
import { collectFanIdPreviewKinds } from "../src/lib/fanIdMedia";

assert.deepEqual(
  collectFanIdPreviewKinds({ ...idolRecord, previews: { "idol-portrait": idolRecord.previews["idol-portrait"]! } }),
  ["idol-portrait"],
);
```

Run: `npx tsx scripts/test-fanid-media.ts`

Expected: FAIL because `collectFanIdPreviewKinds` is not exported.

- [ ] **Step 2: Implement the helper and hook**

Use this hook contract:

```ts
interface UseFanIdLocalMediaResult {
  status: "loading" | "ready" | "error";
  records: ReadonlyMap<string, FanIdMediaRecord>;
  idolPreviewSources: Readonly<Record<string, string>>;
  userPortraitSrc: string | null;
  userAvatarSrc: string | null;
  errorCode: "storage-unavailable" | "storage-full" | null;
  refresh: () => Promise<void>;
  save: (record: FanIdMediaRecord) => Promise<void>;
  remove: (role: FanIdMediaRole) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useFanIdLocalMedia(input: {
  cardSerial: string | null;
  idolIds: readonly string[];
}): UseFanIdLocalMediaResult;
```

When `cardSerial` is null, return an empty `ready` result and do not open IndexedDB; this keeps hook order stable while StepIssue validates incomplete wizard data. Otherwise, request one user record and at most four idol records. Convert confirmed preview blobs to data URLs using `FileReader`; do not persist those data URLs. Ignore rejected/invalid records and leave the corresponding preview absent. Set `storage-full` for `QuotaExceededError`; otherwise set `storage-unavailable`. After `save`, `remove`, or `clearAll`, reload records and sources from IndexedDB so the preview and controls share one authority.

- [ ] **Step 3: Run checks and commit**

Run: `npx tsx scripts/test-fanid-media.ts && npx tsc --noEmit && git diff --check`

Expected: PASS.

```bash
git add src/hooks/useFanIdLocalMedia.ts src/lib/fanIdMedia.ts scripts/test-fanid-media.ts
git commit -m "feat: load local fan id media in react"
```

---

### Task 6: Photo-studio controls and local-only copy

**Files:**
- Create: `src/components/FanIdPhotoStudio.tsx`
- Modify: `src/lib/copy.en.ts`
- Modify: `src/lib/copy.zh.ts`

**Interfaces:**
- Consumes `LocalPhotoEditor`, `UseFanIdLocalMediaResult`, `prepareFanIdPhotoSource`, and `renderFanIdPhotoCrop`.
- Produces the collapsible photo-management section and no card rendering.

- [ ] **Step 1: Record the failing browser selectors**

Before implementation, verify these selectors are absent on StepIssue:

```text
[data-fanid-photo-studio]
[data-fanid-idol-photo]
[data-fanid-user-photo]
[data-fanid-photo-local-note]
[data-fanid-photo-clear-all]
```

Expected: count `0` for each contract.

- [ ] **Step 2: Add explicit localized copy**

Add matching keys in `copy.en.ts` and `copy.zh.ts` for:

```ts
fanIdPhotosTitle
fanIdPhotosSummaryOriginal
fanIdPhotosSummaryCustom
fanIdPhotoOriginal
fanIdPhotoCustomLocal
fanIdPhotoReplace
fanIdPhotoAdjust
fanIdPhotoUseOriginal
fanIdUserPhoto
fanIdUserPortrait
fanIdUserAvatar
fanIdPhotoStoredLocal
fanIdPhotoPermissionNote
fanIdPhotoRemove
fanIdPhotoRemoveAll
fanIdPhotoRemoveAllConfirm
fanIdPhotoUnsupportedType
fanIdPhotoTooLarge
fanIdPhotoDecodedTooLarge
fanIdPhotoDecodeFailed
fanIdPhotoStorageUnavailable
fanIdPhotoStorageFull
fanIdPhotoUseFraming
fanIdPhotoResetFraming
```

Use plain English equivalents and natural zh-TW. The English privacy line is exactly `Stored only in this browser. Nothing is uploaded.` and the permission line is exactly `Choose a photo you have permission to use.`

- [ ] **Step 3: Implement `FanIdPhotoStudio`**

Use this prop contract:

```ts
interface FanIdPhotoStudioProps {
  cardSerial: string;
  picks: readonly CardArtist[];
  cardMode: FanIdCardMode;
  media: UseFanIdLocalMediaResult;
}
```

The component owns only temporary draft state:

```ts
type EditorDraft = {
  role: FanIdMediaRole;
  cropKind: FanIdCropKind;
  source: Blob;
  sourceWidth: number;
  sourceHeight: number;
  sourceUrl: string;
  existingRecord: FanIdMediaRecord | null;
  sourceReplaced: boolean;
};
```

Render a collapsed/expanded section with `data-fanid-photo-studio`. Render four idol tiles from `picks`, each with `data-fanid-idol-photo={pick.id}` and its effective thumbnail. Render one user tile with `data-fanid-user-photo`. The user tile exposes separate Portrait and Avatar actions: User mode selects Portrait first, Idol + User selects Avatar first, and Idol mode defaults to Portrait. Each chooser accepts `.jpg,.jpeg,.png,.webp` and calls `prepareFanIdPhotoSource` without saving. A new chooser sets `sourceReplaced: true`; `Adjust` reuses the existing record source and sets it to `false`. On confirm:

1. call `renderFanIdPhotoCrop(draft.source, preset, draft.cropKind)`;
2. when `sourceReplaced` is false, merge the new crop/preview into the existing record without deleting the user's other crop; when it is true, clear crops/previews from the old source before saving the new crop;
3. call `media.save(record)`;
4. close the editor only after save succeeds.

`Use original` removes only that idol record. Removing the user source removes both user crops. `Remove all local photos` uses `window.confirm(copy.fanIdPhotoRemoveAllConfirm)` before `media.clearAll()`.

Create/revoke `draft.sourceUrl` in an effect cleanup. Map typed processing/storage errors to the exact localized message. Keep the old confirmed record visible until the new save succeeds.

Render the editor inside a native `<dialog>` with `aria-labelledby` pointing to the destination label. Call `showModal()` when a draft opens and `close()` when it clears so browser focus containment and Escape behavior work without a custom trap. Handle the dialog `cancel` event as a non-mutating editor cancellation, then return focus to the tile/action that opened it. Style the dialog as a bottom sheet below the small breakpoint and a centered panel above it. Every status (`Original`, `Custom · on this device`, processing, and error) must have visible text rather than color-only meaning.

- [ ] **Step 4: Type-check and commit**

Run: `npx tsc --noEmit && git diff --check`

Expected: PASS.

```bash
git add src/components/FanIdPhotoStudio.tsx src/lib/copy.en.ts src/lib/copy.zh.ts
git commit -m "feat: add local fan id photo studio"
```

---

### Task 7: Integrate resolved photos into the card and issue step

**Files:**
- Modify: `src/components/FanIdCard.tsx`
- Modify: `src/components/wizard/StepIssue.tsx`

**Interfaces:**
- Consumes `useFanIdLocalMedia`, `resolveFanIdCardPhotos`, and `FanIdPhotoStudio`.
- Extends `FanIdCardCommonProps` with `idolPhoto`, `userPortraitPhoto`, and `userAvatarPhoto` while retaining `facePhoto` compatibility.

- [ ] **Step 1: Record the failing integration behavior**

Open StepIssue and verify the current behavior before the change:

```text
[data-fanid-photo-studio] count is 0
[data-fanid-entry="hero"] still uses the catalog idol URL
selecting User exposes the old FacePhotoPicker rather than the photo studio
```

Expected: all three observations reproduce.

- [ ] **Step 2: Add explicit card photo props**

Extend `FanIdCardCommonProps`:

```ts
idolPhoto?: string | null;
userPortraitPhoto?: string | null;
userAvatarPhoto?: string | null;
```

Resolve compatibility values:

```ts
const effectiveUserPortrait = userPortraitPhoto ?? facePhoto ?? null;
const effectiveUserAvatar = userAvatarPhoto ?? facePhoto ?? null;
const portraitSrc = isUserHero
  ? effectiveUserPortrait
  : idolPhoto ?? hero.image_url ?? null;
```

Render `effectiveUserAvatar` in the owner badge. Use catalog `hero.image_focus` only when `idolPhoto` is absent; confirmed local crops are already framed and must use centered positioning. Add `data-photo-source="custom" | "catalog" | "missing"` to the hero and `data-avatar-source` to the owner badge for verification.

- [ ] **Step 3: Replace temporary StepIssue photo state with local media**

Remove `const [facePhoto, setFacePhoto]` and the direct `FacePhotoPicker` import. Call the hook unconditionally before the incomplete-wizard early return so React hook order never changes:

```ts
const media = useFanIdLocalMedia({
  cardSerial: wiz.serial ?? null,
  idolIds: picks.map((pick) => pick.id),
});
const resolvedPhotos = resolveFanIdCardPhotos({
  mode: cardMode,
  catalogIdolSrc: picks.find((pick) => pick.id === heroId)?.image_url ?? null,
  idolOverrideSrc: media.idolPreviewSources[heroId] ?? null,
  userPortraitSrc: media.userPortraitSrc,
  userAvatarSrc: media.userAvatarSrc,
});
```

Pass the three explicit photo props into `FanIdCard`. Set `photoRequired = resolvedPhotos.photoRequired || (media.status === "loading" && cardMode !== "idol")` so export cannot capture a loading user photo.

Reorder the controls exactly as approved:

1. Card edition.
2. Card layout.
3. Featured idol.
4. `<FanIdPhotoStudio … />`.
5. Existing Decorations / `[data-sticker-toggle]` control.
6. Cardholder name and export controls.

Do not alter sticker state or composition. Preserve the current three layout buttons and per-theme edition picker.

- [ ] **Step 4: Run static checks and commit**

Run: `npx tsx scripts/test-fanid-media.ts && npx tsc --noEmit && npm run build && git diff --check`

Expected: all pass.

```bash
git add src/components/FanIdCard.tsx src/components/wizard/StepIssue.tsx
git commit -m "feat: use local photos in fan id cards"
```

---

### Task 8: Restore local media on completed Fan ID surfaces

**Files:**
- Modify: `src/components/TastePortraitCard.tsx`

**Interfaces:**
- Consumes `useFanIdLocalMedia` and the explicit `FanIdCard` photo props from Task 7.
- Reads only existing lightweight preferences: `serial`, `heroId`, `cardMode`, `themeId`, and `stickersEnabled`.

- [ ] **Step 1: Record the failing refresh behavior**

Complete the wizard with a local idol replacement, return to the Fan ID tab in `TastePortraitCard`, and refresh.

Expected before implementation: the completed Fan ID uses catalog/temporary state instead of the confirmed IndexedDB replacement.

- [ ] **Step 2: Extend preference parsing and load media read-only**

Extend `FanIdPrefs`:

```ts
cardMode?: "idol" | "idol-user" | "user";
themeId?: FanIdThemeId;
stickersEnabled?: boolean;
```

Call `useFanIdLocalMedia` with `prefs.serial ?? null` and current pick IDs. Resolve the same featured-idol/user sources as StepIssue and pass `idolPhoto`, `userPortraitPhoto`, `userAvatarPhoto`, `cardMode`, `themeId`, and `stickersEnabled` to `FanIdCard`.

Keep the existing temporary `FacePhotoPicker` only as a fallback when there is no saved user media and the legacy `showFace` control is used. A temporary face photo must not overwrite IndexedDB records.

- [ ] **Step 3: Verify static checks and commit**

Run: `npx tsc --noEmit && npm run build && git diff --check`

Expected: PASS.

```bash
git add src/components/TastePortraitCard.tsx
git commit -m "feat: restore local photos on completed fan ids"
```

---

### Task 9: Cross-feature browser verification and export parity

**Files:**
- No source files expected. Fix only the smallest relevant source file if verification reveals a defect.

**Interfaces:**
- Verifies local media, three card modes, four themes, sticker toggle, and export together.

- [ ] **Step 1: Verify the clean default**

Open `http://localhost:3100/start?step=4`. Confirm the card uses `data-photo-source="catalog"`, sticker decoration defaults according to saved wizard state, and the photo studio is collapsed without layout shift.

- [ ] **Step 2: Verify per-idol isolation**

Upload a JPEG for idol A, frame it, and confirm. Switch among all four featured idols. Confirm only idol A reports `data-photo-source="custom"`. Upload a PNG for idol B and repeat. Use `Use original` on idol A and confirm idol B remains custom.

- [ ] **Step 3: Verify refresh and readjustment**

Refresh the page. Confirm both saved records remain. Open `Adjust` for idol B, verify the original source and prior crop are restored, move/zoom it, confirm, and verify the card updates without re-upload.

- [ ] **Step 4: Verify independent user crops**

Upload one WebP user photo. In User mode, confirm `user-portrait`; in Idol + User, open the same source and confirm `user-avatar`. Readjust the avatar and verify the full user portrait remains unchanged. Confirm export is disabled when the active mode's required crop is absent and enabled after confirmation.

- [ ] **Step 5: Verify errors preserve confirmed images**

Attempt HEIC input and a generated file over 15MB. Confirm the localized error appears and the previous confirmed preview remains. Confirm the automated failing-factory assertion rejects with `QuotaExceededError` and `classifyFanIdStorageError` maps it to `storage-full`; the hook must display the matching localized message without modifying wizard state when the same code is returned.

- [ ] **Step 6: Verify stickers and protected zones**

Enable `[data-sticker-toggle]`. Check Chrome, Dreamy, Kawaii, and Mono Cute in Idol, Idol + User, and User layouts. Confirm stickers do not cover the local portrait face region, user avatar, archetype panel, holder, barcode, or QR code.

- [ ] **Step 7: Verify no image upload request**

Observe network activity while selecting, cropping, saving, readjusting, and removing a photo. Confirm no request contains the file name, image bytes, blob/data URL, or crop coordinates and no image-upload API request occurs.

- [ ] **Step 8: Verify card and story exports**

Export one decorated custom-photo card, one undecorated custom-photo card, and one story image. Open each PNG and compare portrait framing, avatar framing, sticker bounds, rounded corners, barcode, and QR code with the live preview.

- [ ] **Step 9: Run final checks**

Run:

```bash
npx tsx scripts/test-fanid-media.ts
npx tsx scripts/test-fanid-stickers.ts
npx tsc --noEmit
npm run build
npm run lint
git diff --check
```

Expected: media and sticker scripts print their pass messages; type-check/build/diff checks pass. If repository-wide lint reports unrelated pre-existing failures, record the exact files and run ESLint against only changed feature files before completion.

- [ ] **Step 10: Commit only a verification fix if one was necessary**

If no source fix was needed, do not create an empty commit. If a fix was needed:

```bash
git add src/components/FanIdCard.tsx src/components/FanIdPhotoStudio.tsx src/components/LocalPhotoEditor.tsx src/components/TastePortraitCard.tsx src/components/wizard/StepIssue.tsx src/hooks/useFanIdLocalMedia.ts src/lib/fanIdMedia.ts src/lib/fanIdMediaStore.ts src/lib/fanIdPhotoProcessing.ts src/lib/copy.en.ts src/lib/copy.zh.ts scripts/test-fanid-media.ts
git commit -m "fix: polish local fan id photo customization"
```

## Completion criteria

- Four selected idols can each retain an independent browser-local replacement.
- One user source retains independent portrait and avatar crops.
- Confirmed sources can be readjusted after refresh without re-upload.
- Catalog images remain untouched outside Fan ID.
- Optional SVG sticker decoration and all three layouts continue working.
- Card and story exports match the confirmed preview.
- No image data is uploaded or written to localStorage/preferences.
