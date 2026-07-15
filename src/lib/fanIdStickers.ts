export type StickerThemeId = "chrome" | "dreamy" | "kawaii" | "monochrome-cute";

export type StickerKind =
  | "heart"
  | "star"
  | "bow"
  | "moon"
  | "cloud"
  | "pearl"
  | "sparkle"
  | "chain"
  | "butterfly"
  | "flower"
  | "cat"
  | "ghost"
  | "safety-pin";

export interface StickerPlacement {
  id: string;
  kind: StickerKind;
  x: number;
  y: number;
  size: number;
  rotate: number;
  zone: "header" | "portrait-edge" | "archetype-edge" | "certificate-edge";
  layer: "under-content" | "over-portrait";
  tone?: string;
}

export const STICKER_THEME_IDS: StickerThemeId[] = [
  "chrome",
  "dreamy",
  "kawaii",
  "monochrome-cute",
];

export const STICKER_COMPOSITIONS: Record<StickerThemeId, StickerPlacement[]> = {
  chrome: [
    { id: "chrome-heart-top", kind: "heart", x: 7, y: 9, size: 12, rotate: -12, zone: "header", layer: "under-content" },
    { id: "chrome-star-portrait", kind: "star", x: 93, y: 25, size: 16, rotate: 14, zone: "portrait-edge", layer: "over-portrait" },
    { id: "chrome-chain-right", kind: "chain", x: 97, y: 42, size: 11, rotate: 8, zone: "portrait-edge", layer: "over-portrait" },
    { id: "chrome-safety-pin", kind: "safety-pin", x: 4, y: 48, size: 13, rotate: -18, zone: "portrait-edge", layer: "under-content" },
    { id: "chrome-star-bottom", kind: "star", x: 8, y: 66, size: 13, rotate: -8, zone: "portrait-edge", layer: "under-content" },
    { id: "chrome-heart-bottom", kind: "heart", x: 91, y: 68, size: 15, rotate: 10, zone: "portrait-edge", layer: "under-content" },
    { id: "chrome-pearl-a", kind: "pearl", x: 4, y: 78, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
    { id: "chrome-pearl-b", kind: "pearl", x: 96, y: 80, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
    { id: "chrome-sparkle-a", kind: "sparkle", x: 12, y: 87, size: 7, rotate: 0, zone: "certificate-edge", layer: "under-content" },
    { id: "chrome-star-certificate", kind: "star", x: 89, y: 93, size: 10, rotate: 8, zone: "certificate-edge", layer: "under-content" },
  ],
  dreamy: [
    { id: "dreamy-moon-top", kind: "moon", x: 8, y: 10, size: 14, rotate: -12, zone: "header", layer: "under-content", tone: "pearl" },
    { id: "dreamy-star-portrait", kind: "star", x: 93, y: 25, size: 15, rotate: 12, zone: "portrait-edge", layer: "over-portrait", tone: "translucent" },
    { id: "dreamy-cloud-right", kind: "cloud", x: 97, y: 43, size: 12, rotate: 6, zone: "portrait-edge", layer: "over-portrait", tone: "soft" },
    { id: "dreamy-sparkle-left", kind: "sparkle", x: 4, y: 49, size: 10, rotate: -14, zone: "portrait-edge", layer: "under-content", tone: "pastel" },
    { id: "dreamy-moon-bottom", kind: "moon", x: 8, y: 66, size: 12, rotate: 10, zone: "portrait-edge", layer: "under-content", tone: "lavender" },
    { id: "dreamy-cloud-bottom", kind: "cloud", x: 91, y: 68, size: 14, rotate: -8, zone: "portrait-edge", layer: "under-content", tone: "soft" },
    { id: "dreamy-pearl-a", kind: "pearl", x: 4, y: 78, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
    { id: "dreamy-pearl-b", kind: "pearl", x: 96, y: 80, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
    { id: "dreamy-bubble-a", kind: "pearl", x: 12, y: 87, size: 7, rotate: 0, zone: "certificate-edge", layer: "under-content", tone: "bubble" },
    { id: "dreamy-sparkle-certificate", kind: "sparkle", x: 89, y: 93, size: 10, rotate: 8, zone: "certificate-edge", layer: "under-content", tone: "pastel" },
  ],
  kawaii: [
    { id: "kawaii-bow-top", kind: "bow", x: 8, y: 10, size: 14, rotate: -10, zone: "header", layer: "under-content", tone: "resin" },
    { id: "kawaii-star-portrait", kind: "star", x: 93, y: 25, size: 16, rotate: 12, zone: "portrait-edge", layer: "over-portrait", tone: "glossy" },
    { id: "kawaii-butterfly-right", kind: "butterfly", x: 97, y: 43, size: 12, rotate: 8, zone: "portrait-edge", layer: "over-portrait" },
    { id: "kawaii-flower-left", kind: "flower", x: 4, y: 49, size: 13, rotate: -14, zone: "portrait-edge", layer: "under-content" },
    { id: "kawaii-heart-bottom", kind: "heart", x: 8, y: 67, size: 14, rotate: -8, zone: "portrait-edge", layer: "under-content", tone: "candy" },
    { id: "kawaii-bow-bottom", kind: "bow", x: 91, y: 68, size: 15, rotate: 10, zone: "portrait-edge", layer: "under-content", tone: "resin" },
    { id: "kawaii-pearl-a", kind: "pearl", x: 4, y: 78, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
    { id: "kawaii-pearl-b", kind: "pearl", x: 96, y: 80, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content" },
    { id: "kawaii-flower-certificate", kind: "flower", x: 12, y: 87, size: 8, rotate: -8, zone: "certificate-edge", layer: "under-content" },
    { id: "kawaii-star-certificate", kind: "star", x: 89, y: 93, size: 10, rotate: 8, zone: "certificate-edge", layer: "under-content", tone: "glossy" },
  ],
  "monochrome-cute": [
    { id: "monochrome-cute-heart-top", kind: "heart", x: 8, y: 10, size: 13, rotate: -12, zone: "header", layer: "under-content", tone: "black" },
    { id: "monochrome-cute-star-portrait", kind: "star", x: 93, y: 25, size: 16, rotate: 14, zone: "portrait-edge", layer: "over-portrait", tone: "black-chrome" },
    { id: "monochrome-cute-cat-right", kind: "cat", x: 97, y: 43, size: 12, rotate: 8, zone: "portrait-edge", layer: "over-portrait" },
    { id: "monochrome-cute-ghost-left", kind: "ghost", x: 4, y: 49, size: 13, rotate: -10, zone: "portrait-edge", layer: "under-content" },
    { id: "monochrome-cute-bow-bottom", kind: "bow", x: 8, y: 67, size: 14, rotate: -8, zone: "portrait-edge", layer: "under-content", tone: "gingham" },
    { id: "monochrome-cute-heart-bottom", kind: "heart", x: 91, y: 68, size: 15, rotate: 10, zone: "portrait-edge", layer: "under-content", tone: "black" },
    { id: "monochrome-cute-pearl-a", kind: "pearl", x: 4, y: 78, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content", tone: "white" },
    { id: "monochrome-cute-pearl-b", kind: "pearl", x: 96, y: 80, size: 6, rotate: 0, zone: "archetype-edge", layer: "under-content", tone: "white" },
    { id: "monochrome-cute-ghost-certificate", kind: "ghost", x: 12, y: 87, size: 8, rotate: -8, zone: "certificate-edge", layer: "under-content" },
    { id: "monochrome-cute-star-certificate", kind: "star", x: 89, y: 93, size: 10, rotate: 8, zone: "certificate-edge", layer: "under-content", tone: "black-chrome" },
  ],
};

export function getStickerComposition(themeId?: string | null): StickerPlacement[] {
  if (themeId && themeId in STICKER_COMPOSITIONS) {
    return STICKER_COMPOSITIONS[themeId as StickerThemeId];
  }

  return STICKER_COMPOSITIONS.chrome;
}
