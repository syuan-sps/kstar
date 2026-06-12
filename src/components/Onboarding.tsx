"use client";

import { useEffect, useState } from "react";
import type { UserPrefs } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/types";
import catalogJson from "@/data/catalog.json";
import type { Artist, Catalog } from "@/lib/types";
import FourCuts from "@/components/FourCuts";

const catalog = catalogJson as unknown as Catalog;

type Step = 1 | 2;
const MAX_PICKS = 4;

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]); // idol ids

  useEffect(() => {
    if (localStorage.getItem("kstar:onboarding") !== "done") setShow(true);
  }, []);

  if (!show) return null;

  // ── Search ──────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const results: Artist[] = q
    ? catalog.artists.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.name_zh ?? "").toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  // ── Helpers ─────────────────────────────────────────────────────────
  function toggleIdol(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_PICKS
        ? [...prev, id]
        : prev
    );
  }

  function dismiss() {
    localStorage.setItem("kstar:onboarding", "done");
    setShow(false);
  }

  function complete() {
    const prefs: UserPrefs = { topIdols: selected, weights: DEFAULT_WEIGHTS };
    localStorage.setItem("kstar:prefs", JSON.stringify(prefs));
    window.dispatchEvent(new Event("kstar:prefs-updated"));
    dismiss();
  }

  const selectedArtists = selected
    .map((id) => catalog.artists.find((a) => a.id === id))
    .filter(Boolean) as Artist[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
      <div className="window-frame w-full max-w-md">
        {/* Title bar */}
        <div className="title-bar">
          <span className="mr-1.5 text-base">✦</span>
          <span className="flex-1 truncate text-xs font-bold tracking-wide font-orbitron">
            {step === 1 ? "選出你的 TOP 4" : "你的人生四格"}
          </span>
          <div className="flex gap-0.5">
            <span className="win-btn">_</span>
            <span className="win-btn">□</span>
            <span
              className="win-btn win-btn-close"
              onClick={dismiss}
              style={{ cursor: "pointer" }}
            >
              ×
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="window-body p-5 space-y-4">
          {step === 1 && (
            <>
              <p className="font-orbitron text-sm font-bold text-[#1a0028]">
                你最喜歡的四位偶像？
              </p>
              <p className="text-xs text-[#660066]">
                選出你的 Top 4 · 已選 {selected.length}/{MAX_PICKS}
              </p>

              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋偶像…"
                className="w-full rounded-xl border border-[#ff00cc]/40 bg-white px-3 py-2 text-sm text-[#1a0028] outline-none focus:border-[#ff00cc] focus:ring-1 focus:ring-[#ff00cc]/30"
              />

              {results.length > 0 && (
                <div className="rounded-xl border border-[#ff00cc]/20 bg-white divide-y divide-[#ff00cc]/10 max-h-48 overflow-y-auto">
                  {results.map((a) => {
                    const isSelected = selected.includes(a.id);
                    const isFull = selected.length >= MAX_PICKS && !isSelected;
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleIdol(a.id)}
                        disabled={isFull}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#1a0028] hover:bg-[#ff00cc]/5 transition disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <span>
                          {a.name}
                          {a.name_zh && a.name_zh !== a.name && (
                            <span className="ml-1 text-xs text-[#660066]">{a.name_zh}</span>
                          )}
                          {a.group && (
                            <span className="ml-1 text-[10px] text-[#cc0099]/70">{a.group}</span>
                          )}
                        </span>
                        {isSelected && <span className="text-[#ff00cc]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected chips */}
              {selectedArtists.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedArtists.map((a) => (
                    <span
                      key={a.id}
                      onClick={() => toggleIdol(a.id)}
                      className="cursor-pointer rounded-full bg-[#ff00cc]/15 px-3 py-1 text-xs font-semibold text-[#cc0099] hover:bg-[#ff00cc]/25"
                    >
                      {a.name} ×
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={dismiss}
                  className="text-xs text-[#990066]/60 hover:text-[#990066]"
                >
                  先跳過
                </button>
                <button
                  disabled={selected.length !== MAX_PICKS}
                  onClick={() => setStep(2)}
                  className="rounded-full bg-gradient-to-r from-[#ff00cc] to-[#9933ff] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  沖洗照片 →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="font-orbitron text-sm font-bold text-[#1a0028]">
                你的人生四格 ✦
              </p>
              <p className="text-xs text-[#660066]">和你的本命合照一張</p>

              {/* 인생네컷 — Life in 4 Cuts photobooth strip */}
              <FourCuts artists={selectedArtists} className="mx-auto w-full max-w-[280px]" />

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-[#990066]/60 hover:text-[#990066]"
                >
                  ← 重選
                </button>
                <button
                  onClick={complete}
                  className="rounded-full bg-gradient-to-r from-[#ff00cc] to-[#9933ff] px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_12px_#ff00cc60] hover:brightness-110"
                >
                  收進相簿 ✦
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
