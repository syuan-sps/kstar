import assert from "node:assert/strict";
import { getStickerComposition, STICKER_THEME_IDS } from "@/lib/fanIdStickers";

for (const themeId of STICKER_THEME_IDS) {
  const placements = getStickerComposition(themeId);
  assert.equal(placements.length >= 10 && placements.length <= 14, true, `${themeId} density`);
  assert.equal(new Set(placements.map((item) => item.id)).size, placements.length, `${themeId} ids`);
  for (const item of placements) {
    assert.equal(item.x >= 0 && item.x <= 100, true, `${themeId}:${item.id} x`);
    assert.equal(item.y >= 0 && item.y <= 100, true, `${themeId}:${item.id} y`);
    assert.equal(item.size > 0 && item.size <= 20, true, `${themeId}:${item.id} size`);
    assert.equal(
      Math.abs(item.rotate) <= 24,
      true,
      `${themeId}:${item.id} rotation safety`,
    );
    if (item.layer === "over-portrait") {
      assert.equal(item.zone, "portrait-edge", `${themeId}:${item.id} portrait safety`);
    }
    if (item.zone === "certificate-edge") {
      assert.equal(item.layer, "under-content", `${themeId}:${item.id} certificate safety`);
    }
  }
}

assert.deepEqual(getStickerComposition("missing-theme"), getStickerComposition("chrome"));
assert.equal(getStickerComposition(null).length, getStickerComposition("chrome").length);
assert.deepEqual(getStickerComposition("toString"), getStickerComposition("chrome"));
assert.equal(Object.isFrozen(getStickerComposition("chrome")), true);
assert.throws(() => getStickerComposition("chrome").pop(), TypeError);
console.log("fanid sticker composition checks passed");
