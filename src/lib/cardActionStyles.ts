// One canonical action-button look shared by every result card (限動卡, 完整報告,
// 追星證, 人生四格) so the row under each card reads identically. Matches the styles
// SoulStoryCard/SoulReport already use, lifted here so the four-cut and Fan ID
// views can reuse the exact same pills.

// Primary (下載): filled red.
export const CARD_BTN_PRIMARY =
  "rounded-full bg-[#b4302b] px-3 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:brightness-110 disabled:opacity-50";

// Secondary (分享): glassy white pill (pair with CARD_BTN_SECONDARY_STYLE).
export const CARD_BTN_SECONDARY =
  "rounded-full border border-white/[0.68] px-3 py-2 text-xs font-bold text-[#1a1a1a] shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:brightness-95 disabled:opacity-50";
export const CARD_BTN_SECONDARY_STYLE = { backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.38))" } as const;

// Extra action (e.g. 裝飾): dark pill, distinct from the red primary.
export const CARD_BTN_DARK =
  "rounded-full bg-[#1c1e24] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-125 disabled:opacity-50";

// Tertiary text link (e.g. 重新挑選).
export const CARD_BTN_GHOST =
  "rounded-full px-3 py-2 text-xs font-medium text-[#5e636d]/70 transition hover:text-[#7c8088]";
