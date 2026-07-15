import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FanIdCard from "@/components/FanIdCard";
import {
  getStickerComposition,
  resolveStickerThemeId,
  STICKER_THEME_IDS,
} from "@/lib/fanIdStickers";
import { buildSvgIds, getStickerPaint } from "@/components/FanIdStickerLayer";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { EXPORT_STYLE_PROPS } from "@/lib/exportImage";
import {
  finishWizard,
  normalizeCardMode,
  normalizeStickersEnabled,
  normalizeThemeId,
} from "@/lib/wizardState";
import { SCORE_LAYERS } from "@/lib/types";

assert.equal(normalizeStickersEnabled(true), true);
assert.equal(normalizeStickersEnabled(false), false);
assert.equal(normalizeStickersEnabled("true"), false);
assert.equal(normalizeStickersEnabled(undefined), false);
assert.equal(normalizeThemeId("chrome"), "chrome");
assert.equal(normalizeThemeId("missing-theme"), "chrome");
assert.equal(normalizeThemeId("toString"), "chrome");
assert.equal(normalizeCardMode("user"), "user");
assert.equal(normalizeCardMode("missing-mode"), "idol-user");
assert.equal(EXPORT_STYLE_PROPS.includes("z-index"), true, "export should preserve z-order");

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
assert.deepEqual(getStickerComposition("cloudy-dreamy"), getStickerComposition("dreamy"));
const dreamyBubble = getStickerComposition("cloudy-dreamy").find((item) => item.tone === "bubble");
assert.ok(dreamyBubble, "cloudy-dreamy should include its Dreamy bubble placement");
assert.equal(resolveStickerThemeId("cloudy-dreamy"), "dreamy");
assert.equal(
  getStickerPaint("dreamy", dreamyBubble, buildSvgIds("test")).fill,
  "url(#test-dreamy-bubble)",
);
assert.equal(getStickerComposition(null).length, getStickerComposition("chrome").length);
assert.deepEqual(getStickerComposition("toString"), getStickerComposition("chrome"));
assert.equal(Object.isFrozen(getStickerComposition("chrome")), true);
assert.throws(() => getStickerComposition("chrome").pop(), TypeError);

const decoratedSampleMarkup = renderToStaticMarkup(
  createElement(
    LocaleProvider,
    { locale: "en" },
    createElement(FanIdCard, {
      sample: true,
      stickersEnabled: true,
      themeId: "chrome",
      cardMode: "idol-user",
    }),
  ),
);
const passMarkers = decoratedSampleMarkup.match(/data-fanid-sticker-layer="([^"]+)"/g) ?? [];
assert.equal(passMarkers.length, 2, "decorated card should render exactly two named sticker passes");
assert.match(decoratedSampleMarkup, /data-fanid-sticker-layer="under-content"/);
assert.match(decoratedSampleMarkup, /data-fanid-sticker-layer="over-portrait"/);

const undecoratedSampleMarkup = renderToStaticMarkup(
  createElement(
    LocaleProvider,
    { locale: "en" },
    createElement(FanIdCard, {
      sample: true,
      stickersEnabled: false,
      themeId: "chrome",
      cardMode: "idol-user",
    }),
  ),
);
assert.equal(
  undecoratedSampleMarkup.includes("data-fanid-sticker-layer="),
  false,
  "undecorated card should not render sticker passes",
);

const storage = new Map<string, string>();
const localStorageMock = {
  get length() {
    return storage.size;
  },
  clear() {
    storage.clear();
  },
  getItem(key: string) {
    return storage.has(key) ? storage.get(key)! : null;
  },
  key(index: number) {
    return [...storage.keys()][index] ?? null;
  },
  removeItem(key: string) {
    storage.delete(key);
  },
  setItem(key: string, value: string) {
    storage.set(key, value);
  },
};
const windowMock = {
  dispatchEvent() {
    return true;
  },
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
Object.defineProperty(globalThis, "window", { value: windowMock, configurable: true });

assert.equal(
  finishWizard({
    step: 4,
    picks: ["hero", "pick-2", "pick-3", "pick-4"],
    rank: [...SCORE_LAYERS],
    answers: {},
    heroId: "hero",
    fanName: "Tester",
    issuedAt: "2026.07.15",
    serial: "TEST-1",
    themeId: "broken" as never,
    stickersEnabled: "true" as never,
    cardMode: "broken" as never,
  }),
  true,
);
const normalizedCompletedPrefs = JSON.parse(localStorageMock.getItem("kstar:prefs") ?? "{}");
assert.deepEqual(normalizedCompletedPrefs.topIdols, ["hero", "pick-2", "pick-3", "pick-4"]);
assert.deepEqual(normalizedCompletedPrefs.layerRank, [...SCORE_LAYERS]);
assert.equal(typeof normalizedCompletedPrefs.weights?.aesthetic, "number");
assert.equal(normalizedCompletedPrefs.heroId, "hero");
assert.equal(normalizedCompletedPrefs.fanName, "Tester");
assert.equal(normalizedCompletedPrefs.themeId, "chrome");
assert.equal(normalizedCompletedPrefs.cardMode, "idol-user");
assert.equal(normalizedCompletedPrefs.issuedAt, "2026.07.15");
assert.equal(normalizedCompletedPrefs.serial, "TEST-1");
assert.equal(normalizedCompletedPrefs.stickersEnabled, false);
assert.equal(normalizedCompletedPrefs.fanIdClaimed, true);

localStorageMock.clear();
assert.equal(
  finishWizard({
    step: 4,
    picks: ["hero", "pick-2", "pick-3", "pick-4"],
    rank: [...SCORE_LAYERS],
    answers: {},
    heroId: "hero",
    fanName: "Tester",
    issuedAt: "2026.07.15",
    serial: "TEST-2",
    themeId: "kawaii" as never,
    stickersEnabled: true,
    cardMode: "user",
  }),
  true,
);
assert.equal(JSON.parse(localStorageMock.getItem("kstar:prefs") ?? "{}").themeId, "kawaii");
assert.equal(JSON.parse(localStorageMock.getItem("kstar:prefs") ?? "{}").cardMode, "user");
assert.equal(JSON.parse(localStorageMock.getItem("kstar:prefs") ?? "{}").stickersEnabled, true);

console.log("fanid sticker composition checks passed");
