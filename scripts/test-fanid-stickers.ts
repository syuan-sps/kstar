import assert from "node:assert/strict";
import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import FanIdCard from "@/components/FanIdCard";
import { FAN_ID_THEMES, getFanIdTheme } from "@/lib/fanIdThemes";
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
assert.equal(getFanIdTheme(undefined), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("missing-theme"), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("toString"), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("constructor"), FAN_ID_THEMES.chrome);
assert.equal(getFanIdTheme("__proto__"), FAN_ID_THEMES.chrome);
assert.equal(normalizeCardMode("user"), "user");
assert.equal(normalizeCardMode("missing-mode"), "idol-user");
assert.equal(EXPORT_STYLE_PROPS.includes("z-index"), true, "export should preserve z-order");

type Bounds = Readonly<{ left: number; right: number; top: number; bottom: number }>;

// These measurements follow FanIdCard's fixed shell: 328px outer width, 7px
// shell padding, 54px header, 12px main/footer padding, and the 4:4.55 hero.
// The card has a stable 640px content height with the sample fixture used by
// the export path. Values are converted into the SVG's 0–100 coordinate space.
const CARD_LAYOUT = Object.freeze({
  innerWidth: 314,
  innerHeight: 640,
  hero: { left: 13, right: 301, top: 66, bottom: 394 },
  portraitCaption: { left: 13, right: 301, top: 299, bottom: 394 },
  ownerAvatar: { left: 225, right: 289, top: 318, bottom: 382 },
  archetype: { left: 13, right: 301, top: 404, bottom: 554 },
  holder: { left: 25, right: 228, top: 586, bottom: 629 },
  barcode: { left: 25, right: 101, top: 576, bottom: 592 },
  qr: { left: 246, right: 289, top: 575, bottom: 618 },
});

