"use client";

// 偶像圖鑑 — full filterable directory below the 인생네컷 hero.
// Card click → the idol's four-layer profile page.
// Corner 「＋」 → open the 人生四格 picker to choose which cut to replace.

import { useEffect, useState } from "react";
import Link from "next/link";
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

const PER_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PER = 12;

export default function IdolDirectory({ artists }: { artists: ArtistLite[] }) {
  const [filters, setFilters] = useState<BrowseFilters>({ gender: "全部", gen: "全部", pos: "全部" });
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<CodexView>("list");
  const [pending, setPending] = useState<{ newcomer: ArtistLite; current: ArtistLite[] } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem("kstar:codexView");
      if (v === "star" || v === "list") setView(v);
    } catch { /* ignore */ }
    // Initialise page + per from the URL (?page / ?per) so pages are shareable.
    try {
      const sp = new URLSearchParams(window.location.search);
      const per = Number(sp.get("per"));
      if (PER_OPTIONS.includes(per as (typeof PER_OPTIONS)[number])) setPerPage(per);
      const p = Number(sp.get("page"));
      if (Number.isFinite(p) && p >= 1) setPage(Math.floor(p));
    } catch { /* ignore */ }
    // Keep state in sync when the user navigates back/forward through pages.
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      const per = Number(sp.get("per"));
      setPerPage(PER_OPTIONS.includes(per as (typeof PER_OPTIONS)[number]) ? per : DEFAULT_PER);
      const p = Number(sp.get("page"));
      setPage(Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Write page/per to the URL. push = new history entry (so Back steps through
  // pages); replace = quiet update (e.g. clamping / filter reset).
  function writeUrl(nextPage: number, nextPer: number, mode: "push" | "replace") {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("page", String(nextPage));
      u.searchParams.set("per", String(nextPer));
      u.hash = "idols";
      window.history[mode === "push" ? "pushState" : "replaceState"](null, "", u.toString());
    } catch { /* ignore */ }
  }

  function scrollToGridTop() {
    document.getElementById("idols")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToPage(next: number) {
    setPage(next);
    writeUrl(next, perPage, "push");
    scrollToGridTop();
  }

  function changePer(next: number) {
    setPerPage(next);
    setPage(1);
    writeUrl(1, next, "push");
    scrollToGridTop();
  }

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

  // Changing a filter resets to page 1 (and clears the page param).
  function applyFilter(key: keyof BrowseFilters, opt: string) {
    setFilters((f) => ({ ...f, [key]: opt }));
    setPage(1);
    writeUrl(1, perPage, "replace");
  }

  // ── Pagination (list view) ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(matched.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * perPage;
  const pageItems = matched.slice(startIdx, startIdx + perPage);

  // Compact page list with ellipses: 1 … (p-1) p (p+1) … last
  function pageList(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    const lo = Math.max(2, safePage - 1);
    const hi = Math.min(totalPages - 1, safePage + 1);
    if (lo > 2) out.push("…");
    for (let i = lo; i <= hi; i++) out.push(i);
    if (hi < totalPages - 1) out.push("…");
    out.push(totalPages);
    return out;
  }

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
                onClick={() => applyFilter(key, opt)}
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
        <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#9aa0aa]">
            顯示 <span className="font-orbitron font-bold text-[#5e636d]">{startIdx + 1}–{Math.min(startIdx + perPage, matched.length)}</span> / {matched.length}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#9aa0aa]">每頁</span>
            {PER_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => changePer(n)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  perPage === n
                    ? "bg-[#b4302b] text-white shadow-[0_0_8px_rgba(180,48,43,0.4)]"
                    : "border border-[#c8ccd2] text-[#5e636d] hover:bg-[#7c8088]/10"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {pageItems.map((a) => (
            <Link
              key={a.id}
              href={`/artist/${a.id}`}
              className="group relative block transition hover:-translate-y-0.5"
            >
              <IdolFrame artist={a} showAddCTA />
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
            </Link>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
            <button
              disabled={safePage === 1}
              onClick={() => goToPage(safePage - 1)}
              className="rounded-full border border-[#c8ccd2] px-3 py-1 text-xs font-semibold text-[#5e636d] transition hover:bg-[#7c8088]/10 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              ‹ 上一頁
            </button>
            {pageList().map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1 text-xs text-[#9aa0aa]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={p === safePage ? "page" : undefined}
                  className={`min-w-[2rem] rounded-full px-3 py-1 text-xs font-semibold transition ${
                    p === safePage
                      ? "bg-[#b4302b] text-white shadow-[0_0_8px_rgba(180,48,43,0.4)]"
                      : "border border-[#c8ccd2] text-[#5e636d] hover:bg-[#7c8088]/10"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              disabled={safePage === totalPages}
              onClick={() => goToPage(safePage + 1)}
              className="rounded-full border border-[#c8ccd2] px-3 py-1 text-xs font-semibold text-[#5e636d] transition hover:bg-[#7c8088]/10 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              下一頁 ›
            </button>
          </div>
        )}
        </>
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
