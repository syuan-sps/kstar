"use client";

import { useEffect, useState } from "react";
import type { UserPrefs } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/types";
import type { PickSummary } from "@/lib/types";
import type { ArtistLite } from "@/lib/lite";
import FourCuts from "@/components/FourCuts";
import SoulQuiz from "@/components/SoulQuiz";
import { copy } from "@/lib/copy";

type Step = 1 | 2 | 3;
const MAX_PICKS = 4;

export default function Onboarding({ allArtists }: { allArtists: ArtistLite[] }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]); // idol ids
  const [summaries, setSummaries] = useState<PickSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("kstar:onboarding") === "done") return;
    // If the photobooth splash is playing, hold the picker until it hands off so
    // it pops in on the crossfade; otherwise show immediately.
    const intro = window as unknown as { __kstarIntroPlaying?: boolean };
    if (intro.__kstarIntroPlaying) {
      const onDone = () => setShow(true);
      window.addEventListener("kstar:intro-done", onDone, { once: true });
      return () => window.removeEventListener("kstar:intro-done", onDone);
    }
    setShow(true);
  }, []);

  if (!show) return null;

  // ── Search ──────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const results: ArtistLite[] = q
    ? allArtists.filter(
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

  function markDone() {
    localStorage.setItem("kstar:onboarding", "done");
  }
  function closeModal() {
    markDone();
    setShow(false);
  }

  function writePrefs(patch: Partial<UserPrefs>) {
    const prefs: UserPrefs = { topIdols: selected, weights: DEFAULT_WEIGHTS, ...patch };
    localStorage.setItem("kstar:prefs", JSON.stringify(prefs));
    window.dispatchEvent(new Event("kstar:prefs-updated"));
  }

  // Skip the quiz — basic prefs, equal weights.
  function completeBasic() {
    writePrefs({});
    closeModal();
  }

  // Persist quiz result (keeps modal open on the result card).
  function persistQuiz(patch: Partial<UserPrefs>) {
    writePrefs(patch);
    markDone();
  }

  async function beginQuiz() {
    setLoading(true);
    try {
      const res = await fetch("/api/pick-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickIds: selected }),
      });
      const data = (await res.json()) as { summaries?: PickSummary[] };
      setSummaries(data.summaries ?? []);
      setStep(3);
    } catch {
      completeBasic(); // network failure — don't trap the user
    } finally {
      setLoading(false);
    }
  }

  const selectedArtists = selected
    .map((id) => allArtists.find((a) => a.id === id))
    .filter(Boolean) as ArtistLite[];

  const titleByStep = step === 1 ? "選出你的 TOP 4" : step === 2 ? "你的人生四格" : "追星靈魂測驗";

  return (
    <div className="picker-enter fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
      <div className="window-frame w-full max-w-md">
        {/* Title bar */}
        <div className="title-bar">
          <span className="mr-1.5 text-base">✦</span>
          <span className="flex-1 truncate text-xs font-bold tracking-wide font-orbitron">{titleByStep}</span>
          <div className="flex gap-0.5">
            <span className="win-btn">_</span>
            <span className="win-btn">□</span>
            <span className="win-btn win-btn-close" onClick={closeModal} style={{ cursor: "pointer" }}>×</span>
          </div>
        </div>

        {/* Body */}
        <div className="window-body max-h-[85vh] space-y-4 overflow-y-auto p-5">
          {step === 1 && (
            <>
              <p className="font-orbitron text-sm font-bold text-[#1c1e24]">你最喜歡的四位偶像？</p>
              <p className="text-xs text-[#5e636d]">選出你的 Top 4 · 已選 {selected.length}/{MAX_PICKS}</p>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋偶像…"
                className="w-full rounded-xl border border-[#c8ccd2]/40 bg-white px-3 py-2 text-sm text-[#1c1e24] outline-none focus:border-[#56789f] focus:ring-1 focus:ring-[#56789f]/30"
              />

              {results.length > 0 && (
                <div className="max-h-48 divide-y divide-[#c8ccd2]/10 overflow-y-auto rounded-xl border border-[#c8ccd2]/20 bg-white">
                  {results.map((a) => {
                    const isSelected = selected.includes(a.id);
                    const isFull = selected.length >= MAX_PICKS && !isSelected;
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleIdol(a.id)}
                        disabled={isFull}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#1c1e24] transition hover:bg-[#7c8088]/5 disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <span>
                          {a.name}
                          {a.name_zh && a.name_zh !== a.name && <span className="ml-1 text-xs text-[#5e636d]">{a.name_zh}</span>}
                          {a.group && <span className="ml-1 text-[10px] text-[#1c1e24]/70">{a.group}</span>}
                        </span>
                        {isSelected && <span className="text-[#b4302b]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedArtists.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedArtists.map((a) => (
                    <span
                      key={a.id}
                      onClick={() => toggleIdol(a.id)}
                      className="cursor-pointer rounded-full bg-[#b4302b]/15 px-3 py-1 text-xs font-semibold text-[#b4302b] hover:bg-[#b4302b]/25"
                    >
                      {a.name} ×
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button onClick={closeModal} className="text-xs text-[#7c8088]/60 hover:text-[#7c8088]">先跳過</button>
                <button
                  disabled={selected.length !== MAX_PICKS}
                  onClick={() => setStep(2)}
                  className="rounded-full bg-[#b4302b] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  沖洗照片 →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="font-orbitron text-sm font-bold text-[#1c1e24]">你的人生四格 ✦</p>
              <p className="text-xs text-[#5e636d]">和你的本命合照一張</p>

              <FourCuts artists={selectedArtists} className="mx-auto w-full max-w-[280px]" />

              {/* 追星靈魂 CTA */}
              <div className="rounded-2xl border border-[#56789f]/30 bg-[#56789f]/8 p-3 text-center">
                <p className="font-orbitron text-sm font-bold text-[#1c1e24]">{copy.soulCtaTitle}</p>
                <p className="mt-1 text-[11px] text-[#5e636d]">{copy.soulCtaSub}</p>
                <button
                  onClick={beginQuiz}
                  disabled={loading}
                  className="mt-2.5 rounded-full bg-[#b4302b] px-5 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "分析你的品味中…" : copy.soulCtaStart}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setStep(1)} className="text-xs text-[#7c8088]/60 hover:text-[#7c8088]">← 重選</button>
                <button onClick={completeBasic} className="text-xs text-[#7c8088]/70 hover:text-[#7c8088]">{copy.soulCtaSkip}</button>
              </div>
            </>
          )}

          {step === 3 && (
            <SoulQuiz picks={selectedArtists} summaries={summaries} onPersist={persistQuiz} onClose={closeModal} />
          )}
        </div>
      </div>
    </div>
  );
}