function normalizedBounds(bounds: Bounds): Bounds {
  return {
    left: (bounds.left / CARD_LAYOUT.innerWidth) * 100,
    right: (bounds.right / CARD_LAYOUT.innerWidth) * 100,
    top: (bounds.top / CARD_LAYOUT.innerHeight) * 100,
    bottom: (bounds.bottom / CARD_LAYOUT.innerHeight) * 100,
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

const SHARED_OVER_PORTRAIT_PROTECTED_ZONES = Object.freeze([
  // Keep a 40px rail around the hero for the approved 8–14px edge overlap.
  // Everything inside this center block can contain a face in every card mode.
  {
    name: "face-safe",
    bounds: normalizedBounds({
      left: CARD_LAYOUT.hero.left + 40,
      right: CARD_LAYOUT.hero.right - 40,
      top: CARD_LAYOUT.hero.top + 20,
      bottom: CARD_LAYOUT.portraitCaption.top,
    }),
  },
  { name: "portrait-caption", bounds: normalizedBounds(CARD_LAYOUT.portraitCaption) },
  { name: "archetype-and-score-content", bounds: normalizedBounds(CARD_LAYOUT.archetype) },
  { name: "holder-and-issued-content", bounds: normalizedBounds(CARD_LAYOUT.holder) },
  { name: "barcode", bounds: normalizedBounds(CARD_LAYOUT.barcode) },
  { name: "qr", bounds: normalizedBounds(CARD_LAYOUT.qr) },
]);

const PROTECTED_ZONES_BY_CARD_MODE = Object.freeze({
  idol: SHARED_OVER_PORTRAIT_PROTECTED_ZONES,
  "idol-user": [
    ...SHARED_OVER_PORTRAIT_PROTECTED_ZONES,
    // Includes the avatar border and its 8px drop-shadow footprint.
    { name: "owner-avatar", bounds: normalizedBounds(outsetBounds(CARD_LAYOUT.ownerAvatar, 8)) },
  ],
  user: SHARED_OVER_PORTRAIT_PROTECTED_ZONES,
});

function stickerFootprintRadius(item: { size: number }) {
  // Every SVG shape fits inside a +/-11 unit square before its size/20 scale.
  // Use that square's circumscribed circle, then include the 1.1px stroke and
  // 0.3/0.8/0.7 drop-shadow footprint. This remains safe for every rotation.
  return item.size * ((11 * Math.SQRT2 + 3) / 20);
}

function circleIntersectsBounds(
  item: { x: number; y: number; size: number },
  bounds: Bounds,
) {
  const nearestX = Math.max(bounds.left, Math.min(item.x, bounds.right));
  const nearestY = Math.max(bounds.top, Math.min(item.y, bounds.bottom));
  return Math.hypot(item.x - nearestX, item.y - nearestY) < stickerFootprintRadius(item);
}

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
      for (const [cardMode, protectedZones] of Object.entries(PROTECTED_ZONES_BY_CARD_MODE)) {
        for (const protectedZone of protectedZones) {
          assert.equal(
            circleIntersectsBounds(item, protectedZone.bounds),
            false,
            `${themeId}:${cardMode}:${item.id} must avoid the ${protectedZone.name} protected zone`,
          );
        }
      }
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

const tastePortraitCardSource = fs.readFileSync(
  new URL("../src/components/TastePortraitCard.tsx", import.meta.url),
  "utf8",
);
const stepIssueSource = fs.readFileSync(
  new URL("../src/components/wizard/StepIssue.tsx", import.meta.url),
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
const stepIssueAst = ts.createSourceFile(
  "StepIssue.tsx",
  stepIssueSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);

function jsxAttribute(
  opening: ts.JsxOpeningLikeElement,
  name: string,
) {
  return opening.attributes.properties.find(
    (attribute): attribute is ts.JsxAttribute =>
      ts.isJsxAttribute(attribute) && attribute.name.getText(stepIssueAst) === name,
  );
}

function isLiteralTrue(attribute: ts.JsxAttribute | undefined) {
  const initializer = attribute?.initializer;
  return Boolean(
    (initializer && ts.isStringLiteral(initializer) && initializer.text === "true") ||
      (initializer &&
        ts.isJsxExpression(initializer) &&
        initializer.expression?.kind === ts.SyntaxKind.TrueKeyword),
  );
}

function findJsxElementsWithAttribute(name: string) {
  const matches: ts.JsxElement[] = [];
  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node) && jsxAttribute(node.openingElement, name)) {
      matches.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(stepIssueAst);
  return matches;
}

function countThumbAccents(node: ts.Node) {
  let count = 0;
  function visit(child: ts.Node): void {
    if (
      ((ts.isJsxElement(child) &&
        jsxAttribute(child.openingElement, "data-sticker-toggle-thumb-accent")) ||
        (ts.isJsxSelfClosingElement(child) &&
          jsxAttribute(child, "data-sticker-toggle-thumb-accent")))
    ) {
      count += 1;
    }
    ts.forEachChild(child, visit);
  }
  visit(node);
  return count;
}

const thumbnails = findJsxElementsWithAttribute("data-sticker-toggle-thumbnail");
assert.equal(thumbnails.length, 1, "Sticker bomb control should include exactly one compact preview thumbnail");
assert.equal(
  isLiteralTrue(jsxAttribute(thumbnails[0].openingElement, "aria-hidden")),
  true,
  "Sticker bomb thumbnail should stay decorative for assistive tech",
);

const enabledThumbnailExpression = thumbnails[0].children.find(
  (child): child is ts.JsxExpression =>
    ts.isJsxExpression(child) &&
    Boolean(
      child.expression &&
        ts.isBinaryExpression(child.expression) &&
        child.expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
        ts.isIdentifier(child.expression.left) &&
        child.expression.left.text === "stickersEnabled" &&
        countThumbAccents(child.expression.right) === 3,
    ),
);
assert.ok(
  enabledThumbnailExpression,
  "Sticker bomb thumbnail should render edge accents only when stickersEnabled is true",
);

console.log("fanid sticker composition checks passed");
