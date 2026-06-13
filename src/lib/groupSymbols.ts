// Official-ish group symbols shown on idol photocard frames.
// Soloists (group === null) and groups not in this map fall back to ♡.
// Keys must match the exact `group` strings in catalog.json — variant keys are
// added where the catalog spelling differs from the canonical map key.

export const GROUP_SYMBOLS: Record<string, string> = {
  // ——— BOY GROUPS ———
  "BTS":            "⟭⟬",   // official BTS logo brackets
  "SEVENTEEN":      "◇",    // diamond (Carats fandom/logo)
  "Stray Kids":     "SkZ",  // SKZ logotype abbreviation
  "ENHYPEN":        "∞",    // infinity — debut concept symbol
  "TXT":            "✧",    // four-point star (official 𖧵 glyph has no font coverage → tofu)
  "ATEEZ":          "⧗",    // hourglass — official ATEEZ symbol
  "NCT 127":        "¹²⁷",  // unit number
  "NCT Dream":      "↺",    // rotation — comeback symbol
  "NCT":            "◎",    // circle mark
  "EXO":            "⁶",    // exo-k/m symbol
  "GOT7":           "☾",    // moon — official GOT7 symbol
  "MONSTA X":       "⋈",    // official MONSTA X symbol
  "DAY6":           "❦",    // floral heart — official Day6 symbol
  "SHINee":         "◈",    // shinee diamond
  "Super Junior":   "SJ",
  "BIGBANG":        "▲",    // triangle — VIP/logo
  "WINNER":         "W",
  "iKON":           "iKON",
  "TREASURE":       "☆",
  "THE BOYZ":       "◉",
  "ASTRO":          "✦",
  "VIXX":           "★",
  "INFINITE":       "∞",
  "2PM":            "◆",
  "Block B":        "B",
  "BTOB":           "◁▷",
  "CN Blue":        "♩",
  "FT Island":      "♪",
  "ZB1":            "Z",
  "ZEROBASEONE":    "Z",    // catalog spelling of ZB1
  "RIIZE":          "R",
  "P1Harmony":      "P1",

  // ——— GIRL GROUPS ———
  "BLACKPINK":      "♠",    // spade — in the name
  "TWICE":          "♡",    // heart — official TWICE symbol
  "aespa":          "⟡",    // aespa world/portal symbol
  "NewJeans":       "🐰",   // tokki bunny — official NJ symbol
  "IVE":            "◈",    // IVE jewel concept
  "LE SSERAFIM":    "💎",   // gemstone — official LS representation
  "(G)I-DLE":       "&",    // ampersand — official GI-DLE symbol
  "ITZY":           "⚡",   // lightning — ITZY energy
  "Red Velvet":     "◪",    // half-diamond rv
  "Girls' Generation": "☀", // sunny concept
  "f(x)":           "f(x)",
  "MAMAMOO":        "❖",    // four petals
  "SISTAR":         "♬",
  "2NE1":           "🎤",   // mic — 2NE1 symbol
  "4MINUTE":        "4",
  "miss A":         "A",
  "Wonder Girls":   "W",
  "T-ARA":          "♕",
  "KARA":           "K",
  "Apink":          "♩",
  "GFRIEND":        "回",    // official GFRIEND symbol
  "LOONA":          "Π",    // official LOONA symbol
  "Dreamcatcher":   "✸",    // eight-point star (official 𖧶 glyph has no font coverage → tofu)
  "STAYC":          "★",
  "Kep1er":         "🌟",
  "NMIXX":          "✕",
  "ILLIT":          "🌸",
  "BABYMONSTER":    "👾",   // monster concept
  "tripleS":        "✶",
  "CLASS:y":        "🎀",
  "KISS OF LIFE":   "💋",   // lips — on-brand
  "fromis_9":       "🍀",   // clover
  "WJSN":           "✨",
  "Loossemble":     "◯",
  "MÈOVV":          "🐱",   // cat concept
  "MEOVV":          "🐱",   // catalog spelling of MÈOVV
  "QWER":           "🎸",   // rock band concept

  // ——— J-POP groups ———
  "BE:FIRST":       "B",
  "JO1":            "J",
  "INI":            "I",
  "XG":             "✗",
};

// Helper — call this wherever the frame symbol is rendered.
export function getGroupSymbol(group: string | null | undefined): string {
  if (!group) return "♡"; // soloist fallback
  return GROUP_SYMBOLS[group] ?? "♡"; // unknown group fallback
}
