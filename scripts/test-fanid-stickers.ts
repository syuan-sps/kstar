import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FanIdCard from "@/components/FanIdCard";
import FanIdDecorationFrame, { FAN_ID_DECORATION_ASSETS } from "@/components/FanIdDecorationFrame";
import { StickerBombPreview } from "@/components/wizard/StickerBombPreview";
import { FAN_ID_THEMES, getFanIdTheme } from "@/lib/fanIdThemes";
import {
  getStickerComposition,
  resolveStickerThemeId,
  STICKER_THEME_IDS,
} from "@/lib/fanIdStickers";
import FanIdStickerLayer, { buildSvgIds, getStickerPaint } from "@/components/FanIdStickerLayer";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { EXPORT_STYLE_PROPS } from "@/lib/exportImage";
import {
  finishWizard,
  normalizeCardMode,
  normalizeStickersEnabled,
  normalizeThemeId,
} from "@/lib/wizardState";
import { SCORE_LAYERS } from "@/lib/types";
import { CUSTOM_STICKER_PACKS } from "@/lib/fanIdCustomStickers";

assert.equal(normalizeStickersEnabled(true), true);
assert.equal(normalizeStickersEnabled(false), false);
assert.equal(normalizeStickersEnabled("true"), false);
assert.equal(normalizeStickersEnabled(undefined), false);
assert.equal(normalizeThemeId("chrome"), "chrome");
assert.equal(normalizeThemeId("missing-theme"), "chrome");
assert.equal(normalizeThemeId("toString"), "chrome");
assert.equal(getFanIdTheme(undefined), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("missing-theme"), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("toString"), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("constructor"), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("__proto__"), FAN_ID_THEMES.chrome);
assert.equal(normalizeCardMode("user"), "user");
assert.equal(normalizeCardMode("missing-mode"), "idol-user");
assert.equal(EXPORT_STYLE_PROPS.includes("z-index"), true, "export should preserve z-order");

for (const themeId of Object.keys(FAN_ID_DECORATION_ASSETS)) {
  const decorationFrame = renderToStaticMarkup(
    createElement(FanIdDecorationFrame, { enabled: true, themeId }),
  );
  assert.match(decorationFrame, new RegExp(`data-fanid-decoration-frame="${themeId}-sleeve"`));
  assert.equal(decorationFrame.includes("data-fanid-decoration-popout="), false);
}

const decorationAssetPaths = Object.values(FAN_ID_DECORATION_ASSETS).map(({ sleeve }) => sleeve);
assert.equal(decorationAssetPaths.length, 4, "the four original themes should map one sleeve asset");
for (const assetPath of decorationAssetPaths) {
  assert.equal(
    fs.existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, ""))),
    true,
    `mapped decoration asset should exist: ${assetPath}`,
  );
}

assert.equal(
  renderToStaticMarkup(createElement(FanIdDecorationFrame, { enabled: false, themeId: "kawaii" })),
  "",
  "disabled Kawaii should not render decoration layers",
);
assert.equal(
  renderToStaticMarkup(createElement(FanIdDecorationFrame, { enabled: true, themeId: "missing-theme" })),
  "",
  "unknown themes should not render decoration layers",
);
assert.equal(
  renderToStaticMarkup(createElement(FanIdStickerLayer, { enabled: true, themeId: "kawaii" })),
  "",
  "enabled Kawaii should not render legacy SVG sticker layers",
);

type Bounds = Readonly<{ left: number; right: number; top: number; bottom: number }>;

// FanIdCard's two sticker SVGs cover the whole *auto-height* inner card
// (FanIdCard.tsx:141–146). Its header and hero are fixed in CSS
// (lines 147 and 165), while the archetype/footer below are intentionally
// auto-height (lines 195 and 237). The SVG uses preserveAspectRatio="none",
// so its y coordinates must be checked against every permitted rendered
// height, not a 640px snapshot. 678.59px is the browser measurement from the
// review; 640–700px is the strict supported interval. The upper bound includes
// the optional, single-line `song` footer (line 245); all variable footer
// strings are `truncate`d (lines 243–246), so no allowed input can add rows.
const CARD_LAYOUT = Object.freeze({
  innerWidth: 314,
  hero: { left: 13, right: 301, top: 66, bottom: 393.6 },
  portraitCaption: { left: 13, right: 301, top: 297.6, bottom: 393.6 },
  ownerAvatar: { left: 225, right: 289, top: 317.6, bottom: 381.6 },
});

