import assert from "node:assert/strict";
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import {
  collectFanIdPreviewKinds,
  cropAspect,
  classifyFanIdStorageError,
  isFanIdCropPreset,
  isFanIdMediaRecord,
  makeFanIdMediaKey,
  resolveFanIdCardPhotos,
} from "../src/lib/fanIdMedia";
import {
  getFanIdMediaRecord,
  putFanIdMediaRecord,
  removeAllFanIdMediaForCard,
  removeFanIdMediaRecord,
} from "../src/lib/fanIdMediaStore";
import {
  MAX_FAN_ID_FILE_BYTES,
  validateFanIdPhotoFile,
} from "../src/lib/fanIdPhotoProcessing";
import { canDismissFanIdPhotoStudio } from "../src/lib/fanIdPhotoStudioState";
import {
  advanceFanIdMediaLifecycle,
  isCurrentFanIdMediaLifecycle,
  useFanIdLocalMedia,
} from "../src/hooks/useFanIdLocalMedia";

const preset = {
  crop: { x: -12.5, y: 8 },
  zoom: 1.75,
  croppedAreaPixels: { x: 20, y: 10, width: 800, height: 910 },
};

assert.equal(canDismissFanIdPhotoStudio(false), true);
assert.equal(canDismissFanIdPhotoStudio(true), false);

type HookInput = Parameters<typeof useFanIdLocalMedia>[0];
type HookResult = ReturnType<typeof useFanIdLocalMedia>;

assert.deepEqual(validateFanIdPhotoFile({ type: "image/jpeg", size: 1024 }), { ok: true });
assert.deepEqual(validateFanIdPhotoFile({ type: "image/heic", size: 1024 }), { ok: false, code: "unsupported-type" });
assert.deepEqual(validateFanIdPhotoFile({ type: "image/png", size: MAX_FAN_ID_FILE_BYTES + 1 }), { ok: false, code: "file-too-large" });

function seedUnvalidatedMediaRecord(record: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = fakeIndexedDB.open("kstar-fanid-media");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("media", "readwrite");
      transaction.objectStore("media").put(record);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error);
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}

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

const noCardRequest = advanceFanIdMediaLifecycle({ cardSerial: null, idolIdsKey: "", version: 0 }, null);
assert.equal(isCurrentFanIdMediaLifecycle(noCardRequest, noCardRequest), false);

const emptyCardRequest = advanceFanIdMediaLifecycle(noCardRequest, "");
assert.equal(isCurrentFanIdMediaLifecycle(emptyCardRequest, emptyCardRequest), false);

const cardARequest = advanceFanIdMediaLifecycle(noCardRequest, "8730");
const cardARefresh = advanceFanIdMediaLifecycle(cardARequest, "8730");
const cardBRequest = advanceFanIdMediaLifecycle(cardARefresh, "8731");
const noCardState = advanceFanIdMediaLifecycle(cardBRequest, null);
assert.equal(isCurrentFanIdMediaLifecycle(cardARequest, cardARefresh), false);
assert.equal(isCurrentFanIdMediaLifecycle(cardARefresh, cardBRequest), false);
assert.equal(isCurrentFanIdMediaLifecycle(cardBRequest, cardBRequest), true);
assert.equal(isCurrentFanIdMediaLifecycle(cardBRequest, noCardState), false);
assert.equal(isCurrentFanIdMediaLifecycle(noCardState, noCardState), false);

const idolSetARequest = advanceFanIdMediaLifecycle(cardARequest, "8730", "idol-a");
const idolSetBState = { ...idolSetARequest, idolIdsKey: "idol-b" };
assert.equal(idolSetARequest.idolIdsKey, "idol-a");
assert.equal(isCurrentFanIdMediaLifecycle(idolSetBState, idolSetARequest), false);

const unmountedState = advanceFanIdMediaLifecycle(idolSetARequest, null, "idol-a");
assert.equal(isCurrentFanIdMediaLifecycle(unmountedState, idolSetARequest), false);

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

function makeIdolRecord(cardSerial: string, idolId = "idol-a") {
  const role = { kind: "idol", idolId } as const;
  return {
    key: makeFanIdMediaKey(cardSerial, role),
    cardSerial,
    role,
    source: new Blob(["source"], { type: "image/webp" }),
    sourceWidth: 1200,
    sourceHeight: 1600,
    crops: { "idol-portrait": preset },
    previews: { "idol-portrait": new Blob(["preview"], { type: "image/webp" }) },
    updatedAt: 1,
  };
}

async function flushReact(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function waitForHook(assertion: () => void): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await flushReact();
    }
  }
  throw lastError;
}

