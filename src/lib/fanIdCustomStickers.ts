import type { FanIdThemeId } from "@/lib/fanIdThemes";

export type CustomStickerPackId = FanIdThemeId;

export type CustomStickerAsset = Readonly<{
  id: string;
  packId: CustomStickerPackId;
  label: string;
  src: string;
}>;

export type PlacedCustomSticker = Readonly<{
  id: string;
  assetId: string;
  packId: CustomStickerPackId;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}>;

export const MAX_CUSTOM_STICKERS = 8;
export const MIN_CUSTOM_STICKER_SCALE = 0.07;
export const MAX_CUSTOM_STICKER_SCALE = 0.26;
export const DEFAULT_CUSTOM_STICKER_SCALE = 0.13;

type PackDefinition = Readonly<{
  label: string;
  path: string;
  assets: readonly Readonly<{ id: string; label: string; file: string }> [];
}>;

function entries(...items: readonly string[]) {
  return items.map((item) => {
    const [id, label] = item.split("|");
    return { id, label, file: `${id}.png` };
  });
}

const PACKS: Readonly<Record<CustomStickerPackId, PackDefinition>> = {
  chrome: {
    label: "Chrome", path: "/fanid-themes/chrome/custom",
    assets: [
      { id: "chrome-wire-heart", label: "Wire heart", file: "../generated-decal-01.png" },
      { id: "chrome-compass-star", label: "Compass star", file: "../generated-decal-02.png" },
      { id: "chrome-saturn-charm", label: "Saturn charm", file: "../generated-decal-03.png" },
      ...entries("chrome-dice|Chrome dice", "chrome-safety-pin|Safety pin", "chrome-micro-chain|Micro chain", "chrome-cassette|Silver cassette", "chrome-star-key|Star key", "chrome-crystal-bolt|Crystal bolt", "chrome-padlock|Tiny padlock", "chrome-wing-charm|Wing charm", "chrome-bow|Chrome bow", "chrome-spiked-heart|Spiked heart", "chrome-moon-disc|Moon disc", "chrome-tag|Metal tag", "chrome-gem-star|Gem star", "chrome-ring-pull|Ring pull", "chrome-lightning|Lightning", "chrome-pearl-stud|Pearl stud", "chrome-barcode-tab|Barcode tab"),
    ],
  },
  "cloudy-dreamy": {
    label: "Dreamy", path: "/fanid-themes/cloudy-dreamy/custom",
    assets: [
      { id: "dreamy-cloud-pearls", label: "Cloud pearls", file: "../generated-decal-01.png" },
      { id: "dreamy-moon-star", label: "Moon star", file: "../generated-decal-02.png" },
      { id: "dreamy-galaxy-locket", label: "Galaxy locket", file: "../generated-decal-03.png" },
      ...entries("dreamy-sleepy-cloud|Sleepy cloud", "dreamy-rainbow-charm|Rainbow charm", "dreamy-bubble-cluster|Bubble cluster", "dreamy-angel-wing|Angel wing", "dreamy-blue-bow|Blue bow", "dreamy-shooting-star|Shooting star", "dreamy-lavender-heart|Lavender heart", "dreamy-shell|Shell", "dreamy-glass-droplet|Glass droplet", "dreamy-crescent|Crescent", "dreamy-tiny-planet|Tiny planet", "dreamy-cloud-ribbon|Cloud ribbon", "dreamy-pearl-flower|Pearl flower", "dreamy-star-wand|Star wand", "dreamy-snowflake|Snowflake", "dreamy-soft-key|Soft key", "dreamy-sparkle-gem|Sparkle gem"),
    ],
  },
  kawaii: {
    label: "Kawaii", path: "/fanid-themes/kawaii/custom",
    assets: [
      { id: "kawaii-butterfly", label: "Butterfly", file: "../generated-decal-01.png" },
      { id: "kawaii-heart-locket", label: "Heart locket", file: "../generated-decal-02.png" },
      { id: "kawaii-strawberry-cake", label: "Strawberry cake", file: "../generated-decal-03.png" },
      ...entries("kawaii-ribbon-bow|Ribbon bow", "kawaii-cherry-pair|Cherry pair", "kawaii-glossy-star|Glossy star", "kawaii-tiny-panda|Tiny panda", "kawaii-paw-heart|Paw heart", "kawaii-candy|Candy", "kawaii-flower-button|Flower button", "kawaii-bunny-charm|Bunny charm", "kawaii-ribbon-tag|Ribbon tag", "kawaii-peach|Peach", "kawaii-kitty-mug|Kitty mug", "kawaii-star-cookie|Star cookie", "kawaii-jelly-heart|Jelly heart", "kawaii-milk-carton|Milk carton", "kawaii-mini-camera|Mini camera", "kawaii-strawberry|Strawberry", "kawaii-bubble-wand|Bubble wand"),
    ],
  },
  "monochrome-cute": {
    label: "Mono Cute", path: "/fanid-themes/monochrome-cute/custom",
    assets: [
      { id: "mono-black-cat", label: "Black cat", file: "../generated-decal-01.png" },
      { id: "mono-heart-pin", label: "Heart pin", file: "../generated-decal-02.png" },
      { id: "mono-gingham-bow", label: "Gingham bow", file: "../generated-decal-03.png" },
      ...entries("mono-checker-star|Checker star", "mono-ghost|Ghost", "mono-ribbon-tag|Ribbon tag", "mono-black-heart|Black heart", "mono-safety-pin|Safety pin", "mono-dice|Dice", "mono-moon|Moon", "mono-skull-bow|Skull bow", "mono-white-flower|White flower", "mono-camera|Camera", "mono-star-patch|Star patch", "mono-cat-paw|Cat paw", "mono-bow-key|Bow key", "mono-checker-cherry|Checker cherry", "mono-bear|Monochrome bear", "mono-barcode-charm|Barcode charm", "mono-lightning-heart|Lightning heart"),
    ],
  },
  "ribbon-diary": { label: "Ribbon Diary", path: "/fanid-themes/ribbon-diary/custom", assets: entries("ribbon-satin-bow|Satin bow", "ribbon-pressed-flower|Pressed flower", "ribbon-pearl-heart|Pearl heart", "ribbon-diary-tab|Diary tab", "ribbon-ballet-shoe|Ballet shoe", "ribbon-lace-rosette|Lace rosette", "ribbon-cameo|Cameo", "ribbon-tag|Ribbon tag", "ribbon-perfume|Perfume bottle", "ribbon-pearl-chain|Pearl chain", "ribbon-envelope|Mini envelope", "ribbon-button-flower|Button flower", "ribbon-lipstick|Lipstick charm", "ribbon-tulip|Tulip", "ribbon-stamp|Sticker stamp", "ribbon-mirror|Mirror", "ribbon-tiara|Tiny tiara", "ribbon-bow-clip|Bow clip", "ribbon-heart-lock|Heart lock", "ribbon-scallop-label|Scallop label") },
  "cherry-picnic": { label: "Cherry Picnic", path: "/fanid-themes/cherry-picnic/custom", assets: entries("picnic-strawberry|Strawberry", "picnic-cherry-pair|Cherry pair", "picnic-gingham-bow|Gingham bow", "picnic-dessert-fork|Dessert fork", "picnic-cake-slice|Cake slice", "picnic-jam-jar|Jam jar", "picnic-basket|Picnic basket", "picnic-clover|Clover", "picnic-cherry-pie|Cherry pie", "picnic-red-ribbon|Red ribbon", "picnic-teacup|Tiny teacup", "picnic-milk-bottle|Milk bottle", "picnic-strawberry-milk|Strawberry milk", "picnic-flower|Flower", "picnic-heart-cookie|Heart cookie", "picnic-checker-tab|Checker tab", "picnic-berry-charm|Berry charm", "picnic-sun|Sun", "picnic-gingham-heart|Gingham heart", "picnic-ticket|Picnic ticket") },
  "blue-angel": { label: "Blue Angel", path: "/fanid-themes/blue-angel/custom", assets: entries("angel-crystal-heart|Crystal heart", "angel-wing|Angel wing", "angel-blue-ribbon|Blue ribbon", "angel-star-halo|Star halo", "angel-pearl-drop|Pearl drop", "angel-moon|Moon", "angel-cloud|Cloud", "angel-silver-cross|Silver cross", "angel-icy-butterfly|Icy butterfly", "angel-locket|Locket", "angel-bow|Angel bow", "angel-crystal-star|Crystal star", "angel-winged-key|Winged key", "angel-blue-rose|Blue rose", "angel-snowflake|Snowflake", "angel-tiny-crown|Tiny crown", "angel-ribbon-heart|Ribbon heart", "angel-dove|Dove", "angel-harp|Harp", "angel-blue-gem|Blue gem") },
  "jelly-aquarium": { label: "Jelly Aquarium", path: "/fanid-themes/jelly-aquarium/custom", assets: entries("aqua-bubble|Bubble", "aqua-shell|Shell", "aqua-jellyfish|Jellyfish", "aqua-pearl|Pearl", "aqua-fish-charm|Fish charm", "aqua-starfish|Starfish", "aqua-seahorse|Seahorse", "aqua-bow|Aqua bow", "aqua-coral|Coral", "aqua-tiny-whale|Tiny whale", "aqua-glass-heart|Glass heart", "aqua-mermaid-tail|Mermaid tail", "aqua-clam-locket|Clam locket", "aqua-water-droplet|Water droplet", "aqua-sea-angel|Sea angel", "aqua-shell-flower|Shell flower", "aqua-bubble-wand|Bubble wand", "aqua-ticket|Aquarium ticket", "aqua-moonfish|Moonfish", "aqua-crystal-bead|Crystal bead") },
  "dark-cherry": { label: "Dark Cherry", path: "/fanid-themes/dark-cherry/custom", assets: entries("dark-wine-bow|Wine bow", "dark-black-cherry|Black cherry", "dark-lace-heart|Lace heart", "dark-lock|Lock", "dark-razor-heart|Razor heart charm", "dark-thorn-rose|Thorn rose", "dark-glossy-star|Glossy star", "dark-lipstick|Red lipstick", "dark-gothic-ribbon|Gothic ribbon", "dark-chain-heart|Chain heart", "dark-black-pearl|Black pearl", "dark-dice|Dice", "dark-key|Key", "dark-red-cross|Red cross", "dark-tiny-bat|Tiny bat", "dark-heart-flame|Heart flame", "dark-rose|Dark rose", "dark-plaid-bow|Plaid bow", "dark-wine-glass|Wine glass", "dark-black-cameo|Black cameo") },
};

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export const CUSTOM_STICKER_PACKS: Readonly<Record<CustomStickerPackId, Readonly<{ label: string; assets: readonly CustomStickerAsset[] }>>> = Object.freeze(
  Object.fromEntries(Object.entries(PACKS).map(([packId, pack]) => [packId, Object.freeze({
    label: pack.label,
    assets: Object.freeze(pack.assets.map((asset) => Object.freeze({
      id: asset.id,
      packId: packId as CustomStickerPackId,
      label: asset.label,
      src: asset.file.startsWith("../")
        ? `${pack.path.replace(/\/custom$/, "")}/${asset.file.slice(3)}`
        : `${pack.path}/${asset.file}`,
    }))),
  })])) as Record<CustomStickerPackId, Readonly<{ label: string; assets: readonly CustomStickerAsset[] }>>,
);

