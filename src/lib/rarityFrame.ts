// Always-flattering rarity framing (owner-ratified): rare types flex the
// number; common types get a badge, never a demotion.
import { TYPE_RARITY } from "./typeRarity";

export function frameRarity(code: string): { label: string; pct: number } {
  const pct = TYPE_RARITY[code] ?? 6.3;
  if (pct <= 4) return { label: `${pct}% 超稀有型別`, pct };
  if (pct <= 8) return { label: `${pct}% 稀有型別`, pct };
  if (pct <= 14) return { label: `${pct}% 同路人`, pct };
  return { label: "主流大勢型", pct };
}
