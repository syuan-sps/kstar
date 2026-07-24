import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CUSTOM_STICKER_PACKS,
  DEFAULT_CUSTOM_STICKER_SCALE,
  getCustomStickerAsset,
  makePlacedSticker,
  MAX_CUSTOM_STICKERS,
  normalizePlacedStickers,
  normalizeCustomStickerRotation,
} from "@/lib/fanIdCustomStickers";
import { FAN_ID_THEMES } from "@/lib/fanIdThemes";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FanIdCustomStickerLayer from "@/components/FanIdCustomStickerLayer";
import FanIdCard from "@/components/FanIdCard";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

assert.equal(Object.keys(CUSTOM_STICKER_PACKS).length, 9);
assert.equal(Object.keys(FAN_ID_THEMES).length, 9);

for (const [packId, pack] of Object.entries(CUSTOM_STICKER_PACKS)) {
  assert.equal(pack.assets.length, 20, `${packId} must offer exactly 20 decals`);
  assert.equal(new Set(pack.assets.map((asset) => asset.id)).size, pack.assets.length, `${packId} ids must be unique`);
  // Both directions: the picker may never offer a decal without art (broken
  // image in the tray), and no generated art may sit on disk unoffered.
  const declaredFiles = new Set(pack.assets.map((asset) => path.basename(asset.src)));
  const customDirectory = path.join(process.cwd(), "public", "fanid-themes", packId, "custom");
  const onDisk = fs.existsSync(customDirectory) ? fs.readdirSync(customDirectory).filter((file) => file.endsWith(".png")) : [];
  assert.deepEqual(
    onDisk.filter((file) => !declaredFiles.has(file)),
    [],
    `${packId} has decal art on disk that the picker never offers`,
  );
  for (const asset of pack.assets) {
    assert.equal(asset.packId, packId);
    assert.equal(getCustomStickerAsset(asset.id)?.src, asset.src);
    assert.equal(fs.existsSync(path.join(process.cwd(), "public", asset.src.replace(/^\//, ""))), true, `missing ${asset.src}`);
  }
}

const first = CUSTOM_STICKER_PACKS.chrome.assets[0];
assert.deepEqual(makePlacedSticker(first, "new"), {
  id: "new", assetId: first.id, packId: "chrome", x: 50, y: 50, scale: DEFAULT_CUSTOM_STICKER_SCALE, rotation: 0,
});

const accepted = normalizePlacedStickers([{ id: "one", assetId: first.id, packId: "chrome", x: 124, y: -4, scale: 0.01, rotation: 900 }]);
assert.deepEqual(accepted, [{ id: "one", assetId: first.id, packId: "chrome", x: 100, y: 0, scale: 0.07, rotation: 180 }]);
assert.equal(normalizeCustomStickerRotation(270), -90, "a full left-side rotation must survive persistence");
assert.equal(normalizePlacedStickers(Array.from({ length: MAX_CUSTOM_STICKERS + 5 }, (_, index) => ({ id: String(index), assetId: first.id, packId: "chrome", x: 50, y: 50, scale: .13, rotation: 0 }))).length, MAX_CUSTOM_STICKERS);
assert.deepEqual(normalizePlacedStickers([{ id: "wrong", assetId: first.id, packId: "kawaii", x: 50, y: 50, scale: .13, rotation: 0 }]), []);

const layerMarkup = renderToStaticMarkup(createElement(FanIdCustomStickerLayer, {
  stickers: [{ id: "markup", assetId: first.id, packId: "chrome", x: 50, y: 42, scale: .13, rotation: 12 }],
}));
assert.match(layerMarkup, /data-fanid-custom-sticker="chrome-wire-heart"/);
assert.match(layerMarkup, /left:50%/);
assert.match(layerMarkup, /rotate\(12deg\)/);

const cardMarkup = renderToStaticMarkup(createElement(LocaleProvider, { locale: "en" }, createElement(FanIdCard, {
  sample: true,
  themeId: "chrome",
  customStickers: [{ id: "card", assetId: first.id, packId: "chrome", x: 50, y: 42, scale: .13, rotation: 12 }],
})));
assert.ok(cardMarkup.indexOf("data-fanid-card-frame=\"true\"") < cardMarkup.indexOf("data-fanid-custom-sticker=\"chrome-wire-heart\""), "card frame border must stay behind the custom decal");
assert.ok(cardMarkup.indexOf("qr-start.svg") < cardMarkup.indexOf("data-fanid-custom-sticker=\"chrome-wire-heart\""), "custom decal must appear over live card content");

const issueSource = fs.readFileSync(path.join(process.cwd(), "src/components/wizard/StepIssue.tsx"), "utf8");
assert.match(issueSource, /image\.decode \? image\.decode\(\)\.catch/, "export must wait for image decoding after it swaps the editor out");
assert.match(issueSource, /customStickerEditor=\{phase === "customize" && !exporting/, "editor controls must be absent during export");
console.log("fanid custom sticker catalogue checks passed");