const ASSETS_BY_ID: Readonly<Record<string, CustomStickerAsset>> = Object.freeze(
  Object.fromEntries(Object.values(CUSTOM_STICKER_PACKS).flatMap((pack) => pack.assets.map((asset) => [asset.id, asset]))),
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeCustomStickerRotation(value: number): number {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getCustomStickerAsset(assetId: string): CustomStickerAsset | null {
  return hasOwn(ASSETS_BY_ID, assetId) ? ASSETS_BY_ID[assetId] : null;
}

export function getCustomStickerPack(packId?: string | null) {
  return packId && hasOwn(CUSTOM_STICKER_PACKS, packId)
    ? CUSTOM_STICKER_PACKS[packId as CustomStickerPackId]
    : CUSTOM_STICKER_PACKS.chrome;
}

export function makePlacedSticker(asset: CustomStickerAsset, id: string): PlacedCustomSticker {
  return { id, assetId: asset.id, packId: asset.packId, x: 50, y: 50, scale: DEFAULT_CUSTOM_STICKER_SCALE, rotation: 0 };
}

export function normalizePlacedStickers(value: unknown): PlacedCustomSticker[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const normalized: PlacedCustomSticker[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || normalized.length >= MAX_CUSTOM_STICKERS) continue;
    const candidate = item as Partial<PlacedCustomSticker>;
    const asset = typeof candidate.assetId === "string" ? getCustomStickerAsset(candidate.assetId) : null;
    if (!asset || candidate.packId !== asset.packId || typeof candidate.id !== "string" || candidate.id.length < 1 || candidate.id.length > 96 || ids.has(candidate.id)) continue;
    if (!finite(candidate.x) || !finite(candidate.y) || !finite(candidate.scale) || !finite(candidate.rotation)) continue;
    ids.add(candidate.id);
    normalized.push(Object.freeze({
      id: candidate.id,
      assetId: asset.id,
      packId: asset.packId,
      x: clamp(candidate.x, 0, 100),
      y: clamp(candidate.y, 0, 100),
      scale: clamp(candidate.scale, MIN_CUSTOM_STICKER_SCALE, MAX_CUSTOM_STICKER_SCALE),
      rotation: normalizeCustomStickerRotation(candidate.rotation),
    }));
  }
  return normalized;
}