const MIN_RENDERED_INNER_HEIGHT = 640;
const REVIEWED_RENDERED_INNER_HEIGHT = 678.59;
const MAX_RENDERED_INNER_HEIGHT = 700;

function normalizedBounds(bounds: Bounds, cardHeight: number): Bounds {
  return {
    left: (bounds.left / CARD_LAYOUT.innerWidth) * 100,
    right: (bounds.right / CARD_LAYOUT.innerWidth) * 100,
    top: (bounds.top / cardHeight) * 100,
    bottom: (bounds.bottom / cardHeight) * 100,
  };
}

function outsetBounds(bounds: Bounds, amount: number): Bounds {
  return {
    left: bounds.left - amount,
    right: bounds.right + amount,
    top: bounds.top - amount,
    bottom: bounds.bottom + amount,
  };
}

function protectedZonesForLayout(cardHeight: number, hasOwnerAvatar: boolean) {
  const shared = [
    // A 40px rail is the approved decoration perimeter; the center can show
    // either the idol or the user's face in every card mode.
    {
      name: "face",
      bounds: normalizedBounds({
        left: CARD_LAYOUT.hero.left + 40,
        right: CARD_LAYOUT.hero.right - 40,
        top: CARD_LAYOUT.hero.top + 20,
        bottom: CARD_LAYOUT.portraitCaption.top,
      }, cardHeight),
    },
    { name: "portrait-caption", bounds: normalizedBounds(CARD_LAYOUT.portraitCaption, cardHeight) },
    // FanIdCard places the archetype, holder, barcode, and QR after the hero.
    // This full-width barrier protects all of that auto-height content without
    // pretending its footer has a fixed y coordinate.
    {
      name: "archetype-footer-barcode-qr",
      bounds: normalizedBounds({
        left: 0,
        right: CARD_LAYOUT.innerWidth,
        top: CARD_LAYOUT.hero.bottom + 10,
        bottom: cardHeight,
      }, cardHeight),
    },
  ];

  if (hasOwnerAvatar) {
    // FanIdCard's 64px owner badge is absolute (line 186) and has an 18px
    // blurred shadow. A 30px outset covers its border and shadow footprint.
    shared.push({
      name: "owner-avatar",
      bounds: normalizedBounds(outsetBounds(CARD_LAYOUT.ownerAvatar, 30), cardHeight),
    });
  }

  return shared;
}

function stickerFootprintRadius(item: { size: number }) {
  // Shapes are inside scale(size / 20), but the filter belongs to the outer
  // translated group (FanIdStickerLayer.tsx:130 and :142). Therefore its
  // 0.3/0.8 offset and 0.7 stdDeviation must remain an absolute SVG allowance,
  // never be scaled down for small stickers. The circumscribed circle covers
  // every rotation; the largest 2.1px stroke is included before scaling.
  const scaledShapeAndStroke = item.size * ((11 * Math.SQRT2 + 1.05) / 20);
  const absoluteFilterOutset = 3.2; // max(0.3, 0.8) + 3 * 0.7, rounded up
  return scaledShapeAndStroke + absoluteFilterOutset;
}

function circleIntersectsBounds(
  item: { x: number; y: number; size: number },
  bounds: Bounds,
) {
  const nearestX = Math.max(bounds.left, Math.min(item.x, bounds.right));
  const nearestY = Math.max(bounds.top, Math.min(item.y, bounds.bottom));
  return Math.hypot(item.x - nearestX, item.y - nearestY) < stickerFootprintRadius(item);
}

