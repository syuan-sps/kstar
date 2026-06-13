"use client";

// 偶像圖鑑 — full filterable directory below the 인생네컷 hero.
// Card click → the idol's four-layer profile page.
// Corner 「＋」 → swap the idol into the user's four-cut strip (oldest slot out).

import { useState } from "react";
import Link from "next/link";
import type { Weights } from "@/lib/types";
import type { ArtistLite } from "@/lib/lite";
import {
  GENDER_OPTIONS, GEN_OPTIONS, POS_OPTIONS,
  matchesLite, type BrowseFilters,
} from "@/lib/browse";
import IdolFrame from "./IdolFrame";
import FavoriteButton from "./FavoriteButton";

export default function IdolDirectory({ artists }: { artists: ArtistLite[] }) {
  const [filters, setFilters] = useState<BrowseFilters>({ gender: "全部", gen: "全部", pos: "全部" });
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const matched = artists
    .filter((a) => matchesLite(a, filters))
    .sort((a, b) => b.popularity - a.popularity);

  function addToFourCuts(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const raw = localStorage.getItem("kstar:prefs");
      if (!raw) {
        // Not onboarded yet — open the picker flow
        localStorage.removeItem("kstar:onboarding");
        location.reload();
        return;
      }
      const prefs = JSON.parse(raw) as { topIdols?: string[]; weights?: Weights };
      if (!Array.isArray(prefs.topIdols) || prefs.topIdols.length !== 4) {
        localStorage.removeItem("kstar:onboarding");
        location.reload();
        return;
      }
      if (prefs.topIdols.includes(id)) {
        setJustAdded(id);
        setTimeout(() => setJustAdded(null), 900);
        return;
      }
      // Oldest slot (index 0) out, newcomer in at the end
      prefs.topIdols = [...prefs.topIdols.slice(1), id];
      localStorage.setItem("kstar:prefs", JSON.stringify(prefs));
      window.dispatchEvent(new Event("kstar:prefs-updated"));
      setJustAdded(id);
      setTimeout(() => setJustAdded(null), 900);
    } catch {
      /* ignore */
    }
  }

  const rows: { label: string; key: keyof BrowseFilters; options: readonly string[] }[] = [
    { label: "性別", key: "gender", options: GENDER_OPTIONS },
    { label: "世代", key: "gen", options: GEN_OPTIONS },
    { label: "定位", key: "pos", options: POS_OPTIONS },
  ];

  return (
    <section id="idols" className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h2 className="font-orbitron text-lg font-bold text-white">偶像圖鑑</h2>
        <span className="text-xs text-white/50">{matched.length} 位偶像</span>
      </div>

      <div className="mb-5 space-y-2">
        {rows.map(({ label, key, options }) => (
          <div key={key} className="flex flex-wrap items-center gap-1.5">
            <span className="w-8 shrink-0 text-xs text-white/50">{label}</span>
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setFilters((f) => ({ ...f, [key]: opt }))}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filters[key] === opt
                    ? "bg-[#ff00cc] text-white shadow-[0_0_8px_#ff00cc80]"
                    : "border border-[#ff00cc]/30 text-pink-300 hover:bg-[#ff00cc]/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ))}
      </div>

      {matched.length === 0 ? (
        <p className="rounded-xl border border-[#ff00cc]/20 bg-[#ff00cc]/5 p-6 text-center text-sm text-white/50">
          沒有符合的偶像 — 放寬一下篩選吧
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {matched.map((a) => (
            <Link
              key={a.id}
              href={`/artist/${a.id}`}
              className="group relative block transition hover:-translate-y-0.5"
            >
              <IdolFrame artist={a} />
              <div className="absolute right-2 top-7 z-20">
                <FavoriteButton id={a.id} size="sm" />
              </div>
              <button
                onClick={(e) => addToFourCuts(e, a.id)}
                aria-label={`把 ${a.name} 放進四格`}
                title="放進人生四格"
                className={`absolute bottom-9 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition ${
                  justAdded === a.id
                    ? "bg-[#00e5ff] text-[#1a0028]"
                    : "bg-[#ff00cc]/90 text-white hover:brightness-110"
                }`}
              >
                {justAdded === a.id ? "✓" : "＋"}
              </button>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
