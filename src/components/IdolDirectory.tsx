"use client";

// 偶像圖鑑 — full filterable directory below the 인생네컷 hero.
// Card click → the idol's four-layer profile page.
// Corner 「＋」 → open the 人生四格 picker to choose which cut to replace.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Weights } from "@/lib/types";
import type { ArtistLite } from "@/lib/lite";
import {
  GENDER_OPTIONS, GEN_OPTIONS, POS_OPTIONS,
  matchesLite, type BrowseFilters,
} from "@/lib/browse";
import IdolFrame from "./IdolFrame";
import FavoriteButton from "./FavoriteButton";
import ConstellationView from "./ConstellationView";
import ReplacePickerModal from "./ReplacePickerModal";

type CodexView = "list" | "star";

export default function IdolDirectory({ artists }: { artists: ArtistLite[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<BrowseFilters>({ gender: "全部", gen: "全部", pos: "全部" });
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<CodexView>("list");
  const [pending, setPending] = useState<{ newcomer: ArtistLite; current: ArtistLite[] } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem("kstar:codexView");
      if (v === "star" || v === "list") setView(v);
    } catch { /* ignore */ }
  }, []);

  function changeView(v: CodexView) {
    setView(v);
    try { localStorage.setItem("kstar:codexView", v); } catch { /* ignore */ }
  }

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
        window.dispatchEvent(new Event("kstar:open-onboarding"));
        return;
      }
      const prefs = JSON.parse(raw) as { topIdols?: string[]; weights?: Weights };
      if (!Array.isArray(prefs.topIdols) || prefs.topIdols.length !== 4) {
        window.dispatchEvent(new Event("kstar:open-onboarding"));
        return;
      }
      if (prefs.topIdols.includes(id)) {
        setJustAdded(id);
        setTimeout(() => setJustAdded(null), 900);
        return;
      }
      const newcomer = artists.find((a) => a.id === id);
      const current = prefs.topIdols
        .map((pid) => artists.find((a) => a.id === pid))
        .filter(Boolean) as ArtistLite[];
      if (!newcomer || current.length !== 4) {
        // Fallback to the old behaviour if a pick can't be resolved.
        prefs.topIdols = [...prefs.topIdols.slice(1), id];
        localStorage.setItem("kstar:prefs", JSON.stringify(prefs));
        window.dispatchEvent(new Event("kstar:prefs-updated"));
        setJustAdded(id);
        setTimeout(() => setJustAdded(null), 900);
        return;
      }
      // Let the user choose which of the four cuts to replace.
      setPending({ newcomer, current });
    } catch {
      /* ignore */
    }
  }

  // Swap the newcomer into the chosen four-cut slot.
  function doReplace(slotIndex: number) {
    if (!pending) return;
    const addedId = pending.newcomer.id;
    try {
      const raw = localStorage.getItem("kstar:prefs");
      if (!raw) return;
      const prefs = JSON.parse(raw) as { topIdols?: string[] };
      if (!Array.isArray(prefs.topIdols) || prefs.topIdols.length !== 4) return;
      prefs.topIdols = prefs.topIdols.map((pid, i) => (i === slotIndex ? addedId : pid));
      localStorage.setItem("kstar:prefs", JSON.stringify(prefs));
      window.dispatchEvent(new Event("kstar:prefs-updated"));
    } catch {
      /* ignore */
    } finally {
      setPending(null);
      setJustAdded(addedId);
      setTimeout(() => setJustAdded(null), 900);
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
        <h2 className="font-orbitron text-lg font-bold text-[#1c1e24]">偶像圖鑑</h2>
        <span className="text-xs text-[#9aa0aa]"><span className="chrome-text font-orbitron font-bold">{matched.length}</span> 位偶像</span>
        {mounted && (
          <div className="ml-auto inline-flex self-center rounded-full border border-[#c8ccd2] bg-white p-0.5">
            {([["list", "列表"], ["star", "星圖"]] as [CodexView, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  view === v ? "bg-[#b4302b] text-white" : "text-[#7c8088] hover:bg-[#7c8088]/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="chrome-divider"><span className="chrome-divider-star">✦</span></div>

      {view === "star" ? (
        <ConstellationView />
      ) : (
      <>
      <div className="mb-5 space-y-2">
        {rows.map(({ label, key, options }) => (
          <div key={key} className="flex flex-wrap items-center gap-1.5">
            <span className="w-8 shrink-0 text-xs text-[#9aa0aa]">{label}</span>
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setFilters((f) => ({ ...f, [key]: opt }))}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filters[key] === opt
                    ? "bg-[#b4302b] text-white shadow-[0_0_8px_rgba(180,48,43,0.4)]"
                    : "border border-[#c8ccd2] text-[#5e636d] hover:bg-[#7c8088]/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ))}
      </div>

      {matched.length === 0 ? (
        <p className="rounded-xl border border-[#c8ccd2]/20 bg-[#7c8088]/5 p-6 text-center text-sm text-[#9aa0aa]">
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
                aria-label={`把 ${a.name} 換進人生四格`}
                title="換進人生四格"
                className={`absolute bottom-9 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition ${
                  justAdded === a.id
                    ? "bg-[#b4302b] text-white"
                    : "bg-[#7c8088]/90 text-white hover:brightness-110"
                }`}
              >
                {justAdded === a.id ? "✓" : "＋"}
              </button>
              {!a.image_url && (
                <>
                  <span
                    aria-hidden
                    className="cta-heartbeat pointer-events-none absolute bottom-[38px] left-3 z-20 text-[13px] leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                  >
                    ♥
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/submit?idol=${a.id}`); }}
                    aria-label={`幫 ${a.name} 補照片`}
                    title="補照片"
                    className="absolute bottom-2 left-2 z-20 cursor-pointer rounded-full bg-[#b4302b] px-2.5 py-1.5 text-[10px] font-bold leading-none text-white shadow-[0_2px_7px_rgba(180,48,43,0.4)] transition hover:brightness-110"
                  >
                    補照片
                  </button>
                </>
              )}
            </Link>
          ))}
        </div>
      )}
      </>
      )}

      {pending && (
        <ReplacePickerModal
          newcomer={pending.newcomer}
          current={pending.current}
          onPick={doReplace}
          onClose={() => setPending(null)}
        />
      )}
    </section>
  );
}
