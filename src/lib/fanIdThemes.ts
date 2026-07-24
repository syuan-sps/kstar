export type FanIdThemeId =
  | "chrome"
  | "cloudy-dreamy"
  | "kawaii"
  | "monochrome-cute"
  | "ribbon-diary"
  | "cherry-picnic"
  | "blue-angel"
  | "jelly-aquarium"
  | "dark-cherry";

export interface FanIdTheme {
  id: FanIdThemeId;
  label: string;
  labelZh: string;
  surface: string;
  surfaceColor: string;
  border: string;
  accent: string;
  text: string;
  muted: string;
  radius: string;
  header: string;
  fontClass: string;
}

export const FAN_ID_THEMES: Record<FanIdThemeId, FanIdTheme> = {
  chrome: { id: "chrome", label: "Chrome", labelZh: "鏡面鉻銀", surface: "linear-gradient(150deg,#ededed 0%,#f6f6f6 30%,#eaeaea 55%,#f2f2f2 78%,#e4e4e4 100%)", surfaceColor: "#ededed", border: "#1c1e24", accent: "#56789f", text: "#1c1e24", muted: "#6a6a6a", radius: "16px", header: "linear-gradient(90deg,rgba(18,18,18,.94),rgba(36,36,36,.9))", fontClass: "font-orbitron" },
  "cloudy-dreamy": { id: "cloudy-dreamy", label: "Dreamy", labelZh: "雲朵夢境", surface: "linear-gradient(145deg,rgba(235,241,255,.96),rgba(255,248,255,.92) 55%,rgba(214,231,250,.96))", surfaceColor: "#edf1ff", border: "#b9c9e7", accent: "#8f83c4", text: "#38415b", muted: "#7885a5", radius: "22px", header: "linear-gradient(90deg,rgba(129,145,190,.8),rgba(193,177,224,.75))", fontClass: "font-sans" },
  kawaii: { id: "kawaii", label: "Kawaii", labelZh: "卡哇伊風", surface: "linear-gradient(145deg,#fff0f6,#f7eaff 52%,#e8f2ff)", surfaceColor: "#fff0f6", border: "#e4a6c6", accent: "#d86e9e", text: "#5b3f55", muted: "#a77899", radius: "24px", header: "linear-gradient(90deg,#d982ad,#a995d4)", fontClass: "font-sans" },
  "monochrome-cute": { id: "monochrome-cute", label: "Mono Cute", labelZh: "黑白可愛", surface: "linear-gradient(145deg,#fffefa,#f3f1ed)", surfaceColor: "#fffefa", border: "#242424", accent: "#555555", text: "#202020", muted: "#77736d", radius: "12px", header: "linear-gradient(90deg,#202020,#55514c)", fontClass: "font-sans" },
  "ribbon-diary": { id: "ribbon-diary", label: "Ribbon Diary", labelZh: "緞帶日記", surface: "linear-gradient(145deg,#fff9f4,#f8e9ee 54%,#efe3f4)", surfaceColor: "#fff8f4", border: "#dfb8c8", accent: "#c57999", text: "#563d4a", muted: "#9c7d8b", radius: "24px", header: "linear-gradient(90deg,#c9779c,#d6b5d7)", fontClass: "font-sans" },
  "cherry-picnic": { id: "cherry-picnic", label: "Cherry Picnic", labelZh: "櫻桃野餐", surface: "linear-gradient(145deg,#fff8eb,#fbe6dc 56%,#f1d4d7)", surfaceColor: "#fff8eb", border: "#c5484d", accent: "#b6323d", text: "#512d2c", muted: "#9a6964", radius: "18px", header: "linear-gradient(90deg,#a92f38,#df6a64)", fontClass: "font-sans" },
  "blue-angel": { id: "blue-angel", label: "Blue Angel", labelZh: "藍色天使", surface: "linear-gradient(145deg,#f5fbff,#e6f1ff 50%,#e5e5fb)", surfaceColor: "#f3f9ff", border: "#a9b9e7", accent: "#768bd1", text: "#344567", muted: "#7686a8", radius: "24px", header: "linear-gradient(90deg,#7088ca,#a9abe1)", fontClass: "font-sans" },
  "jelly-aquarium": { id: "jelly-aquarium", label: "Jelly Aquarium", labelZh: "果凍水族", surface: "linear-gradient(145deg,#e8fcfd,#e5f5ff 48%,#eee9ff)", surfaceColor: "#eafbfc", border: "#8cced7", accent: "#63aeb9", text: "#28545f", muted: "#6594a1", radius: "26px", header: "linear-gradient(90deg,#5caeb9,#a99bd2)", fontClass: "font-sans" },
  "dark-cherry": { id: "dark-cherry", label: "Dark Cherry", labelZh: "暗黑櫻桃", surface: "linear-gradient(145deg,#f7eff2,#ead8df 50%,#dfcbd3)", surfaceColor: "#f7eff2", border: "#4d202c", accent: "#812f46", text: "#311a22", muted: "#76515d", radius: "16px", header: "linear-gradient(90deg,#2b171c,#783246)", fontClass: "font-sans" },
};

export function getFanIdTheme(themeId?: string | null): FanIdTheme {
  if (themeId && Object.prototype.hasOwnProperty.call(FAN_ID_THEMES, themeId)) {
    return FAN_ID_THEMES[themeId as FanIdThemeId];
  }
  return FAN_ID_THEMES.chrome;
}
