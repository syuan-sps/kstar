import assert from "node:assert/strict";
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import * as React from "react";
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

type HookInput = Parameters<typeof useFanIdLocalMedia>[0];
type HookResult = ReturnType<typeof useFanIdLocalMedia>;

interface HookSlot {
  value?: unknown;
  deps?: readonly unknown[];
  cleanup?: (() => void) | void;
}

function dependenciesChanged(previous: readonly unknown[] | undefined, next: readonly unknown[] | undefined): boolean {
  return !previous
    || !next
    || previous.length !== next.length
    || next.some((dependency, index) => !Object.is(dependency, previous[index]));
}

function createHookHarness() {
  const slots: HookSlot[] = [];
  const effects: Array<{ index: number; create: () => void | (() => void) }> = [];
  const internals = (React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
  }).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  let cursor = 0;
  let input: HookInput;
  let stateUpdates = 0;

  const dispatcher = {
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      const slot = slots[index] ?? (slots[index] = {
        value: typeof initial === "function" ? (initial as () => T)() : initial,
      });
      return [slot.value as T, (next: T | ((current: T) => T)) => {
        slot.value = typeof next === "function"
          ? (next as (current: T) => T)(slot.value as T)
          : next;
        stateUpdates += 1;
      }] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      const slot = slots[index] ?? (slots[index] = { value: { current: initial } });
      return slot.value as { current: T };
    },
    useMemo<T>(create: () => T, deps: readonly unknown[] | undefined) {
      const index = cursor++;
      const slot = slots[index];
      if (!slot || dependenciesChanged(slot.deps, deps)) {
        slots[index] = { value: create(), deps };
      }
      return slots[index].value as T;
    },
    useCallback<T>(callback: T, deps: readonly unknown[] | undefined) {
      return dispatcher.useMemo(() => callback, deps);
    },
    useEffect(create: () => void | (() => void), deps: readonly unknown[] | undefined) {
      const index = cursor++;
      const slot = slots[index];
      if (!slot || dependenciesChanged(slot.deps, deps)) {
        slots[index] = { ...slot, deps };
        effects.push({ index, create });
      }
    },
  };

  const render = (nextInput = input): HookResult => {
    input = nextInput;
    cursor = 0;
    const previousDispatcher = internals.H;
    internals.H = dispatcher;
    try {
      return useFanIdLocalMedia(input);
    } finally {
      internals.H = previousDispatcher;
    }
  };

  return {
    render,
    runEffects() {
      for (const effect of effects.splice(0)) {
        slots[effect.index].cleanup?.();
        slots[effect.index].cleanup = effect.create();
      }
    },
    unmount() {
      for (const slot of slots) slot.cleanup?.();
    },
    get stateUpdates() {
      return stateUpdates;
    },
  };
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  throw lastError;
}

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

async function runHookChecks(): Promise<void> {
  const originalIndexedDB = globalThis.indexedDB;
  const originalFileReader = globalThis.FileReader;
  const TestFileReader = class {
    result: string | null = null;
    error: DOMException | null = null;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    readAsDataURL(blob: Blob) {
      void blob.arrayBuffer().then(
        (buffer) => {
          this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
          this.onload?.();
        },
        (error: DOMException) => {
          this.error = error;
          this.onerror?.();
        },
      );
    }
  };

  try {
    globalThis.FileReader = TestFileReader as unknown as typeof FileReader;
    globalThis.indexedDB = fakeIndexedDB;
    const cardSerial = "hook-card";
    await putFanIdMediaRecord(makeIdolRecord(cardSerial), fakeIndexedDB);

    const idolSetHarness = createHookHarness();
    idolSetHarness.render({ cardSerial, idolIds: ["idol-a"] });
    idolSetHarness.runEffects();
    await waitFor(() => {
      const media = idolSetHarness.render();
      assert.equal(media.status, "ready");
      assert.equal(media.records.size, 1);
      assert.match(media.idolPreviewSources["idol-a"] ?? "", /^data:image\/webp;base64,/);
    });

    const nextIdolSet = idolSetHarness.render({ cardSerial, idolIds: ["idol-b"] });
    assert.equal(nextIdolSet.status, "loading");
    assert.equal(nextIdolSet.records.size, 0);
    assert.deepEqual(nextIdolSet.idolPreviewSources, {});
    idolSetHarness.unmount();

    let storageOpens = 0;
    globalThis.indexedDB = {
      open() {
        storageOpens += 1;
        throw new Error("IndexedDB should not be opened without a serial");
      },
    } as unknown as IDBFactory;
    for (const cardSerial of [null, ""]) {
      const noSerialHarness = createHookHarness();
      const media = noSerialHarness.render({ cardSerial, idolIds: ["idol-a"] });
      noSerialHarness.runEffects();
      assert.equal(media.status, "ready");
      assert.equal(noSerialHarness.render().status, "ready");
      noSerialHarness.unmount();
    }
    assert.equal(storageOpens, 0);

    let delayedOpenRequest: { onerror: (() => void) | null; error: DOMException | null } | null = null;
    globalThis.indexedDB = {
      open() {
        delayedOpenRequest = { onerror: null, error: null };
        return delayedOpenRequest as unknown as IDBOpenDBRequest;
      },
    } as unknown as IDBFactory;
    const unmountHarness = createHookHarness();
    unmountHarness.render({ cardSerial: "late-card", idolIds: ["idol-a"] });
    unmountHarness.runEffects();
    const updatesBeforeUnmount = unmountHarness.stateUpdates;
    unmountHarness.unmount();
    delayedOpenRequest!.error = new DOMException("blocked", "QuotaExceededError");
    delayedOpenRequest!.onerror!();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(unmountHarness.stateUpdates, updatesBeforeUnmount);

    globalThis.indexedDB = {
      open() {
        throw new DOMException("full", "QuotaExceededError");
      },
    } as unknown as IDBFactory;
    const saveHarness = createHookHarness();
    const saveMedia = saveHarness.render({ cardSerial: "save-card", idolIds: ["idol-a"] });
    await assert.rejects(
      () => saveMedia.save(makeIdolRecord("save-card")),
      (error: unknown) => error instanceof DOMException && error.name === "QuotaExceededError",
    );
    assert.equal(saveHarness.render().status, "error");
    assert.equal(saveHarness.render().errorCode, "storage-full");
    saveHarness.unmount();
  } finally {
    globalThis.indexedDB = originalIndexedDB;
    globalThis.FileReader = originalFileReader;
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
