// Shared idol card theming — the muted, low-saturation per-idol hue used by the
// 圖鑑 small-cards (IdolFrame) and the 應援卡 (FanPassCard). Same idol seed always
// resolves to the same colour family, so the fan pass reads as the same visual
// family as the real idol cards rather than a knockoff.

export type CardTheme = { motifs: string[]; accent: string; soft: string };

// Muted tints in the same calm grey-white family as the 인생네컷 collage.
export const CARD_THEMES: CardTheme[] = [
  { motifs: ["🍎", "🍏"], accent: "#bf8b96", soft: "#efe8ea" }, // dusty rose
  { motifs: ["🍀", "☘️"], accent: "#8fae93", soft: "#e8efe9" }, // muted sage
  { motifs: ["🍓", "🍓"], accent: "#c294ac", soft: "#f0e9ee" }, // muted pink
  { motifs: ["⭐", "✦"], accent: "#8ca1c0", soft: "#e7ecf2" }, // muted slate blue
  { motifs: ["💎", "✦"], accent: "#9298a8", soft: "#e9ebf0" }, // blue grey
  { motifs: ["🎀", "💗"], accent: "#bf97b6", soft: "#efe9ef" }, // muted orchid
  { motifs: ["🌸", "🌷"], accent: "#c19aa3", soft: "#f0eaec" }, // muted mauve
  { motifs: ["🍒", "❤️"], accent: "#bf9094", soft: "#efe9ea" }, // muted clay
];

export function themeHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickTheme(seed: string): CardTheme {
  return CARD_THEMES[themeHash(seed) % CARD_THEMES.length];
}