const FAN_ID_RENDER_LAYOUTS = Object.freeze([
  { name: "idol", cardMode: "idol" as const, showFace: false, hasOwnerAvatar: false },
  { name: "idol-show-face", cardMode: "idol" as const, showFace: true, hasOwnerAvatar: true },
  { name: "idol-user", cardMode: "idol-user" as const, showFace: false, hasOwnerAvatar: true },
  { name: "user", cardMode: "user" as const, showFace: false, hasOwnerAvatar: false },
]);

assert.ok(
  stickerFootprintRadius({ size: 1 }) > 3.2,
  "the outer SVG filter allowance must not be scaled down with a small sticker",
);

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
      for (let cardHeight = MIN_RENDERED_INNER_HEIGHT; cardHeight <= MAX_RENDERED_INNER_HEIGHT; cardHeight += 0.25) {
        for (const layout of FAN_ID_RENDER_LAYOUTS) {
          for (const protectedZone of protectedZonesForLayout(cardHeight, layout.hasOwnerAvatar)) {
            assert.equal(
              circleIntersectsBounds(item, protectedZone.bounds),
              false,
              `${themeId}:${layout.name}:${item.id} at ${cardHeight}px must avoid the ${protectedZone.name} protected zone`,
            );
          }
        }
      }
    }
    if (item.zone === "certificate-edge") {
      assert.equal(item.layer, "under-content", `${themeId}:${item.id} certificate safety`);
    }
  }
}

for (const layout of FAN_ID_RENDER_LAYOUTS) {
  const markup = renderToStaticMarkup(
    createElement(
      LocaleProvider,
      { locale: "en" },
      createElement(FanIdCard, { sample: true, ...layout, stickersEnabled: true }),
    ),
  );
  assert.match(markup, new RegExp(`data-card-mode="${layout.cardMode}"`), `${layout.name} should render its card mode`);
  assert.match(markup, /data-fanid-entry="hero"/, `${layout.name} should render the face portrait`);
  assert.match(markup, /data-fanid-archetype="true"/, `${layout.name} should render archetype content`);
  assert.match(markup, /qr-start\.svg/, `${layout.name} should render the QR content`);
  assert.equal(markup.includes(">OWNER</span>"), layout.hasOwnerAvatar, `${layout.name} owner avatar state`);
}

assert.equal(
  REVIEWED_RENDERED_INNER_HEIGHT >= MIN_RENDERED_INNER_HEIGHT && REVIEWED_RENDERED_INNER_HEIGHT <= MAX_RENDERED_INNER_HEIGHT,
  true,
  "the reviewer-measured auto height must remain within the perimeter contract",
);

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

const DECORATED_CARD_LAYOUTS = ["idol", "idol-user", "user"] as const;
for (const themeId of Object.keys(FAN_ID_THEMES)) {
  for (const cardMode of DECORATED_CARD_LAYOUTS) {
    const decoratedCardMarkup = renderToStaticMarkup(
      createElement(
        LocaleProvider,
        { locale: "en" },
        createElement(FanIdCard, {
          sample: true,
          stickersEnabled: true,
          themeId,
          cardMode,
        }),
      ),
    );
    const label = `${themeId}:${cardMode}`;
    const hasSleeve = Object.prototype.hasOwnProperty.call(FAN_ID_DECORATION_ASSETS, themeId);
    assert.match(decoratedCardMarkup, new RegExp(`data-card-sticker-architecture="${hasSleeve ? "sleeve-frame" : "disabled"}"`), label);
    if (hasSleeve) assert.match(decoratedCardMarkup, new RegExp(`data-fanid-decoration-frame="${themeId}-sleeve"`), label);
    else assert.equal(decoratedCardMarkup.includes("data-fanid-decoration-frame="), false, label);
    assert.equal(decoratedCardMarkup.includes("data-fanid-decoration-popout="), false, `${label} should not render a foreground pop-out`);
    assert.equal(decoratedCardMarkup.includes("data-fanid-sticker-layer="), false, `${label} should not render legacy SVG sticker layers`);
  }
}

