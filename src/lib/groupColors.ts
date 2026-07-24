// Official / widely-accepted fandom colours, used to tint each idol photocard's
// border by the group they belong to.
//
// Sourced from dbkpop's "Kpop Official Colors" table, kprofiles' per-label
// fan-colour pages (SM / JYP / HYBE), Koreaboo and karchives. Two rules the
// data follows, because a wrong colour is worse than no colour:
//
//  - `status: "official"` means formally assigned by the label/group.
//    `status: "fandom"` means never formally announced but near-universally
//    used by the fandom (BTS purple / "borahae", BIGBANG crown yellow).
//  - Groups with nothing credible are simply absent, and fall back to silver.
//    That is the correct result for MAMAMOO, Stray Kids, NewJeans, TXT, ATEEZ
//    and others that use per-member colours or none at all.
//
// Several hexes are faithful approximations of a *named* pearl/pastel colour
// (e.g. "Pearl Aqua Green") where no official hex has ever been published.

export type GroupColorStatus = "official" | "fandom";

export type GroupColorEntry = Readonly<{
  colors: readonly string[];
  names: readonly string[];
  status: GroupColorStatus;
}>;

// Neutral chrome used whenever a group has no credible colour, and for soloists.
export const SILVER_BORDER = Object.freeze(["#c8ccd2", "#9aa0aa"] as const);

const GROUP_COLORS: Readonly<Record<string, GroupColorEntry>> = Object.freeze({
  "(G)I-DLE": { colors: ["#E11900", "#7E00BF"], names: ["Neon Red", "Chic Violet"], status: "official" },
  "2NE1": { colors: ["#FF69B4"], names: ["Hot Pink"], status: "official" },
  "2PM": { colors: ["#1A1A1A"], names: ["Pearl Black"], status: "official" },
  "Apink": { colors: ["#F57F8E"], names: ["Strawberry Pink"], status: "official" },
  "BIGBANG": { colors: ["#FFD700"], names: ["Crown Yellow"], status: "fandom" },
  "BLACKPINK": { colors: ["#000000", "#FF6EC7"], names: ["Black", "Pink"], status: "official" },
  "BTS": { colors: ["#8B5FBF"], names: ["Purple"], status: "fandom" },
  "Dreamcatcher": { colors: ["#101820", "#8A2A2B"], names: ["Pantone Black 6 C", "Pantone 7623 C"], status: "official" },
  "EXO": { colors: ["#FFF8E7"], names: ["Cosmic Latte"], status: "official" },
  "GOT7": { colors: ["#008C45", "#FFFFFF"], names: ["Green", "White"], status: "official" },
  "Girls' Generation": { colors: ["#F4C2C2"], names: ["Pastel Rose Pink"], status: "official" },
  "ITZY": { colors: ["#FF00A0"], names: ["Magenta"], status: "official" },
  "KARA": { colors: ["#FFDAB9"], names: ["Pearl Peach"], status: "official" },
  "LE SSERAFIM": { colors: ["#1C4FD8"], names: ["Fearless Blue"], status: "official" },
  "MONSTA X": { colors: ["#00838A", "#8B00A8"], names: ["Pantone 2221 C", "Pantone 2405 C"], status: "official" },
  "NCT": { colors: ["#F2E1C1"], names: ["Pearl Neo Champagne"], status: "official" },
  "Oh My Girl": { colors: ["#F4A6D7", "#9ADBE8"], names: ["Pantone 230 C", "Pantone 304 C"], status: "official" },
  "RIIZE": { colors: ["#FF6A13"], names: ["Orange"], status: "official" },
  "Red Velvet": { colors: ["#FF9E8A"], names: ["Pastel Coral"], status: "official" },
  "SEVENTEEN": { colors: ["#F7CAC9", "#92A8D1"], names: ["Rose Quartz", "Serenity"], status: "official" },
  "SHINee": { colors: ["#7FE8D6"], names: ["Pearl Aqua Green"], status: "official" },
  "Super Junior": { colors: ["#0F52BA"], names: ["Pearl Sapphire Blue"], status: "official" },
  "TWICE": { colors: ["#FCC89B", "#FF5FA2"], names: ["Apricot", "Neon Magenta"], status: "official" },
  "WJSN": { colors: ["#FFA089", "#5D8AA8"], names: ["Vivid Tangerine", "Airforce Blue"], status: "official" },
  "Wonder Girls": { colors: ["#800020"], names: ["Pearl Burgundy"], status: "official" },
  "aespa": { colors: ["#B8E6D9"], names: ["Aurora"], status: "official" },
});

export function getGroupColorEntry(group?: string | null): GroupColorEntry | null {
  if (!group || !Object.prototype.hasOwnProperty.call(GROUP_COLORS, group)) return null;
  return GROUP_COLORS[group];
}

// The two stops of the photocard's diagonal border gradient. A group with one
// colour returns it for both stops (reads as solid); two colours blend A→B;
// anything unknown — including every soloist — falls back to silver.
export function getGroupBorderStops(group?: string | null): readonly [string, string] {
  const entry = getGroupColorEntry(group);
  if (!entry || entry.colors.length === 0) return [SILVER_BORDER[0], SILVER_BORDER[1]];
  const [first, second] = entry.colors;
  return [premiumTone(first), premiumTone(second ?? first)];
}

export { GROUP_COLORS };

// Blends a group colour toward white and returns an OPAQUE hex.
// The photocard paints its gradient edge with a border-box layer, which covers
// the whole card — the padding-box layer above it must therefore be fully
// opaque, or the edge colour bleeds through and floods the card body.
export function tintTowardWhite(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const channel = (i: number) => parseInt(h.slice(i, i + 2), 16);
  const mixed = [channel(0), channel(2), channel(4)]
    .map((c) => Math.round(c * amount + 255 * (1 - amount)))
    .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0"));
  return `#${mixed.join("")}`;
}

// ── Premium tone mapping ────────────────────────────────────────────────
// The documented official hexes above are deliberately left untouched — they
// are the traceable source of truth. For *display* we map them into the same
// muted envelope the Fan ID editions live in (saturation <= ~26%, lightness
// 34-58%), so a vivid stage colour like ITZY's #FF00A0 or BIGBANG's #FFD700
// sits beside chrome's #56789f without screaming.

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const hue = max === r
    ? ((g - b) / d + (g < b ? 6 : 0))
    : max === g
      ? (b - r) / d + 2
      : (r - g) / d + 4;
  return [(hue * 60) % 360, s, l];
}

function hslToHex(hDeg: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hDeg / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(hDeg / 60) % 6;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][seg < 0 ? seg + 6 : seg];
  return `#${[r, g, b]
    .map((v) => Math.round((v + m) * 255))
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
    .join("")}`;
}

const MAX_SATURATION = 0.26;
const MIN_LIGHTNESS = 0.34;
const MAX_LIGHTNESS = 0.58;

export function premiumTone(hex: string): string {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return hex;
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(s * 0.42, MAX_SATURATION), Math.max(MIN_LIGHTNESS, Math.min(MAX_LIGHTNESS, l)));
}
