"use client";

// Step 1 建立本命欄: four equal, ordered slots above a filterable photo grid.
import { useMemo, useState } from "react";
import type { ArtistLite } from "@/lib/lite";
import {
  GENDER_OPTIONS,
  GEN_OPTIONS,
  matchesLite,
  type GenderFilter,
  type GenFilter,
} from "@/lib/browse";
import Thumb from "@/components/Thumb";
import { copy } from "@/lib/copy";

const PAGE = 24;

export function updatePicks(picks: string[], id: string): string[] {
  if (picks.includes(id)) return picks.filter((pick) => pick !== id);
  if (picks.length >= 4) return picks;
  const next = [...picks, id];
  return next;
}

export function swapPicks(picks: string[], from: number, to: number): string[] {
  const next = [...picks];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function canonicalizePicks(picks: string[], validIds: ReadonlySet<string>): string[] {
  const seen = new Set<string>();
  const canonical: string[] = [];
  for (const id of picks) {
    if (!validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    canonical.push(id);
    if (canonical.length === 4) break;
  }
  return canonical;
}

export function heroForPicks(heroId: string | undefined, picks: string[]): string | undefined {
  return heroId && picks.includes(heroId) ? heroId : undefined;
}

export default function StepPicker({
  allArtists,
  picks,
  onChange,
}: {
  allArtists: ArtistLite[];
  picks: string[];
  onChange: (picks: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<GenderFilter>("全部");
  const [gen, setGen] = useState<GenFilter>("全部");
  const [page, setPage] = useState(0);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const byId = useMemo(() => new Map(allArtists.map((a) => [a.id, a])), [allArtists]);
  const ql = q.trim().toLowerCase();
  const filtered = useMemo(
    () => allArtists.filter(
      (a) => matchesLite(a, { gender, gen, pos: "全部" })
        && (!ql || a.name.toLowerCase().includes(ql) || (a.name_zh ?? "").toLowerCase().includes(ql)),
    ),
    [allArtists, gender, gen, ql],
  );
  const pageItems = filtered.slice(page * PAGE, (page + 1) * PAGE);

  function toggle(id: string) {
    if (picks.includes(id)) {
      setSwapFrom(null);
      onChange(updatePicks(picks, id));
      return;
    }
    if (picks.length >= 4) return;

    const next = updatePicks(picks, id);
    onChange(next);
    if (next.length === 4 && localStorage.getItem("kstar:flashOk") === "1") {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 750);
    }
  }

  function slotTap(i: number) {
    if (swapFrom === null) {
      setSwapFrom(i);
      return;
    }
    const next = swapPicks(picks, swapFrom, i);
    setSwapFrom(null);
    onChange(next);
  }

  return (
    <div className={flash ? "wiz-flash" : undefined}>
      <div className="mb-4 grid grid-cols-4 gap-2" aria-label="本命欄">
        {[0, 1, 2, 3].map((i) => {
          const artist = picks[i] ? byId.get(picks[i]) : undefined;
          return artist ? (
            <div
              key={`${i}-${artist.id}`}
              className={`wiz-develop relative aspect-[3/4] overflow-hidden rounded-lg border ${
                swapFrom === i ? "border-[#b4302b] ring-2 ring-[#b4302b]" : "border-[#c8ccd2]"
              }`}
            >
              <button
                type="button"
                onClick={() => slotTap(i)}
                className="h-full w-full"
                aria-label={`${artist.name} — 點兩格交換位置`}
                aria-pressed={swapFrom === i}
              >
                <Thumb
                  src={artist.image_url}
                  seed={artist.id}
                  label={artist.name}
                  rounded="rounded-none"
                  focusY={artist.image_focus}
                />
              </button>
              <button
                type="button"
                onClick={() => toggle(artist.id)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white"
                aria-label={`移除 ${artist.name}`}
              >
                ×
              </button>
            </div>
          ) : (
            <div
              key={i}
              className="grid aspect-[3/4] place-items-center rounded-lg border border-dashed border-[#c8ccd2] text-[#c8ccd2]"
              aria-label={`空白本命欄 ${i + 1}`}
            >
              ＋
            </div>
          );
        })}
      </div>
      <p className="mb-3 text-center text-xs text-[#9aa0aa]">{copy.wizPickHint(picks.length)}</p>

      <input
        type="search"
        value={q}
        onChange={(event) => { setQ(event.target.value); setPage(0); }}
        placeholder={copy.searchPlaceholder}
        aria-label={copy.searchPlaceholder}
        className="mb-3 w-full rounded-xl border border-[#c8ccd2] px-4 py-2.5"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {GENDER_OPTIONS.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => { setGender(option); setPage(0); }}
            className={`rounded-full border px-3 py-1 text-xs ${
              gender === option
                ? "border-[#b4302b] bg-[#b4302b]/10 text-[#b4302b]"
                : "border-[#c8ccd2] text-[#5e636d]"
            }`}
            aria-pressed={gender === option}
          >
            {option}
          </button>
        ))}
        {GEN_OPTIONS.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => { setGen(option); setPage(0); }}
            className={`rounded-full border px-3 py-1 text-xs ${
              gen === option
                ? "border-[#b4302b] bg-[#b4302b]/10 text-[#b4302b]"
                : "border-[#c8ccd2] text-[#5e636d]"
            }`}
            aria-pressed={gen === option}
          >
            {option === "全部" ? "全部世代" : option}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {pageItems.map((artist) => {
          const picked = picks.includes(artist.id);
          return (
            <button
              type="button"
              key={artist.id}
              onClick={() => toggle(artist.id)}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg border text-left ${
                picked ? "border-[#b4302b] ring-2 ring-[#b4302b]" : "border-[#c8ccd2]/60"
              }`}
              aria-pressed={picked}
              aria-label={`${picked ? "移除" : "選擇"} ${artist.name}`}
            >
              <Thumb
                src={artist.image_url}
                seed={artist.id}
                label={artist.name}
                rounded="rounded-none"
                focusY={artist.image_focus}
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1 pb-0.5 pt-3 text-[10px] font-medium text-white">
                {artist.name}
              </span>
            </button>
          );
        })}
      </div>
      {filtered.length > PAGE && (
        <div className="mt-3 flex justify-center gap-2 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="rounded border border-[#c8ccd2] px-3 py-1 disabled:opacity-40"
            aria-label="上一頁"
          >
            ←
          </button>
          <span className="py-1 text-[#9aa0aa]">{page + 1} / {Math.ceil(filtered.length / PAGE)}</span>
          <button
            type="button"
            disabled={(page + 1) * PAGE >= filtered.length}
            onClick={() => setPage(page + 1)}
            className="rounded border border-[#c8ccd2] px-3 py-1 disabled:opacity-40"
            aria-label="下一頁"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