const defaultThemeMarkup = renderToStaticMarkup(
  createElement(
    LocaleProvider,
    { locale: "en" },
    createElement(FanIdCard, {
      sample: true,
      stickersEnabled: true,
      cardMode: "idol-user",
    }),
  ),
);
assert.match(defaultThemeMarkup, /data-theme="chrome"/, "omitted themes should retain the Chrome default");
assert.match(defaultThemeMarkup, /data-card-sticker-architecture="sleeve-frame"/, "omitted themes should enable the Chrome decoration architecture");
assert.match(defaultThemeMarkup, /data-fanid-decoration-frame="chrome-sleeve"/, "omitted themes should render the Chrome sleeve");
assert.equal(defaultThemeMarkup.includes("data-fanid-decoration-popout="), false, "omitted themes should not render a foreground pop-out");

const invalidThemeMarkup = renderToStaticMarkup(
  createElement(
    LocaleProvider,
    { locale: "en" },
    createElement(FanIdCard, {
      sample: true,
      stickersEnabled: true,
      themeId: "missing-theme" as FanIdThemeId,
      cardMode: "idol-user",
    }),
  ),
);
assert.match(invalidThemeMarkup, /data-theme="chrome"/, "invalid themes should retain the safe Chrome surface fallback");
assert.match(invalidThemeMarkup, /data-card-sticker-architecture="disabled"/, "invalid themes should disable decoration architecture");
assert.equal(invalidThemeMarkup.includes("data-fanid-decoration-frame="), false, "invalid themes should not render decoration sleeves");

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

localStorageMock.clear();
const exportDecal = CUSTOM_STICKER_PACKS.chrome.assets[0];
assert.equal(
  finishWizard({
    step: 4, picks: ["hero", "pick-2", "pick-3", "pick-4"], rank: [...SCORE_LAYERS], answers: {}, heroId: "hero", issuedAt: "2026.07.15", serial: "TEST-3",
    customStickers: [{ id: "saved", assetId: exportDecal.id, packId: exportDecal.packId, x: 23, y: 68, scale: .13, rotation: -12 }],
  }),
  true,
);
assert.deepEqual(JSON.parse(localStorageMock.getItem("kstar:prefs") ?? "{}").customStickers, [{ id: "saved", assetId: exportDecal.id, packId: exportDecal.packId, x: 23, y: 68, scale: .13, rotation: -12 }]);

const tastePortraitCardSource = fs.readFileSync(
  new URL("../src/components/TastePortraitCard.tsx", import.meta.url),
  "utf8",
);
assert.match(
  tastePortraitCardSource,
  /<SoulStoryCard\s+result=\{result\}\s+themeId=\{prefs\.themeId\}\s*\/>/,
  "completed story card should receive the normalized saved themeId",
);
assert.match(
  tastePortraitCardSource,
  /<SoulReport\s+result=\{result\}\s+answers=\{answers\}\s+themeId=\{prefs\.themeId\}\s*\/>/,
  "completed report card should receive the normalized saved themeId",
);
const disabledStickerPreview = renderToStaticMarkup(
  createElement(StickerBombPreview, { enabled: false }),
);
assert.match(
  disabledStickerPreview,
  /aria-hidden="true"/,
  "disabled Sticker bomb preview should stay decorative for assistive tech",
);
assert.match(disabledStickerPreview, /data-sticker-toggle-thumbnail="true"/);
assert.equal(
  disabledStickerPreview.includes("data-sticker-toggle-thumb-accent"),
  false,
  "disabled Sticker bomb preview should not render accents",
);

const enabledStickerPreview = renderToStaticMarkup(
  createElement(StickerBombPreview, { enabled: true }),
);
assert.match(
  enabledStickerPreview,
  /aria-hidden="true"/,
  "enabled Sticker bomb preview should stay decorative for assistive tech",
);
assert.match(enabledStickerPreview, /data-sticker-toggle-thumbnail="true"/);
assert.equal(
  (enabledStickerPreview.match(/data-sticker-toggle-thumb-accent/g) ?? []).length,
  3,
  "enabled Sticker bomb preview should render its three edge accents",
);

console.log("fanid sticker composition checks passed");
