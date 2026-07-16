import assert from "node:assert/strict";
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import {
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

const preset = {
  crop: { x: -12.5, y: 8 },
  zoom: 1.75,
  croppedAreaPixels: { x: 20, y: 10, width: 800, height: 910 },
};

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

void runStoreChecks();