async function runHookChecks(): Promise<void> {
  const originalIndexedDB = globalThis.indexedDB;
  const originalFileReader = globalThis.FileReader;
  const originalActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  let latest: HookResult | null = null;
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  const TestFileReader = class {
    result: string | null = null;
    error: DOMException | null = null;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    readAsDataURL(blob: Blob) {
      void blob.arrayBuffer().then((buffer) => {
        this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
        this.onload?.();
      });
    }
  };

  function Probe({ input }: { input: HookInput }) {
    latest = useFanIdLocalMedia(input);
    return null;
  }

  async function render(input: HookInput): Promise<void> {
    await act(async () => {
      const element = React.createElement(Probe, { input });
      if (renderer) renderer.update(element);
      else renderer = TestRenderer.create(element);
    });
  }

  try {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.FileReader = TestFileReader as unknown as typeof FileReader;
    let storageOpens = 0;
    const countingIndexedDB = {
      open(...args: Parameters<IDBFactory["open"]>) {
        storageOpens += 1;
        return fakeIndexedDB.open(...args);
      },
    } as unknown as IDBFactory;
    globalThis.indexedDB = countingIndexedDB;
    await putFanIdMediaRecord(makeIdolRecord("hook-card-a"), fakeIndexedDB);
    await putFanIdMediaRecord(makeIdolRecord("hook-card-b"), fakeIndexedDB);

    await render({ cardSerial: "hook-card-a", idolIds: ["idol-a"] });
    await waitForHook(() => {
      assert.equal(latest?.status, "ready");
      assert.equal(latest?.records.size, 1);
      assert.match(latest?.idolPreviewSources["idol-a"] ?? "", /^data:image\/webp;base64,/);
    });

    await render({ cardSerial: "hook-card-b", idolIds: ["idol-a"] });
    assert.equal(latest?.status, "loading");
    assert.equal(latest?.records.size, 0);
    assert.deepEqual(latest?.idolPreviewSources, {});
    await waitForHook(() => {
      assert.equal(latest?.status, "ready");
      assert.equal(latest?.records.has(makeFanIdMediaKey("hook-card-b", { kind: "idol", idolId: "idol-a" })), true);
    });

    await render({ cardSerial: "hook-card-b", idolIds: ["idol-b"] });
    assert.equal(latest?.status, "loading");
    assert.equal(latest?.records.size, 0);
    assert.deepEqual(latest?.idolPreviewSources, {});

    storageOpens = 0;
    await render({ cardSerial: "", idolIds: ["idol-a"] });
    assert.equal(latest?.status, "ready");
    assert.equal(latest?.records.size, 0);
    assert.deepEqual(latest?.idolPreviewSources, {});
    await render({ cardSerial: null, idolIds: ["idol-a"] });
    assert.equal(latest?.status, "ready");
    await flushReact();
    assert.equal(storageOpens, 0);

    globalThis.indexedDB = {
      open() { throw new DOMException("full", "QuotaExceededError"); },
    } as unknown as IDBFactory;
    await render({ cardSerial: "hook-card-save", idolIds: ["idol-a"] });
    await act(async () => {
      await assert.rejects(
        () => latest!.save(makeIdolRecord("hook-card-save")),
        (error: unknown) => error instanceof DOMException && error.name === "QuotaExceededError",
      );
    });
    await waitForHook(() => {
      assert.equal(latest?.status, "error");
      assert.equal(latest?.errorCode, "storage-full");
    });

    globalThis.indexedDB = countingIndexedDB;
    await act(async () => {
      await latest!.save(makeIdolRecord("hook-card-save"));
    });
    await waitForHook(() => {
      assert.equal(latest?.status, "ready");
      assert.equal(latest?.records.has(makeFanIdMediaKey("hook-card-save", { kind: "idol", idolId: "idol-a" })), true);
    });
  } finally {
    await act(async () => renderer?.unmount());
    globalThis.indexedDB = originalIndexedDB;
    globalThis.FileReader = originalFileReader;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  }
}

async function runStoreChecks(): Promise<void> {
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

  assert.deepEqual(
    collectFanIdPreviewKinds({
      ...idolRecord,
      previews: { "idol-portrait": idolRecord.previews["idol-portrait"]! },
    }),
    ["idol-portrait"],
  );

  await putFanIdMediaRecord(idolRecord, fakeIndexedDB);
  assert.equal((await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB))?.sourceWidth, 1200);
  await removeFanIdMediaRecord("8730", idolRole, fakeIndexedDB);
  assert.equal(await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB), null);

  await putFanIdMediaRecord(idolRecord, fakeIndexedDB);
  await putFanIdMediaRecord({
    ...idolRecord,
    key: makeFanIdMediaKey("8730", userRole),
    role: userRole,
  }, fakeIndexedDB);
  await putFanIdMediaRecord({
    ...idolRecord,
    key: makeFanIdMediaKey("8731", idolRole),
    cardSerial: "8731",
  }, fakeIndexedDB);
  await removeAllFanIdMediaForCard("8730", fakeIndexedDB);
  assert.equal(await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB), null);
  assert.equal(await getFanIdMediaRecord("8730", userRole, fakeIndexedDB), null);
  assert.equal((await getFanIdMediaRecord("8731", idolRole, fakeIndexedDB))?.sourceWidth, 1200);
  await assert.rejects(
    () => removeAllFanIdMediaForCard("../bad", fakeIndexedDB),
    /Invalid Fan ID card serial/,
  );

  await assert.rejects(
    () => putFanIdMediaRecord({ ...idolRecord, sourceWidth: 0 }, fakeIndexedDB),
    /Invalid Fan ID media record/,
  );
  await seedUnvalidatedMediaRecord({ ...idolRecord, sourceWidth: 0 });
  assert.equal(await getFanIdMediaRecord("8730", idolRole, fakeIndexedDB), null);

  const failingFactory = {
    open() { throw new DOMException("blocked", "QuotaExceededError"); },
  } as unknown as IDBFactory;
  await assert.rejects(
    () => getFanIdMediaRecord("8730", userRole, failingFactory),
    (error: unknown) => error instanceof DOMException && error.name === "QuotaExceededError",
  );

  console.log("fan id media model checks passed");
}

void (async () => {
  await runHookChecks();
  await runStoreChecks();
})();
