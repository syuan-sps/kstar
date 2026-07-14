// 圖鑑 browsing helpers — derive filterable categories from catalog data.
import type { Artist } from "./types";

export type GenderFilter = "全部" | "女團" | "男團" | "Solo";
export type GenFilter = "全部" | "2代" | "3代" | "4代" | "5代";
export type PosFilter = "全部" | "主唱" | "主舞" | "饒舌" | "隊長";

export const GENDER_OPTIONS: GenderFilter[] = ["全部", "女團", "男團", "Solo"];
export const GEN_OPTIONS: GenFilter[] = ["全部", "2代", "3代", "4代", "5代"];
export const POS_OPTIONS: PosFilter[] = ["全部", "主唱", "主舞", "饒舌", "隊長"];

export function genderOf(a: Artist): Exclude<GenderFilter, "全部"> {
  if (!a.group) return "Solo";
  if (a.genres.includes("k-pop girl group")) return "女團";
  if (a.genres.includes("k-pop boy group")) return "男團";
  return "Solo";
}

export function positionsOf(a: Artist): Exclude<PosFilter, "全部">[] {
  const roles = a.profile?.performance?.roles ?? [];
  const out = new Set<Exclude<PosFilter, "全部">>();
  for (const r of roles) {
    if (r === "main vocalist" || r === "lead vocalist") out.add("主唱");
    if (r === "main dancer" || r === "lead dancer") out.add("主舞");
    if (r.includes("rapper")) out.add("饒舌");
    if (r === "leader") out.add("隊長");
  }
  return [...out];
}

export interface BrowseFilters {
  gender: GenderFilter;
  gen: GenFilter;
  pos: PosFilter;
}

export function matchesFilters(a: Artist, f: BrowseFilters): boolean {
  if (f.gender !== "全部" && genderOf(a) !== f.gender) return false;
  if (f.gen !== "全部" && `${a.generation}代` !== f.gen) return false;
  if (f.pos !== "全部" && !positionsOf(a).includes(f.pos)) return false;
  return true;
}

// Lite-variant matcher for the client directory (uses precomputed fields).
export function matchesLite(
  a: { gender: string; generation?: number; positions: string[] },
  f: BrowseFilters
): boolean {
  if (f.gender !== "全部" && a.gender !== f.gender) return false;
  if (f.gen !== "全部" && `${a.generation}代` !== f.gen) return false;
  if (f.pos !== "全部" && !a.positions.includes(f.pos)) return false;
  return true;
}
