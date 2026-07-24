"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCopy } from "@/lib/i18n/LocaleProvider";

export type SearchIndexEntry = {
  id: string;
  name: string;
  name_zh: string | null;
  group: string | null;
};

const MAX_SUGGESTIONS = 6;

export default function SearchBar({ artists = [] }: { artists?: SearchIndexEntry[] }) {
  const copy = useCopy();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  // Client-side prefix/substring match over the slim index (name / 中文名 / 團名).
  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return artists
      .filter((a) =>
        a.name.toLowerCase().includes(term)
        || (a.name_zh?.toLowerCase().includes(term) ?? false)
        || (a.group?.toLowerCase().includes(term) ?? false),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [q, artists]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function goToArtist(id: string) {
    setOpen(false);
    router.push(`/artist/${id}`);
  }

  function submit() {
    if (active >= 0 && suggestions[active]) {
      goToArtist(suggestions[active].id);
      return;
    }
    if (q.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div ref={rootRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex items-center gap-2"
      >
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => { if (q.trim()) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.search}
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="search-suggestions"
          autoComplete="off"
          className="w-full rounded-full border border-[#c8ccd2] bg-[#f4f5f7] px-4 py-1.5 text-sm text-[#1c1e24] outline-none placeholder:text-[#9aa0aa] focus:border-[#56789f]"
        />
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-[#c8ccd2] bg-white shadow-[0_12px_28px_-10px_rgba(28,30,36,0.35)]"
        >
          {suggestions.map((a, i) => (
            <li key={a.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => goToArtist(a.id)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left transition ${i === active ? "bg-[#b4302b]/8" : "hover:bg-[#7c8088]/8"}`}
              >
                <span className="truncate text-sm font-semibold text-[#1c1e24]">{a.name}</span>
                {a.name_zh && a.name_zh !== a.name && (
                  <span className="truncate text-xs text-[#7c8088]">{a.name_zh}</span>
                )}
                {a.group && <span className="ml-auto shrink-0 text-[10px] font-medium text-[#9aa0aa]">{a.group}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
