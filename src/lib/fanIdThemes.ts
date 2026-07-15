export type FanIdThemeId = "chrome" | "cloudy-dreamy" | "kawaii" | "monochrome-cute";

export interface FanIdTheme {
  id: FanIdThemeId;
  label: string;
  surface: string;
  surfaceColor: string;
  border: string;
  accent: string;
  text: string;
  muted: string;
  radius: string;
  header: string;
  fontClass: string;
  stickers: string[];
}

export const FAN_ID_THEMES: Record<FanIdThemeId, FanIdTheme> = {
  chrome: { id: "chrome", label: "Chrome", surface: "linear-gradient(150deg,#ededed 0%,#f6f6f6 30%,#eaeaea 55%,#f2f2f2 78%,#e4e4e4 100%)", surfaceColor: "#ededed", border: "#1c1e24", accent: "#56789f", text: "#1c1e24", muted: "#6a6a6a", radius: "16px", header: "linear-gradient(90deg,rgba(18,18,18,.94),rgba(36,36,36,.9))", fontClass: "font-orbitron", stickers: [] },
  "cloudy-dreamy": { id: "cloudy-dreamy", label: "Dreamy", surface: "linear-gradient(145deg,rgba(235,241,255,.96),rgba(255,248,255,.92) 55%,rgba(214,231,250,.96))", surfaceColor: "#edf1ff", border: "#b9c9e7", accent: "#8f83c4", text: "#38415b", muted: "#7885a5", radius: "22px", header: "linear-gradient(90deg,rgba(129,145,190,.8),rgba(193,177,224,.75))", fontClass: "font-sans", stickers: ["/fanid-themes/cloudy-dreamy/cloud-01.png", "/fanid-themes/cloudy-dreamy/moon-01.png", "/fanid-themes/cloudy-dreamy/sparkle-01.png"] },
  kawaii: { id: "kawaii", label: "Kawaii", surface: "linear-gradient(145deg,#fff0f6,#f7eaff 52%,#e8f2ff)", surfaceColor: "#fff0f6", border: "#e4a6c6", accent: "#d86e9e", text: "#5b3f55", muted: "#a77899", radius: "24px", header: "linear-gradient(90deg,#d982ad,#a995d4)", fontClass: "font-sans", stickers: ["/fanid-themes/kawaii/heart-pastel.png", "/fanid-themes/kawaii/bow-01.png", "/fanid-themes/kawaii/star-pearl.png"] },
  "monochrome-cute": { id: "monochrome-cute", label: "Mono Cute", surface: "linear-gradient(145deg,#fffefa,#f3f1ed)", surfaceColor: "#fffefa", border: "#242424", accent: "#555555", text: "#202020", muted: "#77736d", radius: "12px", header: "linear-gradient(90deg,#202020,#55514c)", fontClass: "font-sans", stickers: ["/fanid-themes/monochrome-cute/item-01.png", "/fanid-themes/monochrome-cute/item-05.png", "/fanid-themes/monochrome-cute/item-09.png"] },
};

export function getFanIdTheme(themeId?: string | null): FanIdTheme {
  return FAN_ID_THEMES[(themeId as FanIdThemeId) ?? "chrome"] ?? FAN_ID_THEMES.chrome;
}
